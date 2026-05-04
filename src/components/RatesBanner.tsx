import { useState } from 'react';

interface RatesBannerProps {
  ratesStatus: 'fresh' | 'stale' | 'error' | 'loading';
  ratesAgeText: string;
  onRefresh: () => void;
  T: Record<string, string>;
}

// ✅ FIX 16 — Feedback visual claro cuando las APIs de tipos de cambio fallan.
// Sin esto el usuario no sabe si los importes están actualizados o no.
export function RatesBanner({
  ratesStatus,
  ratesAgeText,
  onRefresh,
  T,
}: RatesBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Solo muestra banner si hay problema Y el usuario no lo ha cerrado
  if (ratesStatus === 'fresh' || ratesStatus === 'loading' || dismissed)
    return null;

  const isError = ratesStatus === 'error';
  const isStale = ratesStatus === 'stale';

  const bgColor = isError ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)';
  const borderColor = isError ? 'rgba(220,38,38,0.35)' : 'rgba(217,119,6,0.35)';
  const textColor = isError ? '#fca5a5' : '#fcd34d';
  const icon = isError ? '🔴' : '🟡';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 1rem',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>

      <p
        style={{
          flex: 1,
          fontSize: '0.8rem',
          color: textColor,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {isError
          ? 'No se pudieron actualizar los tipos de cambio. Se están usando valores aproximados.'
          : `Tipos de cambio desactualizados (${ratesAgeText}). Las conversiones pueden no ser exactas.`}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={onRefresh}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '0.5rem',
            border: `1px solid ${borderColor}`,
            background: 'transparent',
            color: textColor,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Actualizar
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '0.3rem 0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'transparent',
            color: textColor,
            fontSize: '0.85rem',
            cursor: 'pointer',
            opacity: 0.7,
          }}
          aria-label="Cerrar aviso"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
