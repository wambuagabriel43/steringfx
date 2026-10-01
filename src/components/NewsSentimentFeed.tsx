import React, { useState } from 'react';
import { NewsItem, ForexPair } from '../types.ts';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Zap,
  Globe2,
  Radio
} from 'lucide-react';

interface NewsSentimentFeedProps {
  news: NewsItem[];
  selectedPair: ForexPair;
  onFilterByPair?: (pair: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const NewsSentimentFeed: React.FC<NewsSentimentFeedProps> = ({
  news,
  selectedPair,
  onRefresh,
  isRefreshing = false,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  const currencies = [
    { id: 'ALL', label: 'ALL PAIRS' },
    { id: 'USD', label: 'USD' },
    { id: 'EUR', label: 'EUR' },
    { id: 'GBP', label: 'GBP' },
    { id: 'JPY', label: 'JPY' },
    { id: 'XAUUSD', label: 'GOLD (XAU)' },
    { id: 'CAD', label: 'CAD / OIL' },
    { id: 'AUD', label: 'AUD' },
    { id: 'CHF', label: 'CHF' },
    { id: 'BTCUSD', label: 'BTC' },
  ];

  const sources = [
    { id: 'ALL', label: 'ALL SOURCES' },
    { id: 'FXSTREET', label: 'FXSTREET' },
    { id: 'FOREXLIVE', label: 'FOREXLIVE' },
    { id: 'MACRO', label: 'CENTRAL BANKS' },
  ];

  const filteredNews = news.filter((n) => {
    // Filter by currency
    const matchesCurrency = selectedCurrency === 'ALL' || n.currencies.some((c) => c.toUpperCase().includes(selectedCurrency));
    
    // Filter by source
    let matchesSource = true;
    if (selectedSource === 'FXSTREET') {
      matchesSource = n.source.toLowerCase().includes('fxstreet');
    } else if (selectedSource === 'FOREXLIVE') {
      matchesSource = n.source.toLowerCase().includes('forexlive') || n.source.toLowerCase().includes('investinglive');
    } else if (selectedSource === 'MACRO') {
      matchesSource = !n.source.toLowerCase().includes('fxstreet') && !n.source.toLowerCase().includes('forexlive');
    }

    return matchesCurrency && matchesSource;
  });

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#12192d] border-b border-slate-800 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
              Live FXStreet & ForexLive RSS Feeds
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>UNLIMITED LIVE RSS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                id="refresh-news-feed"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all border border-slate-700/60 disabled:opacity-50"
                title="Fetch fresh live news from free RSS sources"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isRefreshing ? 'Syncing Feeds...' : 'Sync Live RSS'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Source & Currency Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          {/* Source Tabs */}
          <div className="flex items-center gap-1 bg-[#090d1a] p-1 rounded-lg border border-slate-800/80">
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => setSelectedSource(src.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all whitespace-nowrap ${
                  selectedSource === src.id
                    ? src.id === 'FXSTREET'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : src.id === 'FOREXLIVE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {/* Currency Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
            {currencies.map((curr) => (
              <button
                key={curr.id}
                onClick={() => setSelectedCurrency(curr.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all whitespace-nowrap ${
                  selectedCurrency === curr.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-[#182035] text-slate-400 hover:text-slate-200'
                }`}
              >
                {curr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="divide-y divide-slate-800/60 max-h-[580px] overflow-y-auto">
        {filteredNews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            No live articles matching source: <span className="text-amber-400 font-bold">{selectedSource}</span> & currency: <span className="text-emerald-400 font-bold">{selectedCurrency}</span>. Select "ALL" to view the full feed.
          </div>
        ) : (
          filteredNews.map((item) => {
            const isBull = item.sentimentLabel === 'BULLISH';
            const isBear = item.sentimentLabel === 'BEARISH';
            const isFXStreet = item.source.toLowerCase().includes('fxstreet');
            const isForexLive = item.source.toLowerCase().includes('forexlive') || item.source.toLowerCase().includes('investinglive');

            return (
              <div
                key={item.id}
                className="p-4 hover:bg-[#131b30]/60 transition-all text-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Source Pill */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                        isFXStreet
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isForexLive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Globe2 className="w-2.5 h-2.5" />
                      {item.source}
                    </span>

                    {/* Currency tags */}
                    {item.currencies.map((c) => (
                      <span
                        key={c}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a233a] text-slate-300 border border-slate-700/50"
                      >
                        {c}
                      </span>
                    ))}

                    {/* Impact badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.impact === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.impact === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.impact} IMPACT
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {item.timeAgo}
                    </span>
                  </div>

                  {/* Sentiment Meter Badge */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold shrink-0 ${
                      isBull
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isBear
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isBull ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : isBear ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Flame className="w-3 h-3" />
                    )}
                    <span>{item.sentimentLabel} ({item.sentimentScore > 0 ? '+' : ''}{item.sentimentScore})</span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-slate-100 text-sm leading-snug flex items-center gap-1.5">
                  <span>{item.title}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex shrink-0 p-0.5"
                      title="Read original article"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </h4>

                {/* Summary */}
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {item.summary}
                </p>

                {/* Fundamental Implication Box */}
                <div className="p-2.5 rounded-lg bg-[#090e1c] border border-emerald-500/20 text-[11px] text-emerald-300/90 font-mono flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-400 mr-1.5">Fundamental Implication:</span>
                      {item.tradingImplication}
                    </div>
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <span>Read Full</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
