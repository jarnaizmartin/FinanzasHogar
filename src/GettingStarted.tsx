// ============================================================
// GETTING STARTED — FinanzasHogar
// Guía de primeros pasos para nuevos usuarios
// ============================================================

import { useState } from 'react';
import { useApp } from './AppContext';

// ─── Tipos ───────────────────────────────────────────────────

interface Step {
  id: string;
  emoji: string;
  title: string;
  timeEstimate: string;
  color: string;
  description: string;
  tip: string;
  tipType: 'info' | 'warning' | 'success';
  substeps: string[];
  actionLabel: string;
  actionTab?: string;
  actionCallback?: 'security' | 'backup';
}

// ─── Pasos esenciales (alineados con Dashboard) ───────────────

const ESSENTIAL_STEPS: Step[] = [
  {
    id: 'accounts',
    emoji: '🏦',
    title: 'Crea tu primera cuenta',
    timeEstimate: '~2 min',
    color: '#2563eb',
    description:
      'Una cuenta representa cualquier lugar donde guardas dinero: tu banco principal, una cuenta de ahorro, efectivo, etc. La app calculará tu saldo real sumando automáticamente todos los movimientos que registres.',
    tip: 'La fecha del saldo es muy importante. Todos los movimientos con fecha posterior a ella se sumarán al saldo base para calcular tu saldo real. Los anteriores se consideran ya incluidos. Usa la fecha de hoy o la de tu último extracto bancario.',
    tipType: 'warning',
    substeps: [
      'Ve a la pestaña "Cuentas" en la barra de navegación',
      'Pulsa el botón azul "Nueva cuenta"',
      'Introduce el nombre (ej: "Cuenta corriente BBVA")',
      'Introduce el saldo actual y la fecha de hoy',
      'Selecciona la divisa de esa cuenta',
      'Opcionalmente, define un saldo mínimo de alerta',
      'Guarda la cuenta',
    ],
    actionLabel: 'Ir a Cuentas',
    actionTab: 'accounts',
  },
  {
    id: 'real',
    emoji: '🧾',
    title: 'Registra tus primeros movimientos',
    timeEstimate: '~5 min',
    color: '#dc2626',
    description:
      'Los movimientos reales son lo que realmente ha ocurrido: la compra del supermercado, el recibo de la luz, tu nómina recibida. Puedes introducirlos manualmente uno a uno, o importar directamente el extracto CSV de tu banco.',
    tip: 'La importación CSV es la forma más rápida. Descarga el extracto de tu banca online, pulsa "🏦 Importar CSV", selecciona tu banco y la app categoriza los movimientos automáticamente. Soporta Santander, BBVA, CaixaBank, ING, Revolut y Bankinter.',
    tipType: 'info',
    substeps: [
      'Ve a la pestaña "Gastos Reales"',
      'Opción A: Pulsa "🏦 Importar CSV" y sigue los pasos del importador',
      'Opción B: Pulsa "+ Nuevo movimiento" para añadir movimientos manualmente',
      'Asegúrate de asignar la categoría correcta a cada movimiento',
      'Revisa el Dashboard para ver el efecto en tu saldo real',
    ],
    actionLabel: 'Ir a Gastos Reales',
    actionTab: 'real',
  },
  {
    id: 'projections',
    emoji: '📈',
    title: 'Define tus proyecciones',
    timeEstimate: '~5 min',
    color: '#7c3aed',
    description:
      'Las proyecciones son tus ingresos y gastos recurrentes esperados: tu nómina, el alquiler, las suscripciones, los seguros... Una vez definidas, la app calcula automáticamente tu previsión financiera a 12 meses y te avisa cuando algo se desvía.',
    tip: 'Si tienes gastos fijos que se cobran automáticamente (Netflix, gimnasio...), activa la opción "Es un cargo fijo confirmado". Ese gasto se generará automáticamente en Gastos Reales cuando llegue su fecha, sin que tengas que introducirlo manualmente.',
    tipType: 'success',
    substeps: [
      'Ve a la pestaña "Proyecciones"',
      'Pulsa "Nueva proyección" y empieza por tu ingreso principal (nómina)',
      'Selecciona la cuenta, categoría, importe y frecuencia',
      'Añade también tus gastos fijos principales (alquiler, hipoteca)',
      'Añade suscripciones y otros gastos recurrentes',
      'Revisa la pestaña "Previsión" para ver el resultado a 12 meses',
    ],
    actionLabel: 'Ir a Proyecciones',
    actionTab: 'projections',
  },
  {
    id: 'goals',
    emoji: '🎯',
    title: 'Crea un objetivo de ahorro',
    timeEstimate: '~3 min',
    color: '#16a34a',
    description:
      'Define una meta financiera concreta: unas vacaciones, el fondo de emergencia, un coche, la entrada de una casa... La app hace el seguimiento automáticamente y te dice si vas por buen camino para llegar a tiempo.',
    tip: 'El modo Automático es muy potente: vincula el objetivo a una categoría de tus movimientos reales (por ejemplo, transferencias a tu cuenta de ahorro) y la app sumará el progreso sin que tengas que hacer nada.',
    tipType: 'success',
    substeps: [
      'Ve a la pestaña "Objetivos"',
      'Pulsa "+ Nuevo objetivo"',
      'Elige un emoji y color representativos',
      'Define el importe objetivo y la fecha límite (opcional)',
      'Elige entre modo Manual o Automático',
      'Guarda y observa tu progreso en tiempo real',
    ],
    actionLabel: 'Ir a Objetivos',
    actionTab: 'goals',
  },
];

// ─── Pasos recomendados ────────────────────────────────────────

const RECOMMENDED_STEPS: Step[] = [
  {
    id: 'categories',
    emoji: '🏷️',
    title: 'Revisa y personaliza tus categorías',
    timeEstimate: '~3 min',
    color: '#0d9488',
    description:
      'Las categorías organizan tus ingresos y gastos. La app incluye las más habituales (Salario, Alquiler, Alimentación, Transporte...) pero puedes añadir las tuyas propias. Tenerlas bien configuradas mejora la auto-categorización al importar extractos bancarios.',
    tip: 'Accede a las Categorías desde el icono de etiqueta 🏷️ en el header superior derecho. Puedes crear categorías de tipo "Ingreso" o "Gasto" con un color identificativo.',
    tipType: 'info',
    substeps: [
      'Haz clic en el icono 🏷️ del header para abrir Categorías',
      'Revisa las categorías de ingreso y gasto ya creadas',
      'Elimina las que no vayas a usar',
      'Añade las categorías que te falten para tu situación',
      'Asigna colores para identificarlas visualmente',
    ],
    actionLabel: 'Ir a Categorías',
    actionTab: 'categories',
  },
  {
    id: 'security',
    emoji: '🔐',
    title: 'Activa la seguridad',
    timeEstimate: '~3 min',
    color: '#f59e0b',
    description:
      'Protege tus datos financieros con contraseña o verificación en dos pasos (TOTP). Guarda las 12 palabras de recuperación en un lugar seguro — son la única forma de recuperar el acceso si olvidas tu contraseña.',
    tip: 'Descarga también el fichero de recuperación (.json) y guárdalo en un USB o en tu nube privada. Es un respaldo adicional a la frase de recuperación.',
    tipType: 'warning',
    substeps: [
      'Haz clic en el botón amarillo "Activar seguridad" del header',
      'Elige el método: contraseña clásica o verificación en 2 pasos',
      'Guarda las 12 palabras de recuperación en papel o un gestor',
      'Descarga el fichero de recuperación (.json)',
      'Opcionalmente, añade tu email de recuperación',
    ],
    actionLabel: 'Activar seguridad',
    actionCallback: 'security',
  },
  {
    id: 'backup',
    emoji: '💾',
    title: 'Haz tu primera copia de seguridad',
    timeEstimate: '~2 min',
    color: '#8b5cf6',
    description:
      'Tus datos se guardan únicamente en tu navegador. Si limpias el historial, cambias de dispositivo o el ordenador falla, los perderías. Una copia descargada en tu ordenador es tu seguro contra cualquier problema.',
    tip: 'Recomendamos descargar una copia física al menos una vez a la semana. Guárdala en Google Drive, Dropbox o un USB. La app también hace copias automáticas en el historial interno, pero solo la copia descargada sobrevive a una limpieza del navegador.',
    tipType: 'warning',
    substeps: [
      'Haz clic en el icono 📦 del header para abrir Copias de seguridad',
      'Pulsa "💾 Guardar y descargar"',
      'Guarda el fichero .json en un lugar seguro',
      'Configura la frecuencia de recordatorio (7, 14 o 30 días)',
    ],
    actionLabel: 'Abrir Copias de seguridad',
    actionCallback: 'backup',
  },
  {
    id: 'explore',
    emoji: '📊',
    title: 'Explora el Resumen y la Previsión',
    timeEstimate: '~2 min',
    color: '#0891b2',
    description:
      'Con tus primeros datos ya cargados, el Dashboard te mostrará tu patrimonio real, el balance del mes y la comparativa entre lo proyectado y lo real. La pestaña Previsión te mostrará la evolución de tu saldo a 12 meses.',
    tip: 'El Dashboard se actualiza en tiempo real cada vez que añades o modificas datos. Es tu punto de partida diario para tener el pulso de tus finanzas.',
    tipType: 'success',
    substeps: [
      'Ve a la pestaña "Resumen" (Dashboard)',
      'Revisa tu patrimonio total y el balance del mes',
      'Observa la comparativa Proyectado vs Real',
      'Ve a "Previsión" para ver la evolución a 12 meses',
      'Explora "Tendencias" si ya tienes varios meses de datos',
    ],
    actionLabel: 'Ir al Resumen',
    actionTab: 'dashboard',
  },
];

// ─── Props ────────────────────────────────────────────────────

interface GettingStartedProps {
  T: any;
  securityEnabled: boolean;
  onNavigate: (tab: string) => void;
  onNavigateKeepOpen: (tab: string) => void;
  onOpenSecurity: () => void;
  onOpenBackup: () => void;
  onClose: () => void;
}

// ─── Componente principal ─────────────────────────────────────

export function GettingStarted({
  T,
  securityEnabled,
  onNavigateKeepOpen,
  onOpenSecurity,
  onOpenBackup,
  onClose,
}: GettingStartedProps) {
  const { accounts, realExpenses, projections, goals, backupHistory } =
    useApp();

  const [expandedStep, setExpandedStep] = useState<string | null>('accounts');
  const [visitedSteps, setVisitedSteps] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fh_gs_visited') ?? '[]');
    } catch {
      return [];
    }
  });
  

  // ── Detección automática de pasos completados ──────────────────
  const completed: Record<string, boolean> = {
    accounts:    accounts.length > 0,
    real:        realExpenses.length > 0,
    projections: projections.length > 0,
    goals:       goals.length > 0,
    categories:  visitedSteps.includes('categories'), // ✅ completado al visitar
    security:    securityEnabled || visitedSteps.includes('security'),
    backup:      backupHistory.length > 0,
    explore:     accounts.length > 0 && realExpenses.length > 0,
  };
  
  const essentialDone = ESSENTIAL_STEPS.filter((s) => completed[s.id]).length;
  const recommendedDone = RECOMMENDED_STEPS.filter(
    (s) => completed[s.id]
  ).length;
  const totalDone = essentialDone + recommendedDone;
  const totalSteps = ESSENTIAL_STEPS.length + RECOMMENDED_STEPS.length;

  const handleAction = (step: Step) => {
    // ✅ Marcar como visitado al pulsar la acción
    if (!visitedSteps.includes(step.id)) {
      const updated = [...visitedSteps, step.id];
      setVisitedSteps(updated);
      localStorage.setItem('fh_gs_visited', JSON.stringify(updated));
    }
  
    if (step.actionTab) {
      onNavigateKeepOpen(step.actionTab);
    } else if (step.actionCallback === 'security') {
      onOpenSecurity();
      onClose();
    } else if (step.actionCallback === 'backup') {
      onOpenBackup();
      onClose();
    }
  };
  
  const tipColors = {
    info: { bg: T.accentLight, border: `${T.accent}33`, color: T.accent },
    warning: { bg: T.amberBg, border: T.amberBorder, color: T.amber },
    success: { bg: T.greenBg, border: T.greenBorder, color: T.green },
  };
  const tipIcons = { info: '💡', warning: '⚠️', success: '✅' };

  // ── Render de un paso individual ────────────────────────────────
  const renderStep = (step: Step, globalIndex: number) => {
    const isDone = completed[step.id];
    const isExpanded = expandedStep === step.id;
    const tipCfg = tipColors[step.tipType];

    return (
      <div
        key={step.id}
        style={{
          borderRadius: '1rem',
          border: `1.5px solid ${
            isDone
              ? T.greenBorder
              : isExpanded
              ? step.color + '66'
              : T.cardBorder
          }`,
          background: isDone
            ? T.greenBg
            : isExpanded
            ? step.color + '08'
            : T.pageBg,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Cabecera del paso */}
        <button
          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
          style={{
            width: '100%',
            padding: '1rem 1.125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {/* Icono */}
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: isDone
                ? T.green + '22'
                : isExpanded
                ? step.color + '22'
                : T.cardBg,
              border: `1.5px solid ${
                isDone
                  ? T.greenBorder
                  : isExpanded
                  ? step.color + '44'
                  : T.cardBorder
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isDone ? '1rem' : '1.25rem',
              fontWeight: 800,
              color: isDone ? T.green : undefined,
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {isDone ? '✓' : step.emoji}
          </div>

          {/* Texto */}
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
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: isDone ? T.green : step.color,
                  opacity: 0.8,
                }}
              >
                Paso {globalIndex + 1}
              </span>
              {isDone ? (
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.green + '22',
                    border: `1px solid ${T.greenBorder}`,
                    color: T.green,
                  }}
                >
                  ✓ Completado
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.pageBg,
                    border: `1px solid ${T.cardBorder}`,
                    color: T.muted,
                  }}
                >
                  {step.timeEstimate}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: isDone ? T.green : isExpanded ? step.color : T.title,
                textDecoration: isDone ? 'line-through' : 'none',
                opacity: isDone ? 0.7 : 1,
                transition: 'color 0.2s',
              }}
            >
              {step.title}
            </div>
          </div>

          {/* Chevron */}
          <div
            style={{
              fontSize: '0.75rem',
              color: isDone ? T.green : T.muted,
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              opacity: isDone ? 0.5 : 1,
            }}
          >
            ▼
          </div>
        </button>

        {/* Contenido expandido */}
        {isExpanded && (
          <div
            style={{
              padding: '0 1.125rem 1.125rem',
              animation: 'fadeSlideIn 0.2s ease both',
            }}
          >
            <div
              style={{
                height: '1px',
                background: isDone ? T.greenBorder : step.color + '22',
                marginBottom: '1rem',
              }}
            />

            {/* Descripción */}
            <p
              style={{
                fontSize: '0.825rem',
                color: T.body,
                lineHeight: 1.7,
                margin: '0 0 1rem',
              }}
            >
              {step.description}
            </p>

            {/* Tip */}
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: tipCfg.bg,
                border: `1px solid ${tipCfg.border}`,
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {tipIcons[step.tipType]}
              </span>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: tipCfg.color,
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {step.tip}
              </p>
            </div>

            {/* Cómo hacerlo */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: T.muted,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: '0.75rem',
                }}
              >
                Cómo hacerlo
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {step.substeps.map((substep, si) => (
                  <div
                    key={si}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                    }}
                  >
                    <div
                      style={{
                        width: '1.375rem',
                        height: '1.375rem',
                        borderRadius: '50%',
                        background: isDone ? T.green + '18' : step.color + '18',
                        border: `1.5px solid ${
                          isDone ? T.greenBorder : step.color + '44'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        color: isDone ? T.green : step.color,
                        flexShrink: 0,
                        marginTop: '0.1rem',
                      }}
                    >
                      {si + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: T.body,
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {substep}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de acción */}
            {!isDone ? (
              <button
                onClick={() => handleAction(step)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.875rem',
                  border: 'none',
                  background: step.color,
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {step.actionLabel} →
              </button>
            ) : (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.875rem',
                  background: T.greenBg,
                  border: `1px solid ${T.greenBorder}`,
                  textAlign: 'center',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: T.green,
                }}
              >
                ✅ Paso completado
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render de una sección (Esenciales / Recomendados) ──────────
  const renderSection = (
    label: string,
    badge: string,
    steps: Step[],
    startIndex: number,
    doneCount: number
  ) => (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: T.muted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              background: T.accentLight,
              color: T.accent,
              border: `1px solid ${T.accent}33`,
            }}
          >
            {badge}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: doneCount === steps.length ? T.green : T.muted,
          }}
        >
          {doneCount}/{steps.length} completados
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((step, i) => renderStep(step, startIndex + i))}
      </div>
    </div>
  );

  // ── Render principal ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero con barra de progreso global */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '1.25rem',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: '0.375rem',
          }}
        >
          Guía de primeros pasos
        </div>
        <div
          style={{
            fontSize: '0.825rem',
            color: '#93c5fd',
            lineHeight: 1.5,
            marginBottom: '0.875rem',
          }}
        >
          Sigue estos pasos para sacar el máximo partido a FinanzasHogar desde
          el primer día.
        </div>

        {/* Barra de progreso */}
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0.875rem',
            padding: '0.875rem 1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd' }}
            >
              Progreso total
            </span>
            <span
              style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}
            >
              {totalDone} de {totalSteps} pasos
            </span>
          </div>
          <div
            style={{
              height: '0.375rem',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(totalDone / totalSteps) * 100}%`,
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sección Esenciales */}
      {renderSection(
        '⚡ Esenciales',
        'Necesarios para empezar',
        ESSENTIAL_STEPS,
        0,
        essentialDone
      )}

      {/* Divisor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1, height: '1px', background: T.cardBorder }} />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted }}>
          RECOMENDADOS
        </span>
        <div style={{ flex: 1, height: '1px', background: T.cardBorder }} />
      </div>

      {/* Sección Recomendados */}
      {renderSection(
        '🌟 Recomendados',
        'Para sacar el máximo partido',
        RECOMMENDED_STEPS,
        ESSENTIAL_STEPS.length,
        recommendedDone
      )}

      {/* Footer motivacional */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          background: totalDone === totalSteps ? T.greenBg : T.pageBg,
          border: `1px solid ${
            totalDone === totalSteps ? T.greenBorder : T.cardBorder
          }`,
          textAlign: 'center',
        }}
      >
        {totalDone === totalSteps ? (
          <>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: T.green,
                marginBottom: '0.25rem',
              }}
            >
              ¡Has completado todos los pasos!
            </div>
            <div style={{ fontSize: '0.775rem', color: T.green, opacity: 0.8 }}>
              Tienes el control total de tus finanzas. ¡Sigue así!
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💪</div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: T.title,
                marginBottom: '0.25rem',
              }}
            >
              ¡Cuando completes estos pasos, tendrás el control total!
            </div>
            <div style={{ fontSize: '0.775rem', color: T.muted }}>
              Puedes volver a esta guía en cualquier momento desde el icono ❓
              del header.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
