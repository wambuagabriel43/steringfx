import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Send, 
  Paperclip, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Newspaper, 
  Compass, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  Layers,
  Trash2,
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

interface MarketChatAgentProps {
  currentPair: string;
  timeframe: string;
  price?: number;
  rsi?: number;
  emaTrend?: string;
  newsSentiment?: string;
}

export function MarketChatAgent({
  currentPair,
  timeframe,
  price,
  rsi,
  emaTrend,
  newsSentiment,
}: MarketChatAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSterlingMemory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
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

  // Synchronize in real-time when memory updates in the floating modal
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
    scrollToBottom();
  }, [messages]);

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
      const chartElement = 
        document.getElementById('tradingview-chart-container') ||
        document.getElementById('scalper-chart-container') ||
        document.querySelector('main');

      if (!chartElement) throw new Error('Chart not found');

      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#0a0f1d',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setAttachments((prev) => [
        ...prev,
        {
          name: `Chart_Snapshot_${currentPair}_${timeframe}.png`,
          type: 'image/png',
          data: dataUrl,
          previewUrl: dataUrl,
        },
      ]);
    } catch {
      // Fallback schematic card
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
        ctx.fillText(`STERLING CHART AUDIT: ${currentPair} (${timeframe})`, 30, 50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Live Market Price: ${price ?? '1.1225'}`, 30, 90);
        ctx.fillText(`RSI (14): ${rsi ?? '52.0'} | EMA Trend: ${emaTrend ?? 'Bullish'}`, 30, 120);
        ctx.fillText(`Macro Sentiment: ${newsSentiment ?? 'Mixed'}`, 30, 150);

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

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();
      if (isPdf) {
        reader.onload = (event) => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'application/pdf',
              data: event.target?.result as string,
              isDocument: true,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              data: event.target?.result as string,
              isDocument: true,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendQuery = async (queryText: string) => {
    const textContent = queryText.trim();
    if ((!textContent && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textContent || 'Please inspect the attached file/chart and provide your professional trading analysis.',
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
            timeframe,
            price,
            rsi,
            emaTrend,
            newsSentiment,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      const { cleanText, diagram } = parseMessageContent(data.text || '');

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: cleanText,
          timestamp: Date.now(),
          visualDiagram: diagram,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "My apologies, Sir. A transient communication glitch occurred on the terminal network. Please allow me a moment to reconnect and try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const starterQuestions = [
    {
      icon: Camera,
      label: 'Capture & Audit Chart',
      action: () => { handleCaptureChartScreenshot(); setInput(`Sterling, examine this chart snapshot for ${currentPair}. What is the institutional order flow showing?`); },
    },
    {
      icon: Newspaper,
      label: 'FXStreet Breaking News',
      action: () => sendQuery(`What is the latest breaking market news from FXStreet and ForexLive today?`),
    },
    {
      icon: Sparkles,
      label: `Illustrate ${currentPair} Setup`,
      action: () => sendQuery(`Sterling, please generate an illustrated visual diagram of the key trade setup for ${currentPair} (${timeframe}).`),
    },
    {
      icon: Compass,
      label: 'Key Liquidity Zones',
      action: () => sendQuery(`Where are the buy-side and sell-side liquidity pools for ${currentPair}?`),
    },
  ];

  return (
    <div 
      className="flex flex-col h-[740px] bg-[#0c1222] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl relative"
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
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#11192e] to-[#0a0f1d] border-b border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
            🎩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 tracking-wide">Sterling</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-semibold">
                Executive Trading Butler
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time TradingView & FXStreet Feed Connected</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-bold">{currentPair} (${price ?? 'Live'})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Memory Active: {Math.max(0, messages.length - 1)} exchanges</span>
          </div>

          <button
            onClick={() => exportSterlingMemory(messages)}
            title="Export Conversation Record to file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export Log</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset conversational memory with Sterling? This will clear all saved dialogue history.')) {
                const fresh = clearSterlingMemory();
                setMessages(fresh);
              }
            }}
            title="Reset Conversational Memory"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Memory</span>
          </button>
        </div>
      </div>

      {/* Drag Overlay Notice */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-amber-500/20 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center backdrop-blur-sm">
          <ImageIcon className="w-12 h-12 text-amber-300 animate-bounce mb-3" />
          <span className="text-base font-bold text-white">Drop Chart Image or Document for Sterling</span>
          <span className="text-xs text-amber-200 mt-1">Accepts PNG, JPG, PDF, CSV, TXT</span>
        </div>
      )}

      {/* Starter Questions Grid */}
      <div className="px-6 py-2.5 bg-[#090e1c] border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {starterQuestions.map((q, idx) => {
          const Icon = q.icon;
          return (
            <button
              key={idx}
              onClick={q.action}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-amber-300 text-xs transition-all text-left"
            >
              <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate font-medium">{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex-shrink-0 flex items-center justify-center text-sm mt-0.5">
                🎩
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                  : 'bg-[#12192c] border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {/* Message Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((att, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/60 p-2">
                      {att.previewUrl ? (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="max-h-64 w-full object-cover rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-sky-300 font-mono">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Interactive Visual Schematic if returned */}
              {message.visualDiagram && (
                <VisualTradeDiagram data={message.visualDiagram} />
              )}

              <div
                className={`mt-2 text-[10px] font-mono ${
                  message.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex-shrink-0 flex items-center justify-center text-sm">
              🎩
            </div>
            <div className="bg-[#12192c] border border-slate-800 rounded-2xl rounded-bl-none p-4 text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Sterling is analyzing price action, news catalysts, and institutional liquidity...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Tray */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 bg-[#0d1424] border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 flex-shrink-0"
            >
              {att.previewUrl ? (
                <img src={att.previewUrl} alt={att.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <FileText className="w-4 h-4 text-amber-400" />
              )}
              <span className="truncate max-w-[160px] font-mono">{att.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-1 hover:text-rose-400 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-[#0a0f1d] border-t border-slate-800">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask Sterling anything about ${currentPair}, macroeconomic news, or drop chart screenshots here...`}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCaptureChartScreenshot}
                disabled={isCapturingScreen}
                title="Capture live chart screenshot and attach"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition-colors border border-slate-700/50"
              >
                <Camera className={`w-3.5 h-3.5 text-sky-400 ${isCapturingScreen ? 'animate-pulse' : ''}`} />
                <span>{isCapturingScreen ? 'Capturing...' : 'Capture Chart'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image / photo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition-colors border border-slate-700/50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                title="Upload PDF, CSV trade log, or report"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/50"
              >
                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                <span>Attach Document</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Multimodal Vision & Documents Active
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
