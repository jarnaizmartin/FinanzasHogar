import { createContext, useContext } from 'react';
import type React from 'react';
import type { SettingsContextType } from './contexts/SettingsContext';
import type { DataContextType } from './contexts/DataContext';
import type { UIContextType } from './contexts/UIContext';
import type { BackupEntry, AppAlert, ForecastMonth, Account } from './types';

// ─── Re-exportaciones de hooks específicos (migración gradual) ────────────────
// Los componentes pueden migrar de useApp() a estos hooks más específicos
// para evitar re-renders innecesarios.
export { useSettings } from './contexts/SettingsContext';
export { useData }     from './contexts/DataContext';
export { useUI }       from './contexts/UIContext';

// ─── Tipo del AppCore (lo que añade AppCoreProvider) ─────────────────────────
type AppCoreContextType = {
  onboarded: boolean;
  setOnboarded: React.Dispatch<React.SetStateAction<boolean>>;
  resetApp: () => void;
  firstSessionDone: boolean;
  setFirstSessionDone: React.Dispatch<React.SetStateAction<boolean>>;
  tourCompleted: boolean;
  setTourCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  tourIsFirstTime: boolean;
  setTourIsFirstTime: React.Dispatch<React.SetStateAction<boolean>>;
  backupHistory: BackupEntry[];
  setBackupHistory: React.Dispatch<React.SetStateAction<BackupEntry[]>>;
  createBackup: (label?: string) => BackupEntry;
  restoreBackup: (entry: BackupEntry) => void;
  deleteBackup: (id: string) => void;
  downloadBackup: (entry?: BackupEntry) => void;
  backupReminderDays: number;
  setBackupReminderDays: React.Dispatch<React.SetStateAction<number>>;
  backupReminderDismissed: number;
  setBackupReminderDismissed: React.Dispatch<React.SetStateAction<number>>;
  autoBackupDone: boolean;
  setAutoBackupDone: React.Dispatch<React.SetStateAction<boolean>>;
  computedAlerts: AppAlert[];
  forecastAll: ForecastMonth[];
  forecastByAccount: Record<string, ForecastMonth[]>;
  accountWarnings: Record<string, boolean>;
  realBalanceMap: Record<string, { realBalance: number; [key: string]: unknown }>;
  stats: {
    totalBalance: number;
    totalRealBalance: number;
    thisMonth: { income: number; expense: number; net: number };
    warnAccounts: Account[];
  };
};

// ─── Tipo combinado (backward compat) ────────────────────────────────────────
// Intersección de los 4 sub-contextos.
export type AppContextType =
  SettingsContextType &
  DataContextType &
  UIContextType &
  AppCoreContextType;

// ─── Contexto ─────────────────────────────────────────────────────────────────
export const AppContext = createContext<AppContextType | null>(null);

// ─── useApp() — backward compat, sigue funcionando en todos los componentes ──
export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
