// ─── CoachMark.tsx ────────────────────────────────────────────────────────────
// 💡 Spotlights contextuales — primera visita a cada pantalla
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Constantes ───────────────────────────────────────────────────────────────
const LS_KEY = 'fh_coach_seen';
const TOOLTIP_W = 288;
const SPOT_PAD = 10;
const TIP_OFFSET = 16;
const ARROW_SIZE = 9;

// ─── Estilos (inyectados una sola vez) ────────────────────────────────────────
const CM_STYLES = `
  @keyframes cmFadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  @keyframes cmPulse {
    0%, 100% {
      box-shadow:
        0 0 0 3px rgba(59,130,246,0.35),
        0 0 0 9999px rgba(0,0,0,0.65);
    }
    50% {
      box-shadow:
        0 0 0 7px rgba(59,130,246,0.55),
        0 0 0 9999px rgba(0,0,0,0.65);
    }
  }
  @keyframes cmArrow {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(4px); }
  }
`;

// ─── Hook — gestiona el estado "visto" en localStorage ───────────────────────
export function useCoachMark(key: string): {
  seen: boolean;
  markSeen: () => void;
} {
  const get = (): Record<string, boolean> => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const [seen, setSeen] = useState(() => get()[key] === true);

  const markSeen = useCallback(() => {
    const current = get();
    current[key] = true;
    localStorage.setItem(LS_KEY, JSON.stringify(current));
    setSeen(true);
  }, [key]);

  return { seen, markSeen };
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
type CoachMarkProps = {
  targetRef: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  ctaLabel?: string;
  accentColor?: string;
  onDismiss: () => void;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function CoachMark({
  targetRef,
  title,
  description,
  ctaLabel = 'Entendido →',
  accentColor = '#3b82f6',
  onDismiss,
}: CoachMarkProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Inyectar estilos una única vez
  useEffect(() => {
    if (document.getElementById('cm-styles')) return;
    const el = document.createElement('style');
    el.id = 'cm-styles';
    el.textContent = CM_STYLES;
    document.head.appendChild(el);
  }, []);

  // Calcular y actualizar posición del target
  useEffect(() => {
    const update = () => {
      if (targetRef.current) {
        setRect(targetRef.current.getBoundingClientRect());
      }
    };
    update();
    const t = setTimeout(update, 80); // delay para asegurar pintado
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [targetRef]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  if (!rect || rect.width === 0) return null;

  // ── Posición del spotlight ─────────────────────────────────────────────────
  const sL = rect.left - SPOT_PAD;
  const sT = rect.top - SPOT_PAD;
  const sW = rect.width + SPOT_PAD * 2;
  const sH = rect.height + SPOT_PAD * 2;

  // ── Posición del tooltip (auto arriba/abajo según espacio) ────────────────
  const centerX = rect.left + rect.width / 2;
  const spaceBelow = window.innerHeight - (sT + sH);
  const showBelow = spaceBelow >= 180 || spaceBelow >= sT;

  // Tooltip horizontal — clampado para no salir de pantalla
  let tLeft = centerX - TOOLTIP_W / 2;
  tLeft = Math.max(12, Math.min(tLeft, window.innerWidth - TOOLTIP_W - 12));

  const tTop = showBelow ? sT + sH + TIP_OFFSET : undefined;
  const tBottom = showBelow ? undefined : window.innerHeight - sT + TIP_OFFSET;

  // ── Flecha ────────────────────────────────────────────────────────────────
  const arrowCX = Math.min(
    Math.max(centerX, tLeft + 20),
    tLeft + TOOLTIP_W - 20
  );
  const arrowTop = showBelow ? sT + sH + TIP_OFFSET - ARROW_SIZE : undefined;
  const arrowBottom = showBelow
    ? undefined
    : window.innerHeight - sT + TIP_OFFSET - ARROW_SIZE;

  return createPortal(
    <>
      {/* Toca cualquier parte para cerrar */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99996,
          cursor: 'pointer',
        }}
      />

      {/* Spotlight — box-shadow crea el overlay oscuro */}
      <div
        style={{
          position: 'fixed',
          left: sL,
          top: sT,
          width: sW,
          height: sH,
          borderRadius: '0.75rem',
          animation: 'cmPulse 2.5s ease-in-out infinite',
          zIndex: 99997,
          pointerEvents: 'none',
        }}
      />

      {/* Flecha CSS apuntando al spotlight */}
      <div
        style={{
          position: 'fixed',
          left: arrowCX - ARROW_SIZE,
          top: arrowTop,
          bottom: arrowBottom,
          width: 0,
          height: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          animation: 'cmArrow 1.4s ease-in-out infinite',
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          ...(showBelow
            ? { borderBottom: `${ARROW_SIZE}px solid #ffffff` }
            : { borderTop: `${ARROW_SIZE}px solid #ffffff` }),
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          left: tLeft,
          top: tTop,
          bottom: tBottom,
          width: TOOLTIP_W,
          zIndex: 99999,
          background: '#ffffff',
          borderRadius: '1.125rem',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08)',
          padding: '1.25rem',
          animation: 'cmFadeIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        {/* Línea de acento superior */}
        <div
          style={{
            height: '3px',
            borderRadius: '9999px',
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
            marginBottom: '1rem',
          }}
        />

        <div
          style={{
            fontSize: '0.925rem',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.55,
            marginBottom: '1rem',
          }}
        >
          {description}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          style={{
            width: '100%',
            padding: '0.65rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: accentColor,
            color: '#ffffff',
            fontSize: '0.825rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {ctaLabel}
        </button>

        <div
          onClick={onDismiss}
          style={{
            textAlign: 'center',
            fontSize: '0.67rem',
            color: '#94a3b8',
            marginTop: '0.625rem',
            cursor: 'pointer',
          }}
        >
          o pulsa en cualquier parte para cerrar
        </div>
      </div>
    </>,
    document.body
  );
}
