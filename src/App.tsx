import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ForexPair, 
  Timeframe, 
  PairQuote, 
  Candle, 
  IndicatorSnapshot, 
  NewsItem, 
  EconomicEvent, 
  CurrencySentimentMeter, 
  AIPrediction, 
  EASettings 
} from './types.ts';
import { INITIAL_QUOTES } from './data/initialData.ts';
import { Header } from './components/Header.tsx';
import { TickerBar } from './components/TickerBar.tsx';
import { ForexChart } from './components/ForexChart.tsx';
import { AIPredictionCard } from './components/AIPredictionCard.tsx';
import { TechnicalIndicatorsPanel } from './components/TechnicalIndicatorsPanel.tsx';
import { NewsSentimentFeed } from './components/NewsSentimentFeed.tsx';
import { EconomicCalendar } from './components/EconomicCalendar.tsx';
import { CurrencySentimentMatrix } from './components/CurrencySentimentMatrix.tsx';
import { MT5HubView } from './components/MT5HubView.tsx';
import { LotSizeCalculator } from './components/LotSizeCalculator.tsx';
import { StrategyMatrix } from './components/StrategyMatrix.tsx';
import { BacktestView } from './components/BacktestView.tsx';
import { MarketChatAgent } from './components/MarketChatAgent.tsx';
import { TradingViewChart } from './components/TradingViewChart.tsx';
import { SterlingButlerModal } from './components/SterlingButlerModal.tsx';

export default function App() {
  const [currentPair, setCurrentPair] = useState<ForexPair>('EURUSD');
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('H1');
  const [activeTab, setActiveTab] = useState<'terminal' | 'news' | 'mt5' | 'matrix' | 'calculator' | 'backtest' | 'ai-chat'>('terminal');
  const [chartEngine, setChartEngine] = useState<'tradingview' | 'scalper'>('tradingview');
  const [isButlerOpen, setIsButlerOpen] = useState<boolean>(false);

  // Market Data States - Initialized with full baseline quotes for instant rendering
  const [quotes, setQuotes] = useState<PairQuote[]>(INITIAL_QUOTES);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<IndicatorSnapshot | null>(null);
  const [digits, setDigits] = useState<number>(5);
  const [pipSize, setPipSize] = useState<number>(0.0001);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [sentiments, setSentiments] = useState<CurrencySentimentMeter[]>([]);

  // AI Prediction State
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // MT5 EA Settings
  const [eaSettings, setEaSettings] = useState<EASettings>({
    apiUrl: typeof window !== 'undefined' ? `${window.location.origin}` : 'https://your-domain.run.app',
    magicNumber: 882049,
    riskPercent: 1.5,
    fixedLot: 0.10,
    useFixedLot: false,
    minConfidence: 75,
    useTrailingStop: true,
    trailingStopPips: 25.0,
    trailingStepPips: 10.0,
    maxSpreadPips: 2.5,
    maxSlippagePips: 20,
    pollIntervalSeconds: 60,
    allowAutoExecution: true,
    enableOnChartHUD: true,
    enableSoundAlerts: true,
    enablePushAlerts: true,
  });

  // Resilient Quotes Fetch with fallback & graceful silent retry
  const fetchQuotes = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch('/api/forex/pairs', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.pairs) && data.pairs.length > 0) {
          setQuotes(data.pairs);
        }
      } else if (retryCount < 3) {
        // Retry shortly if dev server is warming up
        setTimeout(() => fetchQuotes(retryCount + 1), 1500 * (retryCount + 1));
      }
    } catch {
      if (retryCount < 3) {
        setTimeout(() => fetchQuotes(retryCount + 1), 1500 * (retryCount + 1));
      }
    }
  }, []);

  // Fetch Candles & Technical Indicators for current pair & timeframe
  const fetchChartData = useCallback(async (retryCount = 0) => {
    setIsLoadingChart(true);
    try {
      const res = await fetch(`/api/forex/candles?pair=${currentPair}&timeframe=${currentTimeframe}&count=80`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.candles) setCandles(data.candles);
        if (data.indicators) setIndicators(data.indicators);
        if (data.digits) setDigits(data.digits);
        if (data.pipSize) setPipSize(data.pipSize);
      } else if (retryCount < 2) {
        setTimeout(() => fetchChartData(retryCount + 1), 1200);
      }
    } catch {
      if (retryCount < 2) {
        setTimeout(() => fetchChartData(retryCount + 1), 1200);
      }
    } finally {
      setIsLoadingChart(false);
    }
  }, [currentPair, currentTimeframe]);

  // Fetch News, Events, and Sentiments (Live Fundamental Feed)
  const fetchMacroData = useCallback(async (retryCount = 0) => {
    setIsRefreshingNews(true);
    try {
      const [newsRes, eventsRes, sentimentsRes] = await Promise.all([
        fetch('/api/news').catch(() => null),
        fetch('/api/economic-calendar').catch(() => null),
        fetch('/api/sentiments').catch(() => null),
      ]);

      if (newsRes && newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.news) setNews(newsData.news);
      }
      if (eventsRes && eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.events) setEvents(eventsData.events);
      }
      if (sentimentsRes && sentimentsRes.ok) {
        const sentimentsData = await sentimentsRes.json();
        if (sentimentsData.sentiments) setSentiments(sentimentsData.sentiments);
      }
    } catch {
      if (retryCount < 2) {
        setTimeout(() => fetchMacroData(retryCount + 1), 2000);
      }
    } finally {
      setIsRefreshingNews(false);
    }
  }, []);

  // Run AI Confluence Prediction
  const runAIPrediction = useCallback(async (force = false) => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: currentPair,
          timeframe: currentTimeframe,
          forceRefresh: force,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch {
      // Prediction fallback is handled seamlessly
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentPair, currentTimeframe]);

  // Sync API URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setEaSettings(prev => ({
        ...prev,
        apiUrl: window.location.origin,
      }));
    }
  }, []);

  // Initial Boot & Periodic Polling
  useEffect(() => {
    fetchQuotes();
    fetchMacroData();

    const interval = setInterval(() => {
      fetchQuotes();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchQuotes, fetchMacroData]);

  // Refetch chart data when pair or timeframe changes
  useEffect(() => {
    fetchChartData();
    runAIPrediction(false);
  }, [fetchChartData, runAIPrediction]);

  // Utility for foolproof direct Blob downloads (never navigates iframe or downloads HTML)
  const triggerBlobDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Handle EA download
  const handleDownloadEA = async () => {
    try {
      const res = await fetch('/api/mt5/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eaSettings),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          triggerBlobDownload(data.code, 'AI_Forex_Confluence_EA.mq5');
          return;
        }
      }
    } catch (e) {
      console.error('EA direct download failed, falling back:', e);
    }

    const query = new URLSearchParams({
      apiUrl: eaSettings.apiUrl,
      magicNumber: String(eaSettings.magicNumber),
      riskPercent: String(eaSettings.riskPercent),
      fixedLot: String(eaSettings.fixedLot),
      useFixedLot: String(eaSettings.useFixedLot),
      minConfidence: String(eaSettings.minConfidence),
      useTrailingStop: String(eaSettings.useTrailingStop),
      trailingStopPips: String(eaSettings.trailingStopPips),
      trailingStepPips: String(eaSettings.trailingStepPips),
      maxSpreadPips: String(eaSettings.maxSpreadPips),
      pollIntervalSeconds: String(eaSettings.pollIntervalSeconds),
      allowAutoExecution: String(eaSettings.allowAutoExecution),
      enableOnChartHUD: String(eaSettings.enableOnChartHUD),
      enableSoundAlerts: String(eaSettings.enableSoundAlerts),
      enablePushAlerts: String(eaSettings.enablePushAlerts),
    }).toString();

    window.open(`/api/mt5/download-ea?${query}`, '_blank');
  };

  const handleDownloadIndicator = async () => {
    try {
      const res = await fetch('/api/mt5/download-indicator');
      if (res.ok) {
        const text = await res.text();
        triggerBlobDownload(text, 'AI_Forex_Sentiment_HUD.mq5');
        return;
      }
    } catch (e) {
      console.error('Indicator download fallback:', e);
    }
    window.open(`/api/mt5/download-indicator`, '_blank');
  };

  const handleDownloadVisualRiskReward = async () => {
    try {
      const res = await fetch('/api/mt5/generate-visual-risk-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultLotSize: eaSettings.fixedLot || 0.10,
          defaultRiskPips: 20.0,
          defaultRewardPips: 40.0,
          initialOrderType: 'BUY',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) {
          triggerBlobDownload(data.code, 'Interactive_Visual_RiskReward.mq5');
          return;
        }
      }
    } catch (e) {
      console.error('Visual RR download fallback:', e);
    }

    const query = new URLSearchParams({
      defaultLotSize: String(eaSettings.fixedLot || 0.10),
      defaultRiskPips: '20.0',
      defaultRewardPips: '40.0',
      initialOrderType: 'BUY',
    }).toString();

    window.open(`/api/mt5/download-visual-risk-reward?${query}`, '_blank');
  };

  const currentQuote = quotes.find((q) => q.symbol === currentPair);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        currentPair={currentPair}
        currentTimeframe={currentTimeframe}
        onSelectPair={setCurrentPair}
        onSelectTimeframe={setCurrentTimeframe}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRunAnalysis={() => runAIPrediction(true)}
        isLoadingAI={isLoadingAI}
        onDownloadEA={handleDownloadEA}
      />

      {/* Live Market Tickers Bar */}
      <TickerBar
        quotes={quotes}
        selectedPair={currentPair}
        onSelectPair={setCurrentPair}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: LIVE TERMINAL & CHARTS */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Chart + Technical Indicators Panel (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Chart Engine Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#0e1424] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 bg-[#090d19] p-1 rounded-lg border border-slate-800">
                    <button
                      id="btn-engine-tradingview"
                      onClick={() => setChartEngine('tradingview')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                        chartEngine === 'tradingview'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>TradingView Live Pro</span>
                    </button>
                    <button
                      id="btn-engine-scalper"
                      onClick={() => setChartEngine('scalper')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                        chartEngine === 'scalper'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>AI Draggable TP/SL HUD</span>
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
                      {chartEngine === 'tradingview' ? 'Real-Time WebSocket Tick Stream' : 'Interactive MT5 Order Simulator'}
                    </span>
                  </div>
                </div>

                {chartEngine === 'tradingview' ? (
                  <TradingViewChart
                    pair={currentPair}
                    timeframe={currentTimeframe}
                    height={460}
                  />
                ) : (
                  <ForexChart
                    candles={candles}
                    pair={currentPair}
                    timeframe={currentTimeframe}
                    digits={digits}
                    pipSize={pipSize}
                    prediction={prediction}
                    onRunScan={() => runAIPrediction(true)}
                    isLoading={isLoadingChart}
                  />
                )}

                <TechnicalIndicatorsPanel
                  indicators={indicators}
                  pair={currentPair}
                  timeframe={currentTimeframe}
                  digits={digits}
                />
              </div>

              {/* Right Column: AI Prediction Card + Quick Lot Calculator (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <AIPredictionCard
                  prediction={prediction}
                  pair={currentPair}
                  timeframe={currentTimeframe}
                  digits={digits}
                  pipSize={pipSize}
                  isLoading={isLoadingAI}
                  onRefresh={() => runAIPrediction(true)}
                  onOpenMT5Modal={() => setActiveTab('mt5')}
                />

                <LotSizeCalculator
                  pair={currentPair}
                  quote={currentQuote}
                  defaultStopLossPips={prediction?.potentialPipsRisk || 30}
                />
              </div>
            </div>

            {/* Bottom Row: Live Macro News Feed Snippet & Currency Sentiments */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-7">
                <NewsSentimentFeed 
                  news={news} 
                  selectedPair={currentPair} 
                  onRefresh={fetchMacroData}
                  isRefreshing={isRefreshingNews}
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <CurrencySentimentMatrix sentiments={sentiments} />
                <EconomicCalendar events={events} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NEWS & SENTIMENT FEED */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <NewsSentimentFeed 
                  news={news} 
                  selectedPair={currentPair} 
                  onRefresh={fetchMacroData}
                  isRefreshing={isRefreshingNews}
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <CurrencySentimentMatrix sentiments={sentiments} />
                <EconomicCalendar events={events} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MT5 EA GENERATOR & BRIDGE */}
        {activeTab === 'mt5' && (
          <MT5HubView
            currentPair={currentPair}
            currentTimeframe={currentTimeframe}
            eaSettings={eaSettings}
            onUpdateEASettings={(newVals) => setEaSettings((prev) => ({ ...prev, ...newVals }))}
            onDownloadEA={handleDownloadEA}
            onDownloadIndicator={handleDownloadIndicator}
            onDownloadVisualRiskReward={handleDownloadVisualRiskReward}
          />
        )}

        {/* TAB 4: CONFLUENCE MATRIX */}
        {activeTab === 'matrix' && (
          <StrategyMatrix
            currentPair={currentPair}
            currentTimeframe={currentTimeframe}
            prediction={prediction}
          />
        )}

        {/* TAB 5: RISK & POSITION SIZE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <LotSizeCalculator
              pair={currentPair}
              quote={currentQuote}
              defaultStopLossPips={prediction?.potentialPipsRisk || 30}
            />
          </div>
        )}

        {/* TAB 6: HISTORICAL BACKTEST SIMULATOR */}
        {activeTab === 'backtest' && (
          <BacktestView
            currentPair={currentPair}
            currentTimeframe={currentTimeframe}
            onSelectPair={setCurrentPair}
            onSelectTimeframe={setCurrentTimeframe}
          />
        )}

        {/* TAB 7: AI MARKET ANALYST CHAT */}
        {activeTab === 'ai-chat' && (
          <div className="max-w-4xl mx-auto">
            <MarketChatAgent
              currentPair={currentPair}
              timeframe={currentTimeframe}
              price={currentQuote?.bid}
              rsi={indicators?.rsi14}
              emaTrend={indicators?.emaTrend}
              newsSentiment={prediction?.sentimentSummary}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d18] py-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Forex AI MT5 Predictor • Technical & Live News Confluence System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              MT5 Bridge API: Online
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Risk Disclosure: Trading Forex carries significant risk.</span>
          </div>
        </div>
      </footer>

      {/* Executive Trading Butler Floating Modal & Launcher */}
      <SterlingButlerModal
        currentPair={currentPair}
        currentTimeframe={currentTimeframe}
        price={currentQuote?.bid}
        rsi={indicators?.rsi14}
        emaTrend={indicators?.emaTrend}
        newsSentiment={prediction?.sentimentSummary}
        isOpen={isButlerOpen}
        onToggle={() => setIsButlerOpen((prev) => !prev)}
      />
    </div>
  );
}
