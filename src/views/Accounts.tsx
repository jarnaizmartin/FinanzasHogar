import { useState, useMemo, useRef, type ChangeEvent } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Wallet,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import { CURRENCIES, fmt, today, fmtDateDMY, convertAmount } from '../utils';
import {
  Card,
  ConfirmModal,
  Field,
  Input,
  Sel,
  PrimaryBtn,
  SecondaryBtn,
  DangerBtn,
  PrintButton,
  PrintHeader,
  PrintFooter,
} from '../components/UI';
import { FirstWinToast } from '../components/FirstWinToast';

const uid = () => crypto.randomUUID();

// ─── Tipo del formulario ──────────────────────────────────────────────────────
type AccountForm = {
  name: string;
  balance: string | number;
  date: string;
  minBalance: string | number;
  currency: string;
};

export function Accounts() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    fmtAccount,
    accounts,
    setAccounts,
    forecastByAccount,
    accountWarnings,
    realBalanceMap,
    setTab,
    setRealAccountFilter,
    realExpenses,
    setRealExpenses,
    projections,
    setProjections,
    goals,
    setGoals,
    dateFormat,
  } = useApp();

  const toast = useToast();

  // ── Coach Mark ────────────────────────────────────────────────────────────
  const { seen: coachSeen, markSeen: coachMarkSeen } = useCoachMark('accounts');
  const coachRef = useRef<HTMLDivElement>(null);

  // ── Totales ────────────────────────────────────────────────────────────────
  const totalBase = accounts.reduce((s, a) => s + a.balance, 0);
  const totalReal = accounts.reduce(
    (s, a) => s + (realBalanceMap[a.id]?.realBalance ?? a.balance),
    0
  );

  // ── Estado con tipos explícitos ────────────────────────────────────────────
  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [form, setForm] = useState<AccountForm>({
    name: '',
    balance: '',
    date: today(),
    minBalance: '',
    currency: baseCurrency,
  });

  const openAdd = () => {
    setForm({
      name: '',
      balance: '',
      date: today(),
      minBalance: '',
      currency: baseCurrency,
    });
    setModal('add');
  };

  const openEdit = (acc: (typeof accounts)[number]) => {
    setForm({
      ...acc,
      balance: acc.balance.toFixed(2),
      minBalance: (acc.minBalance ?? 0).toFixed(2),
      currency: acc.currency ?? baseCurrency,
    });
    setModal(acc.id);
  };

  const save = () => {
    if (!form.name || form.balance === '') return;
    const entry = {
      ...form,
      balance: +form.balance,
      minBalance: form.minBalance === '' ? 0 : +(form.minBalance || 0),
    };

    const isFirstAccount = modal === 'add' && accounts.length === 0;

    if (modal === 'add') {
      setAccounts((p) => [
        ...p,
        { ...entry, id: uid(), acknowledgedExpenseIds: [] },
      ]);
      toast('Cuenta creada correctamente', 'success');
    } else {
      const existingAccount = accounts.find((a) => a.id === modal);
      const dateChanged = existingAccount && form.date !== existingAccount.date;

      setAccounts((p) =>
        p.map((a) => {
          if (a.id !== modal) return a;
          let acknowledgedExpenseIds = a.acknowledgedExpenseIds ?? [];
          if (dateChanged) {
            const newlyAcknowledged = realExpenses
              .filter(
                (e) =>
                  e.accountId === a.id &&
                  e.valueDate <= form.date &&
                  !acknowledgedExpenseIds.includes(e.id)
              )
              .map((e) => e.id);
            acknowledgedExpenseIds = [
              ...acknowledgedExpenseIds,
              ...newlyAcknowledged,
            ];
          }
          return { ...a, ...entry, acknowledgedExpenseIds };
        })
      );

      if (dateChanged) {
        toast(
          'Cuenta actualizada. Los movimientos anteriores al nuevo saldo base han sido reconocidos automáticamente.',
          'info'
        );
      } else {
        toast('Cuenta actualizada correctamente', 'success');
      }
    }
    setModal(null);
    if (isFirstAccount) setShowFirstWin(true);
  };

  // ✅ FIX — impacto de eliminación calculado una sola vez con useMemo
  const deleteImpact = useMemo(() => {
    if (!confirmDelete) return null;
    const movCount = realExpenses.filter(
      (e) => e.accountId === confirmDelete
    ).length;
    const projCount = projections.filter(
      (p) => p.accountId === confirmDelete
    ).length;
    const goalCount = goals.filter(
      (g) => g.mode === 'auto' && g.accountId === confirmDelete
    ).length;
    const parts: string[] = [];
    if (movCount > 0)
      parts.push(`${movCount} movimiento${movCount !== 1 ? 's' : ''}`);
    if (projCount > 0)
      parts.push(`${projCount} proyección${projCount !== 1 ? 'es' : ''}`);
    if (goalCount > 0)
      parts.push(`${goalCount} objetivo${goalCount !== 1 ? 's' : ''}`);
    return { movCount, projCount, goalCount, parts };
  }, [confirmDelete, realExpenses, projections, goals]);

  const confirmDel = () => {
    const deletedId = confirmDelete!;
    setAccounts((p) => p.filter((a) => a.id !== deletedId));
    // ✅ FIX — sin variable shadowing: prev/proj en lugar de p/p
    setRealExpenses((prev) => prev.filter((e) => e.accountId !== deletedId));
    setProjections((prev) =>
      prev.filter((proj) => proj.accountId !== deletedId)
    );
    setGoals((prev) =>
      prev.filter((g) => !(g.mode === 'auto' && g.accountId === deletedId))
    );

    const detail =
      deleteImpact && deleteImpact.parts.length > 0
        ? ` junto con ${deleteImpact.parts.join(', ')} asociado${
            deleteImpact.parts.length > 1 ? 's' : ''
          }`
        : '';
    toast(`Cuenta eliminada${detail}`, 'success');
    setConfirmDelete(null);
  };

  const accToDelete = accounts.find((a) => a.id === confirmDelete);

  return (
    <div className="fh-print-section">

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Mis Cuentas"
        subtitle={`${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} · Saldo base total: ${fmtAccount(totalBase, baseCurrency)}`}
      />

      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
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
            Mis Cuentas
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Administra y controla tus saldos
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton
            T={T}
            documentTitle="Mis_Cuentas"
            sectionTitle="Mis Cuentas"
            subtitle={`${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} · Saldo base total: ${fmtAccount(totalBase, baseCurrency)}`}
          />
          <div ref={coachRef} style={{ display: 'inline-flex' }}>
            <PrimaryBtn onClick={openAdd}>
              <Plus size={15} />
              Nueva cuenta
            </PrimaryBtn>
          </div>
        </div>
      </div>
      {/* ── Resumen de patrimonio ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          {
            label: 'Dinero que tenías al empezar',
            value: fmtAccount(totalBase, baseCurrency),
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Dinero que tienes ahora (real)',
            value: fmtAccount(totalReal, baseCurrency),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Cuentas activas',
            value: `${accounts.length} cuenta${
              accounts.length !== 1 ? 's' : ''
            }`,
            color: T.muted,
            bg: T.pageBg,
            border: T.cardBorder,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
      {/* ── Grid de tarjetas ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(22rem,1fr))',
          gap: '1.25rem',
        }}
      >
        {accounts.map((acc) => {
          const warn = accountWarnings[acc.id];
          const fc = forecastByAccount[acc.id] || [];
          const next = fc[0];
          const projectedEnd = acc.balance + fc.reduce((s, m) => s + m.net, 0);

          return (
            <Card
              key={acc.id}
              T={T}
              style={{
                border: `2px solid ${warn ? T.amberBorder : T.cardBorder}`,
              }}
            >
              <div style={{ padding: '1.75rem' }}>
                {/* Cabecera */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                    }}
                  >
                    <div
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.875rem',
                        background: warn ? T.amberBg : T.accentLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${
                          warn ? T.amberBorder : T.cardBorder
                        }`,
                        flexShrink: 0,
                      }}
                    >
                      <Wallet size={20} color={warn ? T.amber : T.accent} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: T.title,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {acc.name}
                        </div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: T.accentLight,
                            color: T.accent,
                            border: `1px solid ${T.accent}33`,
                          }}
                        >
                          {acc.currency ?? baseCurrency}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: T.muted,
                          marginTop: '0.1rem',
                        }}
                      >
                        Al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    </div>
                  </div>
                  {warn && (
                    <AlertTriangle
                      size={18}
                      color={T.amber}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </div>

                {/* Saldo real */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    width: '100%',
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      color: T.muted,
                      textTransform: 'uppercase',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Saldo real calculado
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(1.375rem, 5vw, 2.25rem)',
                      fontWeight: 800,
                      color: warn ? T.amber : T.accent,
                      letterSpacing: '-0.03em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtAccount(
                      realBalanceMap[acc.id]?.realBalance ?? acc.balance,
                      acc.currency ?? baseCurrency
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '0.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: T.muted }}>
                      Base:{' '}
                      {fmtAccount(acc.balance, acc.currency ?? baseCurrency)} ·
                      al {fmtDateDMY(acc.date, dateFormat)}
                    </div>
                    {realBalanceMap[acc.id]?.appliedCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.accent,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ✅ {realBalanceMap[acc.id].appliedCount} movimiento
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}{' '}
                        real
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 'es' : ''}{' '}
                        aplicado
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {realBalanceMap[acc.id]?.ignoredCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.amber,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ⚠️ {realBalanceMap[acc.id].ignoredCount} movimiento
                        {realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''}{' '}
                        ignorado
                        {realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''}{' '}
                        (anterior
                        {realBalanceMap[acc.id].ignoredCount !== 1 ? 'es' : ''}{' '}
                        al saldo base)
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: T.muted }}>
                      Mínimo:{' '}
                      {fmtAccount(acc.minBalance, acc.currency ?? baseCurrency)}
                    </div>
                  </div>
                </div>

                {/* Previsión mensual */}
                {next && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: '0.875rem',
                      background: T.pageBg,
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Ingresos/mes
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: T.green,
                        }}
                      >
                        {fmtAccount(next.income, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Gastos/mes
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: T.red,
                        }}
                      >
                        {fmtAccount(next.expense, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                    <div
                      style={{
                        gridColumn: '1/-1',
                        paddingTop: '0.75rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Saldo proyectado a 12 meses
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          color:
                            projectedEnd >= (acc.minBalance ?? 0)
                              ? T.accent
                              : T.amber,
                        }}
                      >
                        {fmtAccount(projectedEnd, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso saldo mínimo */}
                {warn && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.75rem',
                      background: T.amberBg,
                      border: `1px solid ${T.amberBorder}`,
                      marginBottom: '1rem',
                    }}
                  >
                    <AlertTriangle size={14} color={T.amber} />
                    <span
                      style={{
                        fontSize: '0.775rem',
                        color: T.amber,
                        fontWeight: 600,
                      }}
                    >
                      El saldo proyectado caerá bajo el mínimo
                    </span>
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    onClick={() => {
                      setRealAccountFilter(acc.id);
                      setTab('real');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${T.cardBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <Receipt size={14} />
                    Movimientos
                  </button>
                  <SecondaryBtn onClick={() => openEdit(acc)} T={T}>
                    <Pencil size={14} />
                  </SecondaryBtn>
                  <DangerBtn onClick={() => setConfirmDelete(acc.id)} T={T}>
                    <Trash2 size={14} />
                  </DangerBtn>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Estado vacío */}
        {accounts.length === 0 && (
          <div
            style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '5rem 2rem',
              color: T.muted,
            }}
          >
            <Wallet
              size={48}
              color={T.muted}
              style={{ margin: '0 auto 1rem', opacity: 0.3 }}
            />
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                marginBottom: '0.5rem',
              }}
            >
              Todavía no tienes cuentas
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: T.muted,
                marginBottom: '1.5rem',
              }}
            >
              Añade tu primera cuenta para empezar a gestionar tus finanzas.
            </p>
            <PrimaryBtn onClick={openAdd}>
              <Plus size={15} />
              Crear primera cuenta
            </PrimaryBtn>
          </div>
        )}
      </div>
      {/* ── Modal de creación / edición ── */}
      {modal &&
        createPortal(
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
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: '1.5rem',
                boxShadow: T.cardShadowLg,
                width: '100%',
                maxWidth: '34rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'fadeSlideIn 0.2s ease both',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.5rem 0.75rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
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
                    {modal === 'add' ? 'Nueva cuenta' : 'Editar cuenta'}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    Introduce los datos de tu cuenta
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
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

              <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                <Field label="Nombre de la cuenta">
                  <Input
                    T={T}
                    placeholder="Ej: Cuenta nómina BBVA"
                    value={form.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </Field>

                <Field label="Saldo actual">
                  <Input
                    T={T}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm({
                        ...form,
                        balance: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    💡 Introduce el saldo que tenías en la fecha que elijas
                    abajo
                  </p>
                </Field>

                <Field label="Divisa de la cuenta">
                  <Sel
                    T={T}
                    value={form.currency}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code} — {c.name}
                      </option>
                    ))}
                  </Sel>
                  {modal !== 'add' &&
                    modal !== null &&
                    form.currency !==
                      (accounts.find((a) => a.id === modal)?.currency ??
                        baseCurrency) && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.625rem',
                          background: T.amberBg,
                          border: `1px solid ${T.amberBorder}`,
                          fontSize: '0.72rem',
                          color: T.amber,
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        ⚠️ Has cambiado la divisa de{' '}
                        <strong>
                          {accounts.find((a) => a.id === modal)?.currency ??
                            baseCurrency}
                        </strong>{' '}
                        a <strong>{form.currency}</strong>. Actualiza los
                        valores si es necesario.
                      </div>
                    )}
                </Field>

                <Field label="Fecha del saldo">
                  <Input
                    T={T}
                    type="date"
                    value={form.date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, date: e.target.value })
                    }
                  />
                  <p
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    📅 La app calculará tu saldo real desde esta fecha en
                    adelante
                  </p>
                </Field>

                <Field label="Saldo mínimo de alerta">
                  <Input
                    T={T}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.minBalance}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm({
                        ...form,
                        minBalance:
                          e.target.value === ''
                            ? ''
                            : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    🔔 Te avisaremos si el saldo cae por debajo de este importe
                  </p>
                </Field>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1.5rem',
                  }}
                >
                  <PrimaryBtn onClick={save} fullWidth>
                    <Check size={15} />
                    Guardar cuenta
                  </PrimaryBtn>
                  <SecondaryBtn onClick={() => setModal(null)} T={T}>
                    Cancelar
                  </SecondaryBtn>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* ── Confirm delete ── */}
      {confirmDelete && deleteImpact && (
        <ConfirmModal
          T={T}
          title="¿Eliminar cuenta?"
          message={`Vas a eliminar "${accToDelete?.name}"${
            deleteImpact.parts.length > 0
              ? ` y todos sus datos asociados: ${deleteImpact.parts.join(', ')}.`
              : '. No tiene datos asociados.'
          } Esta acción no se puede deshacer, pero siempre puedes restaurar desde una copia de seguridad.`}
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Coach Mark — primera visita ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Empieza por aquí"
          description="Añade tu primera cuenta con el saldo que tienes hoy. La app hará el seguimiento desde ese momento en adelante."
          onDismiss={coachMarkSeen}
          accentColor="#3b82f6"
        />
      )}

{showFirstWin && (
        <FirstWinToast
          type="account"
          onDone={() => {
            setShowFirstWin(false);
            localStorage.setItem('fh_setup_highlight', 'true');
            setTab('dashboard');
          }}
        />
      )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Mis Cuentas" />

    </div>
  );
}
