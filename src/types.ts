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
  | 'duplicate_projection'
  | 'credit_utilization_high'
  | 'credit_payment_due'
  | 'credit_interest_warning';

// Tipo de acción que debe ejecutar el botón principal de una alerta.
// - 'navigate'           → Cambia de pestaña (comportamiento por defecto)
// - 'open_payment_modal' → Abre el CreditCardPaymentModal de la tarjeta indicada en data.accountId
// - 'open_simulator'     → Navega a Accounts y expande el simulador de la tarjeta indicada en data.accountId
export type AlertActionType =
  | 'navigate'
  | 'open_payment_modal'
  | 'open_simulator';

  // ✅ FIX 10 — Tipos base de entidades (antes eran any[] en BackupEntry y calcForecast)
  export type Account = {
    id: string;
    name: string;
    balance: number;
    currency?: string;
    date: string;
    minBalance?: number;
    // Tipo de cuenta
    accountType?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
    // Entidad financiera (opcional, solo informativo)
    // Puede ser un nombre del catálogo (ver lib/financialInstitutions.ts)
    // o un texto libre escrito por el usuario.
    institution?: string;
    // Campos exclusivos de tarjeta de crédito
    creditLimit?: number;      // Límite de crédito autorizado
    billingDay?: number;       // Día de corte (1-31)
    paymentDueDay?: number;    // Día de vencimiento del pago (1-31)
    interestRate?: number;     // TAE en % (ej: 24.9 para tarjeta · 2.5 para hipoteca)
    minPaymentPct?: number;    // % pago mínimo (ej: 5)
    // ── Campos exclusivos de préstamos/hipotecas ──
    loanType?: 'mortgage' | 'personal';   // Tipo de préstamo (icono y etiqueta)
    monthlyPayment?: number;              // Cuota mensual actual
    paymentsRemaining?: number;           // Nº de cuotas que quedan por pagar
    interestType?: 'fixed' | 'variable';  // Tipo de interés (informativo en Fase 1)
    paymentDay?: number;                  // Día del mes en que se carga la cuota (1-31)
    paymentAccountId?: string;            // Cuenta corriente desde la que se paga la cuota
    linkedProjectionId?: string;          // ID de la proyección recurrente auto-vinculada
    // ── Amortización parcial (Fase 2.1) ──
    /** Comisión de amortización parcial en % sobre el importe amortizado. Opcional. Default 0. */
    amortizationFeePct?: number;
    /** Histórico de amortizaciones parciales aplicadas a este préstamo */
    amortizations?: Array<{
      id: string;
      date: string;                              // YYYY-MM-DD
      amount: number;                            // Capital amortizado (sin comisión)
      fee: number;                               // Comisión cobrada (puede ser 0)
      mode: 'reduce_payment' | 'reduce_term';
      fromAccountId: string;                     // Cuenta desde la que salió el dinero
      // Snapshot del estado del préstamo para histórico
      prevMonthlyPayment?: number;
      newMonthlyPayment?: number;
      prevPaymentsRemaining?: number;
      newPaymentsRemaining?: number;
      interestSavedEstimate?: number;            // Estimación de intereses ahorrados
    }>;
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
  actionType?: AlertActionType; // ✅ NUEVO — define cómo se ejecuta la acción primaria
  data?: Record<string, string | number | boolean>; // ✅ FIX 11 — era Record<string, any>
  generatedAt: number;
};

export type Projection = {
  id: string;
  name: string;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  type: 'income' | 'expense' | 'transfer';
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
  linkedLoanId?: string; // Si está presente, esta proyección representa la cuota de un préstamo (solo lectura en UI)
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
  isTransfer?: boolean;     // Marca este movimiento como parte de una transferencia
  transferId?: string;      // Vincula los dos tramos de la misma transferencia
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
  fromAccountId?: string;
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
