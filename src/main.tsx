import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against cross-origin third-party script errors (e.g. iframe widgets) and benign ResizeObserver notifications
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg === 'Script error.' ||
      msg.includes('ResizeObserver') ||
      event.filename?.includes('tradingview')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (reasonMsg.includes('ResizeObserver') || reasonMsg.includes('Script error')) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
