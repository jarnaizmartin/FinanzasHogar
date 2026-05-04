import { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { useToast } from './contexts/ToastContext';
import {
  PrintButton,
  PrintHeader,
  PrintFooter,
} from './components/UI';

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual', months: 1 },
  { value: 'bimonthly', label: 'Bimensual', months: 2 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'biannual', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
];

function convertAmount(
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

function fmt(
  amount: number,
  toCurrency: string,
  fromCurrency: string = toCurrency,
  rates: Record<string, number> = {}
): string {
  const CURRENCIES = [
    { code: 'EUR', symbol: '€' },
    { code: 'USD', symbol: '$' },
    { code: 'GBP', symbol: '£' },
    { code: 'CAD', symbol: 'CA$' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CHF', symbol: 'CHF' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CNY', symbol: '¥' },
    { code: 'MXN', symbol: '$' },
    { code: 'COP', symbol: '$' },
    { code: 'ARS', symbol: '$' },
    { code: 'CLP', symbol: '$' },
    { code: 'BRL', symbol: 'R$' },
    { code: 'SEK', symbol: 'kr' },
    { code: 'NOK', symbol: 'kr' },
    { code: 'DKK', symbol: 'kr' },
    { code: 'PLN', symbol: 'zł' },
    { code: 'HUF', symbol: 'Ft' },
    { code: 'CZK', symbol: 'Kč' },
    { code: 'RON', symbol: 'lei' },
    { code: 'TRY', symbol: '₺' },
    { code: 'INR', symbol: '₹' },
    { code: 'KRW', symbol: '₩' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'HKD', symbol: 'HK$' },
    { code: 'NZD', symbol: 'NZ$' },
    { code: 'ZAR', symbol: 'R' },
    { code: 'AED', symbol: 'د.إ' },
  ];
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates);
  const c = CURRENCIES.find((c) => c.code === toCurrency) ?? CURRENCIES[0];
  return `${c.symbol}${Number(converted).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDateDMY(dateStr: string, dateFormat: string): string {
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

export function Reports() {
  const {
    T,
    accounts,
    categories,
    projections,
    realExpenses,
    goals,
    baseCurrency,
    displayCurrency,
    rates,
    realBalanceMap,
    dateFormat,
  } = useApp();

  const now = new Date();

  const [reportType, setReportType] = useState<
    'movements' | 'accounts' | 'projections' | 'goals' | 'trends'
  >('movements');
  const [mode, setMode] = useState<'month' | 'range'>('month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [rangeFrom, setRangeFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [rangeTo, setRangeTo] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const periodKeys = useMemo(() => {
    if (mode === 'month') {
      return [`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`];
    }
    const keys: string[] = [];
    const [fy, fm] = rangeFrom.split('-').map(Number);
    const [ty, tm] = rangeTo.split('-').map(Number);
    let y = fy,
      m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      keys.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return keys;
  }, [mode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  const periodLabel = useMemo(() => {
    if (mode === 'month') {
      return new Date(selectedYear, selectedMonth, 1).toLocaleString('es-ES', {
        month: 'long',
        year: 'numeric',
      });
    }
    if (rangeFrom === rangeTo) return rangeFrom;
    return `${rangeFrom} → ${rangeTo}`;
  }, [mode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  const periodReals = useMemo(() => {
    return realExpenses.filter((e) => {
      if (!periodKeys.includes(e.valueDate.slice(0, 7))) return false;
      return true;
    });
  }, [realExpenses, accounts, periodKeys]);

  const periodProjections = useMemo(() => {
    const result: Array<{ proj: any; mk: string }> = [];
    periodKeys.forEach((mk) => {
      const [y, m] = mk.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      projections.forEach((p) => {
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : null;
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        if (!freq) return;
        const diff =
          (d.getFullYear() - start.getFullYear()) * 12 +
          (d.getMonth() - start.getMonth());
        if (diff < 0 || (end && d > end) || diff % freq.months !== 0) return;
        result.push({ proj: p, mk });
      });
    });
    return result;
  }, [projections, periodKeys]);

  const totals = useMemo(() => {
    const realIncome = periodReals
      .filter((e) => e.type === 'income')
      .reduce(
        (s, e) =>
          s + convertAmount(e.amount, e.currency, displayCurrency, rates),
        0
      );
    const realExpense = periodReals
      .filter((e) => e.type === 'expense')
      .reduce(
        (s, e) =>
          s + convertAmount(e.amount, e.currency, displayCurrency, rates),
        0
      );
    let pIncome = 0,
      pExpense = 0;
    periodProjections.forEach(({ proj }) => {
      const acc = accounts.find((a) => a.id === proj.accountId);
      const amt = convertAmount(
        proj.amount,
        acc?.currency ?? baseCurrency,
        displayCurrency,
        rates
      );
      if (proj.type === 'income') pIncome += amt;
      else pExpense += amt;
    });
    const realNet = realIncome - realExpense;
    const savingsRate = realIncome > 0 ? (realNet / realIncome) * 100 : 0;
    return { realIncome, realExpense, realNet, savingsRate, pIncome, pExpense };
  }, [
    periodReals,
    periodProjections,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  const catRows = useMemo(() => {
    const map: Record<
      string,
      {
        catId: string;
        type: 'income' | 'expense';
        projected: number;
        real: number;
      }
    > = {};
    periodProjections.forEach(({ proj }) => {
      const acc = accounts.find((a) => a.id === proj.accountId);
      const amt = convertAmount(
        proj.amount,
        acc?.currency ?? baseCurrency,
        displayCurrency,
        rates
      );
      if (!map[proj.categoryId])
        map[proj.categoryId] = {
          catId: proj.categoryId,
          type: proj.type,
          projected: 0,
          real: 0,
        };
      map[proj.categoryId].projected += amt;
    });
    periodReals.forEach((e) => {
      const amt = convertAmount(e.amount, e.currency, displayCurrency, rates);
      if (!map[e.categoryId])
        map[e.categoryId] = {
          catId: e.categoryId,
          type: e.type as any,
          projected: 0,
          real: 0,
        };
      map[e.categoryId].real += amt;
    });
    return Object.values(map).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return b.real - a.real;
    });
  }, [
    periodProjections,
    periodReals,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  const exportCSV = () => {
    if (reportType === 'projections') {
      const rows = [
        [
          'Concepto',
          'Tipo',
          'Categoría',
          'Cuenta',
          'Importe',
          'Divisa',
          'Frecuencia',
          'Equiv./mes',
          'Fecha inicio',
          'Fecha fin',
        ],
        ...projections.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          const acc = accounts.find((a) => a.id === p.accountId);
          const freq = FREQUENCIES.find((f) => f.value === p.frequency);
          const monthly = freq ? p.amount / freq.months : p.amount;
          return [
            p.name,
            p.type === 'income' ? 'Ingreso' : 'Gasto',
            cat?.name ?? '—',
            acc?.name ?? '—',
            p.amount,
            acc?.currency ?? baseCurrency,
            freq?.label ?? '—',
            monthly.toFixed(2),
            p.startDate,
            p.endDate || 'Sin fin',
          ];
        }),
      ];
      const csv = rows
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');
      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinanzasHogar_proyecciones.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const rows = [
      [
        'Fecha apunte',
        'Fecha valor',
        'Descripción',
        'Tipo',
        'Categoría',
        'Cuenta',
        'Importe',
        'Divisa',
        'Notas',
      ],
      ...periodReals.map((e) => {
        const cat = categories.find((c) => c.id === e.categoryId);
        const acc = accounts.find((a) => a.id === e.accountId);
        return [
          e.entryDate,
          e.valueDate,
          e.description,
          e.type === 'income' ? 'Ingreso' : 'Gasto',
          cat?.name ?? '—',
          acc?.name ?? '—',
          e.type === 'income' ? e.amount : -e.amount,
          e.currency,
          e.notes ?? '',
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinanzasHogar_informe_${periodLabel.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: T.muted,
    textTransform: 'uppercase',
    marginBottom: '0.75rem',
  };

    // ── Títulos dinámicos para impresión ──────────────────────────────────────
    const printMeta = useMemo(() => {
      const map = {
        movements: {
          doc:     'Informe_Movimientos',
          section: 'Informe de Movimientos',
          sub:     periodLabel,
        },
        accounts: {
          doc:     'Informe_Cuentas',
          section: 'Estado de Cuentas',
          sub:     `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}`,
        },
        projections: {
          doc:     'Informe_Proyecciones',
          section: 'Resumen de Proyecciones',
          sub:     `${projections.length} proyección${projections.length !== 1 ? 'es' : ''}`,
        },
        goals: {
          doc:     'Informe_Objetivos',
          section: 'Estado de Objetivos',
          sub:     `${goals.length} objetivo${goals.length !== 1 ? 's' : ''}`,
        },
        trends: {
          doc:     'Informe_Tendencias',
          section: 'Resumen de Tendencias',
          sub:     `${realExpenses.length} movimientos históricos`,
        },
      };
      return map[reportType];
    }, [reportType, periodLabel, accounts.length, projections.length, goals.length, realExpenses.length]);
  
    return (
      <div
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
      className="fh-print-section"
    >
      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title={printMeta.section}
        subtitle={printMeta.sub}
      />

      {/* ── Cabecera ── */}
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
            Informes
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Resumen y exportación de tu actividad financiera
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          {(reportType === 'movements' || reportType === 'projections') && (
            <button
              onClick={exportCSV}
              disabled={reportType === 'movements' && periodReals.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${T.greenBorder}`,
                background: T.greenBg,
                color: T.green,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor:
                  reportType === 'movements' && periodReals.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  reportType === 'movements' && periodReals.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              ⬇️ Exportar CSV
            </button>
          )}
          <PrintButton
            T={T}
            documentTitle={printMeta.doc}
            sectionTitle={printMeta.section}
            subtitle={printMeta.sub}
          />
        </div>
      </div>

      {/* ── Selector tipo informe ── */}
      <div
        className="fh-no-print"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.25rem',
        }}
      >
        {(
          [
            ['movements', '🧾 Movimientos'],
            ['accounts', '🏦 Cuentas'],
            ['projections', '📈 Proyecciones'],
            ['goals', '🎯 Objetivos'],
            ['trends', '📉 Tendencias'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setReportType(v)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: reportType === v ? 'none' : `1px solid ${T.cardBorder}`,
              background: reportType === v ? T.accent : T.cardBg,
              color: reportType === v ? '#fff' : T.muted,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Selector período ── */}
      <div
        className="fh-no-print"
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={sectionTitle}>Período del informe</div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(
            [
              ['month', '📅 Mes concreto'],
              ['range', '📆 Rango de meses'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: mode === v ? 'none' : `1px solid ${T.cardBorder}`,
                background: mode === v ? T.accent : T.pageBg,
                color: mode === v ? '#fff' : T.muted,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        {mode === 'month' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => now.getFullYear() - 2 + i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                {Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: new Date(2024, i, 1).toLocaleString('es-ES', {
                    month: 'long',
                  }),
                })).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Desde
              </label>
              <input
                type="month"
                value={rangeFrom}
                max={rangeTo}
                onChange={(e) => setRangeFrom(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <span
              style={{
                color: T.muted,
                fontWeight: 700,
                paddingBottom: '0.5rem',
              }}
            >
              →
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Hasta
              </label>
              <input
                type="month"
                value={rangeTo}
                min={rangeFrom}
                onChange={(e) => setRangeTo(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

{/* ── Título período ── */}
<div className="fh-no-print" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: T.title,
            textTransform: 'capitalize' as const,
          }}
        >
          {reportType === 'movements' &&
            `Informe de movimientos — ${periodLabel}`}
          {reportType === 'accounts' && 'Estado de cuentas'}
          {reportType === 'projections' && 'Resumen de proyecciones'}
          {reportType === 'goals' && 'Estado de objetivos'}
          {reportType === 'trends' && 'Resumen de tendencias'}
        </div>
        <div
          style={{ fontSize: '0.8rem', color: T.muted, marginTop: '0.25rem' }}
        >
          Generado el{' '}
          {new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* ── INFORME: Movimientos ── */}
      {reportType === 'movements' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Ingresos reales',
                value: fmt(
                  totals.realIncome,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '📈',
              },
              {
                label: 'Gastos reales',
                value: fmt(
                  totals.realExpense,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.red,
                bg: T.redBg,
                border: T.redBorder,
                icon: '📉',
              },
              {
                label: 'Balance neto',
                value:
                  (totals.realNet >= 0 ? '+' : '') +
                  fmt(totals.realNet, displayCurrency, displayCurrency, rates),
                color: totals.realNet >= 0 ? T.green : T.red,
                bg: totals.realNet >= 0 ? T.greenBg : T.redBg,
                border: totals.realNet >= 0 ? T.greenBorder : T.redBorder,
                icon: totals.realNet >= 0 ? '✅' : '⚠️',
              },
              {
                label: 'Tasa de ahorro',
                value: totals.savingsRate.toFixed(1) + '%',
                color:
                  totals.savingsRate >= 20
                    ? T.green
                    : totals.savingsRate >= 0
                    ? T.amber
                    : T.red,
                bg:
                  totals.savingsRate >= 20
                    ? T.greenBg
                    : totals.savingsRate >= 0
                    ? T.amberBg
                    : T.redBg,
                border:
                  totals.savingsRate >= 20
                    ? T.greenBorder
                    : totals.savingsRate >= 0
                    ? T.amberBorder
                    : T.redBorder,
                icon: '🏦',
              },
              {
                label: 'Ingresos proyect.',
                value: fmt(
                  totals.pIncome,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '📋',
              },
              {
                label: 'Gastos proyect.',
                value: fmt(
                  totals.pExpense,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '📋',
              },
            ].map((item) => (
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
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla por categoría */}
          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Detalle por categoría</div>
              <div style={{ fontSize: '0.8rem', color: T.muted }}>
                Comparativa entre lo proyectado y los movimientos reales del
                período
              </div>
            </div>
            {catRows.length === 0 ? (
              <div
                style={{ padding: '3rem', textAlign: 'center', color: T.muted }}
              >
                Sin datos para el período seleccionado
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderBottom: `2px solid ${T.tableBorder}`,
                      }}
                    >
                      {[
                        'Categoría',
                        'Tipo',
                        'Proyectado',
                        'Real',
                        'Diferencia',
                        '% Ejec.',
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.75rem 1.25rem',
                            textAlign: i === 0 ? 'left' : 'right',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase' as const,
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((row, i) => {
                      const cat = categories.find((c) => c.id === row.catId);
                      const diff = row.real - row.projected;
                      const pct =
                        row.projected > 0
                          ? (row.real / row.projected) * 100
                          : null;
                      const isExpense = row.type === 'expense';
                      const overBudget =
                        isExpense && diff > 0 && row.projected > 0;
                      const diffColor = isExpense
                        ? diff > 0
                          ? T.red
                          : diff < 0
                          ? T.green
                          : T.muted
                        : diff > 0
                        ? T.green
                        : diff < 0
                        ? T.amber
                        : T.muted;
                      return (
                        <tr
                          key={row.catId}
                          style={{
                            background:
                              i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                            borderBottom: `1px solid ${T.tableBorder}`,
                          }}
                        >
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                              }}
                            >
                              <span
                                style={{
                                  width: '0.625rem',
                                  height: '0.625rem',
                                  borderRadius: '50%',
                                  background: cat?.color ?? T.muted,
                                  display: 'inline-block',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontWeight: 600, color: T.title }}>
                                {cat?.name ?? 'Sin categoría'}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: isExpense ? T.redBg : T.greenBg,
                                color: isExpense ? T.red : T.green,
                                border: `1px solid ${
                                  isExpense ? T.redBorder : T.greenBorder
                                }`,
                              }}
                            >
                              {isExpense ? 'Gasto' : 'Ingreso'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              color: T.muted,
                            }}
                          >
                            {row.projected > 0
                              ? fmt(
                                  row.projected,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isExpense ? T.red : T.green,
                            }}
                          >
                            {fmt(
                              row.real,
                              displayCurrency,
                              displayCurrency,
                              rates
                            )}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: diffColor,
                            }}
                          >
                            {diff !== 0
                              ? (diff > 0 ? '+' : '') +
                                fmt(
                                  diff,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                            }}
                          >
                            {pct !== null ? (
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: overBudget
                                    ? T.red
                                    : pct >= 90
                                    ? T.green
                                    : T.amber,
                                }}
                              >
                                {pct.toFixed(0)}%{overBudget && ' ⚠️'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderTop: `2px solid ${T.tableBorder}`,
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          padding: '0.875rem 1.25rem',
                          fontWeight: 800,
                          color: T.title,
                          fontSize: '0.8rem',
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1.25rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: T.muted,
                        }}
                      >
                        {fmt(
                          totals.pIncome + totals.pExpense,
                          displayCurrency,
                          displayCurrency,
                          rates
                        )}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1.25rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        {fmt(
                          totals.realIncome + totals.realExpense,
                          displayCurrency,
                          displayCurrency,
                          rates
                        )}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Lista de movimientos */}
          {periodReals.length > 0 && (
            <div
              style={{
                borderRadius: '1rem',
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}
              >
                <div style={sectionTitle}>Movimientos reales del período</div>
                <div style={{ fontSize: '0.8rem', color: T.muted }}>
                  {periodReals.length} movimiento
                  {periodReals.length !== 1 ? 's' : ''} · ordenados por fecha de
                  valor
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.825rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderBottom: `1px solid ${T.tableBorder}`,
                      }}
                    >
                      {[
                        'Fecha valor',
                        'Descripción',
                        'Categoría',
                        'Cuenta',
                        'Importe',
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.65rem 1rem',
                            textAlign: i < 4 ? 'left' : 'right',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase' as const,
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...periodReals]
                      .sort((a, b) => b.valueDate.localeCompare(a.valueDate))
                      .map((e, i) => {
                        const cat = categories.find(
                          (c) => c.id === e.categoryId
                        );
                        const acc = accounts.find((a) => a.id === e.accountId);
                        return (
                          <tr
                            key={e.id}
                            style={{
                              background:
                                i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                              borderBottom: `1px solid ${T.tableBorder}`,
                            }}
                          >
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                color: T.muted,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {fmtDateDMY(e.valueDate, dateFormat)}
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                fontWeight: 600,
                                color: T.title,
                                maxWidth: '16rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {e.description}
                            </td>
                            <td style={{ padding: '0.625rem 1rem' }}>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                }}
                              >
                                <span
                                  style={{
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    borderRadius: '50%',
                                    background: cat?.color ?? T.muted,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ color: T.body }}>
                                  {cat?.name ?? '—'}
                                </span>
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                color: T.muted,
                              }}
                            >
                              {acc?.name ?? '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: e.type === 'income' ? T.green : T.red,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {e.type === 'income' ? '+' : '-'}
                              {e.amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              {e.currency}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── INFORME: Cuentas ── */}
      {reportType === 'accounts' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Total cuentas',
                value: `${accounts.length}`,
                color: T.accent,
                bg: T.accentLight,
                border: `${T.accent}33`,
                icon: '🏦',
              },
              {
                label: 'Patrimonio base',
                value: fmt(
                  accounts.reduce(
                    (s, a) =>
                      s +
                      convertAmount(
                        a.balance,
                        a.currency ?? baseCurrency,
                        displayCurrency,
                        rates
                      ),
                    0
                  ),
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '💰',
              },
              {
                label: 'Patrimonio real',
                value: fmt(
                  accounts.reduce((s, a) => {
                    const rb = realBalanceMap[a.id]?.realBalance ?? a.balance;
                    return (
                      s +
                      convertAmount(
                        rb,
                        a.currency ?? baseCurrency,
                        displayCurrency,
                        rates
                      )
                    );
                  }, 0),
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '✅',
              },
            ].map((item) => (
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
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Detalle por cuenta</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: T.tableHead,
                      borderBottom: `2px solid ${T.tableBorder}`,
                    }}
                  >
                    {[
                      'Cuenta',
                      'Divisa',
                      'Fecha saldo',
                      'Saldo base',
                      'Saldo real',
                      'Mínimo',
                      'Estado',
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: T.muted,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, i) => {
                    const rb = realBalanceMap[acc.id];
                    const belowMin =
                      acc.minBalance > 0 &&
                      (rb?.realBalance ?? acc.balance) < acc.minBalance;
                    return (
                      <tr
                        key={acc.id}
                        style={{
                          background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontWeight: 700,
                            color: T.title,
                          }}
                        >
                          {acc.name}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {acc.currency ?? baseCurrency}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {fmtDateDMY(acc.date, dateFormat)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {fmt(
                            acc.balance,
                            acc.currency ?? baseCurrency,
                            acc.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 800,
                            color: belowMin ? T.red : T.green,
                          }}
                        >
                          {fmt(
                            rb?.realBalance ?? acc.balance,
                            acc.currency ?? baseCurrency,
                            acc.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {acc.minBalance > 0
                            ? fmt(
                                acc.minBalance,
                                acc.currency ?? baseCurrency,
                                acc.currency ?? baseCurrency,
                                rates
                              )
                            : '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: belowMin ? T.redBg : T.greenBg,
                              color: belowMin ? T.red : T.green,
                              border: `1px solid ${
                                belowMin ? T.redBorder : T.greenBorder
                              }`,
                            }}
                          >
                            {belowMin ? '⚠️ Bajo mínimo' : '✅ OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INFORME: Proyecciones ── */}
      {reportType === 'projections' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Total proyecciones',
                value: `${projections.length}`,
                color: T.accent,
                bg: T.accentLight,
                border: `${T.accent}33`,
                icon: '📋',
              },
              {
                label: 'Ingresos mensuales',
                value: fmt(
                  projections
                    .filter((p) => p.type === 'income')
                    .reduce((s, p) => {
                      const f = FREQUENCIES.find(
                        (f) => f.value === p.frequency
                      );
                      return s + (f ? p.amount / f.months : 0);
                    }, 0),
                  baseCurrency,
                  baseCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '📈',
              },
              {
                label: 'Gastos mensuales',
                value: fmt(
                  projections
                    .filter((p) => p.type === 'expense')
                    .reduce((s, p) => {
                      const f = FREQUENCIES.find(
                        (f) => f.value === p.frequency
                      );
                      return s + (f ? p.amount / f.months : 0);
                    }, 0),
                  baseCurrency,
                  baseCurrency,
                  rates
                ),
                color: T.red,
                bg: T.redBg,
                border: T.redBorder,
                icon: '📉',
              },
            ].map((item) => (
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
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Listado completo de proyecciones</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: T.tableHead,
                      borderBottom: `2px solid ${T.tableBorder}`,
                    }}
                  >
                    {[
                      'Concepto',
                      'Tipo',
                      'Categoría',
                      'Cuenta',
                      'Importe',
                      'Frecuencia',
                      'Equiv./mes',
                      'Inicio',
                      'Fin',
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: T.muted,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, i) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const acc = accounts.find((a) => a.id === p.accountId);
                    const freq = FREQUENCIES.find(
                      (f) => f.value === p.frequency
                    );
                    const monthly = freq ? p.amount / freq.months : p.amount;
                    return (
                      <tr
                        key={p.id}
                        style={{
                          background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontWeight: 700,
                            color: T.title,
                          }}
                        >
                          {p.name}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background:
                                p.type === 'expense' ? T.redBg : T.greenBg,
                              color: p.type === 'expense' ? T.red : T.green,
                              border: `1px solid ${
                                p.type === 'expense'
                                  ? T.redBorder
                                  : T.greenBorder
                              }`,
                            }}
                          >
                            {p.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.body,
                          }}
                        >
                          {cat?.name ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.body,
                          }}
                        >
                          {acc?.name ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: p.type === 'income' ? T.green : T.red,
                          }}
                        >
                          {fmt(
                            p.amount,
                            acc?.currency ?? baseCurrency,
                            acc?.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {freq?.label ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {fmt(
                            monthly,
                            acc?.currency ?? baseCurrency,
                            acc?.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {fmtDateDMY(p.startDate, dateFormat)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {p.endDate
                            ? fmtDateDMY(p.endDate, dateFormat)
                            : 'Sin fin'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INFORME: Objetivos ── */}
      {reportType === 'goals' &&
        (() => {
          const total = goals.length;
          const completed = goals.filter((g) => {
            const saved =
              g.mode === 'manual'
                ? g.currentAmount
                : realExpenses
                    .filter(
                      (e) =>
                        e.categoryId === g.categoryId &&
                        e.type === g.autoType &&
                        e.valueDate >= g.autoStartDate
                    )
                    .reduce(
                      (s, e) =>
                        s +
                        convertAmount(e.amount, e.currency, g.currency, rates),
                      0
                    );
            return saved >= g.targetAmount;
          }).length;
          const totalTarget = goals.reduce(
            (s, g) =>
              s +
              convertAmount(g.targetAmount, g.currency, displayCurrency, rates),
            0
          );
          return (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
                  gap: '1rem',
                }}
              >
                {[
                  {
                    label: 'Total objetivos',
                    value: `${total}`,
                    color: T.accent,
                    bg: T.accentLight,
                    border: `${T.accent}33`,
                    icon: '🎯',
                  },
                  {
                    label: 'Completados',
                    value: `${completed} / ${total}`,
                    color: T.green,
                    bg: T.greenBg,
                    border: T.greenBorder,
                    icon: '✅',
                  },
                  {
                    label: 'Total objetivo',
                    value: fmt(
                      totalTarget,
                      displayCurrency,
                      displayCurrency,
                      rates
                    ),
                    color: T.muted,
                    bg: T.pageBg,
                    border: T.cardBorder,
                    icon: '💰',
                  },
                ].map((item) => (
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
                        gap: '0.4rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: item.color,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderRadius: '1rem',
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div style={sectionTitle}>Estado de cada objetivo</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: T.tableHead,
                          borderBottom: `2px solid ${T.tableBorder}`,
                        }}
                      >
                        {[
                          'Objetivo',
                          'Modo',
                          'Ahorrado',
                          'Meta',
                          '% Progreso',
                          'Fecha límite',
                          'Estado',
                        ].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: '0.75rem 1rem',
                              textAlign: i === 0 ? 'left' : 'right',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.07em',
                              textTransform: 'uppercase' as const,
                              color: T.muted,
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map((g, i) => {
                        const saved =
                          g.mode === 'manual'
                            ? g.currentAmount
                            : realExpenses
                                .filter(
                                  (e) =>
                                    e.categoryId === g.categoryId &&
                                    e.type === g.autoType &&
                                    e.valueDate >= g.autoStartDate
                                )
                                .reduce(
                                  (s, e) =>
                                    s +
                                    convertAmount(
                                      e.amount,
                                      e.currency,
                                      g.currency,
                                      rates
                                    ),
                                  0
                                );
                        const pct =
                          g.targetAmount > 0
                            ? Math.min((saved / g.targetAmount) * 100, 100)
                            : 0;
                        const isCompleted = saved >= g.targetAmount;
                        const overdue =
                          g.deadline &&
                          new Date(g.deadline) < new Date() &&
                          !isCompleted;
                        return (
                          <tr
                            key={g.id}
                            style={{
                              background:
                                i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                              borderBottom: `1px solid ${T.tableBorder}`,
                            }}
                          >
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ fontWeight: 700, color: T.title }}>
                                {g.emoji} {g.name}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                color: T.muted,
                              }}
                            >
                              {g.mode === 'manual' ? '✍️ Manual' : '⚡ Auto'}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: T.green,
                              }}
                            >
                              {fmt(saved, g.currency, g.currency, rates)}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                color: T.muted,
                              }}
                            >
                              {fmt(
                                g.targetAmount,
                                g.currency,
                                g.currency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '0.5rem',
                                }}
                              >
                                <div
                                  style={{
                                    width: '4rem',
                                    height: '0.375rem',
                                    borderRadius: '9999px',
                                    background: T.pageBg,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      borderRadius: '9999px',
                                      background: isCompleted
                                        ? T.green
                                        : g.color,
                                      width: `${pct}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    color: isCompleted ? T.green : T.title,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                color: T.muted,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {g.deadline
                                ? fmtDateDMY(g.deadline, dateFormat)
                                : '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  background: isCompleted
                                    ? T.greenBg
                                    : overdue
                                    ? T.redBg
                                    : T.amberBg,
                                  color: isCompleted
                                    ? T.green
                                    : overdue
                                    ? T.red
                                    : T.amber,
                                  border: `1px solid ${
                                    isCompleted
                                      ? T.greenBorder
                                      : overdue
                                      ? T.redBorder
                                      : T.amberBorder
                                  }`,
                                }}
                              >
                                {isCompleted
                                  ? '✅ Completado'
                                  : overdue
                                  ? '⏰ Vencido'
                                  : '🔄 En progreso'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}

      {/* ── INFORME: Tendencias ── */}
      {reportType === 'trends' &&
        (() => {
          const validExp = realExpenses.filter((e) => {
            const acc = accounts.find((a) => a.id === e.accountId);
            if (!acc) return false;
            return periodKeys.includes(e.valueDate.slice(0, 7));
          });
          const totalInc = validExp
            .filter((e) => e.type === 'income')
            .reduce(
              (s, e) =>
                s + convertAmount(e.amount, e.currency, displayCurrency, rates),
              0
            );
          const totalExp = validExp
            .filter((e) => e.type === 'expense')
            .reduce(
              (s, e) =>
                s + convertAmount(e.amount, e.currency, displayCurrency, rates),
              0
            );
          const net = totalInc - totalExp;
          const savRate = totalInc > 0 ? (net / totalInc) * 100 : 0;
          const months = Array.from(
            new Set(validExp.map((e) => e.valueDate.slice(0, 7)))
          ).sort();
          return (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
                  gap: '1rem',
                }}
              >
                {[
                  {
                    label: 'Ingresos totales',
                    value: fmt(
                      totalInc,
                      displayCurrency,
                      displayCurrency,
                      rates
                    ),
                    color: T.green,
                    bg: T.greenBg,
                    border: T.greenBorder,
                    icon: '📈',
                  },
                  {
                    label: 'Gastos totales',
                    value: fmt(
                      totalExp,
                      displayCurrency,
                      displayCurrency,
                      rates
                    ),
                    color: T.red,
                    bg: T.redBg,
                    border: T.redBorder,
                    icon: '📉',
                  },
                  {
                    label: 'Balance neto',
                    value:
                      (net >= 0 ? '+' : '') +
                      fmt(net, displayCurrency, displayCurrency, rates),
                    color: net >= 0 ? T.green : T.red,
                    bg: net >= 0 ? T.greenBg : T.redBg,
                    border: net >= 0 ? T.greenBorder : T.redBorder,
                    icon: net >= 0 ? '✅' : '⚠️',
                  },
                  {
                    label: 'Tasa ahorro media',
                    value: savRate.toFixed(1) + '%',
                    color:
                      savRate >= 20 ? T.green : savRate >= 0 ? T.amber : T.red,
                    bg:
                      savRate >= 20
                        ? T.greenBg
                        : savRate >= 0
                        ? T.amberBg
                        : T.redBg,
                    border:
                      savRate >= 20
                        ? T.greenBorder
                        : savRate >= 0
                        ? T.amberBorder
                        : T.redBorder,
                    icon: '🏦',
                  },
                  {
                    label: 'Meses con datos',
                    value: `${months.length}`,
                    color: T.accent,
                    bg: T.accentLight,
                    border: `${T.accent}33`,
                    icon: '📅',
                  },
                  {
                    label: 'Movimientos',
                    value: `${validExp.length}`,
                    color: T.muted,
                    bg: T.pageBg,
                    border: T.cardBorder,
                    icon: '🧾',
                  },
                ].map((item) => (
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
                        gap: '0.4rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: item.color,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderRadius: '1rem',
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div style={sectionTitle}>Resumen mensual histórico</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: T.tableHead,
                          borderBottom: `2px solid ${T.tableBorder}`,
                        }}
                      >
                        {[
                          'Mes',
                          'Ingresos',
                          'Gastos',
                          'Balance',
                          'Tasa ahorro',
                        ].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: '0.75rem 1rem',
                              textAlign: i === 0 ? 'left' : 'right',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.07em',
                              textTransform: 'uppercase' as const,
                              color: T.muted,
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {months.map((mk, i) => {
                        const mExp = validExp.filter(
                          (e) => e.valueDate.slice(0, 7) === mk
                        );
                        const mInc = mExp
                          .filter((e) => e.type === 'income')
                          .reduce(
                            (s, e) =>
                              s +
                              convertAmount(
                                e.amount,
                                e.currency,
                                displayCurrency,
                                rates
                              ),
                            0
                          );
                        const mGas = mExp
                          .filter((e) => e.type === 'expense')
                          .reduce(
                            (s, e) =>
                              s +
                              convertAmount(
                                e.amount,
                                e.currency,
                                displayCurrency,
                                rates
                              ),
                            0
                          );
                        const mNet = mInc - mGas;
                        const mRate = mInc > 0 ? (mNet / mInc) * 100 : 0;
                        const [y, m] = mk.split('-').map(Number);
                        const label = new Date(y, m - 1, 1).toLocaleString(
                          'es-ES',
                          { month: 'long', year: 'numeric' }
                        );
                        return (
                          <tr
                            key={mk}
                            style={{
                              background:
                                i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                              borderBottom: `1px solid ${T.tableBorder}`,
                            }}
                          >
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                fontWeight: 700,
                                color: T.title,
                                textTransform: 'capitalize' as const,
                              }}
                            >
                              {label}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: T.green,
                              }}
                            >
                              {fmt(
                                mInc,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: T.red,
                              }}
                            >
                              {fmt(
                                mGas,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                fontWeight: 800,
                                color: mNet >= 0 ? T.green : T.red,
                              }}
                            >
                              {mNet >= 0 ? '+' : ''}
                              {fmt(
                                mNet,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 800,
                                  color:
                                    mRate >= 20
                                      ? T.green
                                      : mRate >= 0
                                      ? T.amber
                                      : T.red,
                                }}
                              >
                                {mRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section={printMeta.section} />

    </div>
  );
}
