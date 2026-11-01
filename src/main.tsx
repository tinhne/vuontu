import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { loadBank } from './data';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

// index.html shows a splash until the word bank is ready.
loadBank()
  .catch(() => {
    // The hand-written words still work if the bank fails to load.
  })
  .then(() => {
    root.render(
      <StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    );
  });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is optional; the app works without it.
    });
  });
}
