// ─────────────────────────────────────────────────────────────────────────────
// CreditCardHistoryChart.tsx
// Visualización de la evolución histórica de la deuda de una tarjeta de crédito.
// Incluye selector de periodo (3M / 6M / 12M) e indicador de tendencia.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../AppContext';
import { calcDebtHistory } from '../lib/creditCardUtils';
import type { Account } from '../types';

type Props = { account: Account };

const PERIOD_OPTIONS = [3, 6, 12] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

// Helper local de formato monetario
function fmtMoney(amount: number, currency: string): string {
  return `${Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function CreditCardHistoryChart({ account }: Props) {
  const { T, realExpenses, rates, baseCurrency } = useApp();
  const [months, setMonths] = useState<Period>(6);
  const currency = account.currency ?? baseCurrency;

  const history = useMemo(
    () => calcDebtHistory(account, realExpenses, rates, baseCurrency, months),
    [account, realExpenses, rates, baseCurrency, months]
  );

  // ── Estado vacío: tarjeta nueva sin historia suficiente ──────────────────
  if (history.length < 2) {
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
          📈
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
          Sigue usando la tarjeta y aquí verás cómo ha evolucionado tu deuda mes
          a mes para detectar patrones.
        </div>
      </div>
    );
  }

  // ── Análisis de tendencia ────────────────────────────────────────────────
  const first = history[0].endingDebt;
  const last = history[history.length - 1].endingDebt;
  const trendDelta = last - first;
  const trendIsGood = trendDelta < 0;
  const trendIsFlat = Math.abs(trendDelta) < 10;

  const trendIcon = trendIsFlat ? '➡️' : trendIsGood ? '📉' : '📈';
  const trendColor = trendIsFlat ? T.muted : trendIsGood ? T.green : T.red;
  const trendLabel = trendIsFlat
    ? 'Estable'
    : trendIsGood
    ? 'Bajando'
    : 'Subiendo';
  const trendText = trendIsFlat
    ? `Tu deuda se ha mantenido estable en los últimos ${months} meses.`
    : trendIsGood
    ? `Tu deuda ha bajado ${fmtMoney(
        Math.abs(trendDelta),
        currency
      )} en ${months} meses. ¡Vas por buen camino!`
    : `Tu deuda ha subido ${fmtMoney(
        trendDelta,
        currency
      )} en ${months} meses. Considera ajustar tu pago mensual.`;

  // Promedio de utilización del periodo
  const avgUtilization =
    history.reduce((s, h) => s + h.utilizationPct, 0) / history.length;

  // ── Datos para el gráfico (los enviamos tal cual) ────────────────────────
  const chartData = history.map((h) => ({
    month: h.monthLabel,
    deuda: Number(h.endingDebt.toFixed(2)),
    pagos: Number(h.payments.toFixed(2)),
    gastos: Number(h.expenses.toFixed(2)),
  }));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: '1.25rem',
        background: T.pageBg,
        borderTop: `1px solid ${T.cardBorder}`,
      }}
    >
      {/* Cabecera + selector de periodo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>📈</span>
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: T.title,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Evolución de tu deuda
          </h4>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.2rem',
            borderRadius: '0.625rem',
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
          }}
        >
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setMonths(p)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '0.45rem',
                border: 'none',
                background: months === p ? T.accent : 'transparent',
                color: months === p ? '#fff' : T.muted,
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p}M
            </button>
          ))}
        </div>
      </div>

      {/* Indicador de tendencia */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.875rem',
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{trendIcon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.15rem',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: trendColor,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Tendencia: {trendLabel}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.5rem',
                borderRadius: '9999px',
                background: T.pageBg,
                color: T.muted,
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              Utilización media: {Math.round(avgUtilization)}%
            </span>
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: T.body,
              lineHeight: 1.45,
            }}
          >
            {trendText}
          </div>
        </div>
      </div>

      {/* Gráfico combinado: barras (gastos/pagos) + área (deuda) */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '0.875rem',
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="histDebtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
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
                  fontSize: '0.78rem',
                }}
                labelStyle={{ color: T.title, fontWeight: 700 }}
                formatter={(value: number, name: string) => [
                  fmtMoney(value, currency),
                  name === 'deuda'
                    ? 'Deuda final'
                    : name === 'pagos'
                    ? 'Pagos'
                    : 'Gastos',
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.72rem', paddingTop: '0.5rem' }}
                iconType="circle"
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill={T.red}
                opacity={0.7}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="pagos"
                name="Pagos"
                fill={T.green}
                opacity={0.7}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="deuda"
                name="Deuda"
                stroke={T.accent}
                strokeWidth={2.5}
                fill="url(#histDebtGrad)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
