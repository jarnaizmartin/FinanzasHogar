import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from './AppContext';
import { useToast } from './contexts/ToastContext';
import { ConfirmModal } from './components/UI';

type BackupEntry = {
  id: string;
  timestamp: number;
  label: string;
  accountsCount: number;
  categoriesCount: number;
  projectionsCount: number;
  realExpensesCount: number;
  goalsCount: number;
  data: {
    accounts: any[];
    categories: any[];
    projections: any[];
    realExpenses: any[];
    goals: any[];
    bankFormats: any[];
    categoryRules: any[];
    baseCurrency: string;
    displayCurrency: string;
    dark: boolean;
    licenseState?: any;
  };
};

const uid = () => crypto.randomUUID();

export function BackupPanel({ onClose }: { onClose: () => void }) {
  const {
    T,
    backupHistory,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
  } = useApp();

  const toast = useToast();

  const [confirmRestore, setConfirmRestore] = useState<BackupEntry | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [downloadPreRestore, setDownloadPreRestore] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<BackupEntry | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (confirmRestore || confirmDelete) {
      const allScrollables = document.querySelectorAll('[style*="overflow"]');
      allScrollables.forEach((el) => {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = 0;
        }
      });
    }
  }, [confirmRestore, confirmDelete]);

  const handleCreateBackup = () => {
    const entry = createBackup('Copia manual');
    downloadBackup(entry);
    toast('Copia de seguridad creada y descargada', 'success');
  };

  const handleCreateOnly = () => {
    createBackup('Copia manual');
    toast('Copia de seguridad guardada en el historial', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.app !== 'FinanzasHogar') {
          setImportError('El fichero no es un backup de FinanzasHogar válido.');
          return;
        }
        if (!parsed.data || !parsed.data.accounts) {
          setImportError('El fichero de backup no contiene datos válidos.');
          return;
        }
        const entry: BackupEntry = {
          id: parsed.id ?? uid(),
          timestamp: parsed.timestamp ?? Date.now(),
          label: parsed.label ?? 'Importado desde fichero',
          accountsCount: parsed.data.accounts?.length ?? 0,
          categoriesCount: parsed.data.categories?.length ?? 0,
          projectionsCount: parsed.data.projections?.length ?? 0,
          realExpensesCount: parsed.data.realExpenses?.length ?? 0,
          goalsCount: parsed.data.goals?.length ?? 0,
          data: {
            accounts: parsed.data.accounts ?? [],
            categories: parsed.data.categories ?? [],
            projections: parsed.data.projections ?? [],
            realExpenses: parsed.data.realExpenses ?? [],
            goals: parsed.data.goals ?? [],
            bankFormats: parsed.data.bankFormats ?? [],
            categoryRules: parsed.data.categoryRules ?? [],
            baseCurrency: parsed.data.baseCurrency ?? 'EUR',
            displayCurrency: parsed.data.displayCurrency ?? 'EUR',
            dark: parsed.data.dark ?? false,
          },
        };
        setImportPreview(entry);
        setImportError(null);
      } catch {
        setImportError(
          'No se pudo leer el fichero. Asegúrate de que es un .json válido.'
        );
      }
    };

    reader.onerror = () => setImportError('No se pudo leer el fichero.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const fmtTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeSince = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  };

  // ── Modal component inline ────────────────────────────────────────────────
  const Modal = ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: '4.5rem',
        paddingBottom: '1rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '1.5rem',
          boxShadow: T.cardShadowLg,
          width: '100%',
          maxWidth: '34rem',
          maxHeight: 'calc(100vh - 5.5rem)',
          overflowY: 'auto',
          animation: 'fadeSlideIn 0.2s ease both',
        }}
      >
        <div
          style={{
            padding: '1rem 1.5rem 0.75rem',
            borderBottom: `1px solid ${T.cardBorder}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: T.title,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: T.muted,
                  marginTop: '0.25rem',
                }}
              >
                {subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '0.4rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: T.btnSecBg,
                color: T.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );

  return (
    <Modal
      title="💾 Copias de seguridad"
      subtitle="Guarda y restaura tus datos de forma segura"
    >
      {/* ── Acciones principales ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={handleCreateBackup}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.accent}33`,
            background: T.accentLight,
            color: T.accent,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>💾</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.accent }}
          >
            Guardar y descargar
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Guarda en el historial y descarga un fichero en tu ordenador
          </div>
        </button>

        <button
          onClick={handleCreateOnly}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.cardBorder}`,
            background: T.pageBg,
            color: T.body,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🕐</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
          >
            Solo guardar snapshot
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Guarda una copia en el historial sin descargar ningún fichero
          </div>
        </button>

        <button
          onClick={() => {
            setShowImport(true);
            setImportPreview(null);
            setImportError(null);
          }}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.greenBorder}`,
            background: T.greenBg,
            color: T.green,
            cursor: 'pointer',
            textAlign: 'left',
            gridColumn: '1 / -1',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📂</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.green }}
          >
            Importar copia desde fichero
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Restaura los datos desde un fichero .json descargado anteriormente
          </div>
        </button>
      </div>

      {/* ── Sección importar desde fichero ── */}
      {showImport && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: T.body,
              marginBottom: '0.75rem',
            }}
          >
            📂 Selecciona el fichero de backup (.json)
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.inputBorder}`,
              background: T.inputBg,
              color: T.inputText,
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              marginBottom: '0.75rem',
            }}
          >
            🗂️ Elegir fichero...
          </button>

          {importError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
                fontSize: '0.775rem',
                color: T.red,
                marginBottom: '0.75rem',
              }}
            >
              ⛔ {importError}
            </div>
          )}

          {importPreview && (
            <div>
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.875rem',
                  background: T.cardBg,
                  border: `1px solid ${T.greenBorder}`,
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: T.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.625rem',
                  }}
                >
                  ✅ Fichero válido — Vista previa del contenido
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: T.muted,
                    marginBottom: '0.5rem',
                  }}
                >
                  📅 Fecha de la copia:{' '}
                  <strong style={{ color: T.body }}>
                    {fmtTimestamp(importPreview.timestamp)}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.4rem',
                  }}
                >
                  {[
                    { label: '🏦 Cuentas', value: importPreview.accountsCount },
                    {
                      label: '🏷️ Categorías',
                      value: importPreview.categoriesCount,
                    },
                    {
                      label: '📈 Proyecciones',
                      value: importPreview.projectionsCount,
                    },
                    {
                      label: '🧾 Movimientos',
                      value: importPreview.realExpensesCount,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.625rem',
                        background: T.pageBg,
                        border: `1px solid ${T.cardBorder}`,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: T.body,
                      }}
                    >
                      {item.label}:{' '}
                      <strong style={{ color: T.title }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  marginBottom: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  background: T.accentLight,
                  border: `1px solid ${T.accent}33`,
                }}
              >
                <input
                  type="checkbox"
                  checked={downloadPreRestore}
                  onChange={(e) => setDownloadPreRestore(e.target.checked)}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    accentColor: T.accent,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    color: T.accent,
                    lineHeight: 1.4,
                  }}
                >
                  💾 Descargar también la copia de seguridad previa a la
                  restauración
                </span>
              </label>

              <div
                style={{
                  padding: '0.65rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: T.amberBg,
                  border: `1px solid ${T.amberBorder}`,
                  fontSize: '0.75rem',
                  color: T.amber,
                  marginBottom: '0.75rem',
                  lineHeight: 1.5,
                }}
              >
                ⚠️ Al restaurar este backup{' '}
                <strong>se reemplazarán todos tus datos actuales</strong>.
              </div>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => {
                    const preEntry = createBackup(
                      'Automática pre-restauración'
                    );
                    if (downloadPreRestore) {
                      downloadBackup(preEntry);
                      toast('Copia previa descargada correctamente', 'success');
                    }
                    restoreBackup(importPreview);
                    setShowImport(false);
                    setImportPreview(null);
                    setDownloadPreRestore(false);
                    toast(
                      'Datos restaurados correctamente desde fichero',
                      'success'
                    );
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: T.green,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Restaurar ahora
                </button>
                <button
                  onClick={() => {
                    setImportPreview(null);
                    setShowImport(false);
                  }}
                  style={{
                    padding: '0.7rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${T.cardBorder}`,
                    background: T.btnSecBg,
                    color: T.btnSecText,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Historial de copias ── */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Historial de copias ({backupHistory.length}/50)</span>
          {backupHistory.length > 0 && (
            <span
              style={{ fontSize: '0.68rem', color: T.muted, fontWeight: 400 }}
            >
              Última: {timeSince(backupHistory[0]?.timestamp)}
            </span>
          )}
        </div>

        {backupHistory.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              borderRadius: '1rem',
              background: T.pageBg,
              border: `1.5px dashed ${T.cardBorder}`,
              color: T.muted,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗂️</div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Aún no hay copias guardadas
            </div>
            <div style={{ fontSize: '0.775rem', marginTop: '0.25rem' }}>
              Usa los botones de arriba para crear tu primera copia
            </div>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {[...backupHistory]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.875rem',
                    background: index === 0 ? T.accentLight : T.pageBg,
                    border: `1px solid ${
                      index === 0 ? T.accent + '33' : T.cardBorder
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '0.625rem',
                      background: index === 0 ? T.accentLight : T.cardBg,
                      border: `1px solid ${
                        index === 0 ? T.accent + '44' : T.cardBorder
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {entry.label.includes('pre-restauración')
                      ? '🔄'
                      : index === 0
                      ? '💾'
                      : '🕐'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {entry.label}
                      </span>
                      {index === 0 && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: T.accent,
                            color: '#fff',
                          }}
                        >
                          MÁS RECIENTE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: T.muted }}>
                      {fmtTimestamp(entry.timestamp)} ·{' '}
                      {timeSince(entry.timestamp)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.625rem',
                        marginTop: '0.3rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {[
                        { label: `${entry.accountsCount} cuentas` },
                        { label: `${entry.projectionsCount} proyecc.` },
                        { label: `${entry.realExpensesCount} movim.` },
                        { label: `${entry.goalsCount ?? 0} objetivos` },
                      ].map((item) => (
                        <span
                          key={item.label}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: T.cardBg,
                            border: `1px solid ${T.cardBorder}`,
                            color: T.muted,
                          }}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => {
                        downloadBackup(entry);
                        toast('Copia descargada', 'success');
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: T.btnSecBg,
                        color: T.btnSecText,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⬇️ Descargar
                    </button>
                    <button
                      onClick={() => setConfirmRestore(entry)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.accent}44`,
                        background: T.accentLight,
                        color: T.accent,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🔄 Restaurar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(entry.id)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.redBorder}`,
                        background: T.redBg,
                        color: T.red,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Aviso informativo ── */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem 1.125rem',
          borderRadius: '1rem',
          background: T.redBg,
          border: `1.5px solid ${T.redBorder}`,
          lineHeight: 1.6,
          animation: 'warnGlow 2.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '0.625rem',
          }}
        >
          <span
            style={{
              fontSize: '1.1rem',
              display: 'inline-block',
              animation: 'warnPulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          >
            ⚠️
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              background: T.red,
              color: '#ffffff',
            }}
          >
            Importante
          </span>
          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: T.red }}>
            No pierdas tus datos
          </span>
        </div>
        <p
          style={{
            fontSize: '0.775rem',
            color: T.red,
            margin: 0,
            lineHeight: 1.65,
            opacity: 0.9,
          }}
        >
          Las copias del historial se guardan{' '}
          <strong>únicamente en este navegador</strong>. Si limpias el
          historial, cambias de navegador o cambias de dispositivo,{' '}
          <strong>podrías perderlas para siempre</strong>.
        </p>
        <div
          style={{
            height: '1px',
            background: T.redBorder,
            margin: '0.625rem 0',
            opacity: 0.5,
          }}
        />
        <p
          style={{
            fontSize: '0.775rem',
            color: T.red,
            margin: 0,
            lineHeight: 1.65,
            opacity: 0.9,
          }}
        >
          ✅ Usa siempre <strong>"Guardar y descargar"</strong> para tener una
          copia física en tu ordenador.
        </p>
      </div>

      {/* ── Modal confirmar restaurar ── */}
      {confirmRestore && (
        <ConfirmModal
          T={T}
          danger={false}
          title="¿Restaurar esta copia?"
          confirmLabel="🔄 Restaurar ahora"
          message={`Vas a restaurar la copia del ${fmtTimestamp(
            confirmRestore.timestamp
          )} (${confirmRestore.accountsCount} cuentas, ${
            confirmRestore.projectionsCount
          } proyecciones, ${
            confirmRestore.realExpensesCount
          } movimientos). Todos tus datos actuales serán reemplazados.`}
          checkboxLabel="💾 Descargar también la copia de seguridad previa a la restauración"
          checkboxValue={downloadPreRestore}
          onCheckboxChange={setDownloadPreRestore}
          onConfirm={() => {
            const preEntry = createBackup('Automática pre-restauración');
            if (downloadPreRestore) {
              downloadBackup(preEntry);
              toast('Copia previa descargada correctamente', 'success');
            }
            restoreBackup(confirmRestore);
            setConfirmRestore(null);
            setDownloadPreRestore(false);
            toast('Datos restaurados correctamente', 'success');
            onClose();
          }}
          onCancel={() => {
            setConfirmRestore(null);
            setDownloadPreRestore(false);
          }}
        />
      )}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          danger={true}
          title="¿Eliminar esta copia?"
          message="Se eliminará esta copia del historial. Esta acción no se puede deshacer."
          onConfirm={() => {
            deleteBackup(confirmDelete);
            setConfirmDelete(null);
            toast('Copia eliminada del historial', 'success');
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Modal>
  );
}
