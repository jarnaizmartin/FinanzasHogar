import { createContext, useContext, useMemo, useState } from 'react';
import type React from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type RecurringWarning = {
  projectionName: string;
  amount: number;
  currency: string;
  monthKey: string;
};

export type UIContextType = {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  showCurrency: boolean;
  setShowCurrency: React.Dispatch<React.SetStateAction<boolean>>;
  realAccountFilter: string;
  setRealAccountFilter: React.Dispatch<React.SetStateAction<string>>;
  realReturnTo: { label: string; tab: string; loanId?: string; creditCardId?: string } | null;
  setRealReturnTo: React.Dispatch<React.SetStateAction<{ label: string; tab: string; loanId?: string; creditCardId?: string } | null>>;
  realFilterType: string;
  setRealFilterType: React.Dispatch<React.SetStateAction<string>>;
  realFilterAccount: string;
  setRealFilterAccount: React.Dispatch<React.SetStateAction<string>>;
  realFilterCategory: string;
  setRealFilterCategory: React.Dispatch<React.SetStateAction<string>>;
  realFilterDateMode: 'preset' | 'range';
  setRealFilterDateMode: React.Dispatch<
    React.SetStateAction<'preset' | 'range'>
  >;
  realFilterPreset: string;
  setRealFilterPreset: React.Dispatch<React.SetStateAction<string>>;
  realFilterDateFrom: string;
  setRealFilterDateFrom: React.Dispatch<React.SetStateAction<string>>;
  realFilterDateTo: string;
  setRealFilterDateTo: React.Dispatch<React.SetStateAction<string>>;
  projFilterType: 'all' | 'income' | 'expense';
  setProjFilterType: React.Dispatch<
    React.SetStateAction<'all' | 'income' | 'expense'>
  >;
  projFilterAccount: string;
  setProjFilterAccount: React.Dispatch<React.SetStateAction<string>>;
  projSortBy: 'date' | 'amount' | 'name';
  setProjSortBy: React.Dispatch<
    React.SetStateAction<'date' | 'amount' | 'name'>
  >;
  recurringDuplicateWarnings: RecurringWarning[];
  setRecurringDuplicateWarnings: React.Dispatch<
    React.SetStateAction<RecurringWarning[]>
  >;
  showRecurringWarnings: boolean;
  setShowRecurringWarnings: React.Dispatch<React.SetStateAction<boolean>>;

  // ── Modal global de pago de tarjeta de crédito ──────────────────────────
  // Cualquier componente puede solicitar abrirlo con openPaymentModal(accountId).
  // Se renderiza una única vez en <App /> vía <GlobalModals />.
  paymentModalAccountId: string | null;
  openPaymentModal: (accountId: string) => void;
  closePaymentModal: () => void;

  // ── Petición global de apertura del simulador de amortización ───────────
  // Se "consume" cuando Accounts.tsx la procesa (one-shot, evita bucles).
  simulatorRequestAccountId: string | null;
  requestOpenSimulator: (accountId: string) => void;
  consumeSimulatorRequest: () => void;
};

// ─── Contexto ─────────────────────────────────────────────────────────────────
export const UIContext = createContext<UIContextType | null>(null);

// ─── Hook específico (performance: solo re-renderiza cuando cambia UI) ────────
export function useUI(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState('dashboard');
  const [showCurrency, setShowCurrency] = useState(false);
  const [realAccountFilter, setRealAccountFilter] = useState('all');
  // Origen de navegación a la pestaña Movimientos. Cuando se setea, RealExpenses
  // muestra un botón "← Volver a {label}" que devuelve al usuario a su origen.
  // null = se accedió directamente desde el menú principal.
  const [realReturnTo, setRealReturnTo] = useState<{
    label: string; tab: string; loanId?: string; creditCardId?: string;
  } | null>(null);
  const [realFilterType, setRealFilterType] = useState('all');
  const [realFilterAccount, setRealFilterAccount] = useState('all');
  const [realFilterCategory, setRealFilterCategory] = useState('all');
  const [realFilterDateMode, setRealFilterDateMode] = useState<
    'preset' | 'range'
  >('preset');
  const [realFilterPreset, setRealFilterPreset] = useState('all');
  const [realFilterDateFrom, setRealFilterDateFrom] = useState('');
  const [realFilterDateTo, setRealFilterDateTo] = useState('');
  const [projFilterType, setProjFilterType] = useState<
    'all' | 'income' | 'expense'
  >('all');
  const [projFilterAccount, setProjFilterAccount] = useState('all');
  const [projSortBy, setProjSortBy] = useState<'date' | 'amount' | 'name'>(
    'date'
  );
  const [recurringDuplicateWarnings, setRecurringDuplicateWarnings] = useState<
    RecurringWarning[]
  >([]);
  const [showRecurringWarnings, setShowRecurringWarnings] = useState(false);

  // Estado global del modal de pago (un único modal en toda la app)
  const [paymentModalAccountId, setPaymentModalAccountId] = useState<string | null>(null);
  const openPaymentModal = (accountId: string) => setPaymentModalAccountId(accountId);
  const closePaymentModal = () => setPaymentModalAccountId(null);

  // Petición one-shot para que Accounts.tsx abra el simulador y haga scroll
  const [simulatorRequestAccountId, setSimulatorRequestAccountId] = useState<string | null>(null);
  const requestOpenSimulator = (accountId: string) => {
    // Cambiamos a la pestaña Accounts de inmediato y dejamos la petición pendiente
    setTab('accounts');
    setSimulatorRequestAccountId(accountId);
  };
  const consumeSimulatorRequest = () => setSimulatorRequestAccountId(null);

  const value = useMemo(
    () => ({
      tab,
      setTab,
      showCurrency,
      setShowCurrency,
      realAccountFilter,
      setRealAccountFilter,
      realReturnTo,
      setRealReturnTo,
      realFilterType,
      setRealFilterType,
      realFilterAccount,
      setRealFilterAccount,
      realFilterCategory,
      setRealFilterCategory,
      realFilterDateMode,
      setRealFilterDateMode,
      realFilterPreset,
      setRealFilterPreset,
      realFilterDateFrom,
      setRealFilterDateFrom,
      realFilterDateTo,
      setRealFilterDateTo,
      projFilterType,
      setProjFilterType,
      projFilterAccount,
      setProjFilterAccount,
      projSortBy,
      setProjSortBy,
      recurringDuplicateWarnings,
      setRecurringDuplicateWarnings,
      showRecurringWarnings,
      setShowRecurringWarnings,
      paymentModalAccountId,
      openPaymentModal,
      closePaymentModal,
      simulatorRequestAccountId,
      requestOpenSimulator,
      consumeSimulatorRequest,
    }),
    [
      tab,
      showCurrency,
      realAccountFilter,
      realReturnTo,
      realFilterType,
      realFilterAccount,
      realFilterCategory,
      realFilterDateMode,
      realFilterPreset,
      realFilterDateFrom,
      realFilterDateTo,
      projFilterType,
      projFilterAccount,
      projSortBy,
      recurringDuplicateWarnings,
      showRecurringWarnings,
      paymentModalAccountId,
      simulatorRequestAccountId,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
