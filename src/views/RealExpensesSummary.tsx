import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { useApp } from '../AppContext';
import { convertAmount, fmt } from '../utils';

export function RealExpensesSummary() {
  const { T, realExpenses, displayCurrency, rates, setTab } = useApp();

  const { thisMonthExpenses, currentMonthKey } = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const thisMonthExpenses = realExpenses.filter((e) => {
      const key = e.entryDate.slice(0, 7);
      return key === currentMonthKey;
    });
    return { thisMonthExpenses, currentMonthKey };
  }, [realExpenses]);

  const realIncome = thisMonthExpenses
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const realExpense = thisMonthExpenses
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const realNet = realIncome - realExpense;
  const totalMovements = thisMonthExpenses.length;

  // ── Sin movimientos aún ───────────────────────────────────────────────────
  if (realExpenses.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.cardBg,
          border: `1.5px dashed ${T.cardBorder}`,
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.75rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={16} color={T.accent} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Movimientos Reales
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.1rem',
              }}
            >
              Aún no tienes movimientos registrados
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('real')}
          style={{
            padding: '0.55rem 1.125rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: T.accent,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Registrar movimiento
        </button>
      </div>
    );
  }

  // ── Con movimientos ───────────────────────────────────────────────────────
  return (
    <div
      style={{
        borderRadius: '1rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.625rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={14} color={T.accent} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
            >
              Movimientos Reales — Este mes
            </div>
            <div style={{ fontSize: '0.72rem', color: T.muted }}>
              {totalMovements} movimiento{totalMovements !== 1 ? 's' : ''}{' '}
              registrado{totalMovements !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('real')}
          style={{
            padding: '0.45rem 0.875rem',
            borderRadius: '0.625rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.btnSecBg,
            color: T.btnSecText,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ver todos →
        </button>
      </div>

      {/* Totales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
        }}
      >
        {[
          {
            label: 'Ingresos reales',
            value: fmt(realIncome, displayCurrency, displayCurrency, rates),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Gastos reales',
            value: fmt(realExpense, displayCurrency, displayCurrency, rates),
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
          },
          {
            label: 'Balance real',
            value:
              (realNet >= 0 ? '+' : '') +
              fmt(realNet, displayCurrency, displayCurrency, rates),
            color: realNet >= 0 ? T.green : T.red,
            bg: realNet >= 0 ? T.greenBg : T.redBg,
            border: realNet >= 0 ? T.greenBorder : T.redBorder,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              background: item.bg,
              borderRight: i < 2 ? `1px solid ${item.border}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
