// ─── WelcomeTour.tsx ─────────────────────────────────────────────────────────
// 🎬 Tour de bienvenida — FinanzasHogar v0.1
// Experiencia UX premium antes del onboarding
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type TourCard = {
  id: string;
  emoji: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  tipIcon: string;
  gradient: string;
  accentColor: string;
  features: { icon: string; text: string }[];
};

// ─── Cards del Tour ───────────────────────────────────────────────────────────
const TOUR_CARDS: TourCard[] = [
  {
    id: 'welcome',
    emoji: '🏦',
    tag: 'Bienvenido',
    title: 'Tu banca personal,\nbajo tu control total',
    subtitle: 'Sin servidores. Sin suscripciones. Sin límites.',
    description:
      'FinanzasHogar es tu app de finanzas personales. Todo se guarda en tu dispositivo — nadie más tiene acceso a tus datos. Tú eres el único dueño de tu información financiera.',
    tip: 'Tus datos nunca salen de tu dispositivo. Cero servidores, cero nubes ajenas.',
    tipIcon: '🔒',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%)',
    accentColor: '#60a5fa',
    features: [
      { icon: '🔒', text: 'Privacidad total — datos solo en tu dispositivo' },
      { icon: '⚡', text: 'Funciona sin conexión a internet' },
      { icon: '🌍', text: 'Soporte multidivisa con tipos de cambio reales' },
      { icon: '📱', text: 'Instalable como app en tu móvil u ordenador' },
    ],
  },
  {
    id: 'dashboard',
    emoji: '📊',
    tag: 'Resumen',
    title: 'Tu situación\nfinanciera de un vistazo',
    subtitle: 'Todo lo importante, en una sola pantalla.',
    description:
      'El Dashboard es tu centro de control. De un vistazo verás tu patrimonio total, el balance del mes, las alertas activas y la comparativa entre lo que tenías previsto y lo que realmente ha pasado.',
    tip: 'El saldo real se calcula automáticamente sumando tus movimientos registrados al saldo base que introduces tú.',
    tipIcon: '💡',
    gradient: 'linear-gradient(135deg, #0c1a4a 0%, #1e3a5f 40%, #0d4f8a 100%)',
    accentColor: '#38bdf8',
    features: [
      { icon: '💰', text: 'Patrimonio total y saldo real calculado' },
      { icon: '📈', text: 'Ingresos, gastos y balance neto del mes' },
      { icon: '⚖️', text: 'Proyectado vs real — comparativa automática' },
      { icon: '🎯', text: 'Estado de tus objetivos de ahorro' },
    ],
  },
  {
    id: 'accounts',
    emoji: '🏦',
    tag: 'Cuentas',
    title: 'Tu dinero,\nsiempre a la vista',
    subtitle: 'Saldo base + movimientos reales = saldo real.',
    description:
      'Registra tus cuentas bancarias, de ahorro o efectivo. Introduce el saldo en una fecha concreta y la app calculará automáticamente el saldo real sumando todos los movimientos posteriores que registres.',
    tip: 'Puedes tener cuentas en diferentes divisas. La app las convierte automáticamente a tu divisa base.',
    tipIcon: '💱',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #0d3b6e 40%, #065f46 100%)',
    accentColor: '#34d399',
    features: [
      { icon: '🏦', text: 'Múltiples cuentas en diferentes divisas' },
      {
        icon: '📅',
        text: 'Saldo base con fecha — tú controlas el punto de partida',
      },
      { icon: '⚡', text: 'Saldo real calculado automáticamente' },
      { icon: '⚠️', text: 'Alertas de saldo mínimo configurable' },
    ],
  },
  {
    id: 'projections',
    emoji: '📈',
    tag: 'Proyecciones',
    title: 'Planifica\ntu futuro financiero',
    subtitle: 'Define lo que esperas. La app hace el resto.',
    description:
      'Las proyecciones son tus ingresos y gastos recurrentes esperados: nómina, alquiler, suscripciones, seguros... Una vez definidos, la app genera automáticamente previsiones a 12 meses y te avisa cuando algo se desvía.',
    tip: 'Puedes marcar una proyección como "cargo fijo confirmado" y se generará automáticamente como gasto real cuando llegue su fecha.',
    tipIcon: '🔄',
    gradient: 'linear-gradient(135deg, #0c1a4a 0%, #2d1b69 40%, #4c1d95 100%)',
    accentColor: '#a78bfa',
    features: [
      { icon: '📆', text: 'Frecuencia: mensual, trimestral, anual...' },
      { icon: '🔄', text: 'Cargos automáticos — se generan solos' },
      { icon: '💶', text: 'Ajuste puntual para meses especiales' },
      { icon: '📊', text: 'Previsión a 12 meses por cuenta' },
    ],
  },
  {
    id: 'real',
    emoji: '🧾',
    tag: 'Gastos Reales',
    title: 'Lo que realmente\nha ocurrido',
    subtitle: 'Registra. Compara. Aprende.',
    description:
      'Aquí registras lo que realmente ha pasado: la compra del supermercado, el recibo de la luz, la nómina recibida. Puedes introducirlos a mano o importarlos directamente desde el CSV de tu banco.',
    tip: 'La importación bancaria reconoce automáticamente el banco (Santander, BBVA, CaixaBank, ING, Revolut, Bankinter) y categoriza los movimientos por palabras clave.',
    tipIcon: '🏦',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #7f1d1d 40%, #991b1b 100%)',
    accentColor: '#f87171',
    features: [
      { icon: '📥', text: 'Importación CSV de los principales bancos' },
      { icon: '🏷️', text: 'Categorización automática por palabras clave' },
      { icon: '🔍', text: 'Filtros avanzados por fecha, cuenta y categoría' },
      { icon: '⚠️', text: 'Detección automática de duplicados' },
    ],
  },
  {
    id: 'calendar',
    emoji: '📅',
    tag: 'Calendario',
    title: 'Tu mes\nde un vistazo',
    subtitle: 'Proyecciones y movimientos reales en el tiempo.',
    description:
      'El calendario muestra en cada día tanto las proyecciones pendientes como los movimientos reales registrados. Los puntos sólidos son reales ya ocurridos, los huecos son proyecciones pendientes.',
    tip: 'La vista anual te muestra los 12 meses de un vistazo, con indicadores de color para identificar rápidamente los meses de tensión financiera.',
    tipIcon: '📆',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #164e63 40%, #0e7490 100%)',
    accentColor: '#22d3ee',
    features: [
      { icon: '🔵', text: 'Puntos sólidos — movimientos reales registrados' },
      { icon: '⚪', text: 'Puntos huecos — proyecciones pendientes' },
      { icon: '📆', text: 'Vista anual con los 12 meses y balance neto' },
      { icon: '🎯', text: 'Indicadores de objetivos que vencen ese mes' },
    ],
  },
  {
    id: 'goals',
    emoji: '🎯',
    tag: 'Objetivos',
    title: 'Tus metas,\ntu ritmo',
    subtitle: 'Define. Sigue. Celebra.',
    description:
      'Define tus objetivos de ahorro con nombre, emoji, color e importe objetivo. En modo manual actualizas el progreso tú mismo. En modo automático la app suma directamente los movimientos reales que correspondan.',
    tip: 'El modo automático analiza tus últimos 3 meses para calcular tu ritmo actual de ahorro y predecir si llegarás a tiempo a tu objetivo.',
    tipIcon: '⚡',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #713f12 40%, #92400e 100%)',
    accentColor: '#fbbf24',
    features: [
      { icon: '✍️', text: 'Modo manual — tú controlas el progreso' },
      {
        icon: '⚡',
        text: 'Modo automático — vinculado a tus movimientos reales',
      },
      { icon: '📊', text: 'Ritmo actual y predicción de fecha de llegada' },
      {
        icon: '🎉',
        text: 'Alertas cuando un objetivo está en peligro o completado',
      },
    ],
  },
  {
    id: 'trends',
    emoji: '📉',
    tag: 'Tendencias',
    title: 'Aprende\nde tu historia',
    subtitle: 'Gráficos reales. Patrones reales. Decisiones mejores.',
    description:
      'La sección de tendencias analiza tus movimientos reales históricos y los presenta en gráficos claros: evolución del saldo, ingresos vs gastos mes a mes, tasa de ahorro y distribución por categorías.',
    tip: 'La tasa de ahorro saludable recomendada es del 20% de tus ingresos. La app te indica en todo momento si vas por buen camino.',
    tipIcon: '💪',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1a2e05 40%, #166534 100%)',
    accentColor: '#4ade80',
    features: [
      { icon: '📈', text: 'Ingresos vs gastos — comparativa mensual' },
      { icon: '💰', text: 'Tasa de ahorro real mes a mes' },
      { icon: '🏦', text: 'Evolución del saldo por cuenta' },
      { icon: '🏷️', text: 'Ranking de categorías de gasto' },
    ],
  },
  {
    id: 'reports',
    emoji: '📋',
    tag: 'Informes',
    title: 'Todo documentado,\ntodo exportable',
    subtitle: 'Informes profesionales con un clic.',
    description:
      'Genera informes completos por período: movimientos reales, estado de cuentas, proyecciones, objetivos y tendencias. Expórtalos en CSV para Excel o imprímelos directamente como PDF.',
    tip: 'Los informes se pueden filtrar por mes concreto o por un rango de meses personalizado, para tener exactamente el período que necesitas.',
    tipIcon: '📊',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1e1b4b 40%, #312e81 100%)',
    accentColor: '#818cf8',
    features: [
      { icon: '📊', text: 'Informes de movimientos, cuentas y proyecciones' },
      { icon: '⬇️', text: 'Exportación a CSV compatible con Excel' },
      { icon: '🖨️', text: 'Impresión directa como PDF' },
      { icon: '📅', text: 'Filtro por mes concreto o rango personalizado' },
    ],
  },
  {
    id: 'alerts',
    emoji: '🔔',
    tag: 'Alertas',
    title: 'Tu app\nte cuida',
    subtitle: 'Alertas inteligentes. Siempre proactiva.',
    description:
      'FinanzasHogar analiza continuamente tu situación y te avisa cuando algo merece tu atención: saldo bajo, presupuesto superado, objetivo en peligro, mes con balance negativo... Sin que tengas que buscar nada.',
    tip: 'Puedes descartar alertas puntualmente o ignorarlas permanentemente. La app nunca te molestará con lo que ya sabes.',
    tipIcon: '🧠',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #4c0519 40%, #881337 100%)',
    accentColor: '#fb7185',
    features: [
      { icon: '🔴', text: 'Alertas críticas — requieren acción inmediata' },
      { icon: '🟠', text: 'Advertencias — situaciones a vigilar' },
      { icon: '✅', text: 'Positivas — logros y objetivos alcanzados' },
      { icon: '🔕', text: 'Control total — descarta o ignora lo que quieras' },
    ],
  },
  {
    id: 'start',
    emoji: '🚀',
    tag: '¡Listo!',
    title: 'Empieza tu\nviaje financiero',
    subtitle: 'Configuración en menos de 2 minutos.',
    description:
      'Ahora que conoces todo lo que FinanzasHogar puede hacer por ti, es el momento de configurarla con tus datos. Solo necesitas el nombre de tu cuenta principal y su saldo actual para empezar.',
    tip: 'Todo lo que configures ahora lo podrás cambiar después. No te preocupes por hacerlo perfecto desde el principio.',
    tipIcon: '😊',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%)',
    accentColor: '#60a5fa',
    features: [
      { icon: '⏱️', text: 'Configuración inicial en menos de 2 minutos' },
      { icon: '🔧', text: 'Todo es editable después — sin presión' },
      { icon: '📦', text: 'También puedes explorar con datos de ejemplo' },
      { icon: '🔒', text: 'Puedes activar seguridad con contraseña o 2FA' },
    ],
  },
];

// ─── Estilos de animación ─────────────────────────────────────────────────────
const tourStyles = `
  @keyframes tourFadeIn {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes tourSlideLeft {
    from { opacity: 0; transform: translateX(60px);  }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes tourSlideRight {
    from { opacity: 0; transform: translateX(-60px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes tourPulse {
    0%, 100% { transform: scale(1);    opacity: 1;   }
    50%       { transform: scale(1.05); opacity: 0.8; }
  }
  @keyframes tourFloat {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-8px); }
  }
  @keyframes tourGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(96,165,250,0.3); }
    50%       { box-shadow: 0 0 40px rgba(96,165,250,0.6); }
  }
  @keyframes tourSparkle {
    0%   { transform: scale(0) rotate(0deg);   opacity: 0; }
    50%  { transform: scale(1) rotate(180deg); opacity: 1; }
    100% { transform: scale(0) rotate(360deg); opacity: 0; }
  }
  @keyframes progressFill {
    from { width: 0%; }
  }
  @keyframes dotBounce {
    0%, 100% { transform: translateY(0);    }
    50%       { transform: translateY(-4px); }
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [key, setKey] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);

  const card = TOUR_CARDS[currentIndex];
  const isLast = currentIndex === TOUR_CARDS.length - 1;
  const progress = ((currentIndex + 1) / TOUR_CARDS.length) * 100;

  // ── Inyectar estilos ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'tour-styles';
    el.textContent = tourStyles;
    document.head.appendChild(el);
    return () => document.getElementById('tour-styles')?.remove();
  }, []);

  // ── Sparkles en la última card ────────────────────────────────────────────
  useEffect(() => {
    if (isLast) {
      setShowSparkles(true);
      const t = setTimeout(() => setShowSparkles(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isLast]);

  // ── Navegación con teclado ────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (animating) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === 'Escape' && !isFirstTime) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, animating, isFirstTime]);

  // ── Navegar ───────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (newIndex: number, dir: 'left' | 'right') => {
      if (animating || newIndex < 0 || newIndex >= TOUR_CARDS.length) return;
      setAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setKey((k) => k + 1);
        setAnimating(false);
      }, 300);
    },
    [animating]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      navigate(currentIndex + 1, 'left');
    }
  }, [currentIndex, isLast, navigate, onComplete]);

  const handlePrev = useCallback(() => {
    navigate(currentIndex - 1, 'right');
  }, [currentIndex, navigate]);

  // ── Pantalla de checklist (post-tour) ─────────────────────────────────────
  if (showChecklist) {
    const checklistSteps = [
      { emoji: '🏦', title: 'Crea tu primera cuenta', time: '~2 min' },
      {
        emoji: '🏷️',
        title: 'Revisa y personaliza tus categorías',
        time: '~3 min',
      },
      { emoji: '📈', title: 'Define tus proyecciones', time: '~5 min' },
      {
        emoji: '🧾',
        title: 'Registra tus primeros movimientos',
        time: '~5 min',
      },
      { emoji: '🎯', title: 'Crea un objetivo de ahorro', time: '~3 min' },
      { emoji: '🔐', title: 'Activa la seguridad', time: '~3 min' },
      {
        emoji: '💾',
        title: 'Haz tu primera copia de seguridad',
        time: '~2 min',
      },
      {
        emoji: '📊',
        title: 'Explora el Resumen y la Previsión',
        time: '~2 min',
      },
    ];

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Partículas de fondo */}
        <BackgroundParticles color="#60a5fa" />

        {/* Card central */}
        <div
          style={{
            width: '100%',
            maxWidth: '36rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '2rem',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            animation: 'tourFadeIn 0.4s ease both',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              padding: '2rem 2rem 1.5rem',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '0.75rem',
                animation: 'tourFloat 3s ease-in-out infinite',
              }}
            >
              🚀
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                margin: '0 0 0.5rem',
              }}
            >
              ¡Tour completado!
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#93c5fd',
                margin: '0 0 0.875rem',
                lineHeight: 1.5,
              }}
            >
              Ahora te sugerimos seguir estos pasos en orden para empezar con
              buen pie.
            </p>

            {/* Tiempo total */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#93c5fd',
                  fontWeight: 700,
                }}
              >
                ⏱️ Tiempo total estimado: ~25 min
              </span>
            </div>
          </div>

          {/* Lista de pasos */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {checklistSteps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animation: `tourFadeIn 0.4s ease ${i * 0.06}s both`,
                  }}
                >
                  {/* Número */}
                  <div
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '50%',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1.5px solid rgba(96,165,250,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: '#60a5fa',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Emoji */}
                  <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>
                    {step.emoji}
                  </span>

                  {/* Título */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {step.title}
                  </span>

                  {/* Tiempo */}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {step.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Nota guía */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: 'rgba(96,165,250,0.08)',
                border: '1px solid rgba(96,165,250,0.2)',
                fontSize: '0.775rem',
                color: '#93c5fd',
                lineHeight: 1.5,
              }}
            >
              💡 Encontrarás la guía detallada de cada paso en el icono{' '}
              <strong style={{ color: '#60a5fa' }}>❓</strong> del header →{' '}
              <strong style={{ color: '#60a5fa' }}>
                Guía de primeros pasos
              </strong>
            </div>
          </div>

          {/* Botón principal */}
          <div style={{ padding: '0 1.5rem 2rem' }}>
            <button
              onClick={onComplete}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '1rem',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                animation: 'tourGlow 2s ease-in-out infinite',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow =
                  '0 12px 32px rgba(59,130,246,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(59,130,246,0.4)';
              }}
            >
              ¡Empezar con FinanzasHogar! →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: card.gradient,
        transition: 'background 0.6s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '1.5rem',
        paddingTop: '5rem',
        overflowY: 'auto',
        overflowX: 'hidden', 
      }}
    >
      {/* ── Partículas de fondo ── */}
      <BackgroundParticles color={card.accentColor} />

      {/* ── Sparkles en la última card ── */}
      {showSparkles && <Sparkles />}

      {/* ── Header: progreso + saltar ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
              fontSize: '1rem',
            }}
          >
            🏦
          </div>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.02em',
            }}
          >
            FinanzasHogar
          </span>
        </div>

        {/* Contador + Saltar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {currentIndex + 1} / {TOUR_CARDS.length}
          </span>

          {/* Botón Saltar — solo si NO es primera vez */}
          {!isFirstTime && (
            <button
              onClick={onComplete}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              Saltar tour ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Barra de progreso ── */}
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
            background: card.accentColor,
            width: `${progress}%`,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${card.accentColor}`,
          }}
        />
      </div>

      {/* ── Card principal ── */}
      <div
        key={key}
        style={{
          width: '100%',
          maxWidth: '52rem',
          animation: `${
            direction === 'left' ? 'tourSlideLeft' : 'tourSlideRight'
          } 0.4s cubic-bezier(0.4,0,0.2,1) both`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          marginTop: '1rem',
        }}
      >
        {/* Emoji flotante */}
        <div
          style={{
            fontSize: 'clamp(3rem, 10vw, 5rem)',
            lineHeight: 1,
            animation: 'tourFloat 3s ease-in-out infinite', 
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
          }}
        >
          {card.emoji}
        </div>

        {/* Tag */}
        <div
          style={{
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: `${card.accentColor}22`,
            border: `1px solid ${card.accentColor}55`,
            color: card.accentColor,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          {card.tag}
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: '0 0 0.75rem',
              whiteSpace: 'pre-line',
            }}
          >
            {card.title}
          </h1>
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              color: card.accentColor,
              fontWeight: 600,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {card.subtitle}
          </p>
        </div>

        {/* Descripción + Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))',
            gap: '1.25rem',
            width: '100%',  
          }}
        >
          {/* Descripción */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1.25rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <p
              style={{
                fontSize: '0.925rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {card.description}
            </p>

            {/* Tip destacado */}
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: `${card.accentColor}18`,
                border: `1px solid ${card.accentColor}44`,
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {card.tipIcon}
              </span>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: card.accentColor,
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {card.tip}
              </p>
            </div>
          </div>

          {/* Features */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1.25rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                marginBottom: '0.25rem',
              }}
            >
              Lo que incluye
            </div>
            {card.features.map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  animation: `tourFadeIn 0.4s ease ${i * 0.08}s both`,
                }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.5rem',
                    background: `${card.accentColor}18`,
                    border: `1px solid ${card.accentColor}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                >
                  {feature.icon}
                </div>
                <span
                  style={{
                    fontSize: '0.825rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Navegación ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {/* Botón anterior */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '1.25rem',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.3 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (currentIndex > 0)
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            ←
          </button>

          {/* Dots de navegación */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {TOUR_CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i, i > currentIndex ? 'left' : 'right')}
                style={{
                  width: i === currentIndex ? '1.75rem' : '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background:
                    i === currentIndex
                      ? card.accentColor
                      : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  padding: 0,
                  boxShadow:
                    i === currentIndex ? `0 0 8px ${card.accentColor}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Botón siguiente / CTA final */}
          <button
            onClick={handleNext}
            style={{
              padding: isLast ? '0.875rem 2rem' : '0.875rem 1.75rem',
              borderRadius: '9999px',
              border: 'none',
              background: isLast
                ? `linear-gradient(135deg, ${card.accentColor}, #3b82f6)`
                : card.accentColor,
              color: '#ffffff',
              fontSize: '0.925rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: `0 8px 24px ${card.accentColor}55`,
              transition: 'all 0.2s',
              animation: isLast ? 'tourGlow 2s ease-in-out infinite' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 12px 32px ${card.accentColor}77`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${card.accentColor}55`;
            }}
          >
            {isLast ? <>🚀 ¡Empezar ahora!</> : <>Siguiente →</>}
          </button>
        </div>

        {/* Hint teclado — solo en desktop */}
        <div
          style={{
            fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.25)',
            display: window.innerWidth < 640 ? 'none' : 'flex',
            gap: '0.75rem',
            alignItems: 'center',
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
      </div>
    </div>
  );
}

// ─── Partículas de fondo ──────────────────────────────────────────────────────
function BackgroundParticles({ color }: { color: string }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 4,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: color,
            opacity: Math.random() * 0.3 + 0.05,
            animation: `tourFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      {/* Círculos decorativos grandes */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '40rem',
          height: '40rem',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '35rem',
          height: '35rem',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── Sparkles (última card) ───────────────────────────────────────────────────
function Sparkles() {
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 1.5,
    size: Math.random() * 1.5 + 0.75,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {sparkles.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}rem`,
            animation: `tourSparkle 1.5s ease ${s.delay}s both`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}
