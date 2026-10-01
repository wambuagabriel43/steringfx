import { VisualDiagramData } from '../components/VisualTradeDiagram.tsx';

export interface ChatAttachment {
  name: string;
  type: string;
  data: string; // base64 data url or text content
  previewUrl?: string;
  isDocument?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  visualDiagram?: VisualDiagramData | null;
}

export const STERLING_STORAGE_KEY = 'sterling_butler_conversational_memory_v1';
export const STERLING_MEMORY_EVENT = 'sterling-memory-synced';

export const STERLING_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Good day. I am **Sterling**, your private Executive Trading Butler and quantitative macro analyst.\n\nI retain full memory of our ongoing strategic dialogue, your trade setups, risk parameters, and reviewed assets.\n\nHow may I be of service to your portfolio today, Sir? You may ask me to evaluate current price action, recall our prior setups, inspect a chart screenshot, or construct an illustrated trade schematic.`,
  timestamp: 1700000000000,
};

/**
 * Load conversational memory from browser storage
 */
export function loadSterlingMemory(): ChatMessage[] {
  if (typeof window === 'undefined') return [STERLING_WELCOME_MESSAGE];
  try {
    const raw = localStorage.getItem(STERLING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse Sterling memory from localStorage:', err);
  }
  return [STERLING_WELCOME_MESSAGE];
}

/**
 * Save conversational memory to browser storage and notify any other open components
 */
export function saveSterlingMemory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Avoid saving oversized base64 payload attachments if memory gets huge, preserve recent 50 messages
    const trimmed = messages.slice(-50).map((m) => {
      if (m.attachments && m.attachments.length > 0) {
        // If image data URL is gigantic, truncate preview for long-term storage if needed
        return {
          ...m,
          attachments: m.attachments.map((att) => ({
            name: att.name,
            type: att.type,
            data: att.data && att.data.length > 300000 ? att.data.substring(0, 300000) : att.data,
            previewUrl: att.previewUrl && att.previewUrl.length > 300000 ? att.previewUrl.substring(0, 300000) : att.previewUrl,
            isDocument: att.isDocument,
          })),
        };
      }
      return m;
    });

    localStorage.setItem(STERLING_STORAGE_KEY, JSON.stringify(trimmed));

    // Dispatch custom event for real-time synchronization between floating modal and dedicated tab
    window.dispatchEvent(
      new CustomEvent(STERLING_MEMORY_EVENT, { detail: { messages: trimmed } })
    );
  } catch (err) {
    console.warn('Failed to save Sterling memory to localStorage:', err);
  }
}

/**
 * Clear conversational memory and reset to fresh state
 */
export function clearSterlingMemory(): ChatMessage[] {
  const fresh: ChatMessage[] = [
    {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `Memory cleared and session refreshed, Sir. Our trading slate is pristine. How shall we proceed today?`,
      timestamp: Date.now(),
    },
  ];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STERLING_STORAGE_KEY, JSON.stringify(fresh));
      window.dispatchEvent(
        new CustomEvent(STERLING_MEMORY_EVENT, { detail: { messages: fresh } })
      );
    } catch (err) {
      console.warn('Failed to reset memory:', err);
    }
  }
  return fresh;
}

/**
 * Export conversation to a human-readable text log or JSON file
 */
export function exportSterlingMemory(messages: ChatMessage[], format: 'txt' | 'json' = 'txt'): void {
  if (typeof window === 'undefined') return;

  let fileContent = '';
  let mimeType = 'text/plain';
  let filename = `Sterling_Dialogue_Log_${new Date().toISOString().slice(0, 10)}.txt`;

  if (format === 'json') {
    fileContent = JSON.stringify(messages, null, 2);
    mimeType = 'application/json';
    filename = `Sterling_Dialogue_Log_${new Date().toISOString().slice(0, 10)}.json`;
  } else {
    fileContent = `========================================================================\n` +
      `STERLING EXECUTIVE TRADING BUTLER - CONVERSATIONAL RECORD\n` +
      `Exported: ${new Date().toLocaleString()}\n` +
      `Total Exchanges: ${messages.length}\n` +
      `========================================================================\n\n`;

    for (const msg of messages) {
      const timeStr = new Date(msg.timestamp).toLocaleString();
      const speaker = msg.role === 'user' ? 'YOU (CHIEF)' : 'STERLING (TRADING BUTLER)';
      fileContent += `[${timeStr}] ${speaker}:\n${msg.content}\n`;

      if (msg.attachments && msg.attachments.length > 0) {
        fileContent += `  Attachments: ${msg.attachments.map(a => a.name).join(', ')}\n`;
      }

      if (msg.visualDiagram) {
        fileContent += `  [Visual Diagram]: ${msg.visualDiagram.title} (${msg.visualDiagram.pair} ${msg.visualDiagram.direction})\n` +
          `    Entry: ${msg.visualDiagram.entry} | SL: ${msg.visualDiagram.stopLoss} | TP: ${msg.visualDiagram.takeProfit}\n`;
      }

      fileContent += `\n------------------------------------------------------------------------\n\n`;
    }
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
