import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LicenseProvider } from './LicenseContext'
import { ErrorBoundary } from './components/ErrorBoundary' // ✅ FIX 14
import { injectGlobalAnimations } from './animations'

injectGlobalAnimations() // ← una sola vez, antes de montar React

// ── Registro del Service Worker (PWA) ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('[PWA] Service Worker no registrado');
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary> {/* ✅ FIX 14 — Captura cualquier error de render */}
      <LicenseProvider>
        <App />
      </LicenseProvider>
    </ErrorBoundary>
  </StrictMode>,
)
