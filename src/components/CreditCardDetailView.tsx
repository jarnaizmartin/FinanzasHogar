// ─────────────────────────────────────────────────────────────────────────────
// CreditCardDetailView.tsx
// Vista de detalle dedicada de una tarjeta de crédito.
// Patrón fintech estándar (Revolut/N26): la card es teaser, esto es el detalle.
//
// Estructura:
//   ┌─ Botón volver ──────────────────────────────────────────┐
//   ├─ Hero (datos clave: deuda, disponible, próximo pago)    │
//   ├─ Acciones (editar, eliminar, registrar pago, imprimir)  │
//   ├─ Tabs (Resumen / Histórico / Métricas / Categorías /    │
//   │        Simulador)                                       │
//   └─ Contenido del tab activo                               ┘
//
// En 6.1 los tabs están vacíos. En 6.3 se enchufan los componentes reales.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { BankImportModal } from '../BankImportModal';
import { Download } from 'lucide-react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CreditCard,
  TrendingUp,
  BarChart3,
  Tag,
  Calculator,
  LayoutDashboard,
} from 'lucide-react';
import { useApp } from '../AppContext';
import {
  daysUntilBilling,
  daysUntilPayment,
  getCreditHealthScore,
  getCreditHealthColors,
} from '../lib/creditCardUtils';
import {
  PrintButton,
  PrintHeader,
  PrintFooter,
  PrimaryBtn,
  SecondaryBtn,
  DangerBtn,
} from './UI';
import { CreditCardHealthScore } from './CreditCardHealthScore';
import { CreditCardHistoryChart } from './CreditCardHistoryChart';
import { CreditCardMetrics } from './CreditCardMetrics';
import { CreditCardTopCategories } from './CreditCardTopCategories';
import { CreditCardSimulator } from './CreditCardSimulator';
import type { Account } from '../types';
import { InstitutionLogo } from './InstitutionLogo';

// ─── Tipos ──────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'history' | 'metrics' | 'categories' | 'simulator';

type TabDef = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

const TABS: TabDef[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'history', label: 'Histórico', icon: TrendingUp },
  { id: 'metrics', label: 'Métricas', icon: BarChart3 },
  { id: 'categories', label: 'Categorías', icon: Tag },
  { id: 'simulator', label: 'Simulador', icon: Calculator },
];

// ─── Props ──────────────────────────────────────────────────────────────────
type Props = {
  account: Account;
  onBack: () => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
};

// ─── Componente ─────────────────────────────────────────────────────────────
export function CreditCardDetailView({
  account,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const { T, baseCurrency, fmtAccount, realBalanceMap, openPaymentModal } =
    useApp();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showImport, setShowImport] = useState(false);

  const ccInfo = realBalanceMap[account.id];
  const creditDebt = ccInfo?.creditDebt ?? 0;
  const creditAvailable = ccInfo?.creditAvailable ?? account.creditLimit ?? 0;
  const utilizationPct = ccInfo?.utilizationPct ?? 0;
  const currency = account.currency ?? baseCurrency;

  // Health score y colores
  const health = getCreditHealthScore(utilizationPct);
  const {
    color: utilColor,
    bg: utilBg,
    border: utilBorder,
  } = getCreditHealthColors(health.intent, T);

  // Días corte/pago
  const dBilling = daysUntilBilling(account);
  const dPayment = daysUntilPayment(account);

  // Subtítulo dinámico para la cabecera
  const headerSubtitle = `Tarjeta de crédito · ${currency} · Deuda: ${fmtAccount(
    creditDebt,
    currency
  )}`;

  return (
    <div className="fh-print-section">
      {/* ── Cabecera documento (solo impresión) — formato estándar ── */}
      <PrintHeader
        title={`Tarjeta: ${account.name}`}
        subtitle={headerSubtitle}
      />

      {/* ── Cabecera estándar (coherente con resto de páginas) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          {/* Botón volver — discreto encima del título */}
          <button
            onClick={onBack}
            className="fh-no-print"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem 0.3rem 0.4rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'transparent',
              color: T.muted,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '0.4rem',
              marginLeft: '-0.4rem',
              letterSpacing: '0.04em',
            }}
          >
            <ArrowLeft size={14} />
            Volver a cuentas
          </button>

          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Gestión
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Detalle de tarjeta
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Análisis financiero completo · {currency}
          </p>
        </div>

        {/* Acciones (como en Accounts.tsx) */}
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          <PrintButton
            T={T}
            documentTitle={`Tarjeta_${account.name.replace(/\s+/g, '_')}`}
            sectionTitle={`Tarjeta: ${account.name}`}
            subtitle={headerSubtitle}
          />
          {creditDebt > 0 && (
            <PrimaryBtn onClick={() => openPaymentModal(account.id)}>
              💸 Registrar pago
            </PrimaryBtn>
          )}
            <SecondaryBtn onClick={() => setShowImport(true)} T={T}>
              <Download size={14} />
              Importar extracto
            </SecondaryBtn>
          <SecondaryBtn onClick={() => onEdit(account)} T={T}>
            <Pencil size={14} />
          </SecondaryBtn>
          <DangerBtn onClick={() => onDelete(account.id)} T={T}>
            <Trash2 size={14} />
          </DangerBtn>
        </div>
      </div>

      {/* ── Hero (datos clave) ─────────────────────────────────────────── */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1e293b 0%, #334155 60%, #1e293b 100%)',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          color: '#f1f5f9',
        }}
      >
        {/* Decoración */}
        <div
          style={{
            position: 'absolute',
            top: '-2rem',
            right: '-2rem',
            width: '10rem',
            height: '10rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-1rem',
            right: '5rem',
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />

        {/* Cabecera */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <CreditCard size={22} color="#94a3b8" />
          <div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
              }}
            >
              {account.name}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Tarjeta de crédito · {currency}
            </div>
            {account.institution && (
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginTop: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <InstitutionLogo
                  name={account.institution}
                  size={16}
                  color="cbd5e1"
                />
                {account.institution}
              </div>
            )}
          </div>
        </div>

        {/* Grid de KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
            gap: '1.25rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Deuda actual */}
          <div>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.3rem',
              }}
            >
              Deuda actual
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: creditDebt > 0 ? '#f87171' : '#4ade80',
                lineHeight: 1,
              }}
            >
              {fmtAccount(creditDebt, currency)}
            </div>
          </div>

          {/* Disponible */}
          <div>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.3rem',
              }}
            >
              Disponible
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#4ade80',
                lineHeight: 1,
              }}
            >
              {fmtAccount(creditAvailable, currency)}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                marginTop: '0.3rem',
              }}
            >
              de {fmtAccount(account.creditLimit ?? 0, currency)}
            </div>
          </div>

          {/* Utilización */}
          <div>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.3rem',
              }}
            >
              Utilización
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#f1f5f9',
                lineHeight: 1,
              }}
            >
              {Math.round(utilizationPct)}%
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: '0.4rem',
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                background: utilBg,
                color: utilColor,
                border: `1px solid ${utilBorder}`,
              }}
            >
              {health.label}
            </div>
          </div>

          {/* Próximo pago */}
          {dPayment !== null && (
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.3rem',
                }}
              >
                Próximo pago
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: dPayment <= 3 ? '#f87171' : '#f1f5f9',
                  lineHeight: 1,
                }}
              >
                {dPayment === 0 ? '¡Hoy!' : `${dPayment} días`}
              </div>
              {dBilling !== null && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    marginTop: '0.3rem',
                  }}
                >
                  Corte en {dBilling === 0 ? 'hoy' : `${dBilling}d`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div
        className="fh-no-print fh-tabs-no-scrollbar"
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: `2px solid ${T.cardBorder}`,
          marginBottom: '1.5rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1rem',
                border: 'none',
                background: 'transparent',
                color: isActive ? T.accent : T.muted,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderBottom: `3px solid ${
                  isActive ? T.accent : 'transparent'
                }`,
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon size={15} color={isActive ? T.accent : T.muted} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido del tab ──────────────────────────────────────────── */}
      <div
        style={{
          minHeight: '20rem',
        }}
      >
        {/* Tab: Resumen — Health Score como protagonista + info financiera clave */}
        {activeTab === 'overview' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Health Score completo (single source of truth de "salud financiera") */}
            <div
              style={{
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
              }}
            >
              <CreditCardHealthScore
                account={account}
                utilizationPct={utilizationPct}
                currentDebt={creditDebt}
              />
            </div>

            {/* Resumen rápido de info financiera */}
            {(account.interestRate || account.minPaymentPct) && (
              <div
                style={{
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: '1rem',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}
                >
                  Información financiera
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {account.interestRate != null && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginBottom: '0.2rem',
                        }}
                      >
                        TAE anual
                      </div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        {account.interestRate}%
                      </div>
                    </div>
                  )}
                  {account.minPaymentPct != null && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Pago mínimo
                      </div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        {account.minPaymentPct}%
                      </div>
                    </div>
                  )}
                  {account.billingDay != null && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Día de corte
                      </div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        Día {account.billingDay}
                      </div>
                    </div>
                  )}
                  {account.paymentDueDay != null && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Día de pago
                      </div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        Día {account.paymentDueDay}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Histórico de deuda */}
        {activeTab === 'history' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1rem',
              overflow: 'hidden',
            }}
          >
            <CreditCardHistoryChart account={account} />
          </div>
        )}

        {/* Tab: Métricas históricas */}
        {activeTab === 'metrics' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1rem',
              overflow: 'hidden',
            }}
          >
            <CreditCardMetrics account={account} />
          </div>
        )}

        {/* Tab: Top categorías de gasto */}
        {activeTab === 'categories' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1rem',
              overflow: 'hidden',
            }}
          >
            <CreditCardTopCategories account={account} />
          </div>
        )}

        {/* Tab: Simulador de amortización */}
        {activeTab === 'simulator' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1rem',
              overflow: 'hidden',
            }}
          >
            {creditDebt > 0 ? (
              <CreditCardSimulator account={account} currentDebt={creditDebt} />
            ) : (
              <div
                style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: T.muted,
                }}
              >
                <div
                  style={{
                    fontSize: '2.5rem',
                    marginBottom: '0.75rem',
                    opacity: 0.4,
                  }}
                >
                  🎉
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: T.title,
                    marginBottom: '0.4rem',
                  }}
                >
                  ¡No tienes deuda en esta tarjeta!
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  El simulador de amortización aparecerá automáticamente cuando
                  tengas saldo pendiente.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS local para ocultar scrollbar webkit en tabs */}
      <style>{`
        .fh-tabs-no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Modal de importación (con tarjeta preseleccionada) ── */}
{showImport && (
  <BankImportModal
    onClose={() => setShowImport(false)}
    defaultAccountId={account.id}
  />
)}
{/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section={`Tarjeta: ${account.name}`} />
    </div>
  );
}
