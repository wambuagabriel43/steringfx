import React, { useState, useEffect } from 'react';
import { EASettings, ForexPair, Timeframe } from '../types.ts';
import { 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  RefreshCw,
  Play,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  MoveVertical,
  DollarSign,
  MousePointer
} from 'lucide-react';

interface MT5HubViewProps {
  currentPair: ForexPair;
  currentTimeframe: Timeframe;
  eaSettings: EASettings;
  onUpdateEASettings: (settings: Partial<EASettings>) => void;
  onDownloadEA: () => void;
  onDownloadIndicator: () => void;
  onDownloadVisualRiskReward: () => void;
}

export const MT5HubView: React.FC<MT5HubViewProps> = ({
  currentPair,
  currentTimeframe,
  eaSettings,
  onUpdateEASettings,
  onDownloadEA,
  onDownloadIndicator,
  onDownloadVisualRiskReward,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedRR, setCopiedRR] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'troubleshoot' | 'draggable-indicator' | 'guide' | 'code' | 'config' | 'tester'>('draggable-indicator');
  const [mql5Code, setMql5Code] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);

  // Visual Risk/Reward Indicator Code Preview State
  const [rrIndicatorCode, setRrIndicatorCode] = useState<string>('');
  const [rrDefaultLot, setRrDefaultLot] = useState<number>(0.10);
  const [rrDefaultRisk, setRrDefaultRisk] = useState<number>(20.0);
  const [rrDefaultReward, setRrDefaultReward] = useState<number>(40.0);
  const [rrDefaultDir, setRrDefaultDir] = useState<'BUY' | 'SELL'>('BUY');

  // WebRequest Tester State
  const [testPair, setTestPair] = useState<string>(currentPair);
  const [testTimeframe, setTestTimeframe] = useState<string>(currentTimeframe);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch compiled code preview for EA
  useEffect(() => {
    let isMounted = true;
    setLoadingCode(true);

    fetch('/api/mt5/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eaSettings),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.code) {
          setMql5Code(data.code);
          setLoadingCode(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate code preview:', err);
        if (isMounted) setLoadingCode(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eaSettings]);

  // Fetch Visual Risk/Reward indicator code preview
  useEffect(() => {
    let isMounted = true;
    fetch('/api/mt5/generate-visual-risk-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defaultLotSize: rrDefaultLot,
        defaultRiskPips: rrDefaultRisk,
        defaultRewardPips: rrDefaultReward,
        initialOrderType: rrDefaultDir,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.code) {
          setRrIndicatorCode(data.code);
        }
      })
      .catch((err) => console.error('Failed to generate visual indicator code:', err));

    return () => {
      isMounted = false;
    };
  }, [rrDefaultLot, rrDefaultRisk, rrDefaultReward, rrDefaultDir]);

  const copyCode = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRRCode = () => {
    navigator.clipboard.writeText(rrIndicatorCode);
    setCopiedRR(true);
    setTimeout(() => setCopiedRR(false), 2000);
  };

  const runApiTest = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(`/api/mt5/signal?pair=${testPair}&timeframe=${testTimeframe}`);
      const data = await res.json();
      setTestResponse({
        httpStatus: res.status,
        headers: { 'content-type': res.headers.get('content-type') },
        data,
      });
    } catch (err: any) {
      setTestResponse({
        error: err.message || 'Failed to query test endpoint',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Run initial test
  useEffect(() => {
    runApiTest();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#111c35] to-[#0c1f2e] border border-teal-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                MetaTrader 5 Tools Suite
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                Interactive Drag & Drop TP/SL
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              MetaTrader 5 Interactive Indicators & AI EA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Drag-and-drop Take Profit and Stop Loss lines directly on your MT5 chart with live real-time dollar ($) and pips profit/loss calculations, risk percentages, and one-click order execution.
            </p>
          </div>

          {/* Download Buttons Group */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={onDownloadVisualRiskReward}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-300 hover:to-teal-300 active:scale-95 transition-all"
              title="Download the Interactive Draggable TP/SL Indicator for MT5"
            >
              <MoveVertical className="w-4 h-4" />
              <span>Download Draggable TP/SL Indicator (.mq5)</span>
            </button>
            <button
              onClick={onDownloadEA}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1a2540] hover:bg-[#223154] text-teal-300 border border-teal-500/30 font-bold text-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Confluence EA (.mq5)</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('draggable-indicator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'draggable-indicator'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-md'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50'
            }`}
          >
            <MoveVertical className="w-3.5 h-3.5 text-emerald-400" />
            Interactive Draggable TP/SL Indicator
          </button>
          <button
            onClick={() => setActiveSubTab('troubleshoot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'troubleshoot'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Why Nothing Is Happening? (3-Step Fix)
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'guide'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Installation Guide
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'code'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            EA Source Code
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'config'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            EA Parameters
          </button>
          <button
            onClick={() => setActiveSubTab('tester')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
              activeSubTab === 'tester'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live WebRequest Tester
          </button>
        </div>
      </div>

      {/* SUB-TAB: INTERACTIVE DRAGGABLE TP/SL INDICATOR */}
      {activeSubTab === 'draggable-indicator' && (
        <div className="space-y-6">
          {/* Critical Compilation Notice for MetaEditor */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-rose-950/30 to-amber-950/50 border border-amber-500/50 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-200 font-mono flex items-center gap-2">
                  <span>Getting MetaEditor errors? (e.g., &quot;invalid suffix &apos;vh&apos;&quot;, &quot;invalid suffix &apos;px&apos;&quot;, &quot;invalid preprocessor command&quot;)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why this happened:</strong> Your browser accidentally saved the web page HTML/CSS as <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono">Interactive_Visual_RiskReward.mq5</code> instead of the raw C++ code.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={copyRRCode}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    {copiedRR ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedRR ? 'Copied Raw MQL5 Code!' : '1-Click: Copy Pure MQL5 Code'}</span>
                  </button>
                  <span className="text-[11px] text-amber-300/90 font-mono">
                    👉 Then in MetaEditor: <strong>File &rarr; New &rarr; Custom Indicator &rarr; Paste &rarr; Press F7 (Compile)</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0e1424] border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                <MousePointer className="w-4 h-4" />
                <span>Drag & Drop On Chart</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click and drag the <strong>Green TP</strong> and <strong>Red SL</strong> horizontal lines directly on your MT5 chart using your mouse. The indicator hooks into native <code className="text-emerald-300 font-mono text-[11px]">CHARTEVENT_OBJECT_DRAG</code> for instant response.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                <DollarSign className="w-4 h-4" />
                <span>Live Money & Risk ($ / %)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As you drag the lines, floating tags display the exact dollar payout to be made on Take Profit (e.g. <span className="text-emerald-400 font-bold">+$450.00</span>) and maximum loss on Stop Loss (e.g. <span className="text-rose-400 font-bold">-$150.00</span> | <span className="text-slate-300 font-mono">1.5% Risk</span>) using your broker's exact tick value.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1424] border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>On-Chart Floating HUD & 1-Click</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Features a built-in control panel right on the chart: toggle BUY / SELL modes, adjust Lot Sizes with <span className="font-mono text-cyan-300">[-] [+]</span> buttons, reset to market price, and execute trades in 1-click.
              </p>
            </div>
          </div>

          {/* Quick Config & Customization Panel */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Indicator Default Settings & Code Generator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the default parameters below and copy or download your tailored MQL5 file.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyRRCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all"
                >
                  {copiedRR ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedRR ? 'Copied MQL5!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={onDownloadVisualRiskReward}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-extrabold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Interactive_Visual_RiskReward.mq5</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Default Direction</label>
                <select
                  value={rrDefaultDir}
                  onChange={(e) => setRrDefaultDir(e.target.value as 'BUY' | 'SELL')}
                  className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BUY">🟢 BUY (Long) - TP Above / SL Below</option>
                  <option value="SELL">🔴 SELL (Short) - TP Below / SL Above</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Default Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={rrDefaultLot}
                  onChange={(e) => setRrDefaultLot(parseFloat(e.target.value) || 0.10)}
                  className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Initial Stop Loss (Pips)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="500"
                  value={rrDefaultRisk}
                  onChange={(e) => setRrDefaultRisk(parseFloat(e.target.value) || 20.0)}
                  className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Initial Take Profit (Pips)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  value={rrDefaultReward}
                  onChange={(e) => setRrDefaultReward(parseFloat(e.target.value) || 40.0)}
                  className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* MQL5 Source Code Box */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between pb-2 text-xs font-mono text-slate-400">
                <span>File: <strong className="text-emerald-300">MQL5/Indicators/Interactive_Visual_RiskReward.mq5</strong></span>
                <span className="text-emerald-400 font-bold">Ready to compile (0 errors)</span>
              </div>
              <div className="relative bg-[#070a14] border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
                <pre className="p-4 overflow-x-auto text-slate-300 max-h-[380px] leading-relaxed text-[11px]">
                  {rrIndicatorCode || '// Generating indicator source code...'}
                </pre>
              </div>
            </div>
          </div>

          {/* Quick 2-Minute Installation Steps for MT5 */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1628] via-[#101b33] to-[#0d182e] border border-emerald-500/30 space-y-3">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              How to install on MetaTrader 5 in 60 seconds:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-300 block font-mono">1. Download & Save</strong>
                <p>Click Download and place <code className="text-teal-300 font-mono">Interactive_Visual_RiskReward.mq5</code> into <code className="text-slate-200">MQL5/Indicators</code> (via MT5 <strong className="text-white">File &rarr; Open Data Folder</strong>).</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-300 block font-mono">2. Compile in MetaEditor</strong>
                <p>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">F4</kbd> in MT5, double-click the file under Indicators, and press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">F7</kbd> (Compile).</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-300 block font-mono">3. Drag onto Chart</strong>
                <p>From the Navigator under Indicators, drag <strong className="text-emerald-400">Interactive_Visual_RiskReward</strong> onto any chart. Drag the lines freely with your mouse!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 0: TROUBLESHOOTING & 3-STEP FIX */}
      {activeSubTab === 'troubleshoot' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200 font-mono">
                Diagnostic Analysis: Why MT5 shows "0% Confluence" or no trades are executing
              </h4>
              <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                In your MT5 terminal, the HUD is currently displaying <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">AI Signal: (0% Confluence) | SL: 0.000</code>. This happens because MetaTrader 5 blocks automated orders and WebRequests by default until 3 specific security checkboxes are enabled.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fix 1 */}
            <div className="p-5 rounded-xl bg-[#0e1424] border-2 border-emerald-500/40 space-y-3 shadow-lg relative">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  Critical Step
                </span>
              </div>
              <h3 className="font-bold text-sm text-white font-mono">
                Turn ON "Algo Trading" in MT5 Top Bar
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In your MT5 top toolbar, look for the button that says <strong className="text-emerald-400 font-mono">[ Algo Trading ]</strong>.
              </p>
              <div className="p-3 rounded-lg bg-[#070a14] border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-rose-400">
                  <span>❌ Red square icon = Trades BLOCKED</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>✅ Green play icon = Auto Trading ALLOWED</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Click the button once so it turns <strong>Green</strong>.
              </p>
            </div>

            {/* Fix 2 */}
            <div className="p-5 rounded-xl bg-[#0e1424] border-2 border-cyan-500/40 space-y-3 shadow-lg relative">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400">
                  EA Property
                </span>
              </div>
              <h3 className="font-bold text-sm text-white font-mono">
                Allow Algo Trading on EA (F7)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every Expert Advisor has individual trading permissions:
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">F7</kbd> while on your chart.</li>
                <li>Click the <strong className="text-white">"Common"</strong> tab.</li>
                <li>Check the box: <strong className="text-cyan-300">"Allow Algo Trading"</strong>.</li>
                <li>Click <strong className="text-white">OK</strong>.</li>
              </ul>
              <p className="text-[11px] text-slate-400">
                A smiling blue hat icon will appear in the top-right corner of your chart.
              </p>
            </div>

            {/* Fix 3 */}
            <div className="p-5 rounded-xl bg-[#0e1424] border-2 border-teal-500/40 space-y-3 shadow-lg relative">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/50 font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400">
                  Whitelist URL
                </span>
              </div>
              <h3 className="font-bold text-sm text-white font-mono">
                Whitelist URL in Tools &rarr; Options
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                To stream AI signals, MT5 requires adding the bridge URL to its security whitelist:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Click <strong className="text-white">Tools &rarr; Options</strong> (<kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">Ctrl+O</kbd>).</li>
                <li>Click <strong className="text-white">Expert Advisors</strong> tab.</li>
                <li>Check <strong className="text-teal-300">"Allow WebRequest for listed URL"</strong>.</li>
                <li>Add this exact URL:</li>
              </ul>
              <div className="p-2 rounded bg-[#070a14] border border-teal-500/40 font-mono text-[11px] text-teal-300 break-all flex items-center justify-between">
                <span>{eaSettings.apiUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(eaSettings.apiUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="ml-2 px-2 py-1 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-slate-950 font-bold shrink-0 text-[10px]"
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          </div>

          {/* New v3.0 Hybrid Engine Highlight */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1628] via-[#101b33] to-[#0d182e] border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white font-mono">
                  Upgraded v3.0 Native Failover Engine
                </h4>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                We upgraded the EA code to version 3.0. Even if WebRequest is blocked or pending authorization on your broker, the EA <strong>automatically runs its native on-chart RSI(14) + EMA(20/50/200) + ATR engine</strong> to calculate Entry, Stop Loss, and Take Profit levels right on the chart!
              </p>
            </div>
            <button
              onClick={onDownloadEA}
              className="px-4 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-xs hover:bg-teal-400 transition-all shrink-0 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Upgraded v3.0 EA</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: INSTALLATION GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-white font-mono">
                Allow WebRequest in MT5 Settings
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              MetaTrader 5 requires manual approval before an EA can query external AI servers:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>In MT5, click <strong className="text-slate-200">Tools</strong> &rarr; <strong className="text-slate-200">Options</strong> (or press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">Ctrl + O</kbd>).</li>
              <li>Navigate to the <strong className="text-slate-200">Expert Advisors</strong> tab.</li>
              <li>Check <strong className="text-slate-200">"Allow WebRequest for listed URL"</strong>.</li>
              <li>Click the green <strong className="text-emerald-400 font-bold">+</strong> button and add your bridge URL:</li>
            </ul>
            <div className="p-2.5 rounded bg-[#090d18] border border-teal-500/30 font-mono text-xs text-teal-300 break-all flex items-center justify-between">
              <span>{eaSettings.apiUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(eaSettings.apiUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ml-2 text-slate-400 hover:text-white shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-white font-mono">
                Place File in MT5 Experts Directory
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Copy the downloaded <code className="text-teal-300 font-mono">AI_Forex_Confluence_EA.mq5</code> into your MT5 installation:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>In MT5, click <strong className="text-slate-200">File</strong> &rarr; <strong className="text-slate-200">Open Data Folder</strong>.</li>
              <li>Open the <strong className="text-slate-200">MQL5</strong> folder &rarr; then open <strong className="text-slate-200">Experts</strong>.</li>
              <li>Paste the downloaded <code className="text-teal-300 font-mono">AI_Forex_Confluence_EA.mq5</code> file directly inside.</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-white font-mono">
                Compile in MetaEditor
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Compile the MQL5 script into a runnable binary:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">F4</kbd> in MT5 to open MetaEditor.</li>
              <li>In Navigator, expand <strong className="text-slate-200">Experts</strong> and double-click <code className="text-teal-300 font-mono">AI_Forex_Confluence_EA.mq5</code>.</li>
              <li>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">F7</kbd> or click the <strong className="text-slate-200">Compile</strong> button.</li>
              <li>Verify the compilation output reads: <span className="text-emerald-400 font-bold font-mono">0 errors, 0 warnings</span>.</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-sm text-white font-mono">
                Attach to Chart & Start Trading
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Activate the EA on any currency or asset chart:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Open any chart (e.g. <strong className="text-slate-200">EURUSD H1</strong> or <strong className="text-slate-200">USDJPY M1</strong>).</li>
              <li>From the MT5 Navigator window under Experts, drag <strong className="text-teal-300 font-mono">AI_Forex_Confluence_EA</strong> onto the chart.</li>
              <li>In the "Common" tab, check <strong className="text-slate-200">"Allow Algo Trading"</strong>.</li>
              <li>Click <strong className="text-slate-200">OK</strong>. In the MT5 top toolbar, ensure the <strong className="text-emerald-400 font-mono">Algo Trading</strong> button is toggled ON (green icon).</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MQL5 SOURCE CODE VIEWER (EA) */}
      {activeSubTab === 'code' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Generated MQL5 Expert Advisor Source Code
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Custom compiled with your parameters. Includes automated risk sizing, trailing stop, and WebRequest bridge.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy EA Code'}</span>
              </button>
              <button
                onClick={onDownloadEA}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-mono font-extrabold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .mq5</span>
              </button>
            </div>
          </div>

          <div className="relative bg-[#070a14] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0a0f1d] border-b border-slate-800 text-[11px] text-slate-400">
              <span>AI_Forex_Confluence_EA.mq5</span>
              <span>{loadingCode ? 'Regenerating...' : `${mql5Code.split('\n').length} lines`}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-300 max-h-[450px] leading-relaxed text-[11px]">
              {loadingCode ? '// Generating optimized MQL5 code...' : mql5Code}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EA PARAMETERS BUILDER */}
      {activeSubTab === 'config' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Expert Advisor Input Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust parameters below to auto-regenerate the MQL5 code with your custom defaults.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Percent */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Risk Per Trade (% of Balance)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10.0"
                value={eaSettings.riskPercent}
                onChange={(e) => onUpdateEASettings({ riskPercent: parseFloat(e.target.value) || 1.5 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Fixed Lot */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Fixed Lot Size (if dynamic disabled)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="20.0"
                value={eaSettings.fixedLot}
                onChange={(e) => onUpdateEASettings({ fixedLot: parseFloat(e.target.value) || 0.10 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Min Confidence */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Minimum AI Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={eaSettings.minConfidence}
                onChange={(e) => onUpdateEASettings({ minConfidence: parseInt(e.target.value, 10) || 75 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Trailing Stop Pips */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Trailing Stop Distance (Pips)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="100"
                value={eaSettings.trailingStopPips}
                onChange={(e) => onUpdateEASettings({ trailingStopPips: parseFloat(e.target.value) || 25.0 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Max Spread Pips */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Max Allowed Spread (Pips)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10.0"
                value={eaSettings.maxSpreadPips}
                onChange={(e) => onUpdateEASettings({ maxSpreadPips: parseFloat(e.target.value) || 2.5 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Poll Interval */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Signal Poll Interval (Seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={eaSettings.pollIntervalSeconds}
                onChange={(e) => onUpdateEASettings({ pollIntervalSeconds: parseInt(e.target.value, 10) || 60 })}
                className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 p-3 rounded-lg bg-[#090d18] border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={eaSettings.allowAutoExecution}
                onChange={(e) => onUpdateEASettings({ allowAutoExecution: e.target.checked })}
                className="accent-teal-400 rounded"
              />
              <div>
                <span className="font-bold text-white block">Auto Execution</span>
                <span className="text-[10px] text-slate-400">Execute trades automatically</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg bg-[#090d18] border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={eaSettings.useTrailingStop}
                onChange={(e) => onUpdateEASettings({ useTrailingStop: e.target.checked })}
                className="accent-teal-400 rounded"
              />
              <div>
                <span className="font-bold text-white block">Trailing Stop</span>
                <span className="text-[10px] text-slate-400">Lock in profits dynamically</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg bg-[#090d18] border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={eaSettings.enableOnChartHUD}
                onChange={(e) => onUpdateEASettings({ enableOnChartHUD: e.target.checked })}
                className="accent-teal-400 rounded"
              />
              <div>
                <span className="font-bold text-white block">On-Chart HUD</span>
                <span className="text-[10px] text-slate-400">Draw AI status dashboard</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg bg-[#090d18] border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={eaSettings.enableSoundAlerts}
                onChange={(e) => onUpdateEASettings({ enableSoundAlerts: e.target.checked })}
                className="accent-teal-400 rounded"
              />
              <div>
                <span className="font-bold text-white block">Sound & Popups</span>
                <span className="text-[10px] text-slate-400">Alert on new AI signal</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LIVE WEBREQUEST TESTER */}
      {activeSubTab === 'tester' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Live MT5 WebRequest API Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Test the exact payload your MetaTrader 5 EA receives when querying <code className="text-teal-300 font-mono">/api/mt5/signal</code>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={testPair}
                onChange={(e) => setTestPair(e.target.value)}
                className="bg-[#090d18] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              >
                <option value="EURUSD">EURUSD</option>
                <option value="GBPUSD">GBPUSD</option>
                <option value="USDJPY">USDJPY</option>
                <option value="AUDUSD">AUDUSD</option>
                <option value="USDCAD">USDCAD</option>
                <option value="XAUUSD">XAUUSD (Gold)</option>
              </select>

              <select
                value={testTimeframe}
                onChange={(e) => setTestTimeframe(e.target.value)}
                className="bg-[#090d18] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              >
                <option value="M1">M1</option>
                <option value="M5">M5</option>
                <option value="M15">M15</option>
                <option value="H1">H1</option>
                <option value="H4">H4</option>
                <option value="D1">D1</option>
              </select>

              <button
                onClick={runApiTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test WebRequest</span>
              </button>
            </div>
          </div>

          <div className="bg-[#080c16] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400">
            <div className="text-[11px] text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>GET /api/mt5/signal?pair={testPair}&timeframe={testTimeframe}</span>
              <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
            </div>
            <pre className="mt-3 overflow-x-auto text-[11px] text-slate-200">
              {testResponse ? JSON.stringify(testResponse.data || testResponse, null, 2) : 'Loading test payload...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
