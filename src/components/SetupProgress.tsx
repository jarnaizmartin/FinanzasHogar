// ─── SetupProgress.tsx ────────────────────────────────────────────────────────
// 🚀 Barra de progreso de setup — aparece en Dashboard hasta completar los 5 pasos
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';

const LS_KEY_DISMISSED = 'fh_setup_dismissed';
const LS_KEY_CELEBRATED = 'fh_setup_celebrated';
const LS_KEY_FIRST_SEEN = 'fh_setup_first_seen';
const EXPIRY_DAYS = 7;

function isExpired(): boolean {
  const raw = localStorage.getItem(LS_KEY_FIRST_SEEN);
  if (!raw) return false;
  const diffMs = Date.now() - parseInt(raw, 10);
  return diffMs > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

type Step = {
  id: string;
  emoji: string;
  label: string;
  hint: string;
  tab: string;
  done: boolean;
};

export function SetupProgress() {
  const { T, accounts, projections, realExpenses, goals, setTab, onboarded } =
    useApp();

    const [dismissed, setDismissed] = useState(
      () => localStorage.getItem(LS_KEY_DISMISSED) === 'true' || isExpired()
    );
    const [celebrated, setCelebrated] = useState(
    () => localStorage.getItem(LS_KEY_CELEBRATED) === 'true'
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [highlightNext, setHighlightNext] = useState(() => {
    const val = localStorage.getItem('fh_setup_highlight');
    if (val === 'true') {
      localStorage.removeItem('fh_setup_highlight');
      return true;
    }
    return false;
  });

  // ── Pasos de setup ─────────────────────────────────────────────────────────
  const steps: Step[] = useMemo(
    () => [
      {
        id: 'account',
        emoji: '🏦',
        label: 'Crea tu primera cuenta',
        hint: 'Di cuánto tienes hoy — la app hace el seguimiento desde ahí',
        tab: 'accounts',
        done: accounts.length > 0,
      },
      {
        id: 'movement',
        emoji: '🧾',
        label: 'Registra tu primer movimiento',
        hint: 'O importa directamente el extracto de tu banco',
        tab: 'real',
        done: realExpenses.length > 0,
      },
      {
        id: 'projection',
        emoji: '📈',
        label: 'Define tus ingresos y gastos fijos',
        hint: 'Tu nómina, el alquiler, las suscripciones...',
        tab: 'projections',
        done: projections.length > 0,
      },
      {
        id: 'goal',
        emoji: '🎯',
        label: 'Crea tu primer objetivo de ahorro',
        hint: 'La app te dirá si vas a llegar a tiempo',
        tab: 'goals',
        done: goals.length > 0,
      },

      // Seguridad ya se ofrece en el WelcomeTour y Onboarding

    ],
    [accounts, realExpenses, projections, goals]
  );

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const pct = (completedCount / steps.length) * 100;

  // ── Celebración al completar todos los pasos ───────────────────────────────
  useEffect(() => {
    if (allDone && !celebrated) {
      setShowConfetti(true);
      setCelebrated(true);
      localStorage.setItem(LS_KEY_CELEBRATED, 'true');
      // Ocultar automáticamente tras 4 segundos
      const t = setTimeout(() => {
        setShowConfetti(false);
        setDismissed(true);
        localStorage.setItem(LS_KEY_DISMISSED, 'true');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, celebrated]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(LS_KEY_DISMISSED, 'true');
  };

  // ── Registrar primera visita ───────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(LS_KEY_FIRST_SEEN)) {
      localStorage.setItem(LS_KEY_FIRST_SEEN, Date.now().toString());
    }
  }, []);

  // No mostrar si está descartado, ya celebrado, o el onboarding no está completo
  if (!onboarded || dismissed || (allDone && celebrated && !showConfetti)) return null;

  // ── Render celebración ─────────────────────────────────────────────────────
  if (showConfetti) {
    return (
      <div
        style={{
          borderRadius: '1.25rem',
          background: T.greenBg,
          border: `2px solid ${T.greenBorder}`,
          padding: '2rem',
          textAlign: 'center',
          animation: 'fadeSlideIn 0.3s ease both',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ConfettiParticles color={T.green} />
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎊</div>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: T.green,
            letterSpacing: '-0.03em',
            marginBottom: '0.375rem',
          }}
        >
          ¡FinanzasHogar está lista!
        </div>
        <div style={{ fontSize: '0.875rem', color: T.green, opacity: 0.8 }}>
          Has completado todos los pasos de configuración. ¡A por tus finanzas!
        </div>
      </div>
    );
  }

  // ── Render normal ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        borderRadius: '1.25rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        boxShadow: T.cardShadow,
        overflow: 'hidden',
        animation: 'fadeSlideIn 0.3s ease both',
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          padding: '1.125rem 1.5rem 1rem',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Icono animado */}
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: `linear-gradient(135deg, #3b82f6, #1d4ed8)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
            }}
          >
            🚀
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: T.title,
                letterSpacing: '-0.02em',
                marginBottom: '0.3rem',
              }}
            >
              Configura tu FinanzasHogar
            </div>

            {/* Barra de progreso */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
            >
              <div
                style={{
                  flex: 1,
                  height: '0.375rem',
                  borderRadius: '9999px',
                  background: T.pageBg,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '9999px',
                    background: `linear-gradient(90deg, #3b82f6, #1d4ed8)`,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 0 6px rgba(59,130,246,0.4)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: T.accent,
                  flexShrink: 0,
                  minWidth: '3rem',
                }}
              >
                {completedCount} de {steps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          title="Ocultar esta guía"
          style={{
            padding: '0.35rem',
            borderRadius: '0.5rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.btnSecBg,
            color: T.muted,
            fontSize: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0,
            lineHeight: 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.pageBg;
            e.currentTarget.style.color = T.title;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.btnSecBg;
            e.currentTarget.style.color = T.muted;
          }}
        >
          ✕
        </button>
      </div>

      {/* Lista de pasos */}
      <div style={{ padding: '0.75rem 1rem' }}>
      {steps.map((step, i) => {
          const isNext      = !step.done && steps.slice(0, i).every((s) => s.done);
          const isLocked    = !step.done && !isNext;
          const highlighted = isNext && highlightNext;
          return (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              isNext={isNext}
              isLocked={isLocked}
              highlighted={highlighted}
              T={T}
              onAction={() => {
                setHighlightNext(false);
                setTab(step.tab as any);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Fila de paso ─────────────────────────────────────────────────────────────
function StepRow({
  step,
  index,
  isNext,
  isLocked,
  highlighted,
  T,
  onAction,
}: {
  step: Step;
  index: number;
  isNext: boolean;
  isLocked: boolean;
  highlighted: boolean;
  T: any;
  onAction: () => void;
}) {
  const clickable = !step.done && !isLocked;
  const [flash, setFlash] = useState(highlighted);

  useEffect(() => {
    if (!highlighted) return;
    const t = setTimeout(() => setFlash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={clickable ? onAction : undefined}
      title={isLocked ? 'Completa el paso anterior primero' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '0.875rem',
        cursor: step.done ? 'default' : isLocked ? 'not-allowed' : 'pointer',
        marginBottom: index < 3 ? '0.25rem' : 0,
        background: flash ? T.accent + '18' : isNext ? T.accentLight : 'transparent',
        border: `1px solid ${flash ? T.accent : isNext ? T.accent + '44' : 'transparent'}`,
        boxShadow: flash ? `0 0 0 3px ${T.accent}33` : 'none',
        transition: 'all 0.6s ease',
        opacity: step.done ? 0.55 : isLocked ? 0.38 : 1,
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.background = isNext ? T.accentLight : T.pageBg;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isNext
          ? T.accentLight
          : 'transparent';
      }}
    >
      {/* Indicador */}
      <div
        style={{
          width: '1.875rem',
          height: '1.875rem',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: step.done ? T.greenBg : isNext ? T.accentLight : T.pageBg,
          border: `2px solid ${
            step.done ? T.greenBorder : isNext ? T.accent : T.cardBorder
          }`,
          fontSize: step.done ? '0.875rem' : isLocked ? '0.7rem' : '0.75rem',
          fontWeight: 800,
          color: step.done ? T.green : isNext ? T.accent : T.muted,
          transition: 'all 0.3s',
        }}
      >
        {step.done ? '✓' : isLocked ? '🔒' : index + 1}
      </div>

      {/* Emoji */}
      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{step.emoji}</span>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.825rem',
            fontWeight: step.done ? 600 : 700,
            color: step.done ? T.muted : T.title,
            textDecoration: step.done ? 'line-through' : 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {step.label}
        </div>
        {!step.done && (
          <div
            style={{
              fontSize: '0.7rem',
              color: T.muted,
              marginTop: '0.1rem',
              lineHeight: 1.4,
            }}
          >
            {step.hint}
          </div>
        )}
      </div>

      {/* Flecha — solo siguiente paso pendiente */}
      {isNext && (
        <div
          style={{
            fontSize: '0.875rem',
            color: T.accent,
            fontWeight: 700,
            flexShrink: 0,
            animation: 'twFloat 2s ease-in-out infinite',
          }}
        >
          →
        </div>
      )}
    </div>
  );
}

// ─── Confetti minimalista ─────────────────────────────────────────────────────
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 31 + 5) % 100,
  delay: (i % 5) * 0.15,
  size: (i % 3) + 0.5,
}));

function ConfettiParticles({ color }: { color: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {CONFETTI.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: '-10%',
            width: `${c.size * 6}px`,
            height: `${c.size * 6}px`,
            borderRadius: c.id % 2 === 0 ? '50%' : '2px',
            background:
              c.id % 3 === 0 ? color : c.id % 3 === 1 ? '#60a5fa' : '#fbbf24',
            opacity: 0.7,
            animation: `twFloat ${2 + c.delay}s ease-in-out ${
              c.delay
            }s infinite`,
          }}
        />
      ))}
    </div>
  );
}
