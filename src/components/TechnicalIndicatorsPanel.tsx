import React from 'react';
import { IndicatorSnapshot, ForexPair, Timeframe } from '../types.ts';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Layers, 
  Shield, 
  Zap,
  Sliders
} from 'lucide-react';

interface TechnicalIndicatorsPanelProps {
  indicators: IndicatorSnapshot | null;
  pair: ForexPair;
  timeframe: Timeframe;
  digits: number;
}

export const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = ({
  indicators,
  pair,
  timeframe,
  digits,
}) => {
  if (!indicators) {
    return (
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400">
        Loading technical indicators...
      </div>
    );
  }

  const isRsiBull = indicators.rsi14 >= 50;
  const isEmaBull = indicators.emaTrend.includes('UP');

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-[#12192d] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
            Technical Indicator Matrix ({timeframe})
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {indicators.candlestickPattern}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* RSI (14) */}
        <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">RSI (14)</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-base font-extrabold font-mono ${isRsiBull ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.rsi14.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">{indicators.rsiStatus}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${isRsiBull ? 'bg-emerald-400' : 'bg-rose-400'}`}
              style={{ width: `${indicators.rsi14}%` }}
            ></div>
          </div>
        </div>

        {/* EMA Trend */}
        <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">EMA 20/50/200</div>
          <div className="flex items-center gap-1.5 mt-1">
            {isEmaBull ? (
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-bold text-white truncate font-mono">
              {indicators.emaTrend.replace('_', ' ')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            EMA50: {indicators.ema50.toFixed(digits)}
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Bollinger (20,2)</div>
          <div className="text-xs font-bold text-cyan-300 mt-1 font-mono">
            {indicators.bollingerBands.status}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Width: {indicators.bollingerBands.bandwidth}%
          </div>
        </div>

        {/* ATR (14) Volatility */}
        <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">ATR (14) Volatility</div>
          <div className="text-base font-extrabold text-amber-400 mt-1 font-mono">
            {indicators.atrPips} pips
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
            Range: {indicators.atr14.toFixed(digits)}
          </div>
        </div>
      </div>

      {/* Classic Pivot Levels */}
      <div className="px-4 pb-4">
        <div className="p-2.5 rounded-lg bg-[#090d18] border border-slate-800 text-[11px] font-mono">
          <div className="text-[10px] text-slate-400 uppercase mb-1.5 flex items-center justify-between">
            <span>Classic Support & Resistance Pivots</span>
            <span className="text-slate-300">Central Pivot: {indicators.pivotPoints.pivot.toFixed(digits)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-1 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
              <div className="text-[9px] text-slate-400">S2</div>
              <div>{indicators.pivotPoints.s2.toFixed(digits)}</div>
            </div>
            <div className="p-1 rounded bg-rose-900/20 border border-rose-800/30 text-rose-300">
              <div className="text-[9px] text-slate-400">S1</div>
              <div>{indicators.pivotPoints.s1.toFixed(digits)}</div>
            </div>
            <div className="p-1 rounded bg-emerald-900/20 border border-emerald-800/30 text-emerald-300">
              <div className="text-[9px] text-slate-400">R1</div>
              <div>{indicators.pivotPoints.r1.toFixed(digits)}</div>
            </div>
            <div className="p-1 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
              <div className="text-[9px] text-slate-400">R2</div>
              <div>{indicators.pivotPoints.r2.toFixed(digits)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
