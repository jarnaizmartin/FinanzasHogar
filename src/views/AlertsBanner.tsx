import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';

export function AlertsBanner() {
  const { T, computedAlerts, setIgnoredAlerts, setTab } = useApp();

  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);

  const activeAlerts = computedAlerts.filter((a) => !dismissed.includes(a.id));

  const sorted = useMemo(
    () =>
      [...activeAlerts].sort((a, b) => {
        const order = { critical: 0, warning: 1, positive: 2 };
        return order[a.severity] - order[b.severity];
      }),
    [activeAlerts]
  );

  const visible = useMemo(() => sorted.slice(0, 3), [sorted]);
  const hidden = useMemo(() => sorted.slice(3), [sorted]);

  if (activeAlerts.length === 0) return null;

  const topSeverity = sorted[0]?.severity ?? 'positive';

  const bannerConfig = {
    critical: {
      bg: T.redBg,
      border: T.redBorder,
      color: T.red,
      headerBg: T.red + '18',
      icon: '🔴',
    },
    warning: {
      bg: T.amberBg,
      border: T.amberBorder,
      color: T.amber,
      headerBg: T.amber + '18',
      icon: '🟠',
    },
    positive: {
      bg: T.greenBg,
      border: T.greenBorder,
      color: T.green,
      headerBg: T.green + '18',
      icon: '✅',
    },
  };

  const severityConfig = {
    critical: {
      color: T.red,
      bg: T.redBg,
      border: T.redBorder,
      badgeBg: T.red,
    },
    warning: {
      color: T.amber,
      bg: T.amberBg,
      border: T.amberBorder,
      badgeBg: T.amber,
    },
    positive: {
      color: T.green,
      bg: T.greenBg,
      border: T.greenBorder,
      badgeBg: T.green,
    },
  };

  const typeIcon: Record<string, string> = {
    balance_critical: '🏦',
    balance_risk: '⚠️',
    budget_exceeded: '📉',
    goal_at_risk: '🎯',
    month_negative: '💸',
    goal_overdue: '📅',
    goal_completed: '🎉',
  };

  const cfg = bannerConfig[topSeverity];

  const dismissOne = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    setDismissed(activeAlerts.map((a) => a.id));
  };

  const ignoreAlways = (id: string) => {
    setIgnoredAlerts((prev) => [...prev, id]);
    setDismissed((prev) => [...prev, id]);
  };

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        overflow: 'hidden',
        marginBottom: '0',
        animation: 'fadeSlideIn 0.3s ease both',
      }}
    >
      {/* ── Cabecera del banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          background: cfg.headerBg,
          borderBottom: expanded ? `1px solid ${cfg.border}` : 'none',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span
            style={{
              fontSize: '1rem',
              display: 'inline-block',
              animation:
                topSeverity === 'critical'
                  ? 'warnPulse 2s ease-in-out infinite'
                  : 'none',
            }}
          >
            {cfg.icon}
          </span>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: cfg.color,
              }}
            >
              {activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''}{' '}
              activa{activeAlerts.length !== 1 ? 's' : ''}
            </div>
            <div
              style={{ fontSize: '0.72rem', color: cfg.color, opacity: 0.8 }}
            >
              {sorted.filter((a) => a.severity === 'critical').length > 0 && (
                <span style={{ marginRight: '0.5rem' }}>
                  🔴 {sorted.filter((a) => a.severity === 'critical').length}{' '}
                  crítica
                  {sorted.filter((a) => a.severity === 'critical').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
              {sorted.filter((a) => a.severity === 'warning').length > 0 && (
                <span style={{ marginRight: '0.5rem' }}>
                  🟠 {sorted.filter((a) => a.severity === 'warning').length}{' '}
                  advertencia
                  {sorted.filter((a) => a.severity === 'warning').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
              {sorted.filter((a) => a.severity === 'positive').length > 0 && (
                <span>
                  ✅ {sorted.filter((a) => a.severity === 'positive').length}{' '}
                  positiva
                  {sorted.filter((a) => a.severity === 'positive').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de cabecera */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setTab('alerts')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ver todas →
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? 'Colapsar' : 'Expandir'}
            style={{
              padding: '0.4rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={dismissAll}
            title="Descartar todas hasta la próxima sesión"
            style={{
              padding: '0.4rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Lista de alertas ── */}
      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeSlideIn 0.2s ease both',
          }}
        >
          {visible.map((alert, i) => {
            const aCfg = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom:
                    i < visible.length - 1 || hidden.length > 0
                      ? `1px solid ${cfg.border}`
                      : 'none',
                  background: i % 2 === 0 ? 'transparent' : aCfg.color + '06',
                }}
              >
                {/* Icono */}
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.625rem',
                    background: aCfg.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {typeIcon[alert.type] ?? cfg.icon}
                </div>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: T.title,
                      marginBottom: '0.15rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: aCfg.color,
                      lineHeight: 1.4,
                      opacity: 0.9,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {alert.message}
                  </div>
                </div>

                {/* Acciones */}
                <div
                  style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}
                >
                  {alert.actionTab && (
                    <button
                      onClick={() => setTab(alert.actionTab!)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: aCfg.color,
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alert.actionLabel ?? 'Ver →'}
                    </button>
                  )}
                  <button
                    onClick={() => ignoreAlways(alert.id)}
                    title="No volver a mostrar"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.625rem',
                      border: `1px solid ${aCfg.border}`,
                      background: 'transparent',
                      color: aCfg.color,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    🚫
                  </button>
                  <button
                    onClick={() => dismissOne(alert.id)}
                    title="Descartar hasta la próxima sesión"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.625rem',
                      border: `1px solid ${aCfg.border}`,
                      background: 'transparent',
                      color: aCfg.color,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {/* ── Alertas ocultas ── */}
          {hidden.length > 0 && (
            <div
              style={{
                padding: '0.625rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: cfg.color + '08',
              }}
            >
              <span
                style={{
                  fontSize: '0.775rem',
                  color: cfg.color,
                  fontWeight: 600,
                }}
              >
                +{hidden.length} alerta{hidden.length !== 1 ? 's' : ''} más
              </span>
              <button
                onClick={() => setTab('alerts')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${cfg.border}`,
                  background: 'transparent',
                  color: cfg.color,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ver todas →
              </button>
            </div>
          )}

          {/* ── Leyenda ── */}
          <div
            style={{
              padding: '0.625rem 1.25rem',
              borderTop: `1px solid ${cfg.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: cfg.color + '06',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{ fontSize: '0.68rem', color: cfg.color, opacity: 0.75 }}
            >
              🚫 Ignorar siempre · ✕ Descartar hasta la próxima sesión
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
