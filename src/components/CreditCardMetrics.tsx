// ─────────────────────────────────────────────────────────────────────────────
// CreditCardMetrics.tsx
// Métricas históricas acumuladas de una tarjeta de crédito.
// Filosofía: TRANSPARENCIA. Cada métrica explica qué mide y cómo se calcula.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useApp } from '../AppContext';
import {
  calcDebtHistory,
  calcHistoricalMetrics,
} from '../lib/creditCardUtils';
import type { Account } from '../types';

type Props = { account: Account };

// ─── Helper de formato monetario ─────────────────────────────────────────────
function fmtMoney(amount: number, currency: string): string {
  return `${Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function CreditCardMetrics({ account }: Props) {
  const { T, realExpenses, rates, baseCurrency } = useApp();
  const currency = account.currency ?? baseCurrency;

  // Usamos 12 meses para tener una visión amplia
  const history = useMemo(
    () => calcDebtHistory(account, realExpenses, rates, baseCurrency, 12),
    [account, realExpenses, rates, baseCurrency]
  );

  const metrics = useMemo(
    () =>
      calcHistoricalMetrics(
        history,
        account.interestRate,
        account.minPaymentPct
      ),
    [history, account.interestRate, account.minPaymentPct]
  );

  // ── Estado vacío ──────────────────────────────────────────────────────────
  if (!metrics.hasEnoughData) {
    return (
      <div
        style={{
          padding: '1.5rem 1.25rem',
          background: T.pageBg,
          borderTop: `1px solid ${T.cardBorder}`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>
          📊
        </div>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: T.title,
            marginBottom: '0.35rem',
          }}
        >
          Aún no hay datos suficientes
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: T.muted,
            lineHeight: 1.5,
            maxWidth: '24rem',
            margin: '0 auto',
          }}
        >
          Necesitamos al menos 2 meses de actividad para mostrarte métricas
          fiables sobre intereses, pagos y patrones de gasto.
        </div>
      </div>
    );
  }

  // ── Card individual ───────────────────────────────────────────────────────
  const metricCard = (
    icon: string,
    label: string,
    value: string,
    detail: string,
    color: string,
    bg: string,
    border: string
  ) => (
    <div
      style={{
        padding: '0.875rem 1rem',
        borderRadius: '0.875rem',
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.35rem',
        }}
      >
        <span style={{ fontSize: '0.95rem' }}>{icon}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color,
          letterSpacing: '-0.01em',
          marginBottom: '0.2rem',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.68rem',
          color: T.muted,
          lineHeight: 1.4,
        }}
      >
        {detail}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: '1.25rem',
        background: T.pageBg,
        borderTop: `1px solid ${T.cardBorder}`,
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1rem' }}>📊</span>
        <h4
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            color: T.title,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Métricas históricas
        </h4>
      </div>

      <p
        style={{
          fontSize: '0.75rem',
          color: T.muted,
          margin: '0 0 1rem',
          lineHeight: 1.5,
        }}
      >
        Datos acumulados de los últimos {metrics.monthsTracked} meses (incluyendo
        este mes).
      </p>

      {/* Grid de métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        {metricCard(
          '💰',
          'Total amortizado',
          fmtMoney(metrics.totalPaid, currency),
          'Suma de todos los pagos que has hecho a la tarjeta',
          T.green,
          T.greenBg,
          T.greenBorder
        )}

        {metricCard(
          '🛒',
          'Total gastado',
          fmtMoney(metrics.totalSpent, currency),
          'Suma de todos los gastos cargados en esta tarjeta',
          T.title,
          T.cardBg,
          T.cardBorder
        )}

        {account.interestRate
          ? metricCard(
              '💸',
              'Intereses estimados',
              fmtMoney(metrics.estimatedInterestPaid, currency),
              `Estimación con TAE ${account.interestRate}% sobre la deuda media mensual`,
              T.red,
              T.redBg ?? T.amberBg,
              T.redBorder ?? T.amberBorder
            )
          : metricCard(
              '💸',
              'Intereses estimados',
              '— ',
              'Configura la TAE en los datos de la tarjeta para verlo',
              T.muted,
              T.pageBg,
              T.cardBorder
            )}

        {account.interestRate && account.minPaymentPct && metrics.savedVsMinimum > 0
          ? metricCard(
              '🎯',
              'Ahorro vs pago mínimo',
              fmtMoney(metrics.savedVsMinimum, currency),
              'Lo que has ahorrado en intereses por pagar más del mínimo',
              T.accent,
              T.accentLight,
              `${T.accent}33`
            )
          : metricCard(
              '🎯',
              'Ahorro vs pago mínimo',
              fmtMoney(0, currency),
              account.interestRate && account.minPaymentPct
                ? 'Solo has pagado el mínimo o menos. Pagar más reduciría intereses.'
                : 'Configura TAE y % pago mínimo para verlo',
              T.muted,
              T.pageBg,
              T.cardBorder
            )}
      </div>

      {/* Pico de gasto destacado */}
      {metrics.peakMonth && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: T.amberBg,
            border: `1px solid ${T.amberBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: T.amber,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.15rem',
              }}
            >
              Mes con más gasto
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: T.body,
                lineHeight: 1.4,
              }}
            >
              <strong style={{ color: T.amber, textTransform: 'capitalize' }}>
                {metrics.peakMonth.label}
              </strong>{' '}
              · gastaste{' '}
              <strong>{fmtMoney(metrics.peakMonth.amount, currency)}</strong>{' '}
              con esta tarjeta
            </div>
          </div>
        </div>
      )}

      {/* Nota educativa sobre la estimación */}
      {account.interestRate && metrics.estimatedInterestPaid > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.625rem',
            background: T.cardBg,
            border: `1px dashed ${T.cardBorder}`,
            fontSize: '0.68rem',
            color: T.muted,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          ℹ️ Los intereses son una <strong>estimación</strong> basada en tu TAE
          y la deuda media mensual. El cálculo real del banco puede variar
          según fechas exactas de cobro y capitalización.
        </div>
      )}
    </div>
  );
}
