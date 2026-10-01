import React from 'react';
import { CurrencySentimentMeter } from '../types.ts';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';

interface CurrencySentimentMatrixProps {
  sentiments: CurrencySentimentMeter[];
}

export const CurrencySentimentMatrix: React.FC<CurrencySentimentMatrixProps> = ({
  sentiments,
}) => {
  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-[#12192d] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
            Currency Strength & Sentiment Meter
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Live Macro Bias</span>
      </div>

      <div className="p-4 space-y-3">
        {sentiments.map((s) => {
          const isPos = s.score > 0;
          const isNeg = s.score < 0;
          const absScore = Math.abs(s.score);

          return (
            <div key={s.currency} className="space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white w-10">{s.currency}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isPos
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : isNeg
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.label.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  {isPos ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isNeg ? (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'}>
                    {isPos ? '+' : ''}{s.score}
                  </span>
                </div>
              </div>

              {/* Dual-direction sentiment bar */}
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full flex overflow-hidden">
                <div className="w-1/2 flex justify-end">
                  {isNeg && (
                    <div
                      className="h-full bg-rose-400 rounded-l-full"
                      style={{ width: `${Math.min(100, absScore * 1.5)}%` }}
                    ></div>
                  )}
                </div>
                <div className="w-0.5 h-full bg-slate-600"></div>
                <div className="w-1/2 flex justify-start">
                  {isPos && (
                    <div
                      className="h-full bg-emerald-400 rounded-r-full"
                      style={{ width: `${Math.min(100, absScore * 1.5)}%` }}
                    ></div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 truncate">
                {s.keyTheme}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
