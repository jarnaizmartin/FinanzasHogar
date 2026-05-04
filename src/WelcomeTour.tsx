// ─── WelcomeTour.tsx ─────────────────────────────────────────────────────────
// 🎬 Tour de bienvenida — FinanzasHogar
// 4 cards emocionales · ~30 segundos · sin listas de features
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type TourCard = {
  id: string;
  emoji: string;
  eyebrow: string;
  title: string;
  description: string;
  gradient: string;
  accentColor: string;
  ctaLabel?: string;
};

// ─── 4 Cards emocionales ─────────────────────────────────────────────────────
const TOUR_CARDS: TourCard[] = [
  {
    id: 'problem',
    emoji: '😰',
    eyebrow: 'La pregunta del millón',
    title: '¿Sabes realmente\ncuánto tienes?',
    description:
      'La mayoría de personas no lo sabe con exactitud. Creen que sí, pero no. FinanzasHogar te lo dice en tiempo real, siempre, sin que tengas que calcular nada.',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    accentColor: '#60a5fa',
  },
  {
    id: 'privacy',
    emoji: '🔒',
    eyebrow: 'Lo que nos hace diferentes',
    title: 'Solo tuyo.\nPara siempre.',
    description:
      'Tus datos viven únicamente en tu dispositivo. Sin servidores. Sin suscripciones. Sin que nadie vea tu dinero. Ni nosotros.',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #065f46 50%, #047857 100%)',
    accentColor: '#34d399',
  },
  {
    id: 'superpower',
    emoji: '🔮',
    eyebrow: 'Tu superpoder financiero',
    title: 'Anticipa el mes\nantes de que llegue.',
    description:
      'Define tu nómina y tus gastos fijos una vez. La app te avisa cuando algo se tuerce antes de que ocurra. Como tener un contable en el bolsillo.',
    gradient: 'linear-gradient(135deg, #0c1a4a 0%, #2d1b69 50%, #4c1d95 100%)',
    accentColor: '#a78bfa',
  },
  {
    id: 'start',
    emoji: '🚀',
    eyebrow: 'Ya casi estás',
    title: '2 minutos.\nEso es todo.',
    description:
      'Solo necesitas decirle cuánto tienes ahora mismo. El resto lo descubres usando la app — que para eso está.',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    accentColor: '#60a5fa',
    ctaLabel: '¡Lo quiero! →',
  },
];

// ─── Partículas fijas (fuera del componente para evitar Math.random en render) ─
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  size: (i % 3) + 1.5,
  duration: (i % 4) + 5,
  delay: (i % 3) * 1.2,
}));

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes twFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes twSlideL {
    from { opacity: 0; transform: translateX(56px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes twSlideR {
    from { opacity: 0; transform: translateX(-56px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes twFloat {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-10px); }
  }
  @keyframes twGlow {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  @keyframes twPop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08); }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes twPulse {
    0%, 100% { transform: scale(1);    }
    50%       { transform: scale(1.04); }
  }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export function WelcomeTour({
  onComplete,
  isFirstTime = true,
}: {
  onComplete: () => void;
  isFirstTime?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [animKey, setAnimKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Touch/swipe ────────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);

  const card = TOUR_CARDS[index];
  const isLast = index === TOUR_CARDS.length - 1;
  const progress = (index + 1) / TOUR_CARDS.length;

  // ✅ FIX — window.innerWidth con hook reactivo
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Navegación ─────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (newIndex: number, dir: 'left' | 'right') => {
      if (busy || newIndex < 0 || newIndex >= TOUR_CARDS.length) return;
      setBusy(true);
      setDirection(dir);
      setTimeout(() => {
        setIndex(newIndex);
        setAnimKey((k) => k + 1);
        setBusy(false);
      }, 280);
    },
    [busy]
  );

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    navigate(index + 1, 'left');
  }, [index, isLast, navigate, onComplete]);

  const goPrev = useCallback(
    () => navigate(index - 1, 'right'),
    [index, navigate]
  );

  // Teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (busy) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'Escape' && !isFirstTime) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [busy, goNext, goPrev, isFirstTime, onComplete]);

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  const animName = direction === 'left' ? 'twSlideL' : 'twSlideR';

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: card.gradient,
        transition: 'background 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Partículas de fondo ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: card.accentColor,
              opacity: 0.12,
              animation: `twFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              transition: 'background 0.5s ease',
            }}
          />
        ))}
        {/* Blob decorativo */}
        <div
          style={{
            position: 'absolute',
            top: '-25%',
            right: '-15%',
            width: '45rem',
            height: '45rem',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${card.accentColor}0A 0%, transparent 70%)`,
            animation: 'twGlow 4s ease-in-out infinite',
            transition: 'background 0.5s ease',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Barra de progreso (top) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: card.accentColor,
            boxShadow: `0 0 8px ${card.accentColor}`,
            transition:
              'width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
          }}
        />
      </div>

      {/* ── Header: logo + saltar ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '1.875rem',
              height: '1.875rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
            }}
          >
            🏦
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.02em',
            }}
          >
            FinanzasHogar
          </span>
        </div>

        {/* Saltar — solo si no es primera vez */}
        {!isFirstTime && (
          <button
            onClick={onComplete}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            Saltar ✕
          </button>
        )}
      </div>

      {/* ── Card principal ── */}
      <div
        key={animKey}
        style={{
          width: '100%',
          maxWidth: '28rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem',
          textAlign: 'center',
          animation: `${animName} 0.35s cubic-bezier(0.4,0,0.2,1) both`,
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: 'clamp(4rem, 14vw, 6rem)',
            lineHeight: 1,
            animation: 'twFloat 3.5s ease-in-out infinite',
            filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))',
          }}
        >
          {card.emoji}
        </div>

        {/* Eyebrow */}
        <div
          style={{
            padding: '0.45rem 1.25rem',
            borderRadius: '9999px',
            background: `${card.accentColor}25`,
            border: `1.5px solid ${card.accentColor}55`,
            color: card.accentColor,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            animation: 'twFadeUp 0.4s ease 0.05s both',
          }}
        >
          {card.eyebrow}
        </div>

        {/* Título */}
        <h1
          style={{
            fontSize: 'clamp(1.875rem, 6vw, 2.75rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: 0,
            whiteSpace: 'pre-line',
            animation: 'twFadeUp 0.4s ease 0.1s both',
          }}
        >
          {card.title}
        </h1>

        {/* Descripción */}
        <p
          style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.65,
            margin: 0,
            maxWidth: '22rem',
            animation: 'twFadeUp 0.4s ease 0.15s both',
          }}
        >
          {card.description}
        </p>

        {/* Botón CTA */}
        <button
          onClick={goNext}
          style={{
            padding: isLast ? '1rem 2.5rem' : '0.875rem 2rem',
            borderRadius: '9999px',
            border: 'none',
            background: isLast
              ? `linear-gradient(135deg, ${card.accentColor}, #3b82f6)`
              : card.accentColor,
            color: '#ffffff',
            fontSize: isLast ? '1.05rem' : '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: `0 8px 28px ${card.accentColor}55`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: isLast
              ? 'twPulse 2s ease-in-out infinite'
              : 'twFadeUp 0.4s ease 0.2s both',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = `0 12px 36px ${card.accentColor}77`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 8px 28px ${card.accentColor}55`;
          }}
        >
          {card.ctaLabel ?? 'Siguiente →'}
        </button>

        {/* Dots de navegación */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            animation: 'twFadeUp 0.4s ease 0.25s both',
          }}
        >
          {TOUR_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => !busy && navigate(i, i > index ? 'left' : 'right')}
              aria-label={`Ir a la pantalla ${i + 1}`}
              style={{
                width: i === index ? '1.75rem' : '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                border: 'none',
                background:
                  i === index ? card.accentColor : 'rgba(255,255,255,0.28)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: i === index ? `0 0 8px ${card.accentColor}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Hint teclado — solo desktop */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.22)',
              fontWeight: 600,
              animation: 'twFadeUp 0.4s ease 0.3s both',
            }}
          >
            <span>← → Navegar</span>
            <span>·</span>
            <span>Espacio Siguiente</span>
            {!isFirstTime && (
              <>
                <span>·</span>
                <span>Esc Salir</span>
              </>
            )}
          </div>
        )}

        {/* Hint swipe — solo mobile */}
        {isMobile && (
          <div
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.22)',
              fontWeight: 600,
              animation: 'twFadeUp 0.4s ease 0.3s both',
            }}
          >
            Desliza para navegar
          </div>
        )}
      </div>
    </div>
  );
}
