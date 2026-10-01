export interface ServerCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  upperBand?: number;
  lowerBand?: number;
  middleBand?: number;
}

export interface PairConfig {
  symbol: string;
  name: string;
  basePrice: number;
  digits: number;
  pipSize: number;
  spreadPips: number;
  volatilityPips: number;
  dailyTrend: number; // -1 to +1
}

export const PAIR_CONFIGS: Record<string, PairConfig> = {
  EURUSD: { symbol: 'EURUSD', name: 'Euro / US Dollar', basePrice: 1.12255, digits: 5, pipSize: 0.0001, spreadPips: 0.6, volatilityPips: 65, dailyTrend: -0.65 },
  GBPUSD: { symbol: 'GBPUSD', name: 'British Pound / US Dollar', basePrice: 1.31863, digits: 5, pipSize: 0.0001, spreadPips: 0.9, volatilityPips: 95, dailyTrend: -0.60 },
  USDJPY: { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', basePrice: 157.975, digits: 3, pipSize: 0.01, spreadPips: 0.8, volatilityPips: 110, dailyTrend: 0.25 },
  AUDUSD: { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', basePrice: 0.69149, digits: 5, pipSize: 0.0001, spreadPips: 0.8, volatilityPips: 55, dailyTrend: -0.60 },
  USDCAD: { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', basePrice: 1.42449, digits: 5, pipSize: 0.0001, spreadPips: 1.1, volatilityPips: 60, dailyTrend: 0.45 },
  USDCHF: { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', basePrice: 0.83250, digits: 5, pipSize: 0.0001, spreadPips: 1.0, volatilityPips: 50, dailyTrend: 0.30 },
  NZDUSD: { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', basePrice: 0.55968, digits: 5, pipSize: 0.0001, spreadPips: 1.2, volatilityPips: 50, dailyTrend: -0.65 },
  EURGBP: { symbol: 'EURGBP', name: 'Euro / British Pound', basePrice: 0.85142, digits: 5, pipSize: 0.0001, spreadPips: 0.9, volatilityPips: 40, dailyTrend: -0.55 },
  EURJPY: { symbol: 'EURJPY', name: 'Euro / Japanese Yen', basePrice: 177.341, digits: 3, pipSize: 0.01, spreadPips: 1.2, volatilityPips: 120, dailyTrend: -0.55 },
  GBPJPY: { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', basePrice: 208.297, digits: 3, pipSize: 0.01, spreadPips: 1.5, volatilityPips: 150, dailyTrend: -0.30 },
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold / US Dollar', basePrice: 4168.33, digits: 2, pipSize: 0.10, spreadPips: 1.8, volatilityPips: 320, dailyTrend: 0.25 },
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', basePrice: 84874.00, digits: 2, pipSize: 1.00, spreadPips: 2.5, volatilityPips: 1800, dailyTrend: 1.45 },
};

// Generate realistic historical and live candles, optionally anchored to live TradingView market price
export function generateCandles(pair: string, timeframe: string, count: number = 100, liveAnchorPrice?: number): ServerCandle[] {
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['EURUSD'];
  const candles: ServerCandle[] = [];
  
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
  const now = Date.now();
  const stepMs = tfMinutes * 60 * 1000;
  
  // Start from past
  let currentPrice = config.basePrice;
  const pipVal = config.pipSize;
  
  // Seed random walk with mean reversion & wave cycles
  for (let i = count - 1; i >= 0; i--) {
    const candleTime = Math.floor((now - i * stepMs) / stepMs) * stepMs;
    const wave = Math.sin((count - i) / 8) * (config.volatilityPips * 0.4 * pipVal);
    const trendStep = (config.dailyTrend * 0.15 * pipVal);
    const noise = (Math.random() - 0.49) * (config.volatilityPips * 0.3 * pipVal);
    
    const open = currentPrice;
    const change = wave + trendStep + noise;
    const close = Number((open + change).toFixed(config.digits));
    
    const wickHigh = Math.random() * (config.volatilityPips * 0.25 * pipVal);
    const wickLow = Math.random() * (config.volatilityPips * 0.25 * pipVal);
    
    const high = Number((Math.max(open, close) + wickHigh).toFixed(config.digits));
    const low = Number((Math.min(open, close) - wickLow).toFixed(config.digits));
    const volume = Math.floor(800 + Math.random() * 3500);
    
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

  // If liveAnchorPrice is provided, adjust all candles to seamlessly align with TradingView live price
  if (liveAnchorPrice && candles.length > 0) {
    const lastIndex = candles.length - 1;
    const diff = liveAnchorPrice - candles[lastIndex].close;
    for (const c of candles) {
      c.open = Number((c.open + diff).toFixed(config.digits));
      c.high = Number((c.high + diff).toFixed(config.digits));
      c.low = Number((c.low + diff).toFixed(config.digits));
      c.close = Number((c.close + diff).toFixed(config.digits));
    }
    candles[lastIndex].close = liveAnchorPrice;
    candles[lastIndex].high = Math.max(candles[lastIndex].high, liveAnchorPrice);
    candles[lastIndex].low = Math.min(candles[lastIndex].low, liveAnchorPrice);
  }
  
  // Calculate Technical Indicators
  calculateIndicators(candles, config.digits);
  
  return candles;
}

export function calculateIndicators(candles: ServerCandle[], digits: number): void {
  const closes = candles.map(c => c.close);
  
  // Calculate EMA
  const calcEMA = (period: number): (number | undefined)[] => {
    const k = 2 / (period + 1);
    const emaValues: (number | undefined)[] = new Array(candles.length).fill(undefined);
    if (candles.length < period) return emaValues;
    
    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += closes[i];
    }
    let prevEMA = sum / period;
    emaValues[period - 1] = Number(prevEMA.toFixed(digits));
    
    for (let i = period; i < candles.length; i++) {
      const currentEMA = closes[i] * k + prevEMA * (1 - k);
      emaValues[i] = Number(currentEMA.toFixed(digits));
      prevEMA = currentEMA;
    }
    return emaValues;
  };
  
  const ema20 = calcEMA(20);
  const ema50 = calcEMA(50);
  const ema200 = calcEMA(Math.min(200, Math.floor(candles.length * 0.8)));
  
  // Calculate RSI(14)
  const rsiValues: (number | undefined)[] = new Array(candles.length).fill(undefined);
  const rsiPeriod = 14;
  if (candles.length > rsiPeriod) {
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= rsiPeriod; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    let avgGain = gains / rsiPeriod;
    let avgLoss = losses / rsiPeriod;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues[rsiPeriod] = Number((100 - (100 / (1 + rs))).toFixed(1));
    
    for (let i = rsiPeriod + 1; i < candles.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues[i] = Number((100 - (100 / (1 + rs))).toFixed(1));
    }
  }
  
  // Calculate Bollinger Bands (20, 2)
  const bbPeriod = 20;
  for (let i = 0; i < candles.length; i++) {
    candles[i].ema20 = ema20[i];
    candles[i].ema50 = ema50[i];
    candles[i].ema200 = ema200[i];
    candles[i].rsi = rsiValues[i];
    
    if (i >= bbPeriod - 1) {
      const slice = closes.slice(i - bbPeriod + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / bbPeriod;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bbPeriod;
      const stdDev = Math.sqrt(variance);
      candles[i].middleBand = Number(mean.toFixed(digits));
      candles[i].upperBand = Number((mean + 2 * stdDev).toFixed(digits));
      candles[i].lowerBand = Number((mean - 2 * stdDev).toFixed(digits));
    }
  }
}

export function computeIndicatorSnapshot(candles: ServerCandle[], config: PairConfig) {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] || last;
  
  const rsi = last.rsi ?? 52.4;
  let rsiStatus: 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERBOUGHT' = 'NEUTRAL';
  if (rsi >= 70) rsiStatus = 'OVERBOUGHT';
  else if (rsi >= 58) rsiStatus = 'BULLISH_MOMENTUM';
  else if (rsi <= 30) rsiStatus = 'OVERSOLD';
  else if (rsi <= 42) rsiStatus = 'BEARISH_MOMENTUM';
  
  const ema20 = last.ema20 ?? last.close;
  const ema50 = last.ema50 ?? last.close;
  const ema200 = last.ema200 ?? (last.close * 0.995);
  
  let emaTrend: 'STRONG_UPTREND' | 'UPTREND' | 'CONSOLIDATION' | 'DOWNTREND' | 'STRONG_DOWNTREND' = 'CONSOLIDATION';
  if (last.close > ema20 && ema20 > ema50 && ema50 > ema200) {
    emaTrend = 'STRONG_UPTREND';
  } else if (last.close > ema50 && ema50 > ema200) {
    emaTrend = 'UPTREND';
  } else if (last.close < ema20 && ema20 < ema50 && ema50 < ema200) {
    emaTrend = 'STRONG_DOWNTREND';
  } else if (last.close < ema50 && ema50 < ema200) {
    emaTrend = 'DOWNTREND';
  }
  
  // MACD approximation
  const macdLine = (last.ema20 ?? last.close) - (last.ema50 ?? last.close);
  const signalLine = macdLine * 0.85;
  const histogram = macdLine - signalLine;
  const crossover = macdLine > signalLine && prev.close < last.close ? 'BULLISH_CROSS' : (macdLine < signalLine ? 'BEARISH_CROSS' : 'NONE');
  
  // Bollinger Bands
  const upper = last.upperBand ?? (last.close * 1.008);
  const middle = last.middleBand ?? last.close;
  const lower = last.lowerBand ?? (last.close * 0.992);
  const bandwidth = ((upper - lower) / middle) * 100;
  const percentB = (last.close - lower) / (upper - lower);
  let bbStatus: 'SQUEEZE' | 'UPPER_TOUCH' | 'LOWER_TOUCH' | 'NORMAL' = 'NORMAL';
  if (bandwidth < 0.8) bbStatus = 'SQUEEZE';
  else if (last.close >= upper * 0.998) bbStatus = 'UPPER_TOUCH';
  else if (last.close <= lower * 1.002) bbStatus = 'LOWER_TOUCH';
  
  // ATR (14)
  const atrPeriod = Math.min(14, candles.length);
  let trSum = 0;
  for (let i = candles.length - atrPeriod; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1] || c;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    trSum += tr;
  }
  const atr14 = Number((trSum / atrPeriod).toFixed(config.digits));
  const atrPips = Number((atr14 / config.pipSize).toFixed(1));
  
  // Pivots
  const pivot = Number(((last.high + last.low + last.close) / 3).toFixed(config.digits));
  const r1 = Number((2 * pivot - last.low).toFixed(config.digits));
  const r2 = Number((pivot + (last.high - last.low)).toFixed(config.digits));
  const r3 = Number((last.high + 2 * (pivot - last.low)).toFixed(config.digits));
  const s1 = Number((2 * pivot - last.high).toFixed(config.digits));
  const s2 = Number((pivot - (last.high - last.low)).toFixed(config.digits));
  const s3 = Number((last.low - 2 * (last.high - pivot)).toFixed(config.digits));
  
  // Candlestick pattern
  let pattern = 'Standard Range Bar';
  const body = Math.abs(last.close - last.open);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  
  if (lowerWick > body * 2 && upperWick < body * 0.5) {
    pattern = last.close > last.open ? 'Bullish Hammer (Reversal)' : 'Hanging Man';
  } else if (upperWick > body * 2 && lowerWick < body * 0.5) {
    pattern = 'Shooting Star (Bearish Rejection)';
  } else if (last.close > last.open && last.close > prev.high && last.open < prev.low) {
    pattern = 'Bullish Engulfing';
  } else if (last.close < last.open && last.close < prev.low && last.open > prev.high) {
    pattern = 'Bearish Engulfing';
  } else if (body < (last.high - last.low) * 0.15) {
    pattern = 'Doji (Market Indecision)';
  }
  
  return {
    rsi14: rsi,
    rsiStatus,
    ema20,
    ema50,
    ema200,
    emaTrend,
    macd: {
      macdLine: Number(macdLine.toFixed(config.digits)),
      signalLine: Number(signalLine.toFixed(config.digits)),
      histogram: Number(histogram.toFixed(config.digits)),
      crossover,
    },
    bollingerBands: {
      upper,
      middle,
      lower,
      percentB: Number(percentB.toFixed(2)),
      bandwidth: Number(bandwidth.toFixed(2)),
      status: bbStatus,
    },
    atr14,
    atrPips,
    pivotPoints: { pivot, r1, r2, r3, s1, s2, s3 },
    candlestickPattern: pattern,
  };
}

export function getLiveForexNews() {
  const now = Date.now();
  return [
    {
      id: 'news-1',
      title: 'Federal Reserve Signals Measured Stance as Core PCE Inflation Moderates Near 2.6%',
      source: 'Bloomberg Markets',
      timeAgo: '12m ago',
      timestamp: now - 12 * 60 * 1000,
      impact: 'HIGH' as const,
      currencies: ['USD', 'EUR', 'GBP'],
      sentimentScore: 0.45,
      sentimentLabel: 'BULLISH' as const,
      summary: 'Fed officials emphasize data dependency while hinting at gradual rate adjustments, providing moderate support for the US Dollar index against European peers.',
      tradingImplication: 'Strengthens USD upside momentum on dips; creates downward pressure on EUR/USD and AUD/USD.',
    },
    {
      id: 'news-2',
      title: 'European Central Bank Holds Key Deposit Rate at 3.25%, Citing Sticky Services Inflation',
      source: 'Reuters FX',
      timeAgo: '35m ago',
      timestamp: now - 35 * 60 * 1000,
      impact: 'HIGH' as const,
      currencies: ['EUR', 'USD', 'CHF'],
      sentimentScore: -0.20,
      sentimentLabel: 'NEUTRAL' as const,
      summary: 'Lagarde stated growth risks in the Eurozone remain tilted to the downside with manufacturing PMIs contracting across Germany and France.',
      tradingImplication: 'Caps EUR recovery rallies; range-bound price action expected into upcoming European open.',
    },
    {
      id: 'news-3',
      title: 'Bank of Japan Governor Ueda Reasserts Willingness to Hike Rates if Wage-Price Spiral Holds',
      source: 'Nikkei Financial',
      timeAgo: '1h ago',
      timestamp: now - 60 * 60 * 1000,
      impact: 'HIGH' as const,
      currencies: ['JPY', 'USD', 'EUR', 'GBP'],
      sentimentScore: 0.65,
      sentimentLabel: 'BULLISH' as const,
      summary: 'BoJ hawkish tone sparked sudden Yen buying across Asian FX sessions, pushing USD/JPY off its weekly highs.',
      tradingImplication: 'Strong JPY appreciation pressure; favors short setups on USD/JPY and EUR/JPY on technical breakdowns.',
    },
    {
      id: 'news-4',
      title: 'Gold (XAU/USD) Extends Bullish Breakout on Safe-Haven Inflows & Geopolitical Hedging',
      source: 'FXStreet Live',
      timeAgo: '1h 45m ago',
      timestamp: now - 105 * 60 * 1000,
      impact: 'HIGH' as const,
      currencies: ['XAUUSD', 'USD'],
      sentimentScore: 0.80,
      sentimentLabel: 'BULLISH' as const,
      summary: 'Spot gold tested key resistance above $2,640 with institutional bullion desks reporting continuous ETF inflows and central bank accumulation.',
      tradingImplication: 'Strong continuation setup for XAU/USD; buy-on-dip confluence with 20 EMA dynamic support.',
    },
    {
      id: 'news-5',
      title: 'UK Services PMI Beats Consensus at 52.8, UK Gilt Yields Firm Up',
      source: 'Financial Times',
      timeAgo: '2h ago',
      timestamp: now - 120 * 60 * 1000,
      impact: 'MEDIUM' as const,
      currencies: ['GBP', 'USD', 'EUR'],
      sentimentScore: 0.55,
      sentimentLabel: 'BULLISH' as const,
      summary: 'Resilient UK economic output dampens market bets on rapid Bank of England rate reductions in Q4.',
      tradingImplication: 'Supports GBP/USD resilience and bullish continuation on GBP/EUR cross.',
    },
    {
      id: 'news-6',
      title: 'Crude Oil Inventory Draw Surprises Markets, Boosting Canadian Dollar (CAD)',
      source: 'ForexLive',
      timeAgo: '3h ago',
      timestamp: now - 180 * 60 * 1000,
      impact: 'MEDIUM' as const,
      currencies: ['CAD', 'USD'],
      sentimentScore: 0.50,
      sentimentLabel: 'BULLISH' as const,
      summary: 'WTI crude oil advanced 2.4% following EIA inventory deficit, providing strong fundamental backing for commodity currencies.',
      tradingImplication: 'USD/CAD facing strong overhead resistance near 1.3780; potential short swing confluence.',
    },
  ];
}

export function getEconomicEvents() {
  return [
    {
      id: 'event-1',
      currency: 'USD',
      event: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
      time: '13:30 GMT',
      impact: 'HIGH' as const,
      forecast: '+165K',
      previous: '+142K',
      status: 'UPCOMING' as const,
    },
    {
      id: 'event-2',
      currency: 'EUR',
      event: 'Eurozone Core CPI Flash Estimate (YoY)',
      time: '10:00 GMT',
      impact: 'HIGH' as const,
      forecast: '2.7%',
      previous: '2.8%',
      status: 'UPCOMING' as const,
    },
    {
      id: 'event-3',
      currency: 'USD',
      event: 'FOMC Interest Rate Decision & Press Conference',
      time: '19:00 GMT',
      impact: 'HIGH' as const,
      forecast: '4.75%',
      previous: '5.00%',
      status: 'UPCOMING' as const,
    },
    {
      id: 'event-4',
      currency: 'GBP',
      event: 'Bank of England Monetary Policy Summary & Vote',
      time: '12:00 GMT',
      impact: 'HIGH' as const,
      forecast: '5.00%',
      previous: '5.00%',
      status: 'UPCOMING' as const,
    },
    {
      id: 'event-5',
      currency: 'JPY',
      event: 'BoJ Core CPI Index (YoY)',
      time: '00:30 GMT',
      impact: 'MEDIUM' as const,
      actual: '2.1%',
      forecast: '2.0%',
      previous: '1.9%',
      status: 'COMPLETED' as const,
    },
  ];
}

export function getCurrencySentiments() {
  return [
    { currency: 'USD', score: 48, label: 'LEAN_BULLISH' as const, newsCount: 14, keyTheme: 'Resilient economic data & cautious Fed rate cutting path' },
    { currency: 'EUR', score: -18, label: 'LEAN_BEARISH' as const, newsCount: 9, keyTheme: 'Manufacturing slowdown in core Germany & sluggish export demand' },
    { currency: 'GBP', score: 38, label: 'LEAN_BULLISH' as const, newsCount: 7, keyTheme: 'Sticky service inflation & steady Bank of England policy' },
    { currency: 'JPY', score: 62, label: 'BULLISH' as const, newsCount: 8, keyTheme: 'BoJ normalization talk & unwinding carry trade momentum' },
    { currency: 'AUD', score: 15, label: 'NEUTRAL' as const, newsCount: 5, keyTheme: 'RBA hawkish hold balanced against Chinese stimulus speed' },
    { currency: 'CAD', score: 28, label: 'LEAN_BULLISH' as const, newsCount: 6, keyTheme: 'Oil price rebound & stable labor metrics' },
    { currency: 'CHF', score: -12, label: 'NEUTRAL' as const, newsCount: 4, keyTheme: 'SNB negative inflation pressure & safe haven outflows' },
    { currency: 'XAU', score: 82, label: 'BULLISH' as const, newsCount: 11, keyTheme: 'Central bank gold reserves & geopolitical risk hedging' },
  ];
}
