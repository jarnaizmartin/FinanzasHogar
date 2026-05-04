import { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
} from 'recharts';
import { fmt, monthKey, convertAmount } from '../utils';
import { Card, PrintButton, PrintHeader, PrintFooter } from '../components/UI';
import { useApp } from '../AppContext';

const ACCOUNT_COLORS = [
  '#3b82f6',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#ea580c',
];

// ─── Hook para medir el ancho real del contenedor ─────────────────────────────
function useContainerWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setWidth(Math.floor(w));
          timerRef.current = null;
        }, 150);
      }
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return [ref, width];
}

function useTrendsData(
  rangeMonths: number | 'all',
  accountFilter: string,
  accounts: any[],
  realExpenses: any[],
  categories: any[],
  rates: Record<string, number>,
  baseCurrency: string
) {
  const now = new Date();
  const allMonthKeys = Array.from(
    new Set(realExpenses.map((e) => e.entryDate.slice(0, 7)))
  ).sort();

  let monthKeys: string[] = [];
  if (rangeMonths === 'all') {
    monthKeys = allMonthKeys;
  } else {
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(monthKey(d));
    }
  }

  if (monthKeys.length === 0) return null;

  const filteredAccounts =
    accountFilter === 'all'
      ? accounts
      : accounts.filter((a) => a.id === accountFilter);

  const validExpenses = realExpenses.filter((e) => {
    const acc = accounts.find((a) => a.id === e.accountId);
    if (!acc) return false;
    if (accountFilter !== 'all' && e.accountId !== accountFilter) return false;
    if (!monthKeys.includes(e.entryDate.slice(0, 7))) return false;
    return true;
  });

  const monthlyData = monthKeys.map((mk) => {
    const monthExpenses = validExpenses.filter(
      (e) => e.entryDate.slice(0, 7) === mk
    );
    const income = monthExpenses
      .filter((e) => e.type === 'income')
      .reduce(
        (sum, e) =>
          sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
        0
      );
    const expenses = monthExpenses
      .filter((e) => e.type === 'expense')
      .reduce(
        (sum, e) =>
          sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
        0
      );
    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    const [y, m] = mk.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
      month: 'short',
      year: '2-digit',
    });
    return {
      monthKey: mk,
      label,
      income: parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      net: parseFloat(net.toFixed(2)),
      savingsRate: parseFloat(savingsRate.toFixed(1)),
    };
  });

  const balanceData = monthKeys.map((mk) => {
    const [y, m] = mk.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
      month: 'short',
      year: '2-digit',
    });
    const point: Record<string, any> = { monthKey: mk, label };
    filteredAccounts.forEach((acc) => {
      let balance = convertAmount(
        acc.balance,
        acc.currency ?? baseCurrency,
        baseCurrency,
        rates
      );
      realExpenses.forEach((e) => {
        if (e.accountId !== acc.id) return;
        if (e.entryDate.slice(0, 7) > mk) return;
        const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
        balance += e.type === 'income' ? amt : -amt;
      });
      point[acc.id] = parseFloat(balance.toFixed(2));
      point[`${acc.id}_name`] = acc.name;
    });
    const total = filteredAccounts.reduce(
      (sum, acc) => sum + (point[acc.id] ?? 0),
      0
    );
    point['total'] = parseFloat(total.toFixed(2));
    return point;
  });

  const catTotals: Record<string, number> = {};
  validExpenses
    .filter((e) => e.type === 'expense')
    .forEach((e) => {
      const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
      catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + amt;
    });

  const categoryData = Object.entries(catTotals)
    .map(([catId, total]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        categoryId: catId,
        name: cat?.name ?? 'Sin categoría',
        color: cat?.color ?? '#94a3b8',
        total: parseFloat(total.toFixed(2)),
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  const avgSavingsRate =
    monthlyData.length > 0
      ? monthlyData.reduce((s, m) => s + m.savingsRate, 0) / monthlyData.length
      : 0;

  const bestIncomeMonth = [...monthlyData].sort(
    (a, b) => b.income - a.income
  )[0];
  const worstExpenseMonth = [...monthlyData].sort(
    (a, b) => b.expenses - a.expenses
  )[0];
  const topCategory = categoryData[0];

  const half = Math.floor(monthlyData.length / 2);
  const firstHalfSavings =
    monthlyData.slice(0, half).reduce((s, m) => s + m.savingsRate, 0) /
    (half || 1);
  const secondHalfSavings =
    monthlyData.slice(half).reduce((s, m) => s + m.savingsRate, 0) /
    (monthlyData.length - half || 1);
  const trend: 'up' | 'down' | 'stable' =
    secondHalfSavings > firstHalfSavings + 2
      ? 'up'
      : secondHalfSavings < firstHalfSavings - 2
      ? 'down'
      : 'stable';

  return {
    monthlyData,
    balanceData,
    categoryData,
    filteredAccounts,
    stats: {
      totalIncome,
      totalExpenses,
      totalNet,
      avgSavingsRate,
      bestIncomeMonth,
      worstExpenseMonth,
      topCategory,
      trend,
      monthCount: monthKeys.length,
    },
  };
}

export function TrendsView() {
  const { T, accounts, categories, realExpenses, rates, baseCurrency } =
    useApp();
  const [rangeMonths, setRangeMonths] = useState<number | 'all'>(6);
  const [accountFilter, setAccountFilter] = useState('all');

  // ─── Un hook por gráfico — llamados siempre en el mismo orden ────────────
  const [refG1, widthG1] = useContainerWidth();
  const [refG2, widthG2] = useContainerWidth();
  const [refG3, widthG3] = useContainerWidth();
  const [refG4, widthG4] = useContainerWidth();

  const data = useTrendsData(
    rangeMonths,
    accountFilter,
    accounts,
    realExpenses,
    categories,
    rates,
    baseCurrency
  );

  const printSubtitle = [
    rangeMonths === 'all'
      ? 'Todo el histórico'
      : `Últimos ${rangeMonths} meses`,
    accountFilter !== 'all'
      ? `Cuenta: ${accounts.find((a) => a.id === accountFilter)?.name ?? ''}`
      : null,
    data?.stats.monthCount != null
      ? `${data.stats.monthCount} mes${
          data.stats.monthCount !== 1 ? 'es' : ''
        } analizados`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const fmtAxis = (val: number) => {
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          boxShadow: T.cardShadowLg,
          fontSize: '0.8rem',
        }}
      >
        <div
          style={{ fontWeight: 800, color: T.title, marginBottom: '0.5rem' }}
        >
          {label}
        </div>
        {payload.map((entry: any, i: number) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: entry.color,
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: entry.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {entry.name}:{' '}
            {entry.value?.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ))}
      </div>
    );
  };

  if (!data) {
    return (
      <div
        style={{ textAlign: 'center', padding: '6rem 2rem', color: T.muted }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>
          📉
        </div>
        <p
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            marginBottom: '0.5rem',
          }}
        >
          Todavía no hay datos suficientes
        </p>
        <p style={{ fontSize: '0.875rem', color: T.muted }}>
          Registra movimientos reales durante al menos un mes para ver los
          gráficos de tendencias.
        </p>
      </div>
    );
  }

  const { monthlyData, balanceData, categoryData, filteredAccounts, stats } =
    data;

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader title="Análisis de Tendencias" subtitle={printSubtitle} />

      {/* Cabecera */}
      <div
        className="fh-no-print"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Análisis
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Análisis de tendencias
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Evolución real de tus finanzas
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <PrintButton
            T={T}
            documentTitle="Analisis_de_Tendencias"
            sectionTitle="Análisis de Tendencias"
            subtitle={printSubtitle}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <select
              value={rangeMonths}
              onChange={(e) =>
                setRangeMonths(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value="all">Todo el histórico</option>
            </select>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <Filter size={14} color={T.muted} />
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          gap: '1rem',
        }}
      >
        {[
          {
            label: 'Ingresos totales',
            value: fmt(stats.totalIncome, baseCurrency, baseCurrency, rates),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
            icon: '📈',
          },
          {
            label: 'Gastos totales',
            value: fmt(stats.totalExpenses, baseCurrency, baseCurrency, rates),
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
            icon: '📉',
          },
          {
            label: 'Balance neto',
            value:
              (stats.totalNet >= 0 ? '+' : '') +
              fmt(stats.totalNet, baseCurrency, baseCurrency, rates),
            color: stats.totalNet >= 0 ? T.green : T.red,
            bg: stats.totalNet >= 0 ? T.greenBg : T.redBg,
            border: stats.totalNet >= 0 ? T.greenBorder : T.redBorder,
            icon: stats.totalNet >= 0 ? '✅' : '⚠️',
          },
          {
            label: 'Tasa de ahorro media',
            value: stats.avgSavingsRate.toFixed(1),
            suffix: '%',
            color:
              stats.avgSavingsRate >= 20
                ? T.green
                : stats.avgSavingsRate >= 10
                ? T.amber
                : T.red,
            bg:
              stats.avgSavingsRate >= 20
                ? T.greenBg
                : stats.avgSavingsRate >= 10
                ? T.amberBg
                : T.redBg,
            border:
              stats.avgSavingsRate >= 20
                ? T.greenBorder
                : stats.avgSavingsRate >= 10
                ? T.amberBorder
                : T.redBorder,
            icon: '🏦',
          },
          {
            label: 'Tendencia de ahorro',
            value:
              stats.trend === 'up'
                ? 'Mejorando'
                : stats.trend === 'down'
                ? 'Empeorando'
                : 'Estable',
            color:
              stats.trend === 'up'
                ? T.green
                : stats.trend === 'down'
                ? T.red
                : T.amber,
            bg:
              stats.trend === 'up'
                ? T.greenBg
                : stats.trend === 'down'
                ? T.redBg
                : T.amberBg,
            border:
              stats.trend === 'up'
                ? T.greenBorder
                : stats.trend === 'down'
                ? T.redBorder
                : T.amberBorder,
            icon:
              stats.trend === 'up'
                ? '🚀'
                : stats.trend === 'down'
                ? '📉'
                : '➡️',
          },
        ].map((item: any) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: item.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {item.label}
              </div>
            </div>
            <div
              style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value}
              {item.suffix && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginLeft: '0.25rem',
                  }}
                >
                  {item.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico 1: Ingresos vs Gastos */}
      <Card T={T}>
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Comparativa mensual
          </div>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
          >
            Ingresos vs Gastos reales
          </div>
        </div>
        <div ref={refG1} style={{ padding: '0 1.5rem 1.5rem' }}>
          <ResponsiveContainer width={widthG1} height={280}>
            <ComposedChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis
                tickFormatter={fmtAxis}
                tick={{ fontSize: 11, fill: T.muted }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: T.muted }} />
              <Bar
                dataKey="income"
                name="Ingresos"
                fill={T.green}
                opacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Gastos"
                fill={T.red}
                opacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Balance neto"
                stroke={T.accent}
                strokeWidth={2.5}
                dot={{ fill: T.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Tasa de ahorro */}
      <Card T={T}>
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Evolución del ahorro
          </div>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
          >
            Tasa de ahorro mensual
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color: T.muted,
              marginTop: '0.2rem',
            }}
          >
            La línea de referencia en el 20% marca el objetivo de ahorro
            saludable
          </div>
        </div>
        <div ref={refG2} style={{ padding: '0 1.5rem 1.5rem' }}>
          <ResponsiveContainer width={widthG2} height={220}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="savingsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: T.muted }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={20}
                stroke={T.green}
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: '20% objetivo', fill: T.green, fontSize: 11 }}
              />
              <ReferenceLine
                y={0}
                stroke={T.red}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="savingsRate"
                name="Tasa de ahorro (%)"
                stroke={T.accent}
                strokeWidth={2.5}
                fill="url(#savingsGradient)"
                dot={{ fill: T.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 3: Evolución saldo por cuenta */}
      {balanceData.length > 0 && (
        <Card T={T}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.muted,
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              Patrimonio
            </div>
            <div
              style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
            >
              Evolución del saldo real mes a mes
            </div>
          </div>
          <div ref={refG3} style={{ padding: '0 1.5rem 1.5rem' }}>
            <ResponsiveContainer width={widthG3} height={260}>
              <LineChart
                data={balanceData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis
                  tickFormatter={fmtAxis}
                  tick={{ fontSize: 11, fill: T.muted }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: T.muted }} />
                {filteredAccounts.map((acc, i) => (
                  <Line
                    key={acc.id}
                    type="monotone"
                    dataKey={acc.id}
                    name={acc.name}
                    stroke={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                    strokeWidth={2}
                    dot={{
                      fill: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
                      r: 3,
                    }}
                    activeDot={{ r: 5 }}
                  />
                ))}
                {filteredAccounts.length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total consolidado"
                    stroke={T.accent}
                    strokeWidth={3}
                    strokeDasharray="6 3"
                    dot={{ fill: T.accent, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Gráfico 4: Distribución por categoría */}
      {categoryData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}
        >
          <Card T={T}>
            <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: T.muted,
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Distribución
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                Gastos por categoría
              </div>
            </div>
            <div
              ref={refG4}
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ResponsiveContainer width={widthG4} height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) +
                        ' ' +
                        baseCurrency,
                      'Total',
                    ]}
                    contentStyle={{
                      background: T.cardBg,
                      border: `1px solid ${T.cardBorder}`,
                      borderRadius: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card T={T}>
            <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: T.muted,
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Ranking
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                Top categorías de gasto
              </div>
            </div>
            <div
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {categoryData.slice(0, 6).map((cat, i) => {
                const maxVal = categoryData[0]?.total ?? 1;
                const pct = (cat.total / maxVal) * 100;
                return (
                  <div key={cat.categoryId}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: T.muted,
                            minWidth: '1rem',
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          style={{
                            width: '0.625rem',
                            height: '0.625rem',
                            borderRadius: '50%',
                            background: cat.color,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            color: T.body,
                          }}
                        >
                          {cat.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {cat.total.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '0.375rem',
                        borderRadius: '9999px',
                        background: T.pageBg,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          background: cat.color,
                          width: `${pct}%`,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Resumen destacado */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {[
          {
            label: 'Mes con más ingresos',
            value: stats.bestIncomeMonth?.label ?? '—',
            sub: stats.bestIncomeMonth
              ? fmt(
                  stats.bestIncomeMonth.income,
                  baseCurrency,
                  baseCurrency,
                  rates
                )
              : '—',
            subColor: T.green,
          },
          {
            label: 'Mes con más gastos',
            value: stats.worstExpenseMonth?.label ?? '—',
            sub: stats.worstExpenseMonth
              ? fmt(
                  stats.worstExpenseMonth.expenses,
                  baseCurrency,
                  baseCurrency,
                  rates
                )
              : '—',
            subColor: T.red,
          },
          {
            label: 'Categoría con más gasto',
            value: stats.topCategory?.name ?? '—',
            sub: stats.topCategory
              ? fmt(stats.topCategory.total, baseCurrency, baseCurrency, rates)
              : '—',
            subColor: T.red,
          },
          {
            label: 'Meses analizados',
            value: `${stats.monthCount} mes${
              stats.monthCount !== 1 ? 'es' : ''
            }`,
            sub:
              rangeMonths === 'all'
                ? 'Todo el histórico'
                : `Últimos ${rangeMonths} meses`,
            subColor: T.muted,
          },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, minWidth: '12rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.25rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{ fontSize: '0.925rem', fontWeight: 800, color: T.title }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: item.subColor,
                fontWeight: 600,
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>
      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Análisis de Tendencias" />
    </div>
  );
}
