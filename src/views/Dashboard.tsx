import { useRef } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { Wallet, AlertTriangle } from 'lucide-react';
import { useApp } from '../AppContext';
import { fmt, fmtDateDMY } from '../utils';
import { Card, PrintButton, PrintHeader, PrintFooter, WarnBanner } from '../components/UI';
import { AlertsBanner } from './AlertsBanner';
import { SetupProgress } from '../components/SetupProgress';

export function Dashboard() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    fmtAccount,
    accounts,
    forecastByAccount,
    accountWarnings,
    realBalanceMap,
    stats,
    dateFormat,
  } = useApp();

  const { totalRealBalance, thisMonth, warnAccounts } = stats;

  const { seen: coachSeen, markSeen: coachMarkSeen } =
    useCoachMark('dashboard');
  const coachRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Resumen"
        subtitle={`${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} · Patrimonio total: ${fmt(totalRealBalance, displayCurrency, displayCurrency, rates)}`}
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
            Panel principal
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
            Resumen
          </h2>
          <p style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}>
            Vista general de tu situación financiera
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <PrintButton
            T={T}
            documentTitle="Resumen"
            sectionTitle="Resumen"
            subtitle={`${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} · Patrimonio total: ${fmt(totalRealBalance, displayCurrency, displayCurrency, rates)}`}
          />
        </div>
      </div>

      <WarnBanner warnAccounts={warnAccounts} T={T} />
      <AlertsBanner />
      <SetupProgress />

      {/* ── Hero ── */}
      <div
        ref={coachRef}
        style={{
          borderRadius: '1.25rem',
          background: T.heroBg,
          padding: '1.5rem 2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Patrimonio */}
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Patrimonio total
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: T.heroText,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {fmt(totalRealBalance, displayCurrency, displayCurrency, rates)}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: T.heroMuted,
                marginTop: '0.25rem',
              }}
            >
              Saldo real · {accounts.length} cuenta
              {accounts.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div
            style={{
              width: '1px',
              height: '3.5rem',
              background: 'rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          />

          {/* Ingresos */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Ingresos este mes
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#4ade80',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(thisMonth.income, displayCurrency, baseCurrency, rates)}
            </div>
          </div>

          {/* Gastos */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Gastos este mes
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#f87171',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(thisMonth.expense, displayCurrency, baseCurrency, rates)}
            </div>
          </div>

          {/* Balance neto */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Balance neto
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: thisMonth.net >= 0 ? '#4ade80' : '#f87171',
                letterSpacing: '-0.02em',
              }}
            >
              {thisMonth.net >= 0 ? '+' : ''}
              {fmt(thisMonth.net, displayCurrency, baseCurrency, rates)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Estado por cuenta ── */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          Estado por cuenta
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
            gap: '1rem',
          }}
        >
          {accounts.map((acc) => {
            const warn = accountWarnings[acc.id];
            const fc = forecastByAccount[acc.id] || [];
            const next = fc[0];
            return (
              <Card
                key={acc.id}
                T={T}
                style={{
                  border: `2px solid ${warn ? T.amberBorder : T.cardBorder}`,
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '0.75rem',
                          background: warn ? T.amberBg : T.accentLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Wallet size={16} color={warn ? T.amber : T.accent} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {acc.name}
                      </div>
                    </div>
                    {warn && <AlertTriangle size={16} color={T.amber} />}
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
                        fontWeight: 800,
                        color: warn ? T.amber : T.accent,
                        letterSpacing: '-0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtAccount(
                        realBalanceMap[acc.id]?.realBalance ?? acc.balance,
                        acc.currency ?? baseCurrency
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: T.muted,
                        marginTop: '0.2rem',
                      }}
                    >
                      Base{' '}
                      {fmtAccount(acc.balance, acc.currency ?? baseCurrency)} ·
                      al {fmtDateDMY(acc.date, dateFormat)}
                    </div>
                    {realBalanceMap[acc.id]?.appliedCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.accent,
                          marginTop: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ✅ {realBalanceMap[acc.id].appliedCount} movimiento
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}{' '}
                        real
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 'es' : ''}{' '}
                        aplicado
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {realBalanceMap[acc.id]?.ignoredCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.amber,
                          marginTop: '0.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ⚠️ {realBalanceMap[acc.id].ignoredCount} movimiento
                        {realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''}{' '}
                        ignorado
                        {realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''}{' '}
                        (anteriores al saldo base)
                      </div>
                    )}
                  </div>

                  {next && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        paddingTop: '0.875rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                        marginTop: '0.5rem',
                      }}
                    >
                      {[
                        {
                          label: 'Ing./mes',
                          value: next.income,
                          color: T.green,
                        },
                        {
                          label: 'Gas./mes',
                          value: next.expense,
                          color: T.red,
                        },
                        {
                          label: 'Neto/mes',
                          value: next.net,
                          color: next.net >= 0 ? T.green : T.red,
                          prefix: next.net >= 0 ? '+' : '',
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: T.muted,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: item.color,
                            }}
                          >
                            {(item as any).prefix ?? ''}
                            {fmtAccount(
                              item.value,
                              acc.currency ?? baseCurrency
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Coach Mark ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Aquí está tu dinero real"
          description="Este número se actualiza automáticamente cada vez que registras un movimiento. Nunca tendrás que calcular nada."
          onDismiss={coachMarkSeen}
          accentColor="#3b82f6"
        />
      )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Resumen" />

    </div>
  );
}
