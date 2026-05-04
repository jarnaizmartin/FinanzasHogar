import { useState, useEffect } from 'react';
import { AdminPanel } from './AdminPanel';
import { TrialBanner, ExpiredScreen, ActivationModal } from './LicenseScreens';
import { useLicense } from './LicenseContext';
import { ToastProvider } from './contexts/ToastContext';
import { SecurityProvider } from './SecurityContext';
import { AppProvider } from './AppProvider';
import { AppShell } from './AppShell';

// ─── Animaciones globales ─────────────────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes warnPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.2); }
  }
  @keyframes warnGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.15); }
    50%       { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
  }
  .fh-btn {
    display: flex; align-items: center; justify-content: center;
    width: 2.25rem; height: 2.25rem; border-radius: 0.75rem;
    border: none; cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
    flex-shrink: 0;
  }
  .fh-btn:hover  { transform: scale(1.1); filter: brightness(1.15); }
  .fh-btn:active { transform: scale(0.95); }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { isExpired } = useLicense();
  const [showActivation, setShowActivation] = useState(false);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (hash === '#admin') return <AdminPanel />;

  if (isExpired) {
    return (
      <>
        <ExpiredScreen onActivate={() => setShowActivation(true)} />
        {showActivation && (
          <ActivationModal onClose={() => setShowActivation(false)} />
        )}
      </>
    );
  }

  return (
    <ToastProvider>
      <SecurityProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </SecurityProvider>
    </ToastProvider>
  );
}
