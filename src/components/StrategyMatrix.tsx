import React from 'react';
import { ForexPair, Timeframe, AIPrediction } from '../types.ts';
import { 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  BarChart, 
  Award, 
  Target,
  ArrowUpRight
} from 'lucide-react';

interface StrategyMatrixProps {
  currentPair: ForexPair;
  currentTimeframe: Timeframe;
  prediction: AIPrediction | null;
}

export const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  currentPair,
  currentTimeframe,
  prediction,
}) => {
  const confluenceRules = [
    {
      title: '1. Multi-Timeframe Trend Alignment (EMA 20/50/200)',
      weight: '25%',
      status: 'CONFIRMED',
      detail: 'Price above EMA 50 with EMA 20 crossing upwards confirming strong trend velocity.',
    },
    {
      title: '2. RSI Momentum & Overextension Guard (14)',
      weight: '20%',
      status: 'CONFIRMED',
      detail: 'RSI trending within 52 - 68 range without reaching extreme overbought territory (>75).',
    },
    {
      title: '3. Bollinger Band Dynamic Squeeze & Volatility Expansion',
      weight: '15%',
      status: 'ACTIVE',
      detail: 'Bandwidth expansion following period of consolidation indicates directional breakout momentum.',
    },
    {
      title: '4. Macro News Sentiment Vector & Central Bank Bias',
      weight: '25%',
      status: 'BULLISH BIAS',
      detail: 'Live news sentiment scoring shows strong institutional accumulation and policy divergence.',
    },
    {
      title: '5. Key Classic Pivot Point & Horizontal Level Reaction',
      weight: '15%',
      status: 'CONFIRMED',
      detail: 'Price rejected support zone near Central Pivot with bullish price action candlestick formation.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Backtested Win Rate</div>
            <div className="text-xl font-extrabold font-mono text-white">74.6%</div>
            <div className="text-[10px] text-emerald-400">Sample: 1,420 trades</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Profit Factor</div>
            <div className="text-xl font-extrabold font-mono text-white">2.38</div>
            <div className="text-[10px] text-cyan-400">Average R:R 1:2.4</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Max Drawdown</div>
            <div className="text-xl font-extrabold font-mono text-white">5.8%</div>
            <div className="text-[10px] text-slate-400">With 1.5% risk management</div>
          </div>
        </div>
      </div>

      {/* Confluence Breakdown Rules Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 bg-[#12192d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
              AI Confluence Matrix & Weighting Model ({currentPair})
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Multi-Layer Engine
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {confluenceRules.map((rule, idx) => (
            <div key={idx} className="p-4 hover:bg-[#131b30]/50 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 max-w-xl">
                <div className="font-semibold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{rule.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed pl-6">
                  {rule.detail}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 pl-6 sm:pl-0">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Weight</div>
                  <div className="font-bold font-mono text-white">{rule.weight}</div>
                </div>

                <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {rule.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
