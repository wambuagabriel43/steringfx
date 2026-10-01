import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ForexPair, 
  Timeframe, 
  BacktestResult, 
  BacktestTrade, 
  EquityPoint,
  Candle 
} from '../types.ts';
import { 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign, 
  Award, 
  ShieldAlert, 
  Calendar, 
  Sliders, 
  Download, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Activity, 
  Clock, 
  BarChart2, 
  ChevronRight, 
  Info,
  Maximize2,
  RefreshCw,
  FileText
} from 'lucide-react';

interface BacktestViewProps {
  currentPair: ForexPair;
  currentTimeframe: Timeframe;
  onSelectPair: (pair: ForexPair) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
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

const TIMEFRAMES: Timeframe[] = ['M15', 'H1', 'H4', 'D1'];

export const BacktestView: React.FC<BacktestViewProps> = ({
  currentPair,
  currentTimeframe,
  onSelectPair,
  onSelectTimeframe,
}) => {
  // Preset Date Ranges
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [presetRange, setPresetRange] = useState<'7d' | '14d' | '30d' | '60d' | '90d' | 'custom'>('30d');

  // Strategy Parameters
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [tpStrategy, setTpStrategy] = useState<'TP1' | 'TP2' | 'DYNAMIC_TRAIL'>('TP2');
  const [rrRatio, setRrRatio] = useState<number>(2.0);
  const [spreadPips, setSpreadPips] = useState<number>(1.0);
  const [enableNewsFilter, setEnableNewsFilter] = useState<boolean>(true);

  // UI States
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeVisualTab, setActiveVisualTab] = useState<'equity' | 'chart' | 'distribution'>('equity');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WON' | 'LOST' | 'BUY' | 'SELL'>('ALL');
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null);

  // Backtest State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset Handlers
  const handleSelectPreset = (preset: '7d' | '14d' | '30d' | '60d' | '90d') => {
    setPresetRange(preset);
    const end = new Date();
    const start = new Date();
    const days = preset === '7d' ? 7 : preset === '14d' ? 14 : preset === '30d' ? 30 : preset === '60d' ? 60 : 90;
    start.setDate(end.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Run Backtest
  const runSimulation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/forex/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: currentPair,
          timeframe: currentTimeframe,
          startDate,
          endDate,
          initialBalance,
          riskPercent,
          minConfidence,
          tpStrategy,
          rrRatio,
          spreadPips,
          enableNewsFilter,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: BacktestResult = await res.json();
      setResult(data);
      if (data.trades.length > 0) {
        setSelectedTrade(data.trades[0]);
      }
    } catch (err: any) {
      console.error('Failed to run backtest:', err);
      setErrorMsg('Failed to run simulation. Please verify date parameters and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run on initial mount or when pair/timeframe changes
  useEffect(() => {
    runSimulation();
  }, [currentPair, currentTimeframe]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (!result) return [];
    if (tradeFilter === 'ALL') return result.trades;
    if (tradeFilter === 'WON') return result.trades.filter((t) => t.status === 'WON');
    if (tradeFilter === 'LOST') return result.trades.filter((t) => t.status === 'LOST');
    if (tradeFilter === 'BUY') return result.trades.filter((t) => t.type === 'BUY');
    if (tradeFilter === 'SELL') return result.trades.filter((t) => t.type === 'SELL');
    return result.trades;
  }, [result, tradeFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (!result || result.trades.length === 0) return;
    const headers = ['Trade #', 'Date', 'Type', 'Confidence %', 'Entry Price', 'Exit Price', 'SL', 'TP1', 'TP2', 'Lot Size', 'PnL ($)', 'PnL (%)', 'Pips', 'Status', 'Exit Reason'];
    const rows = result.trades.map((t) => [
      t.tradeNumber,
      new Date(t.entryTime).toISOString(),
      t.type,
      t.confidence,
      t.entryPrice,
      t.exitPrice,
      t.stopLoss,
      t.takeProfit1,
      t.takeProfit2,
      t.lotSize,
      t.pnl,
      t.pnlPercent,
      t.pips,
      t.status,
      t.exitReason,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ForexAI_Backtest_${result.pair}_${result.timeframe}_${result.startDate}_to_${result.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Report
  const handleExportJSON = () => {
    if (!result) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `ForexAI_Backtest_${result.pair}_${result.timeframe}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Parameter Card */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Historical AI Strategy Backtester
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Precision Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verify AI confluence entries, dynamic risk profiles, and historical win rates against past market price action.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showSettings 
                  ? 'bg-slate-800 text-teal-300 border-teal-500/40' 
                  : 'bg-[#151c2e] text-slate-300 hover:bg-slate-800 border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Strategy Parameters</span>
            </button>

            <button
              id="btn-run-backtest"
              onClick={runSimulation}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'fill-slate-950'}`} />
              <span>{isLoading ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Date Range Selection & Quick Presets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Preset Buttons (6 cols) */}
          <div className="md:col-span-6 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1">
              Window:
            </span>
            {(['7d', '14d', '30d', '60d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  presetRange === p
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-[#151c2e] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : p === '30d' ? '30 Days' : p === '60d' ? '60 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Date Pickers (6 cols) */}
          <div className="md:col-span-6 flex items-center gap-2 justify-start md:justify-end text-xs">
            <div className="flex items-center gap-1.5 bg-[#121829] border border-slate-800 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPresetRange('custom');
                }}
                className="bg-transparent text-slate-200 text-xs font-mono outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#121829] border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPresetRange('custom');
                }}
                className="bg-transparent text-slate-200 text-xs font-mono outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Expandable Advanced Strategy Settings Drawer */}
        {showSettings && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-fadeIn">
            {/* Initial Capital */}
            <div className="bg-[#121829] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <label className="text-slate-400 font-mono text-[11px] flex items-center justify-between">
                <span>Initial Balance (USD)</span>
                <span className="text-emerald-400 font-bold">${initialBalance.toLocaleString()}</span>
              </label>
              <div className="flex items-center gap-2">
                {[5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setInitialBalance(amt)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono ${
                      initialBalance === amt 
                        ? 'bg-emerald-500 text-slate-950 font-bold' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ${amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Per Trade */}
            <div className="bg-[#121829] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Risk Per Trade</span>
                <span className="text-teal-400 font-bold">{riskPercent}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                className="w-full accent-teal-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5% (Safe)</span>
                <span>2.0%</span>
                <span>5.0% (Aggressive)</span>
              </div>
            </div>

            {/* Min Confluence Threshold */}
            <div className="bg-[#121829] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Min AI Confluence</span>
                <span className="text-emerald-400 font-bold">{minConfidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                step="5"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50%</span>
                <span>70% (Default)</span>
                <span>85% (High Precision)</span>
              </div>
            </div>

            {/* Take Profit Target Strategy */}
            <div className="bg-[#121829] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <label className="text-slate-400 font-mono text-[11px] block">
                Exit / Take Profit Rule
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setTpStrategy('TP1')}
                  className={`py-1 px-1.5 rounded text-[10px] font-mono text-center transition-all ${
                    tpStrategy === 'TP1' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  title="Close 100% on conservative TP1 (1.2 R:R)"
                >
                  TP1 (1.2R)
                </button>
                <button
                  onClick={() => setTpStrategy('TP2')}
                  className={`py-1 px-1.5 rounded text-[10px] font-mono text-center transition-all ${
                    tpStrategy === 'TP2' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  title="Run trade to extended TP2 (2.0 R:R)"
                >
                  TP2 (2.0R)
                </button>
                <button
                  onClick={() => setTpStrategy('DYNAMIC_TRAIL')}
                  className={`py-1 px-1.5 rounded text-[10px] font-mono text-center transition-all ${
                    tpStrategy === 'DYNAMIC_TRAIL' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  title="Activate ATR trailing stop after 1R profit"
                >
                  Trail Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Key Performance Indicators (KPIs) */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Net Profit */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Net Profit</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-lg font-extrabold font-mono ${result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toLocaleString()}
            </div>
            <div className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${result.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.netProfitPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{result.netProfitPercent >= 0 ? '+' : ''}{result.netProfitPercent}%</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Win Rate</span>
              <Percent className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-extrabold font-mono text-white">
              {result.winRate}%
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-emerald-400">{result.winningTrades}W</span>
              <span>/</span>
              <span className="text-rose-400">{result.losingTrades}L</span>
              <span className="text-slate-500">({result.totalTrades} tot)</span>
            </div>
          </div>

          {/* Profit Factor */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Profit Factor</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-lg font-extrabold font-mono ${result.profitFactor >= 1.5 ? 'text-emerald-400' : result.profitFactor >= 1.0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {result.profitFactor}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {result.profitFactor >= 2.0 ? 'Exceptional' : result.profitFactor >= 1.4 ? 'Profitable' : 'Marginal'}
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Max Drawdown</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg font-extrabold font-mono text-rose-400">
              -{result.maxDrawdownPercent}%
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              -${result.maxDrawdownAmount.toLocaleString()} peak
            </div>
          </div>

          {/* Total Pips Gained */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Total Pips</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-lg font-extrabold font-mono ${result.totalPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.totalPips >= 0 ? '+' : ''}{result.totalPips}
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400">+{result.avgWinPips}</span>
              <span>/</span>
              <span className="text-rose-400">-{result.avgLossPips} avg</span>
            </div>
          </div>

          {/* Sharpe Ratio & Expectancy */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Sharpe / Exp.</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-extrabold font-mono text-white">
              {result.sharpeRatio}
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              +${result.expectancy} / trade
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Container */}
      {result && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {/* Chart Tabs Bar */}
          <div className="px-5 py-3 bg-[#12192d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveVisualTab('equity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeVisualTab === 'equity'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Cumulative Equity Curve
              </button>

              <button
                onClick={() => setActiveVisualTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeVisualTab === 'chart'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-teal-400" />
                Price Action & Trade Signal Replay
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a2238] hover:bg-[#232e4c] text-teal-300 border border-teal-500/30 transition-all font-mono text-[11px]"
                title="Export Trades to CSV"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a2238] hover:bg-[#232e4c] text-slate-300 border border-slate-700 transition-all font-mono text-[11px]"
                title="Download JSON Report"
              >
                <FileText className="w-3 h-3" />
                JSON Report
              </button>
            </div>
          </div>

          {/* TAB 1: CUMULATIVE EQUITY CURVE CHART */}
          {activeVisualTab === 'equity' && (
            <div className="p-5">
              <EquityCurveChart equityCurve={result.equityCurve} initialBalance={result.initialBalance} />
            </div>
          )}

          {/* TAB 2: PRICE ACTION & TRADE SIGNAL REPLAY */}
          {activeVisualTab === 'chart' && (
            <div className="p-5">
              <BacktestCandleReplayChart
                candles={result.candles}
                trades={result.trades}
                pair={result.pair}
                timeframe={result.timeframe}
                onSelectTrade={(t) => setSelectedTrade(t)}
                selectedTradeId={selectedTrade?.id}
              />
            </div>
          )}
        </div>
      )}

      {/* Trade Log & Deep Inspection View */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Trade Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="px-5 py-3.5 bg-[#12192d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono">
                  Executed Trades Log
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {filteredTrades.length} trades
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 text-xs">
                {(['ALL', 'WON', 'LOST', 'BUY', 'SELL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTradeFilter(filter)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-all ${
                      tradeFilter === filter
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Trades Table */}
            <div className="overflow-x-auto max-h-[440px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0f1d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3">Pips</th>
                    <th className="py-2.5 px-3">PnL ($)</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTrades.map((t) => {
                    const isSelected = selectedTrade?.id === t.id;
                    const isWin = t.status === 'WON';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTrade(t)}
                        className={`cursor-pointer transition-all hover:bg-slate-800/40 ${
                          isSelected ? 'bg-emerald-950/30 border-l-2 border-emerald-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400">
                          {t.tradeNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {new Date(t.entryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-mono">
                          {t.entryPrice}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-mono">
                          {t.exitPrice}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${t.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pips >= 0 ? `+${t.pips}` : t.pips}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                          <span className="bg-[#151c2e] px-1.5 py-0.5 rounded border border-slate-800">
                            {t.exitReason.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredTrades.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No trades match the selected filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Trade Inspector & Confluence Rationale (5 cols) */}
          <div className="lg:col-span-5 bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-mono">
                  AI Trade Setup Inspector
                </h3>
              </div>
              {selectedTrade && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedTrade.status === 'WON' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}>
                  {selectedTrade.status === 'WON' ? 'WON (PROFIT)' : 'LOST (SL HIT)'}
                </span>
              )}
            </div>

            {selectedTrade ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Trade Header Card */}
                <div className="bg-[#121829] p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Trade #{selectedTrade.tradeNumber}</span>
                    <span className="text-slate-300 font-bold">{selectedTrade.pair} • {selectedTrade.timeframe}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Result:</span>
                    <span className={`font-bold ${selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedTrade.pnl >= 0 ? `+$${selectedTrade.pnl.toFixed(2)}` : `-$${Math.abs(selectedTrade.pnl).toFixed(2)}`} ({selectedTrade.pips >= 0 ? `+${selectedTrade.pips}` : selectedTrade.pips} pips)
                    </span>
                  </div>
                </div>

                {/* Price Levels Matrix */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#121829] p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Entry Price</span>
                    <span className="text-white font-bold">{selectedTrade.entryPrice}</span>
                  </div>
                  <div className="bg-[#121829] p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Exit Price</span>
                    <span className="text-white font-bold">{selectedTrade.exitPrice}</span>
                  </div>
                  <div className="bg-[#121829] p-2.5 rounded border border-rose-900/40">
                    <span className="text-rose-400 block">Stop Loss</span>
                    <span className="text-rose-300 font-bold">{selectedTrade.stopLoss}</span>
                  </div>
                  <div className="bg-[#121829] p-2.5 rounded border border-emerald-900/40">
                    <span className="text-emerald-400 block">Take Profit 2</span>
                    <span className="text-emerald-300 font-bold">{selectedTrade.takeProfit2}</span>
                  </div>
                </div>

                {/* Indicator State at Moment of Entry */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold block">
                    Market State at Entry Time
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-[#151c2e] p-2 rounded border border-slate-800 text-center">
                      <span className="text-slate-500 block">RSI(14)</span>
                      <span className="text-slate-200 font-bold">{selectedTrade.rsiAtEntry}</span>
                    </div>
                    <div className="bg-[#151c2e] p-2 rounded border border-slate-800 text-center">
                      <span className="text-slate-500 block">EMA Trend</span>
                      <span className="text-emerald-300 font-bold">{selectedTrade.emaTrendAtEntry}</span>
                    </div>
                    <div className="bg-[#151c2e] p-2 rounded border border-slate-800 text-center">
                      <span className="text-slate-500 block">Sentiment Score</span>
                      <span className="text-teal-300 font-bold">{selectedTrade.sentimentScoreAtEntry > 0 ? `+${selectedTrade.sentimentScoreAtEntry}` : selectedTrade.sentimentScoreAtEntry}</span>
                    </div>
                  </div>
                </div>

                {/* AI Rationale */}
                <div className="bg-[#121829] p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Confluence Rationale
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                    {selectedTrade.aiRationale}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select a trade from the log table to view complete AI analysis and indicator metrics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: INTERACTIVE EQUITY CURVE
// ==========================================
interface EquityCurveChartProps {
  equityCurve: EquityPoint[];
  initialBalance: number;
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ equityCurve, initialBalance }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 320 });
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.floor(entry.contentRect.width),
            height: 320,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!equityCurve || equityCurve.length === 0) {
    return <div className="py-12 text-center text-slate-500 text-xs">No equity data available.</div>;
  }

  const padding = { top: 25, right: 65, bottom: 35, left: 60 };
  const chartWidth = Math.max(100, dimensions.width - padding.left - padding.right);
  const chartHeight = Math.max(100, dimensions.height - padding.top - padding.bottom);

  let minEquity = Infinity;
  let maxEquity = -Infinity;

  equityCurve.forEach((p) => {
    if (p.equity < minEquity) minEquity = p.equity;
    if (p.equity > maxEquity) maxEquity = p.equity;
  });

  if (initialBalance < minEquity) minEquity = initialBalance;
  if (initialBalance > maxEquity) maxEquity = initialBalance;

  const buffer = (maxEquity - minEquity) * 0.1 || 500;
  minEquity -= buffer;
  maxEquity += buffer;

  const getX = (index: number) => {
    if (equityCurve.length <= 1) return padding.left;
    return padding.left + (index / (equityCurve.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (maxEquity === minEquity) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((val - minEquity) / (maxEquity - minEquity)) * chartHeight;
  };

  // Build SVG path
  const pathD = equityCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.equity)}`).join(' ');
  const areaD = `${pathD} L ${getX(equityCurve.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  const initialY = getY(initialBalance);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x >= padding.left && x <= padding.left + chartWidth) {
      const ratio = (x - padding.left) / chartWidth;
      const index = Math.min(equityCurve.length - 1, Math.max(0, Math.round(ratio * (equityCurve.length - 1))));
      setHoveredPoint(equityCurve[index]);
      setHoverX(getX(index));
    } else {
      setHoveredPoint(null);
      setHoverX(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredPoint(null);
          setHoverX(null);
        }}
        className="overflow-visible select-none cursor-crosshair"
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * ratio;
          const val = maxEquity - ratio * (maxEquity - minEquity);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left + chartWidth + 8}
                y={y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                ${Math.round(val).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Starting Capital Reference Line */}
        <line
          x1={padding.left}
          y1={initialY}
          x2={padding.left + chartWidth}
          y2={initialY}
          stroke="#475569"
          strokeDasharray="4,4"
          strokeWidth="1.5"
        />
        <text
          x={padding.left + 8}
          y={initialY - 6}
          fill="#94a3b8"
          fontSize="10"
          fontFamily="monospace"
        >
          Initial: ${initialBalance.toLocaleString()}
        </text>

        {/* Area fill */}
        <path d={areaD} fill="url(#equityGradient)" />

        {/* Equity line */}
        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trade Event Markers on Curve */}
        {equityCurve.map((p, idx) => {
          if (p.tradePnl === undefined) return null;
          const cx = getX(idx);
          const cy = getY(p.equity);
          const isWon = p.tradePnl >= 0;

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isSelected(p, hoveredPoint) ? 5 : 3.5}
              fill={isWon ? '#10b981' : '#f43f5e'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Hover Crosshair & Tooltip */}
        {hoveredPoint && hoverX !== null && (
          <g>
            <line
              x1={hoverX}
              y1={padding.top}
              x2={hoverX}
              y2={padding.top + chartHeight}
              stroke="#64748b"
              strokeDasharray="2,2"
              strokeWidth="1"
            />
            <circle
              cx={hoverX}
              cy={getY(hoveredPoint.equity)}
              r="6"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && hoverX !== null && (
        <div
          className="absolute z-20 pointer-events-none bg-[#090e1a] border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono space-y-1"
          style={{
            left: Math.min(dimensions.width - 160, Math.max(10, hoverX - 70)),
            top: 10,
          }}
        >
          <div className="text-slate-400 text-[10px]">{hoveredPoint.dateStr}</div>
          <div className="text-white font-bold text-sm">
            ${hoveredPoint.equity.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] gap-3">
            <span className="text-slate-400">Drawdown:</span>
            <span className="text-rose-400 font-bold">{hoveredPoint.drawdownPercent}%</span>
          </div>
          {hoveredPoint.tradePnl !== undefined && (
            <div className="flex items-center justify-between text-[11px] gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-400">Trade PnL:</span>
              <span className={hoveredPoint.tradePnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {hoveredPoint.tradePnl >= 0 ? `+$${hoveredPoint.tradePnl.toFixed(2)}` : `-$${Math.abs(hoveredPoint.tradePnl).toFixed(2)}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function isSelected(p1: EquityPoint, p2: EquityPoint | null): boolean {
  return p2 !== null && p1.time === p2.time;
}

// ==========================================
// SUB-COMPONENT: CANDLESTICK TRADE REPLAY CHART
// ==========================================
interface BacktestCandleReplayChartProps {
  candles: Candle[];
  trades: BacktestTrade[];
  pair: ForexPair;
  timeframe: Timeframe;
  onSelectTrade: (t: BacktestTrade) => void;
  selectedTradeId?: string;
}

const BacktestCandleReplayChart: React.FC<BacktestCandleReplayChartProps> = ({
  candles,
  trades,
  pair,
  timeframe,
  onSelectTrade,
  selectedTradeId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 380 });
  const [visibleCount, setVisibleCount] = useState<number>(65);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.floor(entry.contentRect.width),
            height: 380,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Display slice of candles
  const displayCandles = useMemo(() => {
    if (candles.length <= visibleCount) return candles;
    return candles.slice(candles.length - visibleCount);
  }, [candles, visibleCount]);

  const padding = { top: 20, right: 65, bottom: 35, left: 10 };
  const chartWidth = Math.max(100, dimensions.width - padding.left - padding.right);
  const chartHeight = Math.max(100, dimensions.height - padding.top - padding.bottom);

  const { minPrice, maxPrice } = useMemo(() => {
    if (displayCandles.length === 0) return { minPrice: 1.0, maxPrice: 1.1 };
    let min = Infinity;
    let max = -Infinity;
    displayCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    const buf = (max - min) * 0.08 || 0.001;
    return { minPrice: min - buf, maxPrice: max + buf };
  }, [displayCandles]);

  const candleGap = chartWidth / displayCandles.length;
  const candleWidth = Math.max(3, candleGap * 0.7);

  const getY = (price: number) => {
    if (maxPrice === minPrice) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
  };

  const getX = (idx: number) => {
    return padding.left + idx * candleGap + candleGap / 2;
  };

  return (
    <div ref={containerRef} className="w-full relative select-none">
      <div className="flex items-center justify-between pb-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">{pair} • {timeframe}</span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Buy Entry
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
            Sell Entry
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisibleCount((c) => Math.min(candles.length, c + 20))}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Zoom Out
          </button>
          <button
            onClick={() => setVisibleCount((c) => Math.max(30, c - 20))}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Zoom In
          </button>
        </div>
      </div>

      <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
        {/* Horizontal grid & Price Axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * ratio;
          const price = maxPrice - ratio * (maxPrice - minPrice);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left + chartWidth + 8}
                y={y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {price.toFixed(4)}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {displayCandles.map((c, i) => {
          const cx = getX(i);
          const isBull = c.close >= c.open;
          const top = getY(Math.max(c.open, c.close));
          const bot = getY(Math.min(c.open, c.close));
          const h = Math.max(1.5, bot - top);
          const yHigh = getY(c.high);
          const yLow = getY(c.low);

          return (
            <g key={c.time}>
              {/* Wick */}
              <line
                x1={cx}
                y1={yHigh}
                x2={cx}
                y2={yLow}
                stroke={isBull ? '#10b981' : '#f43f5e'}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={cx - candleWidth / 2}
                y={top}
                width={candleWidth}
                height={h}
                fill={isBull ? '#10b981' : '#f43f5e'}
                rx="1"
              />
            </g>
          );
        })}

        {/* Trade Entry & Exit Overlays */}
        {trades.map((t) => {
          const entryIdx = displayCandles.findIndex((c) => Math.abs(c.time - t.entryTime) < 1000 * 60 * 60);
          if (entryIdx === -1) return null;

          const ex = getX(entryIdx);
          const ey = getY(t.entryPrice);
          const isBuy = t.type === 'BUY';
          const isWon = t.status === 'WON';
          const isSelected = t.id === selectedTradeId;

          return (
            <g key={t.id} onClick={() => onSelectTrade(t)} className="cursor-pointer">
              {/* Trade Signal Marker */}
              <circle
                cx={ex}
                cy={isBuy ? ey + 18 : ey - 18}
                r={isSelected ? 10 : 8}
                fill={isBuy ? '#10b981' : '#f43f5e'}
                stroke="#0f172a"
                strokeWidth="2"
              />
              <text
                x={ex}
                y={isBuy ? ey + 22 : ey - 14}
                textAnchor="middle"
                fill="#000000"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {isBuy ? '▲' : '▼'}
              </text>

              {/* Stop Loss Level Dashed */}
              <line
                x1={ex}
                y1={getY(t.stopLoss)}
                x2={ex + 40}
                y2={getY(t.stopLoss)}
                stroke="#f43f5e"
                strokeDasharray="2,2"
                strokeWidth="1.5"
              />

              {/* Take Profit Level Dashed */}
              <line
                x1={ex}
                y1={getY(t.takeProfit2)}
                x2={ex + 40}
                y2={getY(t.takeProfit2)}
                stroke="#10b981"
                strokeDasharray="2,2"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
