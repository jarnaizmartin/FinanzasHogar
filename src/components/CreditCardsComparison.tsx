import { useState, useMemo } from 'react';
import { TrendingUp, Snowflake, Mountain } from 'lucide-react';
import { useApp } from '../AppContext';
import { Card } from './UI';
import {
  daysUntilPayment,
  getCreditHealthScore,
  getCreditHealthColors,
} from '../lib/creditCardUtils';
import { InstitutionLogo } from './InstitutionLogo';

type Strategy = 'avalanche' | 'snowball';

/**
 * Comparativa entre tarjetas (5.5)
 * ────────────────────────────────────────────────────────────────
 * Solo se renderiza si hay ≥2 tarjetas activas.
 * Muestra tabla comparativa + recomendación de estrategia
 * (avalancha = TAE más alta primero; bola de nieve = deuda más
 * pequeña primero). Por defecto AVALANCHA (matemáticamente óptima).
 */
export function CreditCardsComparison() {
  const { T, accounts, realBalanceMap, fmtAccount, baseCurrency } = useApp();
  const [strategy, setStrategy] = useState<Strategy>('avalanche');

  // Solo tarjetas con datos completos (TAE definida para ranking avalancha)
  const cards = useMemo(
    () => accounts.filter((a) => a.accountType === 'credit_card'),
    [accounts]
  );

  // No renderizar si hay menos de 2 tarjetas
  if (cards.length < 2) return null;

  // ── Ranking según estrategia ──────────────────────────────────
  // Avalancha: ordena por TAE descendente (paga primero la más cara)
  // Bola de nieve: ordena por deuda ascendente (victoria rápida)
  const ranked = [...cards]
    .map((acc) => {
      const info = realBalanceMap[acc.id];
      const debt = info?.creditDebt ?? 0;
      const util = info?.utilizationPct ?? 0;
      const health = getCreditHealthScore(util);
      const dPay = daysUntilPayment(acc);
      return { acc, debt, util, health, dPay };
    })
    .filter((r) => r.debt > 0) // Solo las que tienen deuda
    .sort((a, b) => {
      if (strategy === 'avalanche') {
        return (b.acc.interestRate ?? 0) - (a.acc.interestRate ?? 0);
      }
      return a.debt - b.debt;
    });

  // Si ninguna tarjeta tiene deuda, no tiene sentido mostrar comparativa de pago
  if (ranked.length === 0) return null;

  const target = ranked[0];

  // Etiquetas y descripciones de estrategia
  const strategyInfo =
    strategy === 'avalanche'
      ? {
          name: 'Avalancha',
          icon: <Mountain size={14} />,
          desc: 'Paga primero la TAE más alta — minimiza intereses',
          why: `Empieza por "${target.acc.name}" (TAE ${target.acc.interestRate ?? 0}%). Es la opción matemáticamente óptima: ahorrarás más en intereses a largo plazo.`,
        }
      : {
          name: 'Bola de nieve',
          icon: <Snowflake size={14} />,
          desc: 'Paga primero la deuda más pequeña — motivación rápida',
          why: `Empieza por "${target.acc.name}" (${fmtAccount(target.debt, target.acc.currency ?? baseCurrency)}). Liquidarla rápido te dará una victoria psicológica y libera flujo para la siguiente.`,
        };

  return (
    <div>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: T.muted,
          textTransform: 'uppercase',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <TrendingUp size={13} /> Comparativa de tarjetas
      </div>

      <Card T={T}>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* ── Recomendación destacada ────────────────────────── */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background: T.accentLight,
              border: `1.5px solid ${T.accent}44`,
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: T.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                💡 Estrategia recomendada: {strategyInfo.icon} {strategyInfo.name}
              </div>

              {/* Toggle estrategia */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  padding: '0.2rem',
                  borderRadius: '9999px',
                  background: T.pageBg,
                  border: `1px solid ${T.cardBorder}`,
                }}
              >
                {([
                  ['avalanche', 'Avalancha'],
                  ['snowball', 'Bola de nieve'],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStrategy(val)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: strategy === val ? T.accent : 'transparent',
                      color: strategy === val ? '#fff' : T.muted,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: T.title,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {strategyInfo.why}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: T.muted,
                marginTop: '0.35rem',
              }}
            >
              {strategyInfo.desc}
            </div>
          </div>

          {/* ── Tabla comparativa ───────────────────────────────── */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.cardBorder}` }}>
                  {['#', 'Tarjeta', 'Deuda', 'Salud', 'TAE', 'Util.', 'Próx. pago'].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.6rem 0.5rem',
                          textAlign: i === 1 ? 'left' : i === 0 ? 'center' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, idx) => {
                  const medal = ['🥇', '🥈', '🥉'][idx] ?? `${idx + 1}.`;
                  const isTarget = idx === 0;
                  const colors = getCreditHealthColors(r.health.intent, T);
                  return (
                    <tr
                      key={r.acc.id}
                      style={{
                        borderBottom: `1px solid ${T.cardBorder}`,
                        background: isTarget ? T.accentLight : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          textAlign: 'center',
                          fontSize: '1.1rem',
                        }}
                      >
                        {medal}
                      </td>
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          fontWeight: isTarget ? 800 : 600,
                          color: T.title,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {r.acc.institution && (
                            <>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: T.accent, fontWeight: 700 }}>
                                <InstitutionLogo name={r.acc.institution} size={14} />
                                {r.acc.institution}
                              </span>
                              <span style={{ color: T.muted, fontWeight: 400 }}>—</span>
                            </>
                          )}
                          <span>{r.acc.name}</span>
                          {isTarget && (
                            <span
                              style={{
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.accent,
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Empieza aquí
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: T.red,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtAccount(r.debt, r.acc.currency ?? baseCurrency)}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: colors.bg,
                            color: colors.color,
                            border: `1px solid ${colors.border}`,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '0.4rem',
                              height: '0.4rem',
                              borderRadius: '50%',
                              background: colors.bar,
                            }}
                            />
                            {r.health.label}
                          </span>
                        </td>
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {r.acc.interestRate != null ? `${r.acc.interestRate}%` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: r.util >= 70 ? T.red : r.util >= 30 ? T.amber : T.green,
                        }}
                      >
                        {Math.round(r.util)}%
                      </td>
                      <td
                        style={{
                          padding: '0.7rem 0.5rem',
                          textAlign: 'right',
                          color: r.dPay !== null && r.dPay <= 3 ? T.red : T.muted,
                          fontWeight: r.dPay !== null && r.dPay <= 3 ? 700 : 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.dPay === null
                          ? '—'
                          : r.dPay === 0
                          ? '¡Hoy!'
                          : `${r.dPay}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Nota educativa ──────────────────────────────────── */}
          <div
            style={{
              marginTop: '0.875rem',
              padding: '0.6rem 0.875rem',
              borderRadius: '0.625rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
              fontSize: '0.7rem',
              color: T.muted,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: T.title }}>¿Por qué dos estrategias?</strong>{' '}
            La <strong>avalancha</strong> es la opción matemáticamente óptima
            (ahorra más intereses). La <strong>bola de nieve</strong> es la
            psicológicamente óptima (más fácil mantener el plan). Elige la que
            mejor funcione contigo.
          </div>
        </div>
      </Card>
    </div>
  );
}
