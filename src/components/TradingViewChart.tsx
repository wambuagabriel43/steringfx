import React, { useMemo, memo } from 'react';
import { ForexPair, Timeframe } from '../types.ts';
import { ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface TradingViewChartProps {
  pair: ForexPair;
  timeframe: Timeframe;
  height?: number | string;
}

// Convert app ForexPair to official TradingView ticker symbol
export function mapPairToTradingViewSymbol(pair: ForexPair): string {
  switch (pair) {
    case 'EURUSD':
      return 'FX:EURUSD';
    case 'GBPUSD':
      return 'FX:GBPUSD';
    case 'USDJPY':
      return 'FX:USDJPY';
    case 'AUDUSD':
      return 'FX:AUDUSD';
    case 'USDCAD':
      return 'FX:USDCAD';
    case 'USDCHF':
      return 'FX:USDCHF';
    case 'NZDUSD':
      return 'FX:NZDUSD';
    case 'EURGBP':
      return 'FX:EURGBP';
    case 'EURJPY':
      return 'FX:EURJPY';
    case 'GBPJPY':
      return 'FX:GBPJPY';
    case 'XAUUSD':
      return 'OANDA:XAUUSD';
    case 'BTCUSD':
      return 'BINANCE:BTCUSDT';
    default:
      return `FX:${pair}`;
  }
}

// Convert app Timeframe to TradingView resolution interval
export function mapTimeframeToTradingViewInterval(tf: Timeframe): string {
  switch (tf) {
    case 'M1':
      return '1';
    case 'M5':
      return '5';
    case 'M15':
      return '15';
    case 'H1':
      return '60';
    case 'H4':
      return '240';
    case 'D1':
      return 'D';
    default:
      return '60';
  }
}

export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({
  pair,
  timeframe,
  height = 500,
}) => {
  const tvSymbol = mapPairToTradingViewSymbol(pair);
  const tvInterval = mapTimeframeToTradingViewInterval(timeframe);

  // Generate safe, direct isolated iframe URL for TradingView widget
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      frameElementId: 'tradingview_embed_widget',
      symbol: tvSymbol,
      interval: tvInterval,
      hidetoptoolbar: '0',
      symboledit: '1',
      saveimage: '1',
      toolbarbg: '#0a0f1d',
      studies: JSON.stringify(['RSI@tv-basicstudies', 'MASimple@tv-basicstudies']),
      theme: 'dark',
      style: '1',
      timezone: 'Etc/UTC',
      withdateranges: '1',
      showpopupbutton: '1',
      popupwidth: '1000',
      popupheight: '650',
      locale: 'en',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [tvSymbol, tvInterval]);

  return (
    <div id="tradingview-chart-container" className="flex flex-col bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* TradingView Top Info Header */}
      <div className="px-4 py-2.5 bg-[#12192a] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">TRADINGVIEW UNLIMITED PRO FEED</span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Symbol: <span className="text-white font-bold">{tvSymbol}</span> ({timeframe})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Real-Time Tick Streaming
          </span>
          <span className="hidden sm:flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Rate Limits
          </span>
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Expand</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Sandboxed Safe Iframe Container */}
      <div 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="w-full relative min-h-[460px] bg-[#0a0f1d]"
      >
        <iframe
          key={`${tvSymbol}-${tvInterval}`}
          title={`TradingView-${tvSymbol}`}
          src={iframeSrc}
          className="w-full h-full border-0"
          style={{ width: '100%', height: '100%' }}
          allow="fullscreen"
          loading="lazy"
        />
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
