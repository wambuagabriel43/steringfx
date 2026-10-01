import React from 'react';
import { ForexPair, Timeframe, PairQuote } from '../types.ts';
import { 
  Bot, 
  Download, 
  Sparkles, 
  Cpu, 
  Activity, 
  Layers, 
  Newspaper, 
  Sliders, 
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  History
} from 'lucide-react';

interface HeaderProps {
  currentPair: ForexPair;
  currentTimeframe: Timeframe;
  onSelectPair: (pair: ForexPair) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
  activeTab: 'terminal' | 'news' | 'mt5' | 'matrix' | 'calculator' | 'backtest' | 'ai-chat';
  onSelectTab: (tab: 'terminal' | 'news' | 'mt5' | 'matrix' | 'calculator' | 'backtest' | 'ai-chat') => void;
  onRunAnalysis: () => void;
  isLoadingAI: boolean;
  onDownloadEA: () => void;
}

const PAIRS: { symbol: ForexPair; label: string }[] = [
  { symbol: 'EURUSD', label: 'EUR/USD' },
  { symbol: 'GBPUSD', label: 'GBP/USD' },
  { symbol: 'USDJPY', label: 'USD/JPY' },
  { symbol: 'AUDUSD', label: 'AUD/USD' },
  { symbol: 'USDCAD', label: 'USD/CAD' },
  { symbol: 'USDCHF', label: 'USD/CHF' },
  { symbol: 'NZDUSD', label: 'NZD/USD' },
  { symbol: 'EURJPY', label: 'EUR/JPY' },
  { symbol: 'GBPJPY', label: 'GBP/JPY' },
  { symbol: 'XAUUSD', label: 'XAU/USD (Gold)' },
  { symbol: 'BTCUSD', label: 'BTC/USD' },
];

const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

export const Header: React.FC<HeaderProps> = ({
  currentPair,
  currentTimeframe,
  onSelectPair,
  onSelectTimeframe,
  activeTab,
  onSelectTab,
  onRunAnalysis,
  isLoadingAI,
  onDownloadEA,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d121f]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0e1a] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-mono">
                  FOREX<span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  MT5 Bridge
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Technical Confluence & Live Sentiment Predictor
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#121829] p-1 rounded-lg border border-slate-800/80">
            <button
              id="tab-terminal"
              onClick={() => onSelectTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'terminal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Terminal
            </button>
            <button
              id="tab-news"
              onClick={() => onSelectTab('news')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'news'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              News & Sentiment
            </button>
            <button
              id="tab-mt5"
              onClick={() => onSelectTab('mt5')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'mt5'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              MT5 EA Generator
            </button>
            <button
              id="tab-matrix"
              onClick={() => onSelectTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Confluence Matrix
            </button>
            <button
              id="tab-calculator"
              onClick={() => onSelectTab('calculator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Risk Calculator
            </button>
            <button
              id="tab-backtest"
              onClick={() => onSelectTab('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'backtest'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Backtest
            </button>
            <button
              id="tab-ai-chat"
              onClick={() => onSelectTab('ai-chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'ai-chat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/40'
              }`}
            >
              <span>🎩</span>
              Sterling (AI Butler)
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-run-ai-scan"
              onClick={onRunAnalysis}
              disabled={isLoadingAI}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
              <span>{isLoadingAI ? 'Analyzing...' : 'AI Scan'}</span>
            </button>

            <button
              id="btn-header-download-ea"
              onClick={onDownloadEA}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a2238] hover:bg-[#222d4a] text-teal-300 border border-teal-500/30 transition-all active:scale-95"
              title="Download MetaTrader 5 Expert Advisor (.mq5)"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Get .mq5 EA</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Currency Pair & Timeframe Selector */}
        <div className="py-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Pair Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1">
              Pairs:
            </span>
            {PAIRS.map((p) => (
              <button
                key={p.symbol}
                id={`pair-btn-${p.symbol}`}
                onClick={() => onSelectPair(p.symbol)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
                  currentPair === p.symbol
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                    : 'bg-[#151c2e] text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#121829] p-0.5 rounded border border-slate-800 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 px-1.5">TF:</span>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all ${
                  currentTimeframe === tf
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/40 text-[11px]">
          <button
            onClick={() => onSelectTab('terminal')}
            className={`px-2 py-1 rounded ${activeTab === 'terminal' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Terminal
          </button>
          <button
            onClick={() => onSelectTab('news')}
            className={`px-2 py-1 rounded ${activeTab === 'news' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            News & Sentiment
          </button>
          <button
            onClick={() => onSelectTab('mt5')}
            className={`px-2 py-1 rounded ${activeTab === 'mt5' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
          >
            MT5 EA
          </button>
          <button
            onClick={() => onSelectTab('matrix')}
            className={`px-2 py-1 rounded ${activeTab === 'matrix' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Matrix
          </button>
          <button
            onClick={() => onSelectTab('calculator')}
            className={`px-2 py-1 rounded ${activeTab === 'calculator' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Risk Calc
          </button>
          <button
            onClick={() => onSelectTab('backtest')}
            className={`px-2 py-1 rounded ${activeTab === 'backtest' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Backtest
          </button>
        </div>
      </div>
    </header>
  );
};
