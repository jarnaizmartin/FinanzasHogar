// ─── Tipos compartidos de la aplicación ──────────────────────────────────────

export type RatesStatus = 'fresh' | 'stale' | 'error' | 'loading';
export type AuthMethod = 'password' | 'totp';
export type AlertSeverity = 'critical' | 'warning' | 'positive';

export type AlertType =
  | 'balance_critical'
  | 'balance_risk'
  | 'budget_exceeded'
  | 'goal_at_risk'
  | 'month_negative'
  | 'goal_overdue'
  | 'goal_completed'
  | 'duplicate_projection';

// ✅ FIX 10 — Tipos base de entidades (antes eran any[] en BackupEntry y calcForecast)
export type Account = {
  id: string;
  name: string;
  balance: number;
  currency?: string;
  date: string;
  minBalance?: number;
};

export type Category = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
};

// ✅ FIX 10 — Tipo del resultado de calcForecast (antes era any[])
export type ForecastMonth = {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  isPast: boolean;
  isCurrent: boolean;
  runningBalance: number;
};

export type AppAlert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  actionTab?: string;
  data?: Record<string, string | number | boolean>; // ✅ FIX 11 — era Record<string, any>
  generatedAt: number;
};

export type Projection = {
  id: string;
  name: string;
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringDay?: number;
  nextOverrideAmount?: number | null;
  lastApplied?: string;
  hasDuplicateWarning?: boolean;
  duplicateWarningMonth?: string;
};

export type RealExpense = {
  id: string;
  entryDate: string;
  valueDate: string;
  description: string;
  categoryId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  accountId: string;
  notes?: string;
  isDuplicateWarning?: boolean;
  duplicateReviewed?: boolean;
};

export type BankColumnKey =
  | 'date'
  | 'valueDate'
  | 'description'
  | 'amount'
  | 'amountIn'
  | 'amountOut'
  | 'balance'
  | 'currency'
  | 'ignore';

export type BankFormat = {
  id: string;
  name: string;
  isCustom: boolean;
  note?: string;
  separator: ',' | ';' | '\t';
  decimal: ',' | '.';
  encoding: 'utf-8' | 'latin1';
  skipRows: number;
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'dd/mm/yy';
  amountMode: 'single' | 'split';
  columns: BankColumnKey[];
  negativeIsExpense: boolean;
};

export type CategoryRule = {
  id: string;
  categoryId: string;
  keywords: string[];
};

export type ImportRowStatus = 'new' | 'duplicate' | 'discarded';

export type ImportRow = {
  id: string;
  entryDate: string;
  valueDate: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  currency: string;
  status: ImportRowStatus;
  duplicateOf?: string;
  notes: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetAmount: number;
  currency: string;
  deadline: string;
  mode: 'manual' | 'auto';
  currentAmount: number;
  categoryId: string;
  accountId: string;
  autoType: 'income' | 'expense';
  autoStartDate: string;
};

export type BackupEntry = {
  id: string;
  timestamp: number;
  label: string;
  accountsCount: number;
  categoriesCount: number;
  projectionsCount: number;
  realExpensesCount: number;
  goalsCount: number;
  data: {
    accounts: Account[]; // ✅ FIX 11 — era any[]
    categories: Category[]; // ✅ FIX 11 — era any[]
    projections: Projection[]; // ✅ FIX 11 — era any[]
    realExpenses: RealExpense[]; // ✅ FIX 11 — era any[]
    goals: SavingsGoal[]; // ✅ FIX 11 — era any[]
    bankFormats: BankFormat[]; // ✅ FIX 11 — era any[]
    categoryRules: CategoryRule[]; // ✅ FIX 11 — era any[]
    baseCurrency: string;
    displayCurrency: string;
    dark: boolean;
    licenseState?: unknown; // ✅ FIX 11 — era any
  };
};

export type ExchangeRates = {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
  status: RatesStatus;
};
