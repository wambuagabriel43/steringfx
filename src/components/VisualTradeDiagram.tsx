import React from 'react';
import { TrendingUp, TrendingDown, Target, ShieldAlert, Sparkles, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface VisualDiagramData {
  title: string;
  type?: 'liquidity_sweep' | 'fvg_orderblock' | 'bullish_reversal' | 'bearish_continuation' | 'risk_reward' | 'range_breakout' | string;
  pair?: string;
  direction?: 'LONG' | 'SHORT' | 'NEUTRAL';
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  keyLevels?: Array<{
    label: string;
    price: number;
    color?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'blue' | 'purple' | string;
  }>;
  description?: string;
}

interface VisualTradeDiagramProps {
  data: VisualDiagramData;
}

export const VisualTradeDiagram: React.FC<VisualTradeDiagramProps> = ({ data }) => {
  const isLong = data.direction === 'LONG';
  const isShort = data.direction === 'SHORT';

  // Calculate potential risk and reward in pips if entry, sl, tp provided
  let riskPips = 0;
  let rewardPips = 0;
  let rrRatio = 'N/A';

  if (data.entry && data.stopLoss && data.takeProfit) {
    const diffSl = Math.abs(data.entry - data.stopLoss);
    const diffTp = Math.abs(data.takeProfit - data.entry);
    const pipScale = data.pair?.includes('JPY') ? 0.01 : (data.pair?.includes('BTC') || data.pair?.includes('XAU')) ? 1.0 : 0.0001;
    riskPips = Number((diffSl / pipScale).toFixed(1));
    rewardPips = Number((diffTp / pipScale).toFixed(1));
    if (riskPips > 0) {
      rrRatio = `1:${(rewardPips / riskPips).toFixed(2)}`;
    }
  }

  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="my-3 rounded-xl border border-slate-700/80 bg-gradient-to-b from-[#0f172a] to-[#090d16] p-4 shadow-xl text-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLong ? 'bg-emerald-500/20 text-emerald-400' : isShort ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isLong ? <ArrowUpRight className="w-4 h-4" /> : isShort ? <ArrowDownRight className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm">{data.title}</span>
              {data.pair && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {data.pair}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sterling Illustrated Market Schematic
            </span>
          </div>
        </div>

        {rrRatio !== 'N/A' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Risk : Reward</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {rrRatio}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Schematic */}
      <div className="relative w-full h-44 bg-[#0a0f1d] rounded-lg border border-slate-800/80 overflow-hidden mb-3 p-2">
        <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bullGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="bearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="fvgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="40" x2="400" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

          {isLong ? (
            <>
              {/* Bullish setup visualization */}
              {/* Take Profit target zone */}
              <rect x="230" y="20" width="160" height="25" fill="#10b981" fillOpacity="0.12" rx="4" />
              <line x1="220" y1="32" x2="400" y2="32" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="390" y="28" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="end">TARGET / TP: {data.takeProfit}</text>

              {/* Fair Value Gap or Order Block */}
              <rect x="140" y="68" width="110" height="24" fill="url(#fvgGrad)" rx="3" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
              <text x="145" y="83" fill="#fbbf24" fontSize="8" fontWeight="600">FVG / Demand Zone</text>

              {/* Entry level line */}
              <line x1="120" y1="92" x2="400" y2="92" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="200" cy="92" r="3.5" fill="#38bdf8" />
              <text x="210" y="90" fill="#38bdf8" fontSize="9" fontWeight="bold">ENTRY: {data.entry}</text>

              {/* Stop loss level */}
              <line x1="100" y1="135" x2="400" y2="135" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="390" y="131" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="end">STOP LOSS: {data.stopLoss}</text>

              {/* Stylized Candlestick sequence */}
              {/* Candle 1 (Bearish impulse) */}
              <line x1="50" y1="45" x2="50" y2="110" stroke="#f43f5e" strokeWidth="1" />
              <rect x="44" y="55" width="12" height="45" fill="#f43f5e" rx="1" />

              {/* Candle 2 (Liquidity sweep wick) */}
              <line x1="85" y1="80" x2="85" y2="148" stroke="#f43f5e" strokeWidth="1.5" />
              <rect x="79" y="85" width="12" height="25" fill="#f43f5e" rx="1" />
              <circle cx="85" cy="148" r="2.5" fill="#f43f5e" />
              <text x="85" y="157" fill="#fda4af" fontSize="7" textAnchor="middle">Liquidity Sweep</text>

              {/* Candle 3 (Strong Bullish displacement) */}
              <line x1="120" y1="70" x2="120" y2="120" stroke="#10b981" strokeWidth="1" />
              <rect x="114" y="75" width="12" height="40" fill="#10b981" rx="1" />

              {/* Candle 4 (Mitigation / Retest entry) */}
              <line x1="155" y1="80" x2="155" y2="105" stroke="#10b981" strokeWidth="1" />
              <rect x="149" y="88" width="12" height="12" fill="#10b981" rx="1" />

              {/* Path of projection */}
              <path d="M 160 92 Q 220 85, 270 45 T 350 32" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrow)" />
            </>
          ) : (
            <>
              {/* Bearish setup visualization */}
              <line x1="100" y1="25" x2="400" y2="25" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="390" y="22" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="end">STOP LOSS: {data.stopLoss}</text>

              {/* Fair Value Gap or Supply Block */}
              <rect x="140" y="68" width="110" height="24" fill="url(#fvgGrad)" rx="3" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
              <text x="145" y="83" fill="#fbbf24" fontSize="8" fontWeight="600">FVG / Supply Zone</text>

              {/* Entry level line */}
              <line x1="120" y1="70" x2="400" y2="70" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="200" cy="70" r="3.5" fill="#38bdf8" />
              <text x="210" y="68" fill="#38bdf8" fontSize="9" fontWeight="bold">ENTRY: {data.entry}</text>

              {/* Take profit line */}
              <rect x="230" y="125" width="160" height="25" fill="#10b981" fillOpacity="0.12" rx="4" />
              <line x1="220" y1="135" x2="400" y2="135" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="390" y="132" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="end">TARGET / TP: {data.takeProfit}</text>

              {/* Stylized Candlestick sequence for bearish reversal */}
              <line x1="50" y1="60" x2="50" y2="120" stroke="#10b981" strokeWidth="1" />
              <rect x="44" y="65" width="12" height="40" fill="#10b981" rx="1" />

              {/* High sweep wick */}
              <line x1="85" y1="15" x2="85" y2="80" stroke="#f43f5e" strokeWidth="1.5" />
              <rect x="79" y="35" width="12" height="25" fill="#f43f5e" rx="1" />
              <circle cx="85" cy="15" r="2.5" fill="#f43f5e" />
              <text x="85" y="12" fill="#fda4af" fontSize="7" textAnchor="middle">Liquidity Sweep</text>

              {/* Bearish impulse */}
              <line x1="120" y1="45" x2="120" y2="105" stroke="#f43f5e" strokeWidth="1" />
              <rect x="114" y="55" width="12" height="42" fill="#f43f5e" rx="1" />

              {/* Path of projection */}
              <path d="M 160 70 Q 220 80, 270 115 T 350 135" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 3" />
            </>
          )}
        </svg>
      </div>

      {/* Numerical Trade Parameters */}
      <div className="grid grid-cols-3 gap-2 mb-3 font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
          <span className="text-[10px] text-slate-400 block">Entry Point</span>
          <span className="text-xs font-bold text-sky-400">{data.entry ?? 'Market'}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Stop Loss</span>
            {riskPips > 0 && <span className="text-[9px] text-rose-400">-{riskPips} pips</span>}
          </div>
          <span className="text-xs font-bold text-rose-400">{data.stopLoss ?? 'Defined'}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Take Profit</span>
            {rewardPips > 0 && <span className="text-[9px] text-emerald-400">+{rewardPips} pips</span>}
          </div>
          <span className="text-xs font-bold text-emerald-400">{data.takeProfit ?? 'Target'}</span>
        </div>
      </div>

      {/* Key Levels List */}
      {data.keyLevels && data.keyLevels.length > 0 && (
        <div className="space-y-1.5 mb-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Key Institutional Levels:</span>
          <div className="flex flex-wrap gap-1.5">
            {data.keyLevels.map((lvl, idx) => (
              <div key={idx} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono ${getBadgeColor(lvl.color)}`}>
                <span className="font-medium">{lvl.label}:</span>
                <span className="font-bold">{lvl.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Walkthrough Description */}
      {data.description && (
        <p className="text-slate-300 text-[11px] leading-relaxed mt-2 pt-2 border-t border-slate-800/80 bg-slate-900/40 p-2 rounded">
          {data.description}
        </p>
      )}
    </div>
  );
};
