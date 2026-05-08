// ─────────────────────────────────────────────────────────────────────────────
// CreditCardHealthScore.tsx
// Visualización del Health Score con desglose factor por factor.
// Filosofía: TRANSPARENCIA TOTAL. El usuario debe entender cada punto.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { calcDebtHistory, calcHealthScore } from '../lib/creditCardUtils';
import type { Account } from '../types';
import type { HealthFactor } from '../lib/creditCardUtils';

type Props = {
  account: Account;
  utilizationPct: number;
  currentDebt: number;
};

// ─── Helper: color según intent del factor ──────────────────────────────────
function intentColors(intent: HealthFactor['intent'], T: any) {
  switch (intent) {
    case 'success':
      return { fg: T.green, bg: T.greenBg, border: T.greenBorder };
    case 'warning':
      return { fg: T.amber, bg: T.amberBg, border: T.amberBorder };
    case 'danger':
      return {
        fg: T.red,
        bg: T.redBg ?? T.amberBg,
        border: T.redBorder ?? T.amberBorder,
      };
    case 'neutral':
    default:
      return { fg: T.muted, bg: T.pageBg, border: T.cardBorder };
  }
}

// ─── Color del score global ─────────────────────────────────────────────────
function scoreColor(score: number, T: any): string {
  if (score >= 80) return T.green;
  if (score >= 60) return '#84cc16'; // verde-lima (entre verde y ámbar)
  if (score >= 40) return T.amber;
  return T.red;
}

export function CreditCardHealthScore({
  account,
  utilizationPct,
  currentDebt,
}: Props) {
  const { T, realExpenses, rates, baseCurrency } = useApp();
  const [expanded, setExpanded] = useState(false);

  // Calculamos histórico de 6 meses para alimentar el score
  const history = useMemo(
    () => calcDebtHistory(account, realExpenses, rates, baseCurrency, 6),
    [account, realExpenses, rates, baseCurrency]
  );

  const result = useMemo(
    () => calcHealthScore(account, history, utilizationPct, currentDebt),
    [account, history, utilizationPct, currentDebt]
  );

  const sColor = scoreColor(result.score, T);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        marginBottom: '1rem',
        borderRadius: '0.875rem',
        background: T.pageBg,
        border: `1.5px solid ${sColor}33`,
        overflow: 'hidden',
      }}
    >
      {/* Cabecera con score grande (clickable para expandir) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          textAlign: 'left',
        }}
      >
        {/* Score circular */}
        <div
          style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            background: `${sColor}1a`,
            border: `2.5px solid ${sColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: sColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {result.score}
          </div>
        </div>

        {/* Texto principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.15rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              🩺 Salud financiera
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.5rem',
                borderRadius: '9999px',
                background: `${sColor}1a`,
                color: sColor,
                border: `1px solid ${sColor}55`,
              }}
            >
              {result.label}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: T.body,
              lineHeight: 1.4,
            }}
          >
            {result.summary}
          </div>
        </div>

        {/* Chevron */}
        <span
          style={{
            fontSize: '0.85rem',
            color: T.muted,
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {/* Barra de progreso del score */}
      <div
        style={{
          height: '0.35rem',
          background: T.cardBorder,
          margin: '0 1rem 0.875rem',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${result.score}%`,
            background: sColor,
            borderRadius: '9999px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {/* Desglose expandible */}
      {expanded && (
        <div
          style={{
            padding: '0.5rem 1rem 1rem',
            borderTop: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: T.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            ✨ Cómo se calcula tu score
          </div>

          {result.factors.map((f) => {
            const c = intentColors(f.intent, T);
            const pct = (f.score / f.maxScore) * 100;
            return (
              <div
                key={f.key}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.625rem',
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '0.3rem',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: T.title,
                    }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: c.fg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.score}
                    <span style={{ opacity: 0.55, fontWeight: 600 }}>
                      {' '}
                      / {f.maxScore} pts
                    </span>
                  </span>
                </div>

                {/* Mini-barra del factor */}
                <div
                  style={{
                    height: '0.25rem',
                    background: T.cardBorder,
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: c.fg,
                      borderRadius: '9999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: T.body,
                    lineHeight: 1.4,
                  }}
                >
                  {f.detail}
                </div>
              </div>
            );
          })}

          {/* Nota educativa final */}
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.625rem',
              background: T.accentLight,
              border: `1px solid ${T.accent}33`,
              fontSize: '0.7rem',
              color: T.accent,
              lineHeight: 1.5,
            }}
          >
            💡 Tu score se actualiza automáticamente con cada movimiento. Mejora
            los factores en ámbar/rojo para subirlo.
          </div>
        </div>
      )}
    </div>
  );
}
