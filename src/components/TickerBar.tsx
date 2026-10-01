import React from 'react';
import { PairQuote, ForexPair } from '../types.ts';
import { TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';

interface TickerBarProps {
  quotes: PairQuote[];
  selectedPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({
  quotes,
  selectedPair,
  onSelectPair,
}) => {
  return (
    <div className="bg-[#090d16] border-b border-slate-800/80 overflow-x-auto py-1.5 px-4 scrollbar-thin">
      <div className="flex items-center gap-4 min-w-max">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono pr-2 border-r border-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300">LIVE FEED</span>
        </div>

        {quotes.map((q) => {
          const isUp = q.change24h >= 0;
          const isSelected = q.symbol === selectedPair;

          return (
            <button
              key={q.symbol}
              onClick={() => onSelectPair(q.symbol)}
              className={`flex items-center gap-2.5 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 text-white shadow-sm'
                  : 'bg-[#111726]/80 border-slate-800/60 text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className="font-bold">{q.symbol}</span>
              <span className="font-semibold text-slate-100">{q.bid.toFixed(q.digits)}</span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-medium ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isUp ? '+' : ''}
                {q.change24h.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">
                {q.spreadPips.toFixed(1)}p
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
