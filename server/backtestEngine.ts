import {
  PAIR_CONFIGS,
  PairConfig,
  ServerCandle,
  calculateIndicators,
} from './forexData.ts';

export interface BacktestParams {
  pair: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  riskPercent: number;
  minConfidence: number;
  tpStrategy: 'TP1' | 'TP2' | 'DYNAMIC_TRAIL';
  rrRatio: number;
  spreadPips?: number;
  enableNewsFilter?: boolean;
}

export interface SimulatedTrade {
  id: string;
  tradeNumber: number;
  entryTime: number;
  exitTime: number;
  pair: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  lotSize: number;
  pnl: number;
  pnlPercent: number;
  pips: number;
  confidence: number;
  status: 'WON' | 'LOST';
  exitReason: 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'TRAILING_STOP' | 'TIME_EXIT';
  rsiAtEntry: number;
  emaTrendAtEntry: string;
  sentimentScoreAtEntry: number;
  aiRationale: string;
}

export interface EquityCurvePoint {
  time: number;
  dateStr: string;
  equity: number;
  balance: number;
  drawdownPercent: number;
  tradePnl?: number;
}

export function runBacktest(params: BacktestParams) {
  const {
    pair = 'EURUSD',
    timeframe = 'H1',
    startDate,
    endDate,
    initialBalance = 10000,
    riskPercent = 1.5,
    minConfidence = 70,
    tpStrategy = 'TP2',
    rrRatio = 2.0,
    spreadPips = 1.0,
    enableNewsFilter = true,
  } = params;

  const cfg = PAIR_CONFIGS[pair] || PAIR_CONFIGS['EURUSD'];
  const pipVal = cfg.pipSize;
  const digits = cfg.digits;

  // Timeframe in minutes
  const tfMinutesMap: Record<string, number> = {
    M1: 1,
    M5: 5,
    M15: 15,
    H1: 60,
    H4: 240,
    D1: 1440,
  };
  const tfMinutes = tfMinutesMap[timeframe] || 60;
  const stepMs = tfMinutes * 60 * 1000;

  // Determine timestamps
  const startTs = startDate ? new Date(startDate).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
  const endTs = endDate ? new Date(endDate).getTime() : Date.now();
  const rangeMs = Math.max(stepMs * 50, endTs - startTs);
  
  // Number of candles needed
  const totalCandles = Math.min(600, Math.max(80, Math.floor(rangeMs / stepMs)));

  // Generate continuous historical price series for this date range
  const candles: ServerCandle[] = [];
  let currentPrice = cfg.basePrice * (0.96 + ((startTs % 100000) / 100000) * 0.08);

  for (let i = 0; i < totalCandles; i++) {
    const candleTime = startTs + i * stepMs;
    // Macro cycle wave
    const cycle = Math.sin(i / 14) * (cfg.volatilityPips * 0.5 * pipVal);
    const trendDrift = (cfg.dailyTrend * 0.2 * pipVal);
    // Deterministic pseudo-randomness based on seed for reproducible backtests
    const pseudoRand = Math.sin(candleTime + i * 37) * 10000;
    const noise = ((pseudoRand - Math.floor(pseudoRand)) - 0.49) * (cfg.volatilityPips * 0.35 * pipVal);

    const open = currentPrice;
    const change = cycle + trendDrift + noise;
    const close = Number((open + change).toFixed(digits));

    const wickHigh = Math.abs(Math.sin(i * 19.3)) * (cfg.volatilityPips * 0.28 * pipVal);
    const wickLow = Math.abs(Math.cos(i * 13.7)) * (cfg.volatilityPips * 0.28 * pipVal);

    const high = Number((Math.max(open, close) + wickHigh).toFixed(digits));
    const low = Number((Math.min(open, close) - wickLow).toFixed(digits));
    const volume = Math.floor(1000 + Math.abs(Math.sin(i * 7.7)) * 4000);

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  // Compute indicators across full candle sequence
  calculateIndicators(candles, digits);

  // Simulation execution loop
  let currentBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownPercent = 0;
  let maxDrawdownAmount = 0;

  const trades: SimulatedTrade[] = [];
  const equityCurve: EquityCurvePoint[] = [];

  // Initial equity point
  equityCurve.push({
    time: candles[0].time,
    dateStr: new Date(candles[0].time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    equity: initialBalance,
    balance: initialBalance,
    drawdownPercent: 0,
  });

  // State for active trade
  let activeTrade: {
    trade: SimulatedTrade;
    entryBarIndex: number;
    trailingStopPrice?: number;
  } | null = null;

  // Warmup period: skip first 25 bars for EMA/RSI stability
  for (let i = 25; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    // 1. Process active trade if any
    if (activeTrade) {
      const t = activeTrade.trade;
      let exited = false;
      let exitPrice = 0;
      let exitReason: SimulatedTrade['exitReason'] = 'TIME_EXIT';

      if (t.type === 'BUY') {
        // Trailing stop adjustment
        if (tpStrategy === 'DYNAMIC_TRAIL' && activeTrade.trailingStopPrice) {
          const profitDist = candle.high - t.entryPrice;
          const riskDist = t.entryPrice - t.stopLoss;
          if (profitDist > riskDist) {
            const newTrail = candle.close - (riskDist * 0.8);
            if (newTrail > activeTrade.trailingStopPrice) {
              activeTrade.trailingStopPrice = newTrail;
            }
          }
        }

        const effectiveSL = activeTrade.trailingStopPrice || t.stopLoss;

        // Check SL Hit
        if (candle.low <= effectiveSL) {
          exitPrice = effectiveSL;
          exitReason = activeTrade.trailingStopPrice && activeTrade.trailingStopPrice > t.entryPrice ? 'TRAILING_STOP' : 'SL_HIT';
          exited = true;
        } 
        // Check TP Hit
        else if (tpStrategy === 'TP1' && candle.high >= t.takeProfit1) {
          exitPrice = t.takeProfit1;
          exitReason = 'TP1_HIT';
          exited = true;
        } else if ((tpStrategy === 'TP2' || tpStrategy === 'DYNAMIC_TRAIL') && candle.high >= t.takeProfit2) {
          exitPrice = t.takeProfit2;
          exitReason = 'TP2_HIT';
          exited = true;
        }
      } else { // SELL
        // Trailing stop adjustment
        if (tpStrategy === 'DYNAMIC_TRAIL' && activeTrade.trailingStopPrice) {
          const profitDist = t.entryPrice - candle.low;
          const riskDist = t.stopLoss - t.entryPrice;
          if (profitDist > riskDist) {
            const newTrail = candle.close + (riskDist * 0.8);
            if (newTrail < activeTrade.trailingStopPrice) {
              activeTrade.trailingStopPrice = newTrail;
            }
          }
        }

        const effectiveSL = activeTrade.trailingStopPrice || t.stopLoss;

        // Check SL Hit
        if (candle.high >= effectiveSL) {
          exitPrice = effectiveSL;
          exitReason = activeTrade.trailingStopPrice && activeTrade.trailingStopPrice < t.entryPrice ? 'TRAILING_STOP' : 'SL_HIT';
          exited = true;
        } 
        // Check TP Hit
        else if (tpStrategy === 'TP1' && candle.low <= t.takeProfit1) {
          exitPrice = t.takeProfit1;
          exitReason = 'TP1_HIT';
          exited = true;
        } else if ((tpStrategy === 'TP2' || tpStrategy === 'DYNAMIC_TRAIL') && candle.low <= t.takeProfit2) {
          exitPrice = t.takeProfit2;
          exitReason = 'TP2_HIT';
          exited = true;
        }
      }

      // Check end of series exit
      if (!exited && i === candles.length - 1) {
        exitPrice = candle.close;
        exitReason = 'TIME_EXIT';
        exited = true;
      }

      if (exited) {
        t.exitTime = candle.time;
        t.exitPrice = Number(exitPrice.toFixed(digits));
        t.exitReason = exitReason;

        // Calculate pips and PnL
        let pips = 0;
        if (t.type === 'BUY') {
          pips = (t.exitPrice - t.entryPrice) / pipVal - spreadPips;
        } else {
          pips = (t.entryPrice - t.exitPrice) / pipVal - spreadPips;
        }
        t.pips = Number(pips.toFixed(1));

        // PnL in USD based on standard lot value ($10/pip standard, scaled to lot)
        const pipDollarValue = pair.includes('JPY') ? 7.5 : pair.includes('XAU') ? 10.0 : pair.includes('BTC') ? 1.0 : 10.0;
        const dollarPnl = t.pips * pipDollarValue * t.lotSize;
        t.pnl = Number(dollarPnl.toFixed(2));
        t.status = t.pnl >= 0 ? 'WON' : 'LOST';
        t.pnlPercent = Number(((t.pnl / currentBalance) * 100).toFixed(2));

        currentBalance += t.pnl;
        if (currentBalance > peakBalance) {
          peakBalance = currentBalance;
        }
        const currentDrawdown = ((peakBalance - currentBalance) / peakBalance) * 100;
        if (currentDrawdown > maxDrawdownPercent) {
          maxDrawdownPercent = currentDrawdown;
          maxDrawdownAmount = peakBalance - currentBalance;
        }

        trades.push(t);
        activeTrade = null;

        equityCurve.push({
          time: candle.time,
          dateStr: new Date(candle.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          equity: Number(currentBalance.toFixed(2)),
          balance: Number(currentBalance.toFixed(2)),
          drawdownPercent: Number(currentDrawdown.toFixed(2)),
          tradePnl: t.pnl,
        });

        continue;
      }
    }

    // 2. Look for new AI confluence signal if no active trade
    if (!activeTrade) {
      const rsi = candle.rsi ?? 50;
      const prevRsi = prevCandle?.rsi ?? 50;
      const ema20 = candle.ema20 ?? candle.close;
      const ema50 = candle.ema50 ?? candle.close;
      const ema200 = candle.ema200 ?? candle.close;

      const upperB = candle.upperBand ?? candle.close + 20 * pipVal;
      const lowerB = candle.lowerBand ?? candle.close - 20 * pipVal;

      // Confluence factors
      let buyScore = 0;
      let sellScore = 0;

      // Trend check
      if (ema20 > ema50 && candle.close > ema20) buyScore += 25;
      if (ema20 < ema50 && candle.close < ema20) sellScore += 25;
      if (candle.close > ema200) buyScore += 15;
      if (candle.close < ema200) sellScore += 15;

      // Momentum / Pullback check
      if (rsi > 42 && rsi < 68 && prevRsi < 45 && rsi > prevRsi) buyScore += 25;
      if (rsi < 58 && rsi > 32 && prevRsi > 55 && rsi < prevRsi) sellScore += 25;

      // Oversold / Overbought reversals
      if (prevRsi < 32 && rsi > 34) buyScore += 30;
      if (prevRsi > 68 && rsi < 66) sellScore += 30;

      // Bollinger Bands touch/rebound
      if (prevCandle.low <= lowerB && candle.close > lowerB) buyScore += 15;
      if (prevCandle.high >= upperB && candle.close < upperB) sellScore += 15;

      // Candlestick pattern
      const isBullishEngulfing = candle.close > candle.open && prevCandle.close < prevCandle.open && candle.close > prevCandle.open;
      const isBearishEngulfing = candle.close < candle.open && prevCandle.close > prevCandle.open && candle.close < prevCandle.open;
      if (isBullishEngulfing) buyScore += 15;
      if (isBearishEngulfing) sellScore += 15;

      // Simulated Macro / Sentiment weight
      const sentimentDrift = Math.sin(i / 8) * 20;
      if (sentimentDrift > 5) buyScore += 15;
      if (sentimentDrift < -5) sellScore += 15;

      const totalBuyConfidence = Math.min(95, Math.max(40, buyScore));
      const totalSellConfidence = Math.min(95, Math.max(40, sellScore));

      let signalType: 'BUY' | 'SELL' | null = null;
      let confidence = 0;

      if (totalBuyConfidence >= minConfidence && totalBuyConfidence > totalSellConfidence + 10) {
        signalType = 'BUY';
        confidence = totalBuyConfidence;
      } else if (totalSellConfidence >= minConfidence && totalSellConfidence > totalBuyConfidence + 10) {
        signalType = 'SELL';
        confidence = totalSellConfidence;
      }

      if (signalType) {
        const atrPips = Math.max(18, cfg.volatilityPips * 0.45);
        const slPips = Math.max(20, Math.round(atrPips * 1.3));
        const tp1Pips = Math.round(slPips * 1.2);
        const tp2Pips = Math.round(slPips * rrRatio);

        let entry = candle.close;
        let sl = 0;
        let tp1 = 0;
        let tp2 = 0;

        if (signalType === 'BUY') {
          entry = Number((candle.close + spreadPips * pipVal).toFixed(digits));
          sl = Number((entry - slPips * pipVal).toFixed(digits));
          tp1 = Number((entry + tp1Pips * pipVal).toFixed(digits));
          tp2 = Number((entry + tp2Pips * pipVal).toFixed(digits));
        } else {
          entry = Number(candle.close.toFixed(digits));
          sl = Number((entry + slPips * pipVal).toFixed(digits));
          tp1 = Number((entry - tp1Pips * pipVal).toFixed(digits));
          tp2 = Number((entry - tp2Pips * pipVal).toFixed(digits));
        }

        // Lot sizing based on risk percent
        const riskAmount = (currentBalance * (riskPercent / 100));
        const pipDollarValue = pair.includes('JPY') ? 7.5 : pair.includes('XAU') ? 10.0 : pair.includes('BTC') ? 1.0 : 10.0;
        const calculatedLot = Math.max(0.01, Number((riskAmount / (slPips * pipDollarValue)).toFixed(2)));

        const tradeId = `bt-${trades.length + 1}-${candle.time}`;
        const newTrade: SimulatedTrade = {
          id: tradeId,
          tradeNumber: trades.length + 1,
          entryTime: candle.time,
          exitTime: 0,
          pair,
          timeframe,
          type: signalType,
          entryPrice: entry,
          exitPrice: 0,
          stopLoss: sl,
          takeProfit1: tp1,
          takeProfit2: tp2,
          lotSize: calculatedLot,
          pnl: 0,
          pnlPercent: 0,
          pips: 0,
          confidence,
          status: 'WON',
          exitReason: 'TP1_HIT',
          rsiAtEntry: Number(rsi.toFixed(1)),
          emaTrendAtEntry: ema20 > ema50 ? 'BULLISH' : 'BEARISH',
          sentimentScoreAtEntry: Number((sentimentDrift / 20).toFixed(2)),
          aiRationale: `${signalType} confluence verified on ${timeframe}. EMA trend alignment supported by RSI pullback (${rsi.toFixed(1)}) and ${sentimentDrift > 0 ? 'bullish macro sentiment' : 'bearish sentiment bias'}. Confluence: ${confidence}%.`,
        };

        activeTrade = {
          trade: newTrade,
          entryBarIndex: i,
          trailingStopPrice: tpStrategy === 'DYNAMIC_TRAIL' ? sl : undefined,
        };
      }
    }
  }

  // Calculate high-level summary metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.status === 'WON').length;
  const losingTrades = trades.filter((t) => t.status === 'LOST').length;
  const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const totalGrossProfit = trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalGrossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalGrossLoss > 0 ? Number((totalGrossProfit / totalGrossLoss).toFixed(2)) : totalGrossProfit > 0 ? 9.99 : 0;

  const netProfit = Number((currentBalance - initialBalance).toFixed(2));
  const netProfitPercent = Number(((netProfit / initialBalance) * 100).toFixed(2));
  const totalPips = Number(trades.reduce((acc, t) => acc + t.pips, 0).toFixed(1));

  const winPipsArray = trades.filter((t) => t.pips > 0).map((t) => t.pips);
  const lossPipsArray = trades.filter((t) => t.pips < 0).map((t) => Math.abs(t.pips));
  const avgWinPips = winPipsArray.length > 0 ? Number((winPipsArray.reduce((a, b) => a + b, 0) / winPipsArray.length).toFixed(1)) : 0;
  const avgLossPips = lossPipsArray.length > 0 ? Number((lossPipsArray.reduce((a, b) => a + b, 0) / lossPipsArray.length).toFixed(1)) : 0;

  const returns = trades.map((t) => t.pnlPercent);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1 ? returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length - 1) : 1;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? Number(((avgReturn / stdDev) * Math.sqrt(totalTrades)).toFixed(2)) : 0;

  const expectancy = totalTrades > 0 ? Number((netProfit / totalTrades).toFixed(2)) : 0;

  return {
    pair,
    timeframe,
    startDate: new Date(startTs).toISOString().split('T')[0],
    endDate: new Date(endTs).toISOString().split('T')[0],
    initialBalance,
    finalBalance: Number(currentBalance.toFixed(2)),
    netProfit,
    netProfitPercent,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    totalPips,
    sharpeRatio,
    avgWinPips,
    avgLossPips,
    avgTradeDurationBars: Math.round(totalCandles / Math.max(1, totalTrades)),
    expectancy,
    equityCurve,
    trades,
    candles,
  };
}
