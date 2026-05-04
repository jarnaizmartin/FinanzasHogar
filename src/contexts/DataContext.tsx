import { createContext, useContext, useMemo } from 'react';
import type React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  Account, Category, Projection, RealExpense,
  SavingsGoal, BankFormat, CategoryRule,
} from '../types';

// ─── Tipo ─────────────────────────────────────────────────────────────────────
export type DataContextType = {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  projections: Projection[];
  setProjections: React.Dispatch<React.SetStateAction<Projection[]>>;
  realExpenses: RealExpense[];
  setRealExpenses: React.Dispatch<React.SetStateAction<RealExpense[]>>;
  goals: SavingsGoal[];
  setGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  bankFormats: BankFormat[];
  setBankFormats: React.Dispatch<React.SetStateAction<BankFormat[]>>;
  categoryRules: CategoryRule[];
  setCategoryRules: React.Dispatch<React.SetStateAction<CategoryRule[]>>;
  ignoredAlerts: string[];
  setIgnoredAlerts: React.Dispatch<React.SetStateAction<string[]>>;
};

// ─── Contexto ─────────────────────────────────────────────────────────────────
export const DataContext = createContext<DataContextType | null>(null);

// ─── Hook específico (performance: solo re-renderiza cuando cambian los datos) ──
export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts]           = useLocalStorage<Account[]>('fh_accounts', []);
  const [categories, setCategories]       = useLocalStorage<Category[]>('fh_categories', []);
  const [projections, setProjections]     = useLocalStorage<Projection[]>('fh_projections', []);
  const [realExpenses, setRealExpenses]   = useLocalStorage<RealExpense[]>('fh_real_expenses', []);
  const [goals, setGoals]                 = useLocalStorage<SavingsGoal[]>('fh_goals', []);
  const [bankFormats, setBankFormats]     = useLocalStorage<BankFormat[]>('fh_bank_formats', []);
  const [categoryRules, setCategoryRules] = useLocalStorage<CategoryRule[]>('fh_category_rules', []);
  const [ignoredAlerts, setIgnoredAlerts] = useLocalStorage<string[]>('fh_ignored_alerts', []);

  const value = useMemo(
    () => ({
      accounts, setAccounts,
      categories, setCategories,
      projections, setProjections,
      realExpenses, setRealExpenses,
      goals, setGoals,
      bankFormats, setBankFormats,
      categoryRules, setCategoryRules,
      ignoredAlerts, setIgnoredAlerts,
    }),
    [
      accounts, categories, projections, realExpenses,
      goals, bankFormats, categoryRules, ignoredAlerts,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
