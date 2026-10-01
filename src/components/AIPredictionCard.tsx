import React, { useState } from 'react';
import { AIPrediction, ForexPair, Timeframe } from '../types.ts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  Newspaper, 
  BarChart3, 
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';

interface AIPredictionCardProps {
  prediction: AIPrediction | null;
  pair: ForexPair;
  timeframe: Timeframe;
  digits: number;
  pipSize: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenMT5Modal: () => void;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({
  prediction,
  pair,
  timeframe,
  digits,
  pipSize,
  isLoading,
  onRefresh,
  onOpenMT5Modal,
}) => {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
          <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white mt-4 font-mono">
          AI Confluence Engine Running...
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Analyzing {pair} ({timeframe}) technical indicators and cross-referencing with live macroeconomic news sentiment feeds.
        </p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[320px] text-center">
        <Sparkles className="w-10 h-10 text-emerald-400/50 mb-3" />
        <h3 className="text-base font-bold text-white font-mono">No Active AI Prediction</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Click below to initiate deep multi-factor market analysis for {pair}.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all"
        >
          Generate AI Prediction
        </button>
      </div>
    );
  }

  const isBuy = prediction.signal.includes('BUY');
  const isSell = prediction.signal.includes('SELL');

  const signalColor = isBuy 
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
    : isSell 
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' 
    : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  const copyTradePlan = () => {
    const text = `FOREX AI SIGNAL [${prediction.pair} - ${prediction.timeframe}]
Signal: ${prediction.signal} (${prediction.confluenceScore}% Confluence)
Entry: ${prediction.entryPrice.toFixed(digits)}
Stop Loss: ${prediction.stopLoss.toFixed(digits)} (${prediction.potentialPipsRisk} pips)
Take Profit 1: ${prediction.takeProfit1.toFixed(digits)} (${prediction.potentialPipsReward} pips)
Take Profit 2: ${prediction.takeProfit2.toFixed(digits)}
Risk:Reward: ${prediction.riskRewardRatio}
AI Rationale: ${prediction.aiRationale}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header Banner */}
      <div className="px-5 py-3.5 bg-[#12192d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm text-white font-mono">
            AI CONFLUENCE SYNTHESIS
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            • {new Date(prediction.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {prediction.engine && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              prediction.isLiveAI !== false 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                : 'bg-teal-950/60 text-teal-300 border-teal-500/40'
            }`}>
              {prediction.isLiveAI !== false ? `Gemini AI (${prediction.engine})` : 'Quant Confluence Engine'}
            </span>
          )}

          <button
            onClick={copyTradePlan}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Copy Signal Details"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Signal Direction & Confluence Score Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#090d18] border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${signalColor} flex items-center justify-center`}>
              {isBuy ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : isSell ? (
                <TrendingDown className="w-6 h-6 text-rose-400" />
              ) : (
                <Flame className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Directional Bias
              </div>
              <div className="text-xl font-extrabold tracking-tight font-mono text-white flex items-center gap-2">
                {prediction.signal.replace('_', ' ')}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">
                  {prediction.pair} {prediction.timeframe}
                </span>
              </div>
            </div>
          </div>

          {/* Confluence Rating Bar */}
          <div className="sm:text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Confluence Probability
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {prediction.confluenceScore}%
            </div>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 sm:ml-auto">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                style={{ width: `${prediction.confluenceScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Technical vs Fundamental Sentiment Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#111728] border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                Technical Score
              </span>
              <span className="font-bold text-white font-mono">{prediction.technicalScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${prediction.technicalScore}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {prediction.technicalSummary}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#111728] border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Newspaper className="w-3.5 h-3.5 text-teal-400" />
                News Sentiment Score
              </span>
              <span className="font-bold text-white font-mono">{prediction.sentimentScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-teal-400 rounded-full"
                style={{ width: `${prediction.sentimentScore}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {prediction.sentimentSummary}
            </p>
          </div>
        </div>

        {/* Trade Execution Plan Levels Grid */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>High-Probability Trade Plan</span>
            <span className="text-emerald-400 font-bold">R:R {prediction.riskRewardRatio}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Entry */}
            <div className="p-2.5 rounded-lg bg-[#090e1c] border border-blue-500/30">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                Entry Price
              </div>
              <div className="text-sm font-extrabold font-mono text-white mt-0.5">
                {prediction.entryPrice.toFixed(digits)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Market Order</div>
            </div>

            {/* Stop Loss */}
            <div className="p-2.5 rounded-lg bg-[#090e1c] border border-rose-500/30">
              <div className="text-[10px] font-mono text-rose-400 uppercase font-semibold">
                Stop Loss (SL)
              </div>
              <div className="text-sm font-extrabold font-mono text-rose-200 mt-0.5">
                {prediction.stopLoss.toFixed(digits)}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">
                -{prediction.potentialPipsRisk} pips
              </div>
            </div>

            {/* Take Profit 1 */}
            <div className="p-2.5 rounded-lg bg-[#090e1c] border border-emerald-500/30">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                Take Profit 1 (TP1)
              </div>
              <div className="text-sm font-extrabold font-mono text-emerald-200 mt-0.5">
                {prediction.takeProfit1.toFixed(digits)}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                +{prediction.potentialPipsReward} pips
              </div>
            </div>

            {/* Take Profit 2 */}
            <div className="p-2.5 rounded-lg bg-[#090e1c] border border-teal-500/30">
              <div className="text-[10px] font-mono text-teal-400 uppercase font-semibold">
                Take Profit 2 (TP2)
              </div>
              <div className="text-sm font-extrabold font-mono text-teal-200 mt-0.5">
                {prediction.takeProfit2.toFixed(digits)}
              </div>
              <div className="text-[10px] text-teal-400/80 mt-0.5">
                Runner Target
              </div>
            </div>
          </div>
        </div>

        {/* AI Rationale & Key Drivers */}
        <div className="p-3.5 rounded-lg bg-[#090d18] border border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI Analytical Thesis
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {prediction.aiRationale}
          </p>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Confluence Factors:
            </div>
            <div className="space-y-1">
              {prediction.keyDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button: Send to MT5 */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={onOpenMT5Modal}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md hover:from-emerald-400 hover:to-teal-400 active:scale-98 transition-all"
          >
            <span>Upload & Sync Setup in MT5</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
