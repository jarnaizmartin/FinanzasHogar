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

  const value = useMemo(
    () => ({
      tab,
      setTab,
      showCurrency,
      setShowCurrency,
      realAccountFilter,
      setRealAccountFilter,
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
    }),
    [
      tab,
      showCurrency,
      realAccountFilter,
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
      realFilterDateMode,
      realFilterPreset,
      realFilterDateFrom,
      realFilterDateTo,
      recurringDuplicateWarnings,
      showRecurringWarnings,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
