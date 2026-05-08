// ─────────────────────────────────────────────────────────────────────────────
// CreditCardSimulator.tsx
// Simulador interactivo de amortización de deuda de tarjeta de crédito.
// El usuario ajusta el pago mensual y la TAE para visualizar:
//  - Meses hasta liquidar la deuda
//  - Intereses totales pagados
//  - Evolución de la deuda mes a mes (gráfico)
//  - Comparativa "ahorras X € e Y meses si pagas Z€ más"
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../AppContext';
import {
  simulateAmortization,
  compareAmortizations,
} from '../lib/creditCardUtils';
import type { Account } from '../types';

// ─── Helper local de formato monetario ───────────────────────────────────────
function fmtMoney(amount: number, currency: string): string {
  return `${Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function fmtMonths(months: number): string {
  if (months <= 0) return '—';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years}a ${rest}m`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
type Props = {
  account: Account;
  currentDebt: number;
};

export function CreditCardSimulator({ account, currentDebt }: Props) {
  const { T } = useApp();
  const currency = account.currency ?? 'EUR';

  // TAE: valor inicial del Account, fallback a 21% (media española)
  const initialApr = account.interestRate ?? 21;
  const [apr, setApr] = useState<number>(initialApr);

  // Pago mensual: por defecto, el pago mínimo o 5% de la deuda
  const minPayment = useMemo(() => {
    const pct = account.minPaymentPct ?? 5;
    return Math.max(10, Math.round(currentDebt * (pct / 100)));
  }, [currentDebt, account.minPaymentPct]);

  // Slider: rango de 1% a 50% de la deuda (suelo 10€, techo razonable)
  const sliderMin = Math.max(10, Math.round(currentDebt * 0.01));
  const sliderMax = Math.max(sliderMin + 10, Math.round(currentDebt * 0.5));
  const [payment, setPayment] = useState<number>(minPayment);

  // ─── Simulaciones ──────────────────────────────────────────────────────────
  const result = useMemo(
    () => simulateAmortization(currentDebt, apr, payment),
    [currentDebt, apr, payment]
  );

  // Escenario "+50€" para comparativa motivacional
  const better = useMemo(
    () => simulateAmortization(currentDebt, apr, payment + 50),
    [currentDebt, apr, payment]
  );

  const savings = useMemo(
    () => compareAmortizations(result, better),
    [result, better]
  );

  // ─── Datos para el gráfico ─────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!result.feasible) return [];
    // Sampleo: si hay >60 meses, mostramos cada N meses para no saturar
    const step =
      result.schedule.length > 60 ? Math.ceil(result.schedule.length / 60) : 1;
    const sampled = result.schedule
      .filter((_, i) => i % step === 0 || i === result.schedule.length - 1)
      .map((m) => ({
        month: m.month,
        deuda: Number(m.endingDebt.toFixed(2)),
      }));
    // Punto inicial (mes 0)
    return [{ month: 0, deuda: Number(currentDebt.toFixed(2)) }, ...sampled];
  }, [result, currentDebt]);

  // ─── Estilos compartidos ───────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: T.muted,
    marginBottom: '0.5rem',
  };

  const metricCard = (
    icon: string,
    label: string,
    value: string,
    color: string,
    bg: string,
    border: string
  ) => (
    <div
      style={{
        flex: 1,
        minWidth: '8rem',
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
          gap: '0.35rem',
          marginBottom: '0.35rem',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>{icon}</span>
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
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
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
          marginBottom: '1rem',
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
          Simulador de amortización
        </h4>
      </div>

      <p
        style={{
          fontSize: '0.78rem',
          color: T.muted,
          margin: '0 0 1.25rem',
          lineHeight: 1.5,
        }}
      >
        Descubre cuánto tardarás en liquidar tu deuda y cuántos intereses
        pagarás según el importe que abones cada mes.
      </p>

      {/* Resumen de la deuda + TAE editable */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <span style={labelStyle}>Deuda actual</span>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: T.red,
            }}
          >
            {fmtMoney(currentDebt, currency)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '8rem' }}>
          <label htmlFor="apr-input" style={labelStyle}>
            TAE (% anual)
          </label>
          <input
            id="apr-input"
            type="number"
            min={0}
            max={50}
            step={0.1}
            value={apr}
            onChange={(e) => setApr(Math.max(0, Number(e.target.value) || 0))}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '0.625rem',
              border: `1.5px solid ${T.inputBorder}`,
              background: T.inputBg,
              color: T.inputText,
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {!account.interestRate && (
            <div
              style={{
                fontSize: '0.65rem',
                color: T.muted,
                marginTop: '0.25rem',
                fontStyle: 'italic',
              }}
            >
              Valor estimado · media España 21%
            </div>
          )}
        </div>
      </div>

      {/* Slider de pago mensual */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '0.5rem',
          }}
        >
          <span style={labelStyle}>Pago mensual</span>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: T.accent,
              letterSpacing: '-0.01em',
            }}
          >
            {fmtMoney(payment, currency)}
          </span>
        </div>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={5}
          value={payment}
          onChange={(e) => setPayment(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: T.accent,
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: T.muted,
            marginTop: '0.25rem',
          }}
        >
          <span>{fmtMoney(sliderMin, currency)}</span>
          <span style={{ fontStyle: 'italic' }}>
            Mínimo recomendado: {fmtMoney(minPayment, currency)}
          </span>
          <span>{fmtMoney(sliderMax, currency)}</span>
        </div>
      </div>

      {/* CASO NO VIABLE: el pago no cubre intereses */}
      {!result.feasible ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '0.875rem',
            background: T.redBg,
            border: `1px solid ${T.redBorder}`,
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: T.red,
                marginBottom: '0.25rem',
              }}
            >
              Pago insuficiente
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: T.red,
                opacity: 0.9,
                lineHeight: 1.5,
              }}
            >
              Con este pago mensual ni siquiera cubres los intereses (
              {fmtMoney(result.monthlyInterestFirstMonth, currency)}/mes).
              <strong> Tu deuda crecería indefinidamente.</strong> Sube el pago
              al menos por encima de ese umbral.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Métricas clave */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            {metricCard(
              '⏱️',
              'Tiempo total',
              fmtMonths(result.months),
              T.accent,
              T.accentLight,
              `${T.accent}33`
            )}
            {metricCard(
              '💸',
              'Intereses',
              fmtMoney(result.totalInterest, currency),
              T.red,
              T.redBg,
              T.redBorder
            )}
            {metricCard(
              '🏦',
              'Total a pagar',
              fmtMoney(result.totalPaid, currency),
              T.title,
              T.cardBg,
              T.cardBorder
            )}
          </div>

          {/* Gráfico de evolución */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.875rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
              }}
            >
              📉 Evolución de la deuda
            </div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={T.accent}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={T.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={T.cardBorder}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={T.muted}
                    tick={{ fontSize: 11, fill: T.muted }}
                    label={{
                      value: 'Meses',
                      position: 'insideBottom',
                      offset: -2,
                      fontSize: 11,
                      fill: T.muted,
                    }}
                  />
                  <YAxis
                    stroke={T.muted}
                    tick={{ fontSize: 11, fill: T.muted }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: T.cardBg,
                      border: `1px solid ${T.cardBorder}`,
                      borderRadius: '0.625rem',
                      fontSize: '0.8rem',
                    }}
                    labelStyle={{ color: T.title, fontWeight: 700 }}
                    formatter={(value: number) => [
                      fmtMoney(value, currency),
                      'Deuda',
                    ]}
                    labelFormatter={(label) => `Mes ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="deuda"
                    stroke={T.accent}
                    strokeWidth={2}
                    fill="url(#debtGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparativa motivacional */}
          {savings.interestSaved > 0 && (
            <div
              style={{
                padding: '0.875rem 1.125rem',
                borderRadius: '0.875rem',
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: T.green,
                  lineHeight: 1.5,
                }}
              >
                Si pagaras <strong>{fmtMoney(payment + 50, currency)}</strong>{' '}
                al mes (solo 50€ más),{' '}
                <strong>
                  ahorrarías {fmtMoney(savings.interestSaved, currency)}
                </strong>{' '}
                en intereses y liquidarías tu deuda{' '}
                <strong>{savings.monthsSaved} meses antes</strong>.
              </div>
            </div>
          )}

          {/* Aviso educativo si los intereses son muy altos */}
          {result.totalInterest > currentDebt * 0.3 && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: T.amberBg,
                border: `1px solid ${T.amberBorder}`,
                fontSize: '0.75rem',
                color: T.amber,
                lineHeight: 1.5,
              }}
            >
              ⚠️ Los intereses representarán el{' '}
              <strong>
                {((result.totalInterest / currentDebt) * 100).toFixed(0)}%
              </strong>{' '}
              de tu deuda actual. Considera aumentar el pago mensual para
              reducir el coste financiero.
            </div>
          )}
        </>
      )}
    </div>
  );
}
