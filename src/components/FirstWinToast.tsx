// ─── FirstWinToast.tsx ────────────────────────────────────────────────────────
// 🏆 Celebración "First Win" — aparece al completar cada primer paso del setup
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../AppContext';

export type FirstWinType = 'account' | 'movement' | 'projection' | 'goal';

type Config = {
  emoji: string;
  title: string;
  sub: string;
  color: string;
  ctaLabel?: string;
  ctaTab?: string;
};

export const FIRST_WIN_CONFIGS: Record<FirstWinType, Config> = {
  account: {
    emoji: '🎉',
    title: '¡Primera cuenta añadida!',
    sub: 'Ahora registra tu primer movimiento.',
    color: '#3b82f6',
    ctaLabel: 'Registrar movimiento →',
    ctaTab: 'real',
  },
  movement: {
    emoji: '📊',
    title: '¡Ya tienes tu primer movimiento real!',
    sub: 'Define tus ingresos y gastos fijos.',
    color: '#16a34a',
    ctaLabel: 'Definir proyecciones →',
    ctaTab: 'projections',
  },
  projection: {
    emoji: '🔮',
    title: '¡La app ya conoce tus ingresos!',
    sub: 'Crea tu primer objetivo de ahorro.',
    color: '#7c3aed',
    ctaLabel: 'Crear objetivo →',
    ctaTab: 'goals',
  },
  goal: {
    emoji: '🎯',
    title: '¡Meta definida!',
    sub: 'La app te avisará si te desvías.',
    color: '#d97706',
  },
};

type Props = {
  type: FirstWinType;
  onDone: () => void;
};

export function FirstWinToast({ type, onDone }: Props) {
  const { T, setTab } = useApp();
  const config = FIRST_WIN_CONFIGS[type];
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const DURATION = 3500;

  // Entrada con un pequeño delay para que el modal se cierre primero
  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(show);
  }, []);

  // Barra de progreso + auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const interval = 30;
    const step = (interval / DURATION) * 100;

    const bar = setInterval(() => {
      setProgress((p) => Math.max(0, p - step));
    }, interval);

    const dismiss = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 320);
    }, DURATION);

    return () => {
      clearInterval(bar);
      clearTimeout(dismiss);
    };
  }, [visible]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '-130%'})`,
        zIndex: 999999,
        transition:
          'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        width: '100%',
        maxWidth: '22rem',
        padding: '0 1rem',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: T.cardBg,
          border: `2px solid ${config.color}55`,
          borderRadius: '1.25rem',
          boxShadow: `0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px ${config.color}22`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mini confetti */}
        <MiniConfetti color={config.color} />

        {/* Contenido */}
        <div
          style={{
            padding: '1.5rem 1.5rem 1.25rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              textAlign: 'center',
              marginBottom: '0.625rem',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
            }}
          >
            {config.emoji}
          </div>
          <div
            style={{
              fontSize: '0.975rem',
              fontWeight: 800,
              color: T.title,
              textAlign: 'center',
              letterSpacing: '-0.02em',
              marginBottom: '0.3rem',
            }}
          >
            {config.title}
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color: T.muted,
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: config.ctaLabel ? '0.75rem' : 0,
            }}
          >
            {config.sub}
          </div>

          {config.ctaLabel && config.ctaTab && (
            <button
              onClick={() => {
                setTab(config.ctaTab as any);
                onDone();
              }}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: config.color,
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                pointerEvents: 'auto',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {config.ctaLabel}
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        <div style={{ height: '3px', background: T.pageBg }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${config.color}88, ${config.color})`,
              transition: 'width 0.03s linear',
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Mini confetti ────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: (i * 19 + 6) % 100,
  delay: (i % 5) * 0.18,
  size: (i % 3) * 0.4 + 0.5,
}));

function MiniConfetti({ color }: { color: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {PARTICLES.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: '-8%',
            width: `${c.size * 5}px`,
            height: `${c.size * 5}px`,
            borderRadius: c.id % 2 === 0 ? '50%' : '2px',
            background:
              c.id % 3 === 0 ? color : c.id % 3 === 1 ? '#60a5fa' : '#fbbf24',
            opacity: 0.45,
            animation: `twFloat ${1.8 + c.delay}s ease-in-out ${
              c.delay
            }s infinite`,
          }}
        />
      ))}
    </div>
  );
}
