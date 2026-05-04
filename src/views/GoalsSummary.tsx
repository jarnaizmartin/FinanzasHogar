import { useMemo } from 'react';
import { useApp } from '../AppContext';
import { calcGoalProgress } from '../utils';
import { convertAmount, fmt } from '../utils';

export function GoalsSummary() {
  const {
    T,
    goals,
    accounts,
    categories,
    realExpenses,
    displayCurrency,
    rates,
    setTab,
  } = useApp();

  if (goals.length === 0) {
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
              fontSize: '1.125rem',
            }}
          >
            🎯
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Objetivos de ahorro
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.1rem',
              }}
            >
              Aún no tienes objetivos definidos
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('goals')}
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
          + Crear objetivo
        </button>
      </div>
    );
  }

  const sortedGoals = [...goals].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const visibleGoals = sortedGoals.slice(0, 3);
  const hasMore = goals.length > 3;

  const totalTarget = goals.reduce(
    (s, g) =>
      s + convertAmount(g.targetAmount, g.currency, displayCurrency, rates),
    0
  );
  const totalSaved = goals.reduce(
    (s, g) =>
      s +
      convertAmount(
        calcGoalProgress(g, realExpenses, accounts, rates).saved,
        g.currency,
        displayCurrency,
        rates
      ),
    0
  );
  const totalPct =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completedCount = goals.filter(
    (g) => calcGoalProgress(g, realExpenses, accounts, rates).completed
  ).length;

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
              fontSize: '1rem',
            }}
          >
            🎯
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
            >
              Objetivos de ahorro
            </div>
            <div style={{ fontSize: '0.72rem', color: T.muted }}>
              {goals.length} objetivo{goals.length !== 1 ? 's' : ''}
              {completedCount > 0 &&
                ` · ${completedCount} completado${
                  completedCount !== 1 ? 's' : ''
                } 🎉`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('goals')}
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

      {/* ── Progreso global ── */}
      <div
        style={{
          padding: '0.875rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
          background: T.pageBg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: T.muted }}>
            Total ahorrado:{' '}
            <strong style={{ color: T.green }}>
              {fmt(totalSaved, displayCurrency, displayCurrency, rates)}
            </strong>{' '}
            de{' '}
            <strong style={{ color: T.title }}>
              {fmt(totalTarget, displayCurrency, displayCurrency, rates)}
            </strong>
          </span>
          <span
            style={{ fontSize: '0.8rem', fontWeight: 800, color: T.accent }}
          >
            {Math.round(totalPct)}%
          </span>
        </div>
        <div
          style={{
            height: '0.5rem',
            borderRadius: '9999px',
            background: T.cardBorder,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '9999px',
              background: `linear-gradient(90deg, ${T.accent}cc, ${T.accent})`,
              width: `${totalPct}%`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* ── Lista de objetivos ── */}
      <div
        style={{
          padding: '0.875rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {visibleGoals.map((goal) => {
          const prog = calcGoalProgress(goal, realExpenses, accounts, rates);

          return (
            <div
              key={goal.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${
                  prog.completed ? T.greenBorder : T.cardBorder
                }`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Barra de color lateral */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '0.25rem',
                  background: goal.color,
                }}
              />

              <span
                style={{
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  marginLeft: '0.25rem',
                }}
              >
                {goal.emoji}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: T.title,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '60%',
                    }}
                  >
                    {goal.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: prog.completed ? T.green : goal.color,
                      flexShrink: 0,
                    }}
                  >
                    {prog.completed ? '🎉 ¡Listo!' : `${Math.round(prog.pct)}%`}
                  </span>
                </div>

                <div
                  style={{
                    height: '0.375rem',
                    borderRadius: '9999px',
                    background: T.cardBorder,
                    overflow: 'hidden',
                    marginBottom: '0.3rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '9999px',
                      background: prog.completed ? T.green : goal.color,
                      width: `${prog.pct}%`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: T.muted }}>
                    {fmt(prog.saved, goal.currency, goal.currency, rates)}
                    {' / '}
                    {fmt(
                      goal.targetAmount,
                      goal.currency,
                      goal.currency,
                      rates
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      flexShrink: 0,
                    }}
                  >
                    {goal.mode === 'auto' && (
                      <span
                        style={{
                          marginRight: '0.375rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.accentLight,
                          color: T.accent,
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Auto
                      </span>
                    )}
                    {goal.deadline &&
                      prog.monthsLeft !== null &&
                      !prog.completed && (
                        <span
                          style={{
                            color: prog.monthsLeft <= 1 ? T.red : T.muted,
                          }}
                        >
                          {prog.monthsLeft <= 0
                            ? '⚠️ Vencido'
                            : `${prog.monthsLeft} mes${
                                prog.monthsLeft !== 1 ? 'es' : ''
                              }`}
                        </span>
                      )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setTab('goals')}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.pageBg,
              color: T.muted,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver {goals.length - 3} objetivo{goals.length - 3 !== 1 ? 's' : ''}{' '}
            más →
          </button>
        )}
      </div>
    </div>
  );
}
