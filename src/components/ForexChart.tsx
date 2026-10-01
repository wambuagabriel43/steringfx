import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Candle, ForexPair, Timeframe, AIPrediction } from '../types.ts';
import { 
  Eye, 
  EyeOff, 
  Maximize2, 
  BarChart2, 
  TrendingUp, 
  TrendingDown,
  Target, 
  ShieldAlert, 
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Sliders,
  DollarSign,
  MoveVertical,
  Download,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface ForexChartProps {
  candles: Candle[];
  pair: ForexPair;
  timeframe: Timeframe;
  digits: number;
  pipSize: number;
  prediction: AIPrediction | null;
  onRunScan: () => void;
  isLoading: boolean;
}

export const ForexChart: React.FC<ForexChartProps> = ({
  candles,
  pair,
  timeframe,
  digits,
  pipSize,
  prediction,
  onRunScan,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 440 });
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(55);
  
  // Indicator Toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showTargets, setShowTargets] = useState(true);

  // === INTERACTIVE DRAGGABLE TP & SL VISUAL RISK/REWARD STATE ===
  const [showRRTool, setShowRRTool] = useState(true);
  const [orderDir, setOrderDir] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState<number>(0.10);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [tpPrice, setTpPrice] = useState<number>(0);
  const [slPrice, setSlPrice] = useState<number>(0);
  const [draggingTarget, setDraggingTarget] = useState<'entry' | 'tp' | 'sl' | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<'entry' | 'tp' | 'sl' | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.floor(entry.contentRect.width),
            height: Math.max(400, Math.floor(entry.contentRect.height || 440)),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Visible window of candles
  const visibleCandles = useMemo(() => {
    if (candles.length <= visibleCount) return candles;
    return candles.slice(candles.length - visibleCount);
  }, [candles, visibleCount]);

  const lastCandle = visibleCandles[visibleCandles.length - 1];

  // Initialize or update default TP / SL / Entry when candles or prediction load
  useEffect(() => {
    if (lastCandle && entryPrice === 0) {
      const currentClose = lastCandle.close;
      const initialDir = prediction?.direction === 'SELL' ? 'SELL' : 'BUY';
      setOrderDir(initialDir);
      setEntryPrice(currentClose);
      
      const defaultPips = 30 * pipSize;
      if (initialDir === 'BUY') {
        setTpPrice(prediction?.takeProfit1 || Number((currentClose + defaultPips * 1.5).toFixed(digits)));
        setSlPrice(prediction?.stopLoss || Number((currentClose - defaultPips).toFixed(digits)));
      } else {
        setTpPrice(prediction?.takeProfit1 || Number((currentClose - defaultPips * 1.5).toFixed(digits)));
        setSlPrice(prediction?.stopLoss || Number((currentClose + defaultPips).toFixed(digits)));
      }
    }
  }, [lastCandle, prediction, pipSize, digits, entryPrice]);

  // Dimensions & Scale Calculations
  const rsiHeight = showRSI ? 85 : 0;
  const mainHeight = dimensions.height - rsiHeight - 35; // 35px for time axis
  const paddingRight = 75; // Price axis width
  const chartWidth = Math.max(100, dimensions.width - paddingRight);

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 1.0, maxPrice: 1.1, maxVolume: 1000 };
    
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showBollinger && c.lowerBand && c.lowerBand < min) min = c.lowerBand;
      if (showBollinger && c.upperBand && c.upperBand > max) max = c.upperBand;
      if (showTargets && prediction) {
        if (prediction.stopLoss < min) min = prediction.stopLoss;
        if (prediction.takeProfit1 > max) max = prediction.takeProfit1;
        if (prediction.takeProfit2 > max) max = prediction.takeProfit2;
      }
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Include interactive draggable prices in scale boundary if active
    if (showRRTool && entryPrice > 0) {
      if (entryPrice < min) min = entryPrice;
      if (entryPrice > max) max = entryPrice;
      if (tpPrice > 0) {
        if (tpPrice < min) min = tpPrice;
        if (tpPrice > max) max = tpPrice;
      }
      if (slPrice > 0) {
        if (slPrice < min) min = slPrice;
        if (slPrice > max) max = slPrice;
      }
    }

    const buffer = (max - min) * 0.08 || 0.001;
    return {
      minPrice: min - buffer,
      maxPrice: max + buffer,
      maxVolume: maxVol || 1,
    };
  }, [visibleCandles, showBollinger, showTargets, prediction, showRRTool, entryPrice, tpPrice, slPrice]);

  const candleWidth = Math.max(3, (chartWidth / visibleCandles.length) * 0.7);
  const candleGap = chartWidth / visibleCandles.length;

  const getY = useCallback((price: number) => {
    if (maxPrice === minPrice) return mainHeight / 2;
    return mainHeight - ((price - minPrice) / (maxPrice - minPrice)) * mainHeight;
  }, [maxPrice, minPrice, mainHeight]);

  const getPriceFromY = useCallback((y: number) => {
    const clampedY = Math.max(0, Math.min(mainHeight, y));
    const price = minPrice + ((mainHeight - clampedY) / mainHeight) * (maxPrice - minPrice);
    return Number(price.toFixed(digits));
  }, [minPrice, maxPrice, mainHeight, digits]);

  const getX = (index: number) => {
    return index * candleGap + candleGap / 2;
  };

  // Money & Risk Computations
  const isPairGold = pair.includes('XAU') || pair.includes('GOLD');
  const isPairCrypto = pair.includes('BTC') || pair.includes('ETH');
  const isPairJPY = pair.includes('JPY');

  // Approximate pip value in USD for 1.00 Standard Lot
  const pipValuePerLot = useMemo(() => {
    if (isPairGold) return 10.0; // $10 per $0.10 move on 100oz
    if (isPairCrypto) return 1.0;
    if (isPairJPY && entryPrice > 0) return (0.01 / entryPrice) * 100000;
    return 10.0; // Standard $10/pip on EURUSD, GBPUSD, AUDUSD, etc.
  }, [isPairGold, isPairCrypto, isPairJPY, entryPrice]);

  const pipValueCurrent = pipValuePerLot * lotSize;

  const tpPips = useMemo(() => {
    if (!tpPrice || !entryPrice || !pipSize) return 0;
    return Math.abs(tpPrice - entryPrice) / pipSize;
  }, [tpPrice, entryPrice, pipSize]);

  const slPips = useMemo(() => {
    if (!slPrice || !entryPrice || !pipSize) return 0;
    return Math.abs(entryPrice - slPrice) / pipSize;
  }, [slPrice, entryPrice, pipSize]);

  const tpMoney = useMemo(() => {
    return tpPips * pipValueCurrent;
  }, [tpPips, pipValueCurrent]);

  const slMoney = useMemo(() => {
    return slPips * pipValueCurrent;
  }, [slPips, pipValueCurrent]);

  const riskRewardRatio = useMemo(() => {
    if (slPips <= 0) return 0;
    return tpPips / slPips;
  }, [tpPips, slPips]);

  const riskPercentage = useMemo(() => {
    if (accountBalance <= 0) return 0;
    return (slMoney / accountBalance) * 100;
  }, [slMoney, accountBalance]);

  // Flip direction (BUY <-> SELL) and intelligently reflect TP and SL
  const handleToggleDirection = (newDir?: 'BUY' | 'SELL') => {
    const targetDir = newDir || (orderDir === 'BUY' ? 'SELL' : 'BUY');
    setOrderDir(targetDir);
    const currEntry = entryPrice || (lastCandle ? lastCandle.close : 1.0800);
    const tpDist = Math.abs(tpPrice - currEntry) || (30 * pipSize);
    const slDist = Math.abs(slPrice - currEntry) || (15 * pipSize);

    if (targetDir === 'BUY') {
      setTpPrice(Number((currEntry + tpDist).toFixed(digits)));
      setSlPrice(Number((currEntry - slDist).toFixed(digits)));
    } else {
      setTpPrice(Number((currEntry - tpDist).toFixed(digits)));
      setSlPrice(Number((currEntry + slDist).toFixed(digits)));
    }
  };

  // Reset lines to current live price
  const handleResetToMarket = () => {
    if (!lastCandle) return;
    const currentClose = lastCandle.close;
    setEntryPrice(currentClose);
    const defaultPips = 25 * pipSize;
    if (orderDir === 'BUY') {
      setTpPrice(Number((currentClose + defaultPips * 1.8).toFixed(digits)));
      setSlPrice(Number((currentClose - defaultPips).toFixed(digits)));
    } else {
      setTpPrice(Number((currentClose - defaultPips * 1.8).toFixed(digits)));
      setSlPrice(Number((currentClose + defaultPips).toFixed(digits)));
    }
  };

  // Sync with AI Prediction Targets
  const handleSyncWithAI = () => {
    if (!prediction || !lastCandle) return;
    setOrderDir(prediction.direction === 'SELL' ? 'SELL' : 'BUY');
    setEntryPrice(prediction.entryPrice || lastCandle.close);
    setTpPrice(prediction.takeProfit1);
    setSlPrice(prediction.stopLoss);
  };

  // Mouse Dragging Event Listeners
  const handleMouseDown = (target: 'entry' | 'tp' | 'sl', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTarget(target);
  };

  useEffect(() => {
    if (!draggingTarget) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPrice = getPriceFromY(y);

      if (draggingTarget === 'tp') {
        // Enforce valid side based on direction
        if (orderDir === 'BUY') {
          setTpPrice(Math.max(entryPrice + pipSize, newPrice));
        } else {
          setTpPrice(Math.min(entryPrice - pipSize, newPrice));
        }
      } else if (draggingTarget === 'sl') {
        if (orderDir === 'BUY') {
          setSlPrice(Math.min(entryPrice - pipSize, newPrice));
        } else {
          setSlPrice(Math.max(entryPrice + pipSize, newPrice));
        }
      } else if (draggingTarget === 'entry') {
        const diff = newPrice - entryPrice;
        setEntryPrice(newPrice);
        setTpPrice((prev) => Number((prev + diff).toFixed(digits)));
        setSlPrice((prev) => Number((prev + diff).toFixed(digits)));
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingTarget(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingTarget, getPriceFromY, orderDir, entryPrice, pipSize, digits]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= chartWidth && y >= 0 && y <= dimensions.height) {
      const idx = Math.min(
        visibleCandles.length - 1,
        Math.max(0, Math.floor(x / candleGap))
      );
      setHoveredCandle(visibleCandles[idx]);
      setHoverX(x);
      setHoverY(y);
    } else {
      setHoveredCandle(null);
      setHoverX(null);
      setHoverY(null);
    }
  };

  const handleMouseLeave = () => {
    if (!draggingTarget) {
      setHoveredCandle(null);
      setHoverX(null);
      setHoverY(null);
    }
  };

  // Price Axis Grid lines (6 horizontal levels)
  const priceGridLevels = useMemo(() => {
    const levels = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      const price = minPrice + ((maxPrice - minPrice) / count) * i;
      levels.push(price);
    }
    return levels;
  }, [minPrice, maxPrice]);

  return (
    <div id="scalper-chart-container" className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
      {/* Top Chart Toolbar */}
      <div className="px-4 py-2.5 bg-[#12192d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-sm text-white tracking-wide">{pair}</span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {timeframe}
            </span>
          </div>

          {lastCandle && (
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span>O: <span className="text-slate-200">{lastCandle.open.toFixed(digits)}</span></span>
              <span>H: <span className="text-emerald-400">{lastCandle.high.toFixed(digits)}</span></span>
              <span>L: <span className="text-rose-400">{lastCandle.low.toFixed(digits)}</span></span>
              <span>C: <span className="text-white font-bold">{lastCandle.close.toFixed(digits)}</span></span>
            </div>
          )}
        </div>

        {/* Indicator & Tool Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Visual Risk & Reward Draggable Indicator Button */}
          <button
            onClick={() => setShowRRTool(!showRRTool)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all font-semibold ${
              showRRTool 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60'
            }`}
            title="Toggle Draggable Visual Take Profit & Stop Loss Tool"
          >
            <MoveVertical className="w-3.5 h-3.5 text-emerald-400" />
            <span>Draggable TP/SL Tool</span>
            {showRRTool && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>

          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              showEMA20 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              showEMA50 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              showEMA200 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 200
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              showBollinger ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            BB (20,2)
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              showRSI ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            RSI (14)
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
            <button
              onClick={() => setVisibleCount((prev) => Math.max(25, prev - 10))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisibleCount((prev) => Math.min(120, prev + 10))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Interactive Risk/Reward Control Dock when Tool is Active */}
      {showRRTool && (
        <div className="bg-[#0b101d] border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Direction Toggle Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                onClick={() => handleToggleDirection('BUY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-bold text-[11px] transition-all ${
                  orderDir === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                BUY / LONG
              </button>
              <button
                onClick={() => handleToggleDirection('SELL')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-bold text-[11px] transition-all ${
                  orderDir === 'SELL'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                SELL / SHORT
              </button>
            </div>

            {/* Lot Size Steppers */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
              <span className="text-slate-400 text-[11px]">Lot Size:</span>
              <button
                onClick={() => setLotSize((l) => Math.max(0.01, Number((l - 0.05).toFixed(2))))}
                className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center justify-center text-xs"
              >
                -
              </button>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={lotSize}
                onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white text-[11px] focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => setLotSize((l) => Number((l + 0.05).toFixed(2)))}
                className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
              <span className="text-[10px] text-slate-400 font-mono">(${pipValueCurrent.toFixed(2)}/pip)</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetToMarket}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 border border-slate-700"
                title="Re-center draggable lines around current live price"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                Reset Lines
              </button>

              {prediction && (
                <button
                  onClick={handleSyncWithAI}
                  className="px-2 py-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 rounded text-[11px] flex items-center gap-1 border border-cyan-800/50"
                  title="Align lines to latest AI Forecast targets"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Sync AI
                </button>
              )}
            </div>
          </div>

          {/* Real-Time Profit / Loss / Risk Summary */}
          <div className="flex items-center gap-3 font-mono">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">
              <span className="text-emerald-400 font-bold">🎯 Win: +${tpMoney.toFixed(2)}</span>
              <span className="text-emerald-500 text-[10px]">({tpPips.toFixed(1)} pips)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-md">
              <span className="text-rose-400 font-bold">🛑 Risk: -${slMoney.toFixed(2)}</span>
              <span className="text-rose-500 text-[10px]">({slPips.toFixed(1)} pips | {riskPercentage.toFixed(1)}%)</span>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-md text-cyan-300 font-bold">
              <span>R:R 1 : {riskRewardRatio.toFixed(2)}</span>
            </div>

            {/* MT5 Indicator Download Shortcut */}
            <a
              href={`/api/mt5/download-visual-risk-reward?defaultLotSize=${lotSize}&defaultRiskPips=${slPips.toFixed(1)}&defaultRewardPips=${tpPips.toFixed(1)}&initialOrderType=${orderDir}`}
              download="Interactive_Visual_RiskReward.mq5"
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] flex items-center gap-1 shadow-sm font-sans font-semibold transition-all"
              title="Download this interactive indicator as .mq5 for MetaTrader 5"
            >
              <Download className="w-3 h-3" />
              Get MT5 Indicator
            </a>
          </div>
        </div>
      )}

      {/* Main Chart Canvas / SVG */}
      <div
        ref={containerRef}
        className="relative w-full h-[440px] bg-[#0a0f1d] select-none cursor-crosshair"
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full"
        >
          <defs>
            {/* Bollinger Band Fill Gradient */}
            <linearGradient id="bbAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>

            {/* Visual Risk & Reward Shaded Zone Gradients */}
            <linearGradient id="rewardZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="riskZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {priceGridLevels.map((p, idx) => {
            const y = getY(p);
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.toFixed(digits)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Fill & Lines */}
          {showBollinger && (
            <g>
              {/* BB Area */}
              <path
                d={visibleCandles
                  .map((c, i) => {
                    if (!c.upperBand || !c.lowerBand) return '';
                    const x = getX(i);
                    const yUpper = getY(c.upperBand);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${yUpper}`;
                  })
                  .filter(Boolean)
                  .join(' ') +
                  visibleCandles
                    .slice()
                    .reverse()
                    .map((c, i) => {
                      if (!c.lowerBand) return '';
                      const revIdx = visibleCandles.length - 1 - i;
                      const x = getX(revIdx);
                      const yLower = getY(c.lowerBand);
                      return `L ${x} ${yLower}`;
                    })
                    .filter(Boolean)
                    .join(' ') + ' Z'}
                fill="url(#bbAreaGrad)"
              />
              {/* Upper Line */}
              <path
                d={visibleCandles
                  .map((c, i) => {
                    if (!c.upperBand) return '';
                    const x = getX(i);
                    const y = getY(c.upperBand);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              {/* Lower Line */}
              <path
                d={visibleCandles
                  .map((c, i) => {
                    if (!c.lowerBand) return '';
                    const x = getX(i);
                    const y = getY(c.lowerBand);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            </g>
          )}

          {/* Candlesticks & Volume overlay */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isBull = c.close >= c.open;
            const candleColor = isBull ? '#10b981' : '#f43f5e';

            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const topBody = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            return (
              <g key={c.time || i}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={topBody}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isBull ? '#10b981' : '#f43f5e'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* EMA 20 Line (Amber) */}
          {showEMA20 && (
            <path
              d={visibleCandles
                .map((c, i) => {
                  if (!c.ema20) return '';
                  const x = getX(i);
                  const y = getY(c.ema20);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.6"
            />
          )}

          {/* EMA 50 Line (Cyan) */}
          {showEMA50 && (
            <path
              d={visibleCandles
                .map((c, i) => {
                  if (!c.ema50) return '';
                  const x = getX(i);
                  const y = getY(c.ema50);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.6"
            />
          )}

          {/* EMA 200 Line (Purple) */}
          {showEMA200 && (
            <path
              d={visibleCandles
                .map((c, i) => {
                  if (!c.ema200) return '';
                  const x = getX(i);
                  const y = getY(c.ema200);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
            />
          )}

          {/* === INTERACTIVE DRAGGABLE TP & SL OVERLAY === */}
          {showRRTool && entryPrice > 0 && tpPrice > 0 && slPrice > 0 && (
            <g className="draggable-rr-engine">
              {/* Shaded Reward Zone (Green) */}
              {(() => {
                const yEntry = getY(entryPrice);
                const yTP = getY(tpPrice);
                const top = Math.min(yEntry, yTP);
                const height = Math.abs(yEntry - yTP);
                const startX = Math.max(0, chartWidth * 0.45);
                return (
                  <g>
                    <rect
                      x={startX}
                      y={top}
                      width={chartWidth - startX}
                      height={height}
                      fill="url(#rewardZoneGrad)"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      strokeDasharray="4 4"
                      opacity="0.75"
                    />
                    <text
                      x={startX + 10}
                      y={top + height / 2 + 4}
                      fill="#34d399"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                      opacity="0.85"
                    >
                      +{tpPips.toFixed(1)} Pips (+${tpMoney.toFixed(2)})
                    </text>
                  </g>
                );
              })()}

              {/* Shaded Risk Zone (Red) */}
              {(() => {
                const yEntry = getY(entryPrice);
                const ySL = getY(slPrice);
                const top = Math.min(yEntry, ySL);
                const height = Math.abs(yEntry - ySL);
                const startX = Math.max(0, chartWidth * 0.45);
                return (
                  <g>
                    <rect
                      x={startX}
                      y={top}
                      width={chartWidth - startX}
                      height={height}
                      fill="url(#riskZoneGrad)"
                      stroke="#f43f5e"
                      strokeWidth="0.8"
                      strokeDasharray="4 4"
                      opacity="0.75"
                    />
                    <text
                      x={startX + 10}
                      y={top + height / 2 + 4}
                      fill="#fb7185"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                      opacity="0.85"
                    >
                      -{slPips.toFixed(1)} Pips (-${slMoney.toFixed(2)})
                    </text>
                  </g>
                );
              })()}

              {/* 1. ENTRY LINE (Cyan) */}
              {(() => {
                const y = getY(entryPrice);
                const isHovered = hoveredTarget === 'entry' || draggingTarget === 'entry';
                return (
                  <g
                    className="cursor-ns-resize group"
                    onMouseEnter={() => setHoveredTarget('entry')}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onMouseDown={(e) => handleMouseDown('entry', e)}
                  >
                    {/* Invisible thick hover area for easy grabbing */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="transparent"
                      strokeWidth="16"
                    />
                    {/* Visible Line */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#06b6d4"
                      strokeWidth={isHovered ? "2.5" : "1.8"}
                      strokeDasharray="5 3"
                    />
                    {/* Handle Tag */}
                    <g transform={`translate(${chartWidth - 190}, ${y - 12})`}>
                      <rect
                        width="185"
                        height="24"
                        rx="4"
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth="1.2"
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="92"
                        y="16"
                        fill="#67e8f9"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        🚀 {orderDir} @ {entryPrice.toFixed(digits)} (Drag Entry)
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* 2. TAKE PROFIT LINE (Green - DRAGGABLE) */}
              {(() => {
                const y = getY(tpPrice);
                const isHovered = hoveredTarget === 'tp' || draggingTarget === 'tp';
                return (
                  <g
                    className="cursor-ns-resize group"
                    onMouseEnter={() => setHoveredTarget('tp')}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onMouseDown={(e) => handleMouseDown('tp', e)}
                  >
                    {/* Invisible thick hover grab zone */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="transparent"
                      strokeWidth="16"
                    />
                    {/* Visible TP Line */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#10b981"
                      strokeWidth={isHovered ? "3" : "2"}
                    />
                    {/* Floating TP Money & Pips Badge */}
                    <g transform={`translate(${chartWidth - 225}, ${y - 13})`}>
                      <rect
                        width="220"
                        height="26"
                        rx="5"
                        fill={isHovered ? "#065f46" : "#064e3b"}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        className="filter drop-shadow-lg"
                      />
                      <text
                        x="110"
                        y="17"
                        fill="#a7f3d0"
                        fontSize="10.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        🎯 TP: {tpPrice.toFixed(digits)} | +${tpMoney.toFixed(2)} (+{tpPips.toFixed(1)}p)
                      </text>
                    </g>
                    {/* Drag Handle Icon on Left */}
                    <circle
                      cx={35}
                      cy={y}
                      r={isHovered ? 7 : 5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })()}

              {/* 3. STOP LOSS LINE (Red - DRAGGABLE) */}
              {(() => {
                const y = getY(slPrice);
                const isHovered = hoveredTarget === 'sl' || draggingTarget === 'sl';
                return (
                  <g
                    className="cursor-ns-resize group"
                    onMouseEnter={() => setHoveredTarget('sl')}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onMouseDown={(e) => handleMouseDown('sl', e)}
                  >
                    {/* Invisible thick hover grab zone */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="transparent"
                      strokeWidth="16"
                    />
                    {/* Visible SL Line */}
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#f43f5e"
                      strokeWidth={isHovered ? "3" : "2"}
                    />
                    {/* Floating SL Money & Risk Badge */}
                    <g transform={`translate(${chartWidth - 225}, ${y - 13})`}>
                      <rect
                        width="220"
                        height="26"
                        rx="5"
                        fill={isHovered ? "#881337" : "#4c0519"}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        className="filter drop-shadow-lg"
                      />
                      <text
                        x="110"
                        y="17"
                        fill="#fecdd3"
                        fontSize="10.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        🛑 SL: {slPrice.toFixed(digits)} | -${slMoney.toFixed(2)} (-{slPips.toFixed(1)}p)
                      </text>
                    </g>
                    {/* Drag Handle Icon on Left */}
                    <circle
                      cx={35}
                      cy={y}
                      r={isHovered ? 7 : 5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })()}
            </g>
          )}

          {/* RSI Sub-Chart Window */}
          {showRSI && (
            <g transform={`translate(0, ${mainHeight + 15})`}>
              {/* RSI Background and Separator */}
              <line
                x1={0}
                y1={0}
                x2={chartWidth + paddingRight}
                y2={0}
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <rect
                x={0}
                y={0}
                width={chartWidth}
                height={rsiHeight}
                fill="#070a14"
                opacity="0.9"
              />

              {/* Overbought 70 level */}
              <line
                x1={0}
                y1={rsiHeight * 0.3}
                x2={chartWidth}
                y2={rsiHeight * 0.3}
                stroke="#f43f5e"
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={chartWidth + 6}
                y={rsiHeight * 0.3 + 3}
                fill="#f43f5e"
                fontSize="9"
                fontFamily="monospace"
              >
                70 OB
              </text>

              {/* Middle 50 level */}
              <line
                x1={0}
                y1={rsiHeight * 0.5}
                x2={chartWidth}
                y2={rsiHeight * 0.5}
                stroke="#334155"
                strokeDasharray="2 2"
                strokeWidth="1"
              />

              {/* Oversold 30 level */}
              <line
                x1={0}
                y1={rsiHeight * 0.7}
                x2={chartWidth}
                y2={rsiHeight * 0.7}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={chartWidth + 6}
                y={rsiHeight * 0.7 + 3}
                fill="#10b981"
                fontSize="9"
                fontFamily="monospace"
              >
                30 OS
              </text>

              {/* RSI Label */}
              <text
                x={10}
                y={14}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                RSI (14): {lastCandle?.rsi ? lastCandle.rsi.toFixed(1) : '--'}
              </text>

              {/* RSI Line */}
              <path
                d={visibleCandles
                  .map((c, i) => {
                    if (c.rsi === undefined) return '';
                    const x = getX(i);
                    const y = rsiHeight - (c.rsi / 100) * rsiHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.6"
              />
            </g>
          )}

          {/* Hover Crosshair & Data Tooltip */}
          {hoverX !== null && hoverY !== null && hoveredCandle && !draggingTarget && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={dimensions.height}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={0}
                y1={hoverY}
                x2={chartWidth}
                y2={hoverY}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>

        {/* Hovered Price Info Tooltip Box */}
        {hoveredCandle && hoverX !== null && !draggingTarget && (
          <div
            className="absolute z-20 bg-[#0f172a]/95 border border-slate-700 p-2 rounded-lg text-[11px] font-mono shadow-xl pointer-events-none text-slate-200"
            style={{
              left: Math.min(hoverX + 15, dimensions.width - 180),
              top: 15,
            }}
          >
            <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
              {new Date(hoveredCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
              <span>Open: <span className="text-white">{hoveredCandle.open.toFixed(digits)}</span></span>
              <span>High: <span className="text-emerald-400">{hoveredCandle.high.toFixed(digits)}</span></span>
              <span>Low: <span className="text-rose-400">{hoveredCandle.low.toFixed(digits)}</span></span>
              <span>Close: <span className="text-white font-bold">{hoveredCandle.close.toFixed(digits)}</span></span>
              {hoveredCandle.rsi !== undefined && (
                <span>RSI: <span className="text-teal-400">{hoveredCandle.rsi.toFixed(1)}</span></span>
              )}
              <span>Vol: <span className="text-slate-300">{hoveredCandle.volume}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Legend & Quick Help */}
      <div className="px-4 py-2 bg-[#0d1322] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded"></span> 🎯 Drag Green TP Line
          </span>
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="w-2.5 h-0.5 bg-rose-400 rounded"></span> 🛑 Drag Red SL Line
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded"></span> 🚀 Drag Cyan Entry
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">1 Pip = {pipSize} | Contract: 100k Units</span>
        </div>
      </div>
    </div>
  );
};
