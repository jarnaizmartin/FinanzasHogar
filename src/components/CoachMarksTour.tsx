// ============================================================
// CoachMarksTour.tsx
// Tour secuencial para los iconos del header de FinanzasHogar
// Independiente de CoachMark.tsx (spotlights contextuales)
// ============================================================

import { useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Constante pública (usada en AppShell para reset) ────────
export const LS_KEY_TOUR = 'fh_header_tour_done';

// ─── Definición de pasos ─────────────────────────────────────
interface TourStep {
  attr: string; // valor de data-coachmark en el botón
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const STEPS: TourStep[] = [
  {
    attr: 'cm-security',
    emoji: '🔐',
    title: 'Seguridad',
    description:
      'Protege tus datos con contraseña o verificación en dos pasos (TOTP). Muy recomendado si compartes el dispositivo o quieres mayor tranquilidad.',
    color: '#f59e0b',
  },
  {
    attr: 'cm-backup',
    emoji: '💾',
    title: 'Copias de seguridad',
    description:
      'Tus datos viven en tu navegador. Descarga copias periódicas para no perderlos si limpias el historial o cambias de dispositivo.',
    color: '#8b5cf6',
  },
  {
    attr: 'cm-reset',
    emoji: '🗑️',
    title: 'Borrado selectivo',
    description:
      'Elimina solo los datos que necesites: cuentas, movimientos, proyecciones... Siempre puedes restaurar desde una copia de seguridad.',
    color: '#ef4444',
  },
  {
    attr: 'cm-darkmode',
    emoji: '🌙',
    title: 'Modo oscuro / claro',
    description:
      'Alterna entre tema claro y oscuro según tus preferencias o el entorno de luz donde uses la app.',
    color: '#6366f1',
  },
  {
    attr: 'cm-categories',
    emoji: '🏷️',
    title: 'Categorías',
    description:
      'Gestiona tus categorías de ingresos y gastos. Tenerlas bien definidas mejora la auto-categorización al importar extractos bancarios.',
    color: '#14b8a6',
  },
  {
    attr: 'cm-help',
    emoji: '❓',
    title: 'Centro de ayuda',
    description:
      'Manual completo, preguntas frecuentes, guía de primeros pasos y atajos de teclado. Siempre disponible cuando lo necesites.',
    color: '#a855f7',
  },
  {
    attr: 'cm-exit',
    emoji: '🚪',
    title: 'Salir',
    description:
      'Cierra la sesión de forma segura. Si llevas días sin hacer una copia de seguridad, te lo recordaremos antes de salir.',
    color: '#64748b',
  },
  {
    attr: 'cm-currency',
    emoji: '💱',
    title: 'Divisas y fechas',
    description:
      'Configura tu divisa base, la divisa de visualización, el formato de fechas y consulta los tipos de cambio en tiempo real.',
    color: '#2563eb',
  },
];

// ─── Constantes de layout ─────────────────────────────────────
const TOOLTIP_W = 300;
const SPOT_PAD = 7;
const TIP_GAP = 10;
const ARROW_HALF = 7;

// ─── Helpers ─────────────────────────────────────────────────

/** Marca el tour como completado en localStorage */
export function markTourDone() {
  localStorage.setItem(LS_KEY_TOUR, 'true');
}

/** Comprueba si el tour ya se ha visto */
export function isTourDone(): boolean {
  return localStorage.getItem(LS_KEY_TOUR) === 'true';
}

/** Reinicia el tour (para usar desde Ayuda o Reset) */
export function resetTour() {
  localStorage.removeItem(LS_KEY_TOUR);
}

// ─── Componente ───────────────────────────────────────────────

interface CoachMarksTourProps {
  onComplete: () => void;
}

export function CoachMarksTour({ onComplete }: CoachMarksTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // ── Encontrar el elemento del paso actual ─────────────────
  const resolveRect = useCallback((idx: number): DOMRect | null => {
    const el = document.querySelector<HTMLElement>(
      `[data-coachmark="${STEPS[idx].attr}"]`
    );
    return el ? el.getBoundingClientRect() : null;
  }, []);

  // ── Actualizar rect cuando cambia el paso ─────────────────
  useLayoutEffect(() => {
    setVisible(false);
    setRect(null);

    // Si el elemento no existe en el DOM (ej: botón de seguridad
    // ya configurada muestra iconos distintos), saltamos ese paso
    const found = resolveRect(stepIdx);
    if (!found) {
      // Saltar automáticamente en la dirección actual
      const next = stepIdx + direction;
      if (next >= STEPS.length) {
        handleComplete();
      } else if (next < 0) {
        setStepIdx(0);
      } else {
        setStepIdx(next);
      }
      return;
    }

    setRect(found);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [stepIdx]);

  // ── Recalcular si cambia el tamaño de la ventana ──────────
  useEffect(() => {
    const handler = () => {
      const found = resolveRect(stepIdx);
      if (found) setRect(found);
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, [stepIdx, resolveRect]);

  // ── Escape para cerrar ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Navegación ────────────────────────────────────────────
  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setVisible(false);
    setTimeout(() => {
      const next = stepIdx + dir;
      if (next >= STEPS.length) {
        handleComplete();
      } else if (next >= 0) {
        setStepIdx(next);
      }
    }, 150);
  };

  const handleComplete = () => {
    markTourDone();
    onComplete();
  };

  // ── Nada que mostrar todavía ──────────────────────────────
  if (!rect) return null;

  const step = STEPS[stepIdx];

  // ── Cálculo del spotlight ─────────────────────────────────
  const sx = rect.left - SPOT_PAD;
  const sy = rect.top - SPOT_PAD;
  const sw = rect.width + SPOT_PAD * 2;
  const sh = rect.height + SPOT_PAD * 2;

  // ── Cálculo del tooltip (por debajo del spotlight) ────────
  let tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  tooltipLeft = Math.max(
    12,
    Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 12)
  );
  const tooltipTop = sy + sh + TIP_GAP;

  // Posición de la flecha relativa al tooltip
  const arrowAbsX = rect.left + rect.width / 2;
  const arrowRelX = Math.max(
    ARROW_HALF + 8,
    Math.min(arrowAbsX - tooltipLeft, TOOLTIP_W - ARROW_HALF - 8)
  );

  // ── Render ────────────────────────────────────────────────
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}>
      {/* ── SVG spotlight con máscara ── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="cmt-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={sx}
              y={sy}
              width={sw}
              height={sh}
              rx="10"
              ry="10"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#cmt-mask)"
        />
      </svg>

      {/* ── Click en overlay = siguiente ── */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => navigate(1)}
      />

      {/* ── Anillo pulsante sobre el elemento ── */}
      <div
        style={{
          position: 'absolute',
          left: sx,
          top: sy,
          width: sw,
          height: sh,
          borderRadius: '10px',
          border: `2px solid ${step.color}`,
          boxShadow: `0 0 0 4px ${step.color}33`,
          pointerEvents: 'none',
          animation: 'cmtPulse 2s ease-in-out infinite',
        }}
      />

      {/* ── Tooltip ── */}
      <div
        style={{
          position: 'absolute',
          left: tooltipLeft,
          top: tooltipTop,
          width: TOOLTIP_W,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          zIndex: 9001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Flecha */}
        <div
          style={{
            position: 'absolute',
            top: -ARROW_HALF,
            left: arrowRelX - ARROW_HALF,
            width: 0,
            height: 0,
            borderLeft: `${ARROW_HALF}px solid transparent`,
            borderRight: `${ARROW_HALF}px solid transparent`,
            borderBottom: `${ARROW_HALF}px solid ${step.color}`,
            pointerEvents: 'none',
          }}
        />

        {/* Card */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: `1.5px solid ${step.color}55`,
            borderRadius: '1rem',
            padding: '1.125rem',
            boxShadow: `
              0 24px 60px rgba(0,0,0,0.65),
              0 0 0 1px ${step.color}18
            `,
          }}
        >
          {/* Progreso — dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '0.3rem',
                    width: i === stepIdx ? '1.25rem' : '0.3rem',
                    borderRadius: '9999px',
                    background:
                      i === stepIdx
                        ? step.color
                        : i < stepIdx
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {stepIdx + 1} / {STEPS.length}
            </span>
          </div>

          {/* Emoji + título */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.625rem',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: `${step.color}22`,
                border: `1px solid ${step.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              {step.emoji}
            </div>
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {step.title}
            </h3>
          </div>

          {/* Descripción */}
          <p
            style={{
              fontSize: '0.775rem',
              color: 'rgba(255,255,255,0.62)',
              lineHeight: 1.6,
              margin: '0 0 1rem',
            }}
          >
            {step.description}
          </p>

          {/* Controles */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {stepIdx > 0 && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
              >
                ← Atrás
              </button>
            )}

            <button
              onClick={() => navigate(1)}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: step.color,
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {stepIdx < STEPS.length - 1 ? 'Siguiente →' : '¡Listo! 🎉'}
            </button>

            {stepIdx < STEPS.length - 1 && (
              <button
                onClick={handleComplete}
                style={{
                  padding: '0.45rem 0.625rem',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.28)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Saltar
              </button>
            )}
          </div>

          {/* Hint */}
          <p
            style={{
              margin: '0.625rem 0 0',
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.18)',
              textAlign: 'center',
            }}
          >
            Pulsa en cualquier parte para avanzar · Esc para cerrar
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
