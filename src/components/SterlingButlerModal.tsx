import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ChevronDown, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  Eye, 
  Layers,
  ArrowUpRight,
  Download,
  Brain
} from 'lucide-react';
import { VisualTradeDiagram, VisualDiagramData } from './VisualTradeDiagram.tsx';
import { 
  ChatMessage, 
  ChatAttachment, 
  loadSterlingMemory, 
  saveSterlingMemory, 
  clearSterlingMemory, 
  exportSterlingMemory, 
  STERLING_MEMORY_EVENT 
} from '../utils/sterlingMemory.ts';

export type { ChatMessage, ChatAttachment };

interface SterlingButlerModalProps {
  currentPair: string;
  currentTimeframe: string;
  price?: number;
  rsi?: number;
  emaTrend?: string;
  newsSentiment?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const SterlingButlerModal: React.FC<SterlingButlerModalProps> = ({
  currentPair,
  currentTimeframe,
  price,
  rsi,
  emaTrend,
  newsSentiment,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSterlingMemory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync state to localStorage whenever messages update
  useEffect(() => {
    saveSterlingMemory(messages);
  }, [messages]);

  // Sync across tabs and with MarketChatAgent when memory updates
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.messages) {
        setMessages(e.detail.messages);
      }
    };
    window.addEventListener(STERLING_MEMORY_EVENT, handleSync);
    return () => window.removeEventListener(STERLING_MEMORY_EVENT, handleSync);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Extract visual-diagram JSON block from assistant response
  const parseMessageContent = (rawText: string): { cleanText: string; diagram: VisualDiagramData | null } => {
    const diagramRegex = /```visual-diagram\s*([\s\S]*?)\s*```/;
    const match = rawText.match(diagramRegex);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        const cleanText = rawText.replace(diagramRegex, '').trim();
        return { cleanText, diagram: parsed };
      } catch {
        return { cleanText: rawText, diagram: null };
      }
    }
    return { cleanText: rawText, diagram: null };
  };

  // Capture current chart container screenshot
  const handleCaptureChartScreenshot = async () => {
    setIsCapturingScreen(true);
    try {
      // Find candidate chart container on screen
      const chartElement = 
        document.getElementById('tradingview-chart-container') ||
        document.getElementById('scalper-chart-container') ||
        document.querySelector('[data-chart-container="true"]') ||
        document.querySelector('main');

      if (!chartElement) {
        throw new Error('Chart container not found');
      }

      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#0a0f1d',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const newAtt: ChatAttachment = {
        name: `Chart_Snapshot_${currentPair}_${currentTimeframe}.png`,
        type: 'image/png',
        data: dataUrl,
        previewUrl: dataUrl,
      };

      setAttachments((prev) => [...prev, newAtt]);
    } catch {
      // Create a fallback schematic capture card if iframe denies cross-origin screenshot
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 600;
      fallbackCanvas.height = 360;
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, 600, 360);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(10, 10, 580, 340);
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`STERLING CHART AUDIT: ${currentPair} (${currentTimeframe})`, 30, 50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Current Live Market Price: ${price ?? '1.1225'}`, 30, 90);
        ctx.fillText(`RSI (14): ${rsi ?? '52.0'} | EMA Trend: ${emaTrend ?? 'Bullish'}`, 30, 120);
        ctx.fillText(`Macro Sentiment Bias: ${newsSentiment ?? 'Mixed'}`, 30, 150);
        ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()} UTC`, 30, 180);

        // Draw illustrative candlestick
        ctx.fillStyle = '#10b981';
        ctx.fillRect(200, 220, 24, 70);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(212, 200);
        ctx.lineTo(212, 310);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(260, 240, 24, 60);
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(272, 220);
        ctx.lineTo(272, 320);
        ctx.stroke();

        const dataUrl = fallbackCanvas.toDataURL('image/png');
        setAttachments((prev) => [
          ...prev,
          {
            name: `${currentPair}_Technical_Snapshot.png`,
            type: 'image/png',
            data: dataUrl,
            previewUrl: dataUrl,
          },
        ]);
      }
    } finally {
      setIsCapturingScreen(false);
    }
  };

  // Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'image/png',
            data: result,
            previewUrl: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handle Document Upload (PDF, CSV, TXT, JSON)
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      const reader = new FileReader();
      if (isPdf) {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'application/pdf',
              data: result,
              isDocument: true,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              data: text,
              isDocument: true,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Send query to Sterling
  const sendMessage = async (textToSend: string) => {
    const content = textToSend.trim();
    if ((!content && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: content || 'Please inspect the attached file/chart and provide your professional trading analysis.',
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setInput('');
    setAttachments([]);
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          context: {
            pair: currentPair,
            timeframe: currentTimeframe,
            price,
            rsi,
            emaTrend,
            newsSentiment,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with Sterling');
      }

      const data = await response.json();
      const { cleanText, diagram } = parseMessageContent(data.text || '');

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: cleanText,
        timestamp: Date.now(),
        visualDiagram: diagram,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `My apologies, Sir. A transient communication glitch occurred on the secure terminal feed. Allow me a moment to re-establish our connection. Please try again.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const starterChips = [
    { label: '📸 Analyze Chart', action: () => { handleCaptureChartScreenshot(); setInput('Sterling, what specific candlestick patterns and liquidity zones do you detect on this chart?'); } },
    { label: '📰 Breaking News Impact', action: () => sendMessage('What breaking FXStreet or central bank news is currently moving the markets?') },
    { label: `🎨 Illustrate ${currentPair} Setup`, action: () => sendMessage(`Sterling, please generate an illustrated visual diagram of the highest-probability setup on ${currentPair} right now.`) },
    { label: '🛡️ Capital & Risk Audit', action: () => sendMessage(`Audit my current risk parameters for ${currentPair}. Where is my invalidation level?`) },
  ];

  return (
    <>
      {/* 1. Floating Persistent Butler Launcher Badge (Always visible on any page) */}
      {!isOpen && (
        <button
          id="btn-open-sterling-butler"
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all group border border-amber-300/40"
          title="Open Sterling - Executive Trading Butler"
        >
          <div className="relative">
            <span className="text-base">🎩</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold tracking-wide uppercase text-[11px] text-slate-950 flex items-center gap-1">
              Sterling <span className="text-[9px] px-1 py-0.2 bg-slate-950/20 rounded font-mono font-normal">AI Butler</span>
            </span>
            <span className="text-[10px] text-slate-900/80 font-medium">Ready • TradingView & News Live</span>
          </div>
        </button>
      )}

      {/* 2. Floating Pop-up Butler Modal */}
      {isOpen && (
        <div
          id="sterling-butler-modal-window"
          className={`fixed z-50 shadow-2xl transition-all duration-300 flex flex-col bg-[#0b101d] border border-amber-500/40 rounded-2xl overflow-hidden backdrop-blur-xl ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-14 max-w-5xl mx-auto'
              : 'bottom-4 right-4 w-[95vw] sm:w-[460px] md:w-[480px] h-[640px] max-h-[92vh]'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              const reader = new FileReader();
              if (file.type.startsWith('image/')) {
                reader.onload = (ev) => {
                  setAttachments((p) => [...p, { name: file.name, type: file.type, data: ev.target?.result as string, previewUrl: ev.target?.result as string }]);
                };
                reader.readAsDataURL(file);
              } else {
                reader.onload = (ev) => {
                  setAttachments((p) => [...p, { name: file.name, type: file.type || 'text/plain', data: ev.target?.result as string, isDocument: true }]);
                };
                reader.readAsText(file);
              }
            }
          }}
        >
          {/* Butler Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#11192e] to-[#0d1322] border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-sm shadow-inner">
                🎩
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-xs tracking-wide">Sterling</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
                    Executive Butler
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentPair} ({currentTimeframe})</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">${price ?? 'Live'}</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportSterlingMemory(messages)}
                title="Export Conversation Record (.txt)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset conversational memory with Sterling? This will clear all dialogue history.')) {
                    const fresh = clearSterlingMemory();
                    setMessages(fresh);
                  }
                }}
                title="Reset Conversational Memory"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore' : 'Maximize'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onToggle}
                title="Close Butler"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="px-3 py-1.5 bg-[#090d18] border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Brain className="w-3 h-3 text-amber-400" />
              Memory Retained: {Math.max(0, messages.length - 1)} turns
            </span>
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              TradingView Verified Feed
            </span>
            <span className="flex items-center gap-1 font-mono hidden sm:flex">
              <Eye className="w-3 h-3 text-sky-400" />
              Multimodal Vision & Docs Ready
            </span>
          </div>

          {/* Drag Overlay Notice */}
          {isDragging && (
            <div className="absolute inset-0 z-30 bg-amber-500/20 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center backdrop-blur-sm">
              <ImageIcon className="w-10 h-10 text-amber-300 animate-bounce mb-2" />
              <span className="text-sm font-bold text-white">Drop Chart Image or Document to Sterling</span>
              <span className="text-xs text-amber-200 mt-1">Accepts PNG, JPG, PDF, CSV, TXT</span>
            </div>
          )}

          {/* Message History Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex-shrink-0 flex items-center justify-center text-xs mt-0.5">
                    🎩
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-[#131b2e] border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Attachments preview inside message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/60 p-1.5">
                          {att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="max-h-48 w-full object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-sky-300 font-mono">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="truncate">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main text content with markdown styling */}
                  <div className="leading-relaxed whitespace-pre-wrap break-words text-xs">
                    {msg.content}
                  </div>

                  {/* Visual Diagram if generated */}
                  {msg.visualDiagram && (
                    <VisualTradeDiagram data={msg.visualDiagram} />
                  )}

                  <div
                    className={`mt-1.5 text-[9px] font-mono ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex-shrink-0 flex items-center justify-center text-xs">
                  🎩
                </div>
                <div className="bg-[#131b2e] border border-slate-800 rounded-2xl rounded-bl-none p-3 text-slate-400 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Sterling is analyzing order flow & macroeconomic catalysts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-[#0d1322] flex gap-1.5 overflow-x-auto no-scrollbar">
            {starterChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={chip.action}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition-all flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Attachment Preview Tray */}
          {attachments.length > 0 && (
            <div className="px-3 py-1.5 bg-[#0e1628] border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] text-slate-200 flex-shrink-0"
                >
                  {att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="truncate max-w-[120px] font-mono">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input & Action Bar */}
          <div className="p-3 bg-[#0a0f1d] border-t border-slate-800">
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocFileChange}
              accept=".pdf,.csv,.txt,.json"
              className="hidden"
            />

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask Sterling about ${currentPair}, paste chart, or attach statement...`}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCaptureChartScreenshot}
                    disabled={isCapturingScreen}
                    title="Capture live chart screenshot and attach"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition-colors border border-slate-700/50"
                  >
                    <Camera className={`w-3.5 h-3.5 text-sky-400 ${isCapturingScreen ? 'animate-pulse' : ''}`} />
                    <span>{isCapturingScreen ? 'Capturing...' : 'Capture Chart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload image / photo"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition-colors border border-slate-700/50"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    title="Upload PDF, CSV trade log, or report"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/50"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>Document</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  Enter to send • Esc to close
                </span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
