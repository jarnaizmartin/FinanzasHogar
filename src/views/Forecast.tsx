import { useState, useMemo } from 'react';
import { Filter, Wallet, AlertTriangle } from 'lucide-react';
import { fmt } from '../utils';
import { Card, PrintButton, PrintHeader, PrintFooter } from '../components/UI';
import { useApp } from '../AppContext';

export function Forecast() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    accounts,
    forecastAll,
    forecastByAccount,
  } = useApp();

  const [selectedAccount, setSelectedAccount] = useState('all');

  const activeForecast =
    selectedAccount === 'all'
      ? forecastAll
      : forecastByAccount[selectedAccount] || [];

  const activeAccount = accounts.find((a) => a.id === selectedAccount);
  const startBalance =
    selectedAccount === 'all'
      ? accounts.reduce((s, a) => s + a.balance, 0)
      : activeAccount?.balance || 0;

  const maxBal = useMemo(
    () => Math.max(...activeForecast.map((m) => m.runningBalance), 1),
    [activeForecast]
  );

  return (
    <div className="fh-print-section">

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Previsión de saldos"
        subtitle={`${selectedAccount === 'all' ? `Todas las cuentas — ${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}` : activeAccount?.name ?? ''} · Saldo inicial: ${fmt(startBalance, displayCurrency, baseCurrency, rates)}`}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
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
            Previsión de saldos
          </h2>
          <p style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}>
            Evolución proyectada a 12 meses
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <PrintButton
            T={T}
            documentTitle="Prevision_Saldos"
            sectionTitle="Previsión de saldos"
            subtitle={`${selectedAccount === 'all' ? `Todas las cuentas — ${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}` : activeAccount?.name ?? ''} · Saldo inicial: ${fmt(startBalance, displayCurrency, baseCurrency, rates)}`}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <Filter size={14} color={T.muted} />
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 700,
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '1rem 1.25rem',
          borderRadius: '1rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          marginBottom: '1.5rem',
        }}
      >
        <Wallet size={18} color={T.accent} />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.accent }}>
            {selectedAccount === 'all'
              ? `Todas las cuentas — ${accounts.length} cuentas`
              : activeAccount?.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: '0.1rem' }}>
            Saldo inicial:{' '}
            <strong style={{ color: T.body }}>
              {fmt(startBalance, displayCurrency, baseCurrency, rates)}
            </strong>
            {selectedAccount !== 'all' &&
              ` · Mínimo: ${fmt(
                activeAccount?.minBalance || 0,
                displayCurrency,
                baseCurrency,
                rates
              )}`}
          </div>
        </div>
      </div>

      <Card T={T} style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          Gráfico de evolución
        </div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            marginBottom: '1.5rem',
          }}
        >
          Saldo estimado mensual
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '14rem' }}>
          {activeForecast.map((m, i) => {
            const pct = (m.runningBalance / maxBal) * 100;
            const isNeg = m.runningBalance < 0;
            const totalMinBalance = accounts.reduce((s, a) => s + (a.minBalance || 0), 0);
            const belowMin =
              selectedAccount === 'all'
                ? m.runningBalance < totalMinBalance
                : m.runningBalance < (activeAccount?.minBalance || 0);
            return (
              <div
                key={m.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <div
                  title={fmt(m.runningBalance, displayCurrency, baseCurrency, rates)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '11rem',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      fontSize: '0.55rem',
                      color: T.muted,
                      textAlign: 'center',
                      marginBottom: '0.2rem',
                      fontWeight: 700,
                    }}
                  >
                    {fmt(m.runningBalance, displayCurrency, baseCurrency, rates)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '0.375rem 0.375rem 0 0',
                      background: isNeg
                        ? T.red
                        : belowMin
                        ? T.amber
                        : i === 0
                        ? T.accent
                        : '#93c5fd',
                      height: `${Math.max(pct, 3)}%`,
                      transition: 'height 0.5s ease',
                      opacity: i === 0 ? 1 : 0.8,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: T.muted,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {m.label.slice(0, 3).toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.75rem',
            color: T.muted,
          }}
        >
          {[
            { color: T.accent, label: 'Normal' },
            { color: T.amber, label: 'Bajo mínimo' },
            { color: T.red, label: 'Negativo' },
          ].map((item) => (
            <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span
                style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  borderRadius: '0.2rem',
                  background: item.color,
                  display: 'inline-block',
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </Card>

      <Card T={T} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.75rem 0.75rem', borderBottom: `1px solid ${T.tableBorder}` }}>
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
            Detalle mensual
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}>
            Tabla de previsión completa
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: T.tableHead, borderBottom: `2px solid ${T.tableBorder}` }}>
                {['Mes', 'Ingresos', 'Gastos', 'Balance neto', 'Saldo estimado'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: T.muted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeForecast.map((m, i) => {
                const totalMinBalance = accounts.reduce((s, a) => s + (a.minBalance || 0), 0);
                const belowMin =
                  selectedAccount === 'all'
                    ? m.runningBalance < totalMinBalance
                    : m.runningBalance < (activeAccount?.minBalance || 0);
                return (
                  <tr
                    key={m.key}
                    style={{
                      background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                      borderBottom: `1px solid ${T.tableBorder}`,
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: T.title, textTransform: 'capitalize' }}>
                      {m.label}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: T.green }}>
                      {fmt(m.income, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: T.red }}>
                      {fmt(m.expense, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: m.net >= 0 ? T.green : T.red }}>
                      {m.net >= 0 ? '+' : ''}{fmt(m.net, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: m.runningBalance < 0 ? T.red : belowMin ? T.amber : T.accent }}>
                      {fmt(m.runningBalance, displayCurrency, baseCurrency, rates)}
                      {belowMin && (
                        <span style={{ fontSize: '0.65rem', display: 'block', color: T.amber, fontWeight: 600 }}>
                          ⚠ Bajo mínimo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
        }}
      >
        <AlertTriangle size={15} color={T.muted} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <span style={{ fontSize: '0.775rem', color: T.muted, lineHeight: 1.5 }}>
        El saldo estimado parte del saldo actual de{' '}
          <strong style={{ color: T.body }}>
            {selectedAccount === 'all' ? 'todas las cuentas' : activeAccount?.name}
          </strong>{' '}
          ({fmt(startBalance, displayCurrency, baseCurrency, rates)}) y aplica únicamente las
          proyecciones asignadas. No incluye movimientos no proyectados.
        </span>
      </div>

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Previsión de saldos" />

    </div>
  );
}
