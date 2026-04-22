import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LicenseProvider } from './LicenseContext'

// ── Registro del Service Worker (PWA) ────────────────────────────────────────
if ('serviceWorker' in navigator) {                          // ← AÑADIR
  window.addEventListener('load', () => {                   // ← AÑADIR
    navigator.serviceWorker.register('/sw.js').catch(() => {// ← AÑADIR
      console.warn('[PWA] Service Worker no registrado');    // ← AÑADIR
    });                                                      // ← AÑADIR
  });                                                        // ← AÑADIR
}                                                            // ← AÑADIR

createRoot(document.getElementById('root')!).render(
  <StrictMode>
<LicenseProvider>
  <App />
</LicenseProvider>
  </StrictMode>,
)
