import { useState } from 'react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';

export function BackupReminderBanner({
  onOpenBackup,
}: {
  onOpenBackup: () => void;
}) {
  const {
    T,
    accounts,
    backupHistory,
    backupReminderDays,
    setBackupReminderDays,
    backupReminderDismissed,
    setBackupReminderDismissed,
    autoBackupDone,
    setAutoBackupDone,
    downloadBackup,
  } = useApp();
  const toast = useToast();
  const [showInfo] = useState(true);

  const lastBackupTimestamp = backupHistory[0]?.timestamp ?? 0;
  const daysSinceBackup =
    lastBackupTimestamp > 0
      ? Math.floor((Date.now() - lastBackupTimestamp) / (1000 * 60 * 60 * 24))
      : null;
  const daysSinceDismissed =
    backupReminderDismissed > 0
      ? Math.floor(
          (Date.now() - backupReminderDismissed) / (1000 * 60 * 60 * 24)
        )
      : null;
  const neverBackedUp = lastBackupTimestamp === 0;
  const backupIsOld =
    daysSinceBackup !== null && daysSinceBackup >= backupReminderDays;
  const recentlyDismissed =
    daysSinceDismissed !== null && daysSinceDismissed < backupReminderDays;

  if (accounts.length === 0) return null;

  const showPositive = autoBackupDone;
  const showAlert =
    !autoBackupDone && !recentlyDismissed && (neverBackedUp || backupIsOld);
  if (!showPositive && !showAlert) return null;

  const color = showPositive ? T.amber : T.red;
  const bgColor = showPositive ? T.amberBg : T.redBg;
  const border = showPositive ? T.amberBorder : T.redBorder;

  const title = showPositive
    ? '✅ Copia de seguridad automática creada'
    : neverBackedUp
    ? '⚠️ Aún no tienes ninguna copia de seguridad'
    : `⚠️ Han pasado ${daysSinceBackup} días desde tu última copia`;

  const subtitle = showPositive
    ? `Hemos guardado automáticamente una copia en el historial (${
        backupHistory[0]?.accountsCount ?? 0
      } cuentas · ${backupHistory[0]?.projectionsCount ?? 0} proyecciones · ${
        backupHistory[0]?.realExpensesCount ?? 0
      } movimientos · ${backupHistory[0]?.goalsCount ?? 0} objetivos).`
    : neverBackedUp
    ? 'Si algo falla en el navegador o cambias de dispositivo, perderías todos tus datos.'
    : 'El historial interno está guardado, pero te recomendamos tener también una copia en tu ordenador.';

  const handleClose = () => {
    if (showPositive) setAutoBackupDone(false);
    else setBackupReminderDismissed(Date.now());
  };

  return (
    <div
      style={{
        margin: '0 0 1.5rem',
        borderRadius: '1rem',
        background: bgColor,
        border: `1.5px solid ${border}`,
        overflow: 'hidden',
        animation: 'fadeSlideIn 0.4s ease both',
      }}
    >
      <div
        style={{
          padding: '0.875rem 1.125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '1.25rem',
            flexShrink: 0,
            display: 'inline-block',
            animation: !showPositive
              ? 'warnPulse 2s ease-in-out infinite'
              : 'none',
          }}
        >
          {showPositive ? '💾' : '🔴'}
        </span>
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color,
              marginBottom: '0.15rem',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color,
              opacity: 0.85,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>
        {!showPositive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                color,
                opacity: 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              Recordar cada:
            </span>
            <select
              value={backupReminderDays}
              onChange={(e) => setBackupReminderDays(Number(e.target.value))}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.5rem',
                border: `1px solid ${border}`,
                background: bgColor,
                color,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {backupHistory.length > 0 && (
            <button
              onClick={() => {
                downloadBackup(backupHistory[0]);
                toast('Copia descargada en tu ordenador', 'success');
                handleClose();
              }}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: color,
                color: '#ffffff',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⬇️ Descargar ahora
            </button>
          )}
          <button
            onClick={() => {
              onOpenBackup();
              handleClose();
            }}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: `1.5px solid ${border}`,
              background: 'transparent',
              color,
              fontSize: '0.775rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📂 Ver historial
          </button>
          <button
            onClick={handleClose}
            title="Cerrar este aviso"
            style={{
              padding: '0.5rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${border}`,
              background: 'transparent',
              color,
              fontSize: '0.8rem',
              cursor: 'pointer',
              opacity: 0.6,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {showInfo && (
        <div
          style={{
            padding: '0.875rem 1.25rem 1rem',
            borderTop: `1px solid ${border}`,
            background: showPositive
              ? 'rgba(217,119,6,0.06)'
              : 'rgba(220,38,38,0.06)',
            animation: 'fadeSlideIn 0.2s ease both',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color,
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: 'warnPulse 2s ease-in-out infinite',
              }}
            >
              ⚠️
            </span>
            ¿Por qué es importante descargar la copia a tu ordenador?
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '0.875rem',
            }}
          >
            {[
              {
                icon: '🧹',
                title: 'Limpieza del navegador',
                text: 'Si limpias el historial, cookies o caché del navegador, el historial de copias desaparecería para siempre.',
              },
              {
                icon: '💻',
                title: 'Cambio de dispositivo',
                text: 'Si cambias de ordenador o de navegador, los datos del historial interno NO se transfieren automáticamente.',
              },
              {
                icon: '💥',
                title: 'Fallo del dispositivo',
                text: 'Si el ordenador se estropea o el disco duro falla, perderías todo el historial junto con el resto de datos.',
              },
              {
                icon: '🔄',
                title: 'Actualización del navegador',
                text: 'En casos excepcionales, algunas actualizaciones de navegador pueden borrar el almacenamiento local.',
              },
            ].map((item) => (
              <div
                key={item.icon}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: bgColor,
                  border: `1px solid ${border}`,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      color,
                      marginBottom: '0.1rem',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color,
                      opacity: 0.8,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '0.75rem',
              background: color,
              color: '#ffffff',
              fontSize: '0.775rem',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Nuestra recomendación:</strong> Descarga la copia en tu
            ordenador y guárdala también en un lugar seguro como un USB, Google
            Drive o Dropbox. Así siempre tendrás un respaldo aunque falle
            cualquier cosa.
          </div>
        </div>
      )}
    </div>
  );
}
