import { useState, useContext, createContext } from 'react';

const uid = () => crypto.randomUUID();

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type AddToast = (message: string, type?: ToastType) => void;

// ─── Contexto ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<AddToast | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast(): AddToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

// ─── Toast individual ─────────────────────────────────────────────────────────
function Toast({ toast }: { toast: ToastItem }) {
  const configs: Record<ToastType, { bg: string; icon: string }> = {
    success: { bg: '#16a34a', icon: '✅' },
    error:   { bg: '#dc2626', icon: '⛔' },
    warning: { bg: '#d97706', icon: '⚠️' },
    info:    { bg: '#2563eb', icon: 'ℹ️' },
  };
  const cfg = configs[toast.type] ?? configs.success;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.75rem 1.125rem',
        borderRadius: '0.875rem',
        background: cfg.bg,
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'auto',
        animation: 'slideIn 0.25s ease',
      }}
    >
      <span>{cfg.icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// ─── Contenedor de toasts ─────────────────────────────────────────────────────
function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast: AddToast = (message, type = 'success') => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
