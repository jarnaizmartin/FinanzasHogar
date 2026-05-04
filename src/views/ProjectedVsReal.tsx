import { useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useApp } from '../AppContext';
import { FREQUENCIES, convertAmount, fmt, monthKey } from '../utils';

export function ProjectedVsReal({ monthOffset = 0 }: { monthOffset?: number }) {
  const {
    T,
    accounts,
    categories,
    projections,
    realExpenses,
    displayCurrency,
    baseCurrency,
    rates,
  } = useApp();

  const now = new Date();
  now.setDate(1);
  now.setMonth(now.getMonth() + monthOffset);
  const currentMonthKey = monthKey(now);

  // ── Reales válidos del mes actual ─────────────────────────────────────────
  const validCurrentMonthReals = useMemo(() => {
    return realExpenses.filter((e) => {
      if (e.entryDate.slice(0, 7) !== currentMonthKey) return false;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      return true;
    });
  }, [realExpenses, accounts, currentMonthKey]);

  // ── Proyecciones activas este mes ─────────────────────────────────────────
  const activeProjections = useMemo(() => {
    return projections.filter((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : null;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diff =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth());
      if (diff < 0 || (end && now > end) || diff % freq.months !== 0)
        return false;
      return true;
    });
  }, [projections]);

  // ── Agrupamos por categoría ───────────────────────────────────────────────
  const rows = useMemo(() => {
    const map: Record<
      string,
      {
        categoryId: string;
        type: 'income' | 'expense';
        projected: number;
        real: number;
      }
    > = {};

    // Añadimos proyecciones
    activeProjections.forEach((p) => {
      const acc = accounts.find((a) => a.id === p.accountId);
      const accCurrency = acc?.currency ?? baseCurrency;
      const amount = convertAmount(
        p.amount,
        accCurrency,
        displayCurrency,
        rates
      );
      if (!map[p.categoryId]) {
        map[p.categoryId] = {
          categoryId: p.categoryId,
          type: p.type as 'income' | 'expense',
          projected: 0,
          real: 0,
        };
      }
      map[p.categoryId].projected += amount;
    });

    // Añadimos reales válidos del mes
    validCurrentMonthReals.forEach((e) => {
      const amount = convertAmount(
        e.amount,
        e.currency,
        displayCurrency,
        rates
      );
      if (!map[e.categoryId]) {
        map[e.categoryId] = {
          categoryId: e.categoryId,
          type: e.type as 'income' | 'expense',
          projected: 0,
          real: 0,
        };
      }
      map[e.categoryId].real += amount;
    });

    return Object.values(map).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return b.projected - a.projected;
    });
  }, [
    activeProjections,
    validCurrentMonthReals,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  // ── Totales ───────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const projectedIncome = rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.projected, 0);
    const projectedExpense = rows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.projected, 0);
    const realIncome = rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.real, 0);
    const realExpense = rows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.real, 0);
    return { projectedIncome, projectedExpense, realIncome, realExpense };
  }, [rows]);

  const monthName = new Date(now.getFullYear(), now.getMonth()).toLocaleString(
    'es-ES',
    { month: 'long', year: 'numeric' }
  );

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: '1rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.2rem',
            }}
          >
            Comparativa mensual
          </div>
          <div
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.02em',
              textTransform: 'capitalize',
            }}
          >
            Apuntes Proyectados vs Gastos Reales — {monthName}
          </div>
        </div>

        {/* Leyenda */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: T.muted, fontWeight: 600 }}>
            Importes por categoría:{' '}
            <span style={{ color: T.muted, fontWeight: 400 }}>Proyectado</span>
            {' / '}
            <span style={{ color: T.accent, fontWeight: 700 }}>Real</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: T.muted, opacity: 0.8 }}>
            Barra = % real ejecutado sobre lo proyectado · color por categoría
          </div>
        </div>
      </div>

      {/* ── Totales resumen ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        {[
          {
            label: 'Ingresos proyectados',
            value: fmt(
              totals.projectedIncome,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.green,
            bg: T.greenBg,
            opacity: 0.7,
          },
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
            opacity: 1,
          },
          {
            label: 'Gastos proyectados',
            value: fmt(
              totals.projectedExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.red,
            bg: T.redBg,
            opacity: 0.7,
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
            opacity: 1,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '0.875rem 1rem',
              background: item.bg,
              borderRight: i < 3 ? `1px solid ${T.cardBorder}` : 'none',
              opacity: item.opacity,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.3rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filas por categoría ── */}
      <div
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* ── Gastos ── */}
        {rows.filter((r) => r.type === 'expense').length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.red,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <ArrowDownCircle size={12} color={T.red} />
              Gastos por categoría
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {rows
                .filter((r) => r.type === 'expense')
                .map((row) => {
                  const cat = categories.find((c) => c.id === row.categoryId);
                  const pct =
                    row.projected > 0
                      ? Math.min((row.real / row.projected) * 100, 100)
                      : 0;
                  const overBudget =
                    row.real > row.projected && row.projected > 0;
                  const overPct =
                    row.projected > 0
                      ? Math.round(
                          ((row.real - row.projected) / row.projected) * 100
                        )
                      : null;
                  const remaining = Math.max(0, row.projected - row.real);
                  const noBudget = row.projected === 0;

                  return (
                    <div key={row.categoryId}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
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
                              width: '0.625rem',
                              height: '0.625rem',
                              borderRadius: '50%',
                              background: cat?.color ?? T.cardBorder,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: T.title,
                            }}
                          >
                            {cat?.name ?? 'Sin categoría'}
                          </span>
                          {overBudget && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.redBg,
                                color: T.red,
                                border: `1px solid ${T.redBorder}`,
                              }}
                            >
                              +{overPct}% sobre presupuesto
                            </span>
                          )}
                          {!overBudget &&
                            !noBudget &&
                            row.real > 0 &&
                            row.projected > 0 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: T.pageBg,
                                  color: T.muted,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                {Math.round((row.real / row.projected) * 100)}%
                              </span>
                            )}
                          {noBudget && row.real > 0 && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.amberBg,
                                color: T.amber,
                                border: `1px solid ${T.amberBorder}`,
                              }}
                            >
                              Sin presupuesto
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            <span style={{ color: T.muted, fontWeight: 500 }}>
                              {row.projected > 0
                                ? fmt(
                                    row.projected,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )
                                : '—'}
                            </span>
                            <span style={{ color: T.muted, fontWeight: 400 }}>
                              {' / '}
                            </span>
                            <span
                              style={{
                                color: cat?.color ?? T.accent,
                                fontWeight: 800,
                              }}
                            >
                              {fmt(
                                row.real,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          </span>
                          {remaining > 0 && (
                            <span
                              style={{ fontSize: '0.72rem', color: T.muted }}
                            >
                              Resta{' '}
                              {fmt(
                                remaining,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      {!noBudget && (
                        <div
                          style={{
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
                              background: overBudget
                                ? T.red
                                : cat?.color ?? T.accent,
                              width: `${pct}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      )}
                      {noBudget && row.real > 0 && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.amberBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: T.amber,
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Ingresos ── */}
        {rows.filter((r) => r.type === 'income').length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <ArrowUpCircle size={12} color={T.green} />
              Ingresos por categoría
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {rows
                .filter((r) => r.type === 'income')
                .map((row) => {
                  const cat = categories.find((c) => c.id === row.categoryId);
                  const pct =
                    row.projected > 0
                      ? Math.min((row.real / row.projected) * 100, 100)
                      : 0;
                  const overEarned =
                    row.real > row.projected && row.projected > 0;
                  const overPct =
                    row.projected > 0
                      ? Math.round(
                          ((row.real - row.projected) / row.projected) * 100
                        )
                      : null;
                  const pending = Math.max(0, row.projected - row.real);
                  const noBudget = row.projected === 0;

                  return (
                    <div key={row.categoryId}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
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
                              width: '0.625rem',
                              height: '0.625rem',
                              borderRadius: '50%',
                              background: cat?.color ?? T.cardBorder,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: T.title,
                            }}
                          >
                            {cat?.name ?? 'Sin categoría'}
                          </span>
                          {overEarned && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.greenBg,
                                color: T.green,
                                border: `1px solid ${T.greenBorder}`,
                              }}
                            >
                              +{overPct}% sobre lo esperado
                            </span>
                          )}
                          {!overEarned &&
                            !noBudget &&
                            row.real > 0 &&
                            row.projected > 0 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: T.pageBg,
                                  color: T.muted,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                {Math.round((row.real / row.projected) * 100)}%
                              </span>
                            )}
                          {noBudget && row.real > 0 && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.amberBg,
                                color: T.amber,
                                border: `1px solid ${T.amberBorder}`,
                              }}
                            >
                              Sin proyección
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            <span style={{ color: T.muted, fontWeight: 500 }}>
                              {row.projected > 0
                                ? fmt(
                                    row.projected,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )
                                : '—'}
                            </span>
                            <span style={{ color: T.muted, fontWeight: 400 }}>
                              {' / '}
                            </span>
                            <span
                              style={{
                                color: cat?.color ?? T.green,
                                fontWeight: 800,
                              }}
                            >
                              {fmt(
                                row.real,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          </span>
                          {pending > 0 && (
                            <span
                              style={{ fontSize: '0.72rem', color: T.muted }}
                            >
                              Pendiente{' '}
                              {fmt(
                                pending,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {!noBudget && (
                        <div
                          style={{
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
                              background: cat?.color ?? T.green,
                              width: `${pct}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      )}
                      {noBudget && row.real > 0 && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.amberBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: T.amber,
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
