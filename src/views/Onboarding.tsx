import { useState, useRef } from 'react';
import { Check, Shield } from 'lucide-react';
import { CURRENCIES } from '../utils';
import { LIGHT } from '../theme'; // ✅ FIX — importar desde theme.ts, no redefinir
import { LegalModal, LEGAL_DOCS } from './Legal';
import type {
  Account,
  Category,
  Projection,
  RealExpense,
  CategoryRule,
} from '../types';

// ─── Tipo explícito para onFinish ─────────────────────────────────────────────
type OnboardingData = {
  accounts: Account[];
  categories: Category[];
  projections: Projection[];
  realExpenses?: RealExpense[];
  categoryRules?: CategoryRule[];
  baseCurrency: string;
  dateFormat: string;
};

const DEFAULT_CATEGORIES = [
  { name: 'Salario', type: 'income', color: '#16a34a' },
  { name: 'Freelance / Consultoría', type: 'income', color: '#0891b2' },
  { name: 'Alquiler recibido', type: 'income', color: '#0d9488' },
  { name: 'Inversiones / Dividendos', type: 'income', color: '#4f46e5' },
  { name: 'Pensión', type: 'income', color: '#7c3aed' },
  { name: 'Otros ingresos', type: 'income', color: '#ca8a04' },
  { name: 'Vivienda / Alquiler', type: 'expense', color: '#dc2626' },
  { name: 'Hipoteca', type: 'expense', color: '#b91c1c' },
  { name: 'Alimentación', type: 'expense', color: '#ea580c' },
  { name: 'Transporte', type: 'expense', color: '#ca8a04' },
  { name: 'Salud / Farmacia', type: 'expense', color: '#0891b2' },
  { name: 'Educación', type: 'expense', color: '#4f46e5' },
  { name: 'Ocio / Entretenimiento', type: 'expense', color: '#7c3aed' },
  { name: 'Suscripciones digitales', type: 'expense', color: '#db2777' },
  { name: 'Ropa / Moda', type: 'expense', color: '#ec4899' },
  { name: 'Restaurantes / Bares', type: 'expense', color: '#f97316' },
  { name: 'Viajes / Vacaciones', type: 'expense', color: '#06b6d4' },
  { name: 'Seguros', type: 'expense', color: '#64748b' },
  { name: 'Mascotas', type: 'expense', color: '#84cc16' },
  { name: 'Ahorro / Inversión', type: 'expense', color: '#1d4ed8' },
  { name: 'Otros gastos', type: 'expense', color: '#94a3b8' },
];

const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '31/01/2025' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '01/31/2025' },
  { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2025-01-31' },
  { value: 'dd-mm-yyyy', label: 'DD-MM-YYYY', example: '31-01-2025' },
];

const uid = () => crypto.randomUUID();

// ✅ FIX — LIGHT ya no se define aquí, viene de theme.ts

export function Onboarding({
  onFinish,
}: {
  onFinish: (data: OnboardingData) => void;
}) {
  // ✅ FIX — eliminado `step` (dead state que nunca cambiaba)
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedDateFormat, setSelectedDateFormat] = useState('dd/mm/yyyy');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false); // ✅ FIX — estado de carga
  const [showSecurityStep, setShowSecurityStep] = useState(false);
  const [openLegalDoc, setOpenLegalDoc] = useState<
    keyof typeof LEGAL_DOCS | null
  >(null);

  // ✅ FIX — ref tipada correctamente
  const pendingFinishData = useRef<OnboardingData | null>(null);

  const T = LIGHT;

  // ── Paso de seguridad post-onboarding ──────────────────────────────────────
  if (showSecurityStep) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '2rem',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}
            >
              <Shield size={28} color="#fff" />
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                margin: '0 0 0.5rem',
              }}
            >
              ¿Proteger tu app?
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#93c5fd',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Acabas de introducir tus datos financieros. Te recomendamos
              protegerlos con contraseña.
            </p>
          </div>

          {/* ✅ FIX — estado de carga en el botón de seguridad */}
          <button
            onClick={() => {
              if (!pendingFinishData.current) return;
              setLoadingSecurity(true);
              onFinish(pendingFinishData.current);
              localStorage.setItem('fh_open_security', 'true');
            }}
            disabled={loadingSecurity}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              background: loadingSecurity ? '#1d4ed8' : '#2563eb',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loadingSecurity ? 'not-allowed' : 'pointer',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: loadingSecurity ? 0.8 : 1,
              transition: 'all 0.2s',
            }}
          >
            <span>
              {loadingSecurity
                ? '⏳ Preparando...'
                : '🛡️ Activar seguridad ahora'}
            </span>
            {!loadingSecurity && (
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Recomendado
              </span>
            )}
          </button>

          <button
            onClick={() => {
              // Limpia seguridad residual sin necesitar el contexto
              localStorage.removeItem('fh_security');
              localStorage.removeItem('fh_lock_state');
              localStorage.removeItem('fh_totp_last_unlock');
              if (pendingFinishData.current)
                onFinish(pendingFinishData.current);
            }}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Saltar por ahora →
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: '#475569',
              marginTop: '1.25rem',
            }}
          >
            Siempre podrás activarla desde el header de la app.
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla principal de onboarding ──────────────────────────────────────
  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '32rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '2rem',
            padding: '3rem 2.5rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}
            >
              <Shield size={28} color="#fff" />
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.04em',
                margin: '0 0 0.75rem',
              }}
            >
              Bienvenido a FinanzasHogar
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: '#93c5fd',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Tu app de finanzas personales. Simple, clara y siempre bajo tu
              control.
            </p>

            {/* ── Selector de divisa ── */}
            <div style={{ marginTop: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#93c5fd',
                  marginBottom: '0.375rem',
                  textAlign: 'center',
                }}
              >
                ¿En qué moneda gestionas tus finanzas?
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  textAlign: 'center',
                  margin: '0 0 0.875rem',
                  lineHeight: 1.5,
                }}
              >
                Esta será tu divisa principal. Podrás cambiarla después y
                asignar una divisa diferente a cada cuenta.
              </p>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.875rem',
                  border: '2px solid #3b82f6',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                }}
              >
                {CURRENCIES.map((c) => (
                  <option
                    key={c.code}
                    value={c.code}
                    style={{ background: '#1e3a5f', color: '#ffffff' }}
                  >
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
              {(() => {
                const selected = CURRENCIES.find(
                  (c) => c.code === selectedCurrency
                );
                return selected ? (
                  <div
                    style={{
                      marginTop: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: '#60a5fa',
                    }}
                  >
                    <Check size={13} color="#60a5fa" />
                    <span>{selected.name} seleccionada</span>
                  </div>
                ) : null;
              })()}

              {/* ── Selector de formato de fecha ── */}
              <div style={{ marginTop: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#93c5fd',
                    marginBottom: '0.375rem',
                    textAlign: 'center',
                  }}
                >
                  ¿Cómo prefieres ver las fechas?
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#cbd5e1',
                    textAlign: 'center',
                    margin: '0 0 0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  Elige el formato que uses habitualmente en tu país.
                </p>
                <select
                  value={selectedDateFormat}
                  onChange={(e) => setSelectedDateFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    border: '2px solid #3b82f6',
                    background: 'rgba(255,255,255,0.07)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  {DATE_FORMATS.map((f) => (
                    <option
                      key={f.value}
                      value={f.value}
                      style={{ background: '#1e3a5f', color: '#ffffff' }}
                    >
                      {f.label} — ej: {f.example}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    marginTop: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.78rem',
                    color: '#60a5fa',
                  }}
                >
                  <Check size={13} color="#60a5fa" />
                  <span>
                    Las fechas se mostrarán como:{' '}
                    {DATE_FORMATS.find((f) => f.value === selectedDateFormat)
                      ?.example ?? ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Aceptación legal ── */}
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                style={{
                  width: '1.125rem',
                  height: '1.125rem',
                  marginTop: '0.1rem',
                  cursor: 'pointer',
                  accentColor: '#3b82f6',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.775rem',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                }}
              >
                He leído y acepto el{' '}
                {(['aviso', 'privacidad', 'terminos', 'cookies'] as const).map(
                  (doc, i, arr) => {
                    const labels: Record<string, string> = {
                      aviso: 'Aviso Legal',
                      privacidad: 'Política de Privacidad',
                      terminos: 'Términos y Condiciones',
                      cookies: 'Política de Cookies',
                    };
                    const separators: Record<number, string> = {
                      1: ', la ',
                      2: ', los ',
                      3: ' y la ',
                    };
                    return (
                      <span key={doc}>
                        {i > 0 && separators[i]}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenLegalDoc(doc);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60a5fa',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.775rem',
                            textDecoration: 'underline',
                          }}
                        >
                          {labels[doc]}
                        </button>
                      </span>
                    );
                  }
                )}
                {' de FinanzasHogar.'}
              </span>
            </label>
            {!legalAccepted && (
              <p
                style={{
                  fontSize: '0.72rem',
                  color: '#fca5a5',
                  marginTop: '0.5rem',
                  marginLeft: '1.875rem',
                  fontWeight: 600,
                }}
              >
                Debes aceptar los términos para continuar.
              </p>
            )}
          </div>

          {/* ── Botón principal ── */}
          <button
            onClick={() => {
              if (!legalAccepted) return;
              const cats = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid() }));
              // ✅ FIX — guardar datos en ref y mostrar paso de seguridad
              pendingFinishData.current = {
                accounts: [],
                categories: cats,
                projections: [],
                baseCurrency: selectedCurrency,
                dateFormat: selectedDateFormat,
              };
              localStorage.setItem('fh_open_guide', 'true');
              setShowSecurityStep(true);
            }}
            disabled={!legalAccepted}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              border: 'none',
              background: legalAccepted ? '#2563eb' : '#1e3a5f',
              color: legalAccepted ? '#ffffff' : '#64748b',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: legalAccepted ? 'pointer' : 'not-allowed',
              width: '100%',
              boxShadow: legalAccepted
                ? '0 4px 16px rgba(37,99,235,0.4)'
                : 'none',
              opacity: legalAccepted ? 1 : 0.5,
              transition: 'all 0.2s',
              marginBottom: '1.25rem',
            }}
          >
            🚀 Empezar con FinanzasHogar →
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            🔒 Tus datos se guardan solo en tu dispositivo.
            <br />
            Nunca se envían a ningún servidor.
          </p>
        </div>
      </div>

      {openLegalDoc && (
        <LegalModal
          docKey={openLegalDoc}
          onClose={() => setOpenLegalDoc(null)}
        />
      )}
    </>
  );
}
