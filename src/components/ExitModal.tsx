import { createPortal } from 'react-dom';

interface ExitModalProps {
  T: any;
  backupHistory: any[];
  createBackup: (label: string) => any;
  downloadBackup: (entry: any) => void;
  onClose: () => void;
}

export function ExitModal({
  T,
  backupHistory,
  createBackup,
  downloadBackup,
  onClose,
}: ExitModalProps) {
  const lastDownload = backupHistory[0]?.timestamp ?? 0;
  const daysSince =
    lastDownload > 0
      ? Math.floor((Date.now() - lastDownload) / (1000 * 60 * 60 * 24))
      : null;
  const hasRecentDownload = daysSince !== null && daysSince < 1;

  const handleExitWithoutDownload = () => {
    // ✅ Siempre crea backup interno al salir, aunque no descargue fichero
    createBackup('Automática al salir');
    window.close();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '1.5rem',
          boxShadow: T.cardShadowLg,
          width: '100%',
          maxWidth: '28rem',
          padding: '1.75rem',
          animation: 'fadeSlideIn 0.2s ease both',
        }}
      >
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            fontSize: '1.5rem',
          }}
        >
          👋
        </div>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          ¿Salir de FinanzasHogar?
        </h3>

        {!hasRecentDownload && (
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background:
                daysSince === null || daysSince >= 7 ? T.redBg : T.amberBg,
              border: `1px solid ${
                daysSince === null || daysSince >= 7
                  ? T.redBorder
                  : T.amberBorder
              }`,
              fontSize: '0.825rem',
              color: daysSince === null || daysSince >= 7 ? T.red : T.amber,
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            {daysSince === null
              ? '⚠️ Nunca has descargado una copia de seguridad. Te recomendamos guardar una antes de salir.'
              : daysSince >= 7
              ? `⚠️ Han pasado ${daysSince} días desde tu última copia. Te recomendamos descargar una antes de salir.`
              : `💡 Tu última copia fue hace ${daysSince} día${
                  daysSince !== 1 ? 's' : ''
                }.`}
          </div>
        )}
        {hasRecentDownload && (
          <p
            style={{
              fontSize: '0.825rem',
              color: T.muted,
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            ✅ Tu copia de seguridad está al día. Hasta pronto.
          </p>
        )}

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
        >
          {!hasRecentDownload && (
            <button
              onClick={() => {
                const entry = createBackup('Copia antes de salir');
                downloadBackup(entry);
                setTimeout(() => window.close(), 300);
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: T.accent,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              💾 Descargar copia y salir
            </button>
          )}
          <button
            onClick={handleExitWithoutDownload}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.875rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.btnSecBg,
              color: T.btnSecText,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Salir sin descargar
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '0.875rem',
              border: 'none',
              background: 'transparent',
              color: T.muted,
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar — seguir usando la app
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
