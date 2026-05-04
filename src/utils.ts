export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'CAD', symbol: 'CA$', name: 'Dólar canadiense' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar australiano' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
  { code: 'SEK', symbol: 'kr', name: 'Corona sueca' },
  { code: 'NOK', symbol: 'kr', name: 'Corona noruega' },
  { code: 'DKK', symbol: 'kr', name: 'Corona danesa' },
  { code: 'PLN', symbol: 'zł', name: 'Esloti polaco' },
  { code: 'HUF', symbol: 'Ft', name: 'Forinto húngaro' },
  { code: 'CZK', symbol: 'Kč', name: 'Corona checa' },
  { code: 'RON', symbol: 'lei', name: 'Leu rumano' },
  { code: 'TRY', symbol: '₺', name: 'Lira turca' },
  { code: 'INR', symbol: '₹', name: 'Rupia india' },
  { code: 'KRW', symbol: '₩', name: 'Won surcoreano' },
  { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapur' },
  { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong' },
  { code: 'NZD', symbol: 'NZ$', name: 'Dólar neozelandés' },
  { code: 'ZAR', symbol: 'R', name: 'Rand sudafricano' },
  { code: 'AED', symbol: 'د.إ', name: 'Dírham de los EAU' },
];

export const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual', months: 1 },
  { value: 'bimonthly', label: 'Bimensual', months: 2 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'biannual', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
];

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates || Object.keys(rates).length === 0) return amount;
  const rateFrom = rates[fromCurrency] ?? 1;
  const amountInEur = amount / rateFrom;
  const rateTo = rates[toCurrency] ?? 1;
  return amountInEur * rateTo;
}

export function fmt(
  amount: number,
  toCurrency: string,
  fromCurrency: string = toCurrency,
  rates: Record<string, number> = {}
): string {
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates);
  const c = CURRENCIES.find((c) => c.code === toCurrency) ?? CURRENCIES[0];
  return `${c.symbol}${Number(converted).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const today = () => new Date().toISOString().split('T')[0];

export const monthKey = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
};

export const addMonths = (date: Date | string, n: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
};

export const syncEndDateDay = (startDate: string, endDate: string) => {
  if (!endDate || !startDate) return endDate;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const maxDay = new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
  e.setDate(Math.min(s.getDate(), maxDay));
  return e.toISOString().split('T')[0];
};

export function fmtDateShort(dateStr: string, dateFormat: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return '—';
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const monthShort = months[parseInt(m, 10) - 1] ?? m;
  switch (dateFormat) {
    case 'mm/dd/yyyy':
      return `${m}/${d}/${y}`;
    case 'yyyy-mm-dd':
      return `${y}-${m}-${d}`;
    case 'dd-mm-yyyy':
      return `${d}-${m}-${y}`;
    default:
      return `${parseInt(d, 10)} ${monthShort} ${y}`;
  }
}

export function fmtDateDMY(dateStr: string, dateFormat: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return '—';
  switch (dateFormat) {
    case 'mm/dd/yyyy':
      return `${m}/${d}/${y}`;
    case 'yyyy-mm-dd':
      return `${y}-${m}-${d}`;
    case 'dd-mm-yyyy':
      return `${d}-${m}-${y}`;
    default:
      return `${d}/${m}/${y}`;
  }
}

export function calcGoalProgress(
  goal: any,
  realExpenses: any[],
  accounts: any[],
  rates: Record<string, number>
): {
  saved: number;
  pct: number;
  remaining: number;
  completed: boolean;
  monthsLeft: number | null;
  monthlyNeeded: number | null;
  monthlyRate: number;
  estimatedDate: string | null;
  onTrack: boolean;
} {
  const now = new Date();

  let saved = 0;
  if (goal.mode === 'manual') {
    saved = goal.currentAmount;
  } else {
    saved = realExpenses.reduce((sum, e) => {
      if (e.categoryId !== goal.categoryId) return sum;
      if (e.type !== goal.autoType) return sum;
      if (e.valueDate < goal.autoStartDate) return sum;
      if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
        return sum;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc || e.valueDate <= acc.date) return sum;
      return sum + convertAmount(e.amount, e.currency, goal.currency, rates);
    }, 0);
  }

  const pct =
    goal.targetAmount > 0
      ? Math.min((saved / goal.targetAmount) * 100, 100)
      : 0;
  const remaining = Math.max(0, goal.targetAmount - saved);
  const completed = saved >= goal.targetAmount;

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
  const monthsLeft = deadlineDate
    ? Math.max(
        0,
        Math.ceil(
          (deadlineDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24 * 30.44)
        )
      )
    : null;

  const monthlyNeeded =
    monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;

  let monthlyRate = 0;
  if (goal.mode === 'auto') {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentTotal = realExpenses.reduce((sum, e) => {
      if (e.categoryId !== goal.categoryId) return sum;
      if (e.type !== goal.autoType) return sum;
      if (new Date(e.valueDate) < threeMonthsAgo) return sum;
      if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
        return sum;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc || e.valueDate <= acc.date) return sum;
      return sum + convertAmount(e.amount, e.currency, goal.currency, rates);
    }, 0);
    monthlyRate = recentTotal / 3;
  }

  let estimatedDate: string | null = null;
  if (monthlyRate > 0 && remaining > 0) {
    const monthsToGo = Math.ceil(remaining / monthlyRate);
    const est = new Date();
    est.setMonth(est.getMonth() + monthsToGo);
    estimatedDate = est.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  } else if (completed) {
    estimatedDate = 'Objetivo alcanzado';
  }

  const onTrack = monthlyNeeded !== null && monthlyRate >= monthlyNeeded;

  return {
    saved,
    pct,
    remaining,
    completed,
    monthsLeft,
    monthlyNeeded,
    monthlyRate,
    estimatedDate,
    onTrack,
  };
}
