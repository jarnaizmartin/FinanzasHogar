import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { Projection } from '../types';
import {
  CURRENCIES,
  FREQUENCIES,
  fmt,
  today,
  fmtDateShort,
  fmtDateDMY,
  syncEndDateDay,
  convertAmount,
} from '../utils';
import {
  Card,
  ConfirmModal,
  Field,
  Input,
  Sel,
  PrimaryBtn,
  SecondaryBtn,
  GhostBtn,
  PrintButton,
  PrintHeader,
  PrintFooter,
  QuickCategoryModal,
} from '../components/UI';
import { FirstWinToast } from '../components/FirstWinToast';

const uid = () => crypto.randomUUID();

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  once: 'Una vez',
};

// ─── Tipo del formulario ──────────────────────────────────────────────────────
type ProjectionForm = {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  currency: string;
  frequency: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  notes: string;
  active: boolean;
  isRecurring: boolean;
  recurringDay: number;
  nextOverrideAmount: number | null;
};

export function Projections() {
  const {
    T,
    projections,
    setProjections,
    categories,
    accounts,
    displayCurrency,
    baseCurrency,
    rates,
    dateFormat,
    setTab,
    forecastAll,
    projFilterType,
    setProjFilterType,
    projFilterAccount,
    setProjFilterAccount,
    projSortBy,
    setProjSortBy,
  } = useApp();

  const toast = useToast();

  // ── Coach Mark ────────────────────────────────────────────────────────────
  const { seen: coachSeen, markSeen: coachMarkSeen } =
    useCoachMark('projections');
  const coachRef = useRef<HTMLDivElement>(null);

  // ── Estado con tipos explícitos ────────────────────────────────────────────
  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false); // ✅ FIX UX — panel avanzado
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [forecastMonthOffset, setForecastMonthOffset] = useState(0);
  const [view, setView] = useState<'list' | 'analysis'>(
    () =>
      (localStorage.getItem('fh_view_projections') as 'list' | 'analysis') ??
      'list'
  );

  // Reset offset si no hay proyecciones o al cambiar de vista
  useEffect(() => {
    if (projections.length === 0) setForecastMonthOffset(0);
  }, [projections.length, view]);

  // Filtros persistidos en contexto
  const filterType = projFilterType;
  const setFilterType = setProjFilterType;
  const filterAccount = projFilterAccount;
  const setFilterAccount = setProjFilterAccount;
  const sortBy = projSortBy;
  const setSortBy = setProjSortBy;

  const emptyForm: ProjectionForm = {
    name: '',
    type: 'expense',
    amount: '',
    currency: baseCurrency,
    frequency: 'monthly',
    startDate: today(),
    endDate: '',
    categoryId: '',
    accountId: accounts[0]?.id ?? '',
    toAccountId: '',
    notes: '',
    active: true,
    isRecurring: false,
    recurringDay: new Date().getDate(),
    nextOverrideAmount: null,
  };

  const [form, setForm] = useState<ProjectionForm>(emptyForm);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (!form.amount || +form.amount <= 0)
      e.amount = 'Introduce un importe válido';
    if (!form.accountId) e.accountId = 'Selecciona una cuenta origen';
    if (form.type === 'transfer') {
      if (!form.toAccountId) e.toAccountId = 'Selecciona una cuenta destino';
      if (form.toAccountId && form.toAccountId === form.accountId)
        e.toAccountId = 'Las cuentas deben ser diferentes';
    } else {
      if (!form.categoryId) e.categoryId = 'Selecciona una categoría';
    }
    if (form.endDate && form.endDate < form.startDate)
      e.endDate = 'La fecha fin debe ser posterior al inicio';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const existingProj =
      modal !== 'add' ? projections.find((p) => p.id === modal) : null;
    const preserveLastApplied = existingProj?.lastApplied === currentMonthKey;
    const isFirstProjection = modal === 'add' && projections.length === 0;

    const entry = {
      ...form,
      amount: +form.amount,
      categoryId: form.type === 'transfer' ? '__transfer__' : form.categoryId,
      toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
      isRecurring: form.isRecurring ?? false,
      recurringDay: form.isRecurring
        ? new Date(form.startDate + 'T00:00:00').getDate()
        : undefined,
      nextOverrideAmount: form.nextOverrideAmount ?? null,
      lastApplied: preserveLastApplied
        ? currentMonthKey
        : form.isRecurring
        ? existingProj?.lastApplied ?? undefined
        : undefined,
      id: modal === 'add' ? uid() : modal!,
    };

    if (modal === 'add') {
      setProjections((p) => [...p, entry]);
      toast('Proyección creada correctamente', 'success');
    } else {
      setProjections((p) =>
        p.map((x) => (x.id === modal ? { ...x, ...entry } : x))
      );
      toast('Proyección actualizada correctamente', 'success');
    }
    setModal(null);
    setForm(emptyForm);
    setErrors({});
    setShowAdvanced(false);
    if (isFirstProjection) setShowFirstWin(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setShowAdvanced(false);
    setModal('add');
  };

  const openEdit = (proj: Projection) => {
    setForm({
      name: proj.name,
      type: proj.type,
      amount: proj.amount.toString(),
      currency: proj.currency ?? baseCurrency,
      frequency: proj.frequency,
      startDate: proj.startDate,
      endDate: proj.endDate ?? '',
      categoryId: proj.categoryId === '__transfer__' ? '' : (proj.categoryId ?? ''),
      accountId: proj.accountId ?? accounts[0]?.id ?? '',
      toAccountId: proj.toAccountId ?? '',
      notes: proj.notes ?? '',
      active: proj.active ?? true,
      isRecurring: proj.isRecurring ?? false,
      recurringDay:
        proj.recurringDay ?? new Date(proj.startDate + 'T00:00:00').getDate(),
      nextOverrideAmount: proj.nextOverrideAmount ?? null,
    });
    setErrors({});
    setShowAdvanced(!!(proj.nextOverrideAmount || proj.isRecurring));
    setModal(proj.id);
  };

  const duplicate = (proj: Projection) => {
    const newProj = { ...proj, id: uid(), name: `${proj.name} (copia)` };
    setProjections((p) => [...p, newProj]);
    toast('Proyección duplicada', 'success');
  };

  const toggleActive = (id: string) => {
    setProjections((p) =>
      p.map((x) => (x.id === id ? { ...x, active: !(x.active ?? true) } : x))
    );
  };

  // ── Filtrado y ordenación ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...projections];
    if (filterType !== 'all') list = list.filter((p) => p.type === filterType);
    if (filterAccount !== 'all')
      list = list.filter((p) => p.accountId === filterAccount);
    list.sort((a, b) => {
      if (sortBy === 'date') return a.startDate.localeCompare(b.startDate);
      if (sortBy === 'amount') return b.amount - a.amount;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [projections, filterType, filterAccount, sortBy]);

  // ── Resumen global ─────────────────────────────────────────────────────────
  const globalStats = useMemo(() => {
    const active = projections.filter((p) => p.active !== false);
    const monthlyIncome = active
      .filter((p) => p.type === 'income')
      .reduce((s, p) => {
        const base = convertAmount(
          p.amount,
          p.currency ?? baseCurrency,
          displayCurrency,
          rates
        );
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        return s + base * (freq?.factor ?? 1);
      }, 0);
    const monthlyExpense = active
      .filter((p) => p.type === 'expense')
      .reduce((s, p) => {
        const base = convertAmount(
          p.amount,
          p.currency ?? baseCurrency,
          displayCurrency,
          rates
        );
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        return s + base * (freq?.factor ?? 1);
      }, 0);
    return {
      total: projections.length,
      active: active.length,
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
    };
  }, [projections, displayCurrency, rates, baseCurrency]);

  const printSubtitle = useMemo(() => {
    const parts: string[] = [];

    if (filterType !== 'all')
      parts.push(filterType === 'income' ? 'Tipo: Ingresos' : 'Tipo: Gastos');

    if (filterAccount !== 'all') {
      const acc = accounts.find((a) => a.id === filterAccount);
      if (acc) parts.push(`Cuenta: ${acc.name}`);
    }

    parts.push(
      `${globalStats.active} activa${globalStats.active !== 1 ? 's' : ''} de ${globalStats.total} proyección${globalStats.total !== 1 ? 'es' : ''}`
    );

    return parts.join(' · ');
  }, [filterType, filterAccount, accounts, globalStats.active, globalStats.total]);

  const topProjectedExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    projections
      .filter((p) => p.type === 'expense' && p.active !== false)
      .forEach((p) => {
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        map[p.categoryId] =
          (map[p.categoryId] || 0) + (freq ? p.amount / freq.months : 0);
      });
    return Object.entries(map)
      .map(([id, val]) => ({ cat: categories.find((c) => c.id === id), val }))
      .filter((x) => x.cat)
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [projections, categories]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fh-print-section">

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Proyecciones"
        subtitle={printSubtitle}
      />

      {/* ── Cabecera ── */}
      <div
        className="fh-no-print"
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
            Planificación
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
            Proyecciones
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Ingresos y gastos recurrentes previstos
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton
            T={T}
            documentTitle="Proyecciones"
            sectionTitle="Proyecciones"
            subtitle={printSubtitle}
          />
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nueva proyección
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Resumen global ── */}
      <div
        ref={coachRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          {
            label: 'Total proyecciones',
            value: `${globalStats.total}`,
            sub: `${globalStats.active} activas`,
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Ingresos/mes',
            value: fmt(
              globalStats.monthlyIncome,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Gastos/mes',
            value: fmt(
              globalStats.monthlyExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.red,
            bg: T.redBg ?? T.amberBg,
            border: T.redBorder ?? T.amberBorder,
          },
          {
            label: 'Neto/mes',
            value: fmt(
              Math.abs(globalStats.monthlyNet),
              displayCurrency,
              displayCurrency,
              rates
            ),
            prefix: globalStats.monthlyNet >= 0 ? '+' : '-',
            color: globalStats.monthlyNet >= 0 ? T.green : T.red,
            bg: globalStats.monthlyNet >= 0 ? T.greenBg : T.redBg ?? T.amberBg,
            border:
              globalStats.monthlyNet >= 0
                ? T.greenBorder
                : T.redBorder ?? T.amberBorder,
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
                fontSize: '1.1rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
              }}
            >
              {(item as any).prefix ?? ''}
              {item.value}
            </div>
            {(item as any).sub && (
              <div
                style={{
                  fontSize: '0.68rem',
                  color: item.color,
                  opacity: 0.7,
                  marginTop: '0.2rem',
                }}
              >
                {(item as any).sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sub-tabs ── */}
      <div
        className="fh-no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            borderRadius: '0.875rem',
            border: `1.5px solid ${T.cardBorder}`,
            padding: '0.25rem',
            background: T.pageBg,
          }}
        >
          {(
            [
              ['list', '📋', 'Lista'],
              ['analysis', '📊', 'Análisis'],
            ] as const
          ).map(([val, icon, label]) => (
            <button
              key={val}
              onClick={() => {
                setView(val);
                localStorage.setItem('fh_view_projections', val);
              }}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: view === val ? T.accent : 'transparent',
                color: view === val ? '#fff' : T.muted,
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        {view === 'analysis' && (
          <span style={{ fontSize: '0.75rem', color: T.muted }}>
            Previsión y distribución proyectada
          </span>
        )}
      </div>

      {view === 'list' && (
        <>
          {/* ── Filtros ── */}
          {projections.length > 0 && (
            <div
              className="fh-no-print"
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {(['all', 'income', 'expense'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    style={{
                      padding: '0.45rem 0.875rem',
                      borderRadius: '9999px',
                      border: `1.5px solid ${
                        filterType === t ? T.accent : T.cardBorder
                      }`,
                      background: filterType === t ? T.accentLight : T.pageBg,
                      color: filterType === t ? T.accent : T.muted,
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'all'
                      ? 'Todos'
                      : t === 'income'
                      ? '📈 Ingresos'
                      : '📉 Gastos'}
                  </button>
                ))}
              </div>

              {accounts.length > 1 && (
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  style={{
                    padding: '0.45rem 0.875rem',
                    borderRadius: '9999px',
                    border: `1.5px solid ${T.cardBorder}`,
                    background: T.pageBg,
                    color: T.muted,
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">Todas las cuentas</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'date' | 'amount' | 'name')
                }
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: '9999px',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.pageBg,
                  color: T.muted,
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  marginLeft: 'auto',
                }}
              >
                <option value="date">Ordenar por fecha</option>
                <option value="amount">Ordenar por importe</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>
          )}

          {/* ── Lista de proyecciones ── */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}
            >
              {filtered.map((proj) => {
                const cat = categories.find((c) => c.id === proj.categoryId);
                const acc = accounts.find((a) => a.id === proj.accountId);
                const toAcc = proj.toAccountId
                  ? accounts.find((a) => a.id === proj.toAccountId)
                  : null;
                const freq = FREQUENCIES.find(
                  (f) => f.value === proj.frequency
                );
                const monthlyAmt = convertAmount(
                  proj.amount * (freq?.factor ?? 1),
                  proj.currency ?? baseCurrency,
                  displayCurrency,
                  rates
                );
                const isActive = proj.active !== false;
                const isExpanded = expandedId === proj.id;

                return (
                  <Card
                    key={proj.id}
                    T={T}
                    style={{
                      opacity: isActive ? 1 : 0.55,
                      border: `1px solid ${
                        proj.type === 'income' ? T.greenBorder : T.cardBorder
                      }`,
                    }}
                  >
                    <div style={{ padding: '1.125rem 1.5rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        {/* Info principal */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.875rem',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '0.375rem',
                              height: '2.75rem',
                              borderRadius: '9999px',
                              background:
                                proj.type === 'income'
                                  ? T.green
                                  : proj.type === 'transfer'
                                  ? T.accent
                                  : T.red,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.2rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.925rem',
                                  fontWeight: 800,
                                  color: isActive ? T.title : T.muted,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '16rem',
                                }}
                              >
                                {proj.name}
                              </span>
                              <span
                                style={{
                                  padding: '0.1rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  background:
                                    proj.type === 'income'
                                      ? T.greenBg
                                      : proj.type === 'transfer'
                                      ? T.accentLight
                                      : T.redBg ?? T.amberBg,
                                  color:
                                    proj.type === 'income'
                                      ? T.green
                                      : proj.type === 'transfer'
                                      ? T.accent
                                      : T.red,
                                  border: `1px solid ${
                                    proj.type === 'income'
                                      ? T.greenBorder
                                      : proj.type === 'transfer'
                                      ? T.accent + '33'
                                      : T.redBorder ?? T.amberBorder
                                  }`,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {proj.type === 'income'
                                  ? '📈 Ingreso'
                                  : proj.type === 'transfer'
                                  ? '↔ Traspaso'
                                  : '📉 Gasto'}
                              </span>
                              {!isActive && (
                                <span
                                  style={{
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    background: T.pageBg,
                                    color: T.muted,
                                    border: `1px solid ${T.cardBorder}`,
                                  }}
                                >
                                  Pausada
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: T.muted,
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              {proj.type === 'transfer' ? (
                                <>
                                  <span>{acc?.name ?? '—'}</span>
                                  <span>→</span>
                                  <span>{toAcc?.name ?? '—'}</span>
                                </>
                              ) : (
                                <>
                                  {cat && <span>{cat.name}</span>}
                                  {acc && <span>· {acc.name}</span>}
                                </>
                              )}
                              <span>
                                ·{' '}
                                {FREQ_LABELS[proj.frequency] ?? proj.frequency}
                              </span>
                              {proj.endDate && (
                                <span>
                                  · hasta{' '}
                                  {fmtDateShort(proj.endDate, dateFormat)}
                                </span>
                              )}
                            </div>

                            {/* Badge recurrente */}
                            {proj.isRecurring && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  marginTop: '0.3rem',
                                  flexWrap: 'wrap',
                                }}
                              >
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
                                  🔄 Automático · día{' '}
                                  {new Date(
                                    proj.startDate + 'T00:00:00'
                                  ).getDate()}
                                </span>
                                {proj.lastApplied && (
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '9999px',
                                      background: T.greenBg,
                                      color: T.green,
                                      border: `1px solid ${T.greenBorder}`,
                                    }}
                                  >
                                    ✅ Aplicado: {proj.lastApplied}
                                  </span>
                                )}
                                {proj.hasDuplicateWarning && (
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '9999px',
                                      background: T.redBg ?? T.amberBg,
                                      color: T.red,
                                      border: `1px solid ${
                                        T.redBorder ?? T.amberBorder
                                      }`,
                                    }}
                                  >
                                    ⚠️ Posible duplicado ·{' '}
                                    {proj.duplicateWarningMonth}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Badge nextOverrideAmount */}
                            {proj.nextOverrideAmount && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  background: T.amberBg,
                                  color: T.amber,
                                  border: `1px solid ${T.amberBorder}`,
                                  marginTop: '0.3rem',
                                  display: 'inline-block',
                                }}
                              >
                                {(() => {
                                  const projAcc = accounts.find(
                                    (a) => a.id === proj.accountId
                                  );
                                  const currency =
                                    projAcc?.currency ?? baseCurrency;
                                  const symbol =
                                    CURRENCIES.find((c) => c.code === currency)
                                      ?.symbol ?? '';
                                  const amount = Number(
                                    proj.nextOverrideAmount
                                  ).toLocaleString('es-ES', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  });
                                  return `⚠️ Próximo cargo: ${symbol}${amount} ${currency}`;
                                })()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Importe */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: 800,
                              color:
                                proj.type === 'income'
                                  ? T.green
                                  : proj.type === 'transfer'
                                  ? T.accent
                                  : T.red,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {proj.type === 'income' ? '+' : proj.type === 'transfer' ? '↔' : '-'}
                            {fmt(
                              proj.amount,
                              proj.currency ?? baseCurrency,
                              proj.currency ?? baseCurrency,
                              rates
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: T.muted }}>
                            ≈{' '}
                            {fmt(
                              monthlyAmt,
                              displayCurrency,
                              displayCurrency,
                              rates
                            )}
                            /mes
                          </div>
                        </div>

                        {/* Acciones */}
                        <div
                          className="fh-no-print"
                          style={{
                            display: 'flex',
                            gap: '0.25rem',
                            flexShrink: 0,
                          }}
                        >
                          <GhostBtn
                            onClick={() =>
                              setExpandedId(isExpanded ? null : proj.id)
                            }
                            T={T}
                            title="Ver detalles"
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </GhostBtn>
                          <GhostBtn
                            onClick={() => duplicate(proj)}
                            T={T}
                            title="Duplicar"
                          >
                            <Copy size={14} />
                          </GhostBtn>
                          <GhostBtn
                            onClick={() => openEdit(proj)}
                            T={T}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </GhostBtn>
                          <GhostBtn
                            onClick={() => setConfirmDelete(proj.id)}
                            T={T}
                            color={T.red}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </GhostBtn>
                        </div>
                      </div>

                      {/* Panel expandido */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: `1px solid ${T.cardBorder}`,
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(12rem, 1fr))',
                            gap: '0.75rem',
                          }}
                        >
                          {[
                            {
                              label: 'Fecha inicio',
                              value: fmtDateDMY(proj.startDate, dateFormat),
                            },
                            {
                              label: 'Fecha fin',
                              value: proj.endDate
                                ? fmtDateDMY(proj.endDate, dateFormat)
                                : 'Sin límite',
                            },
                            {
                              label: 'Frecuencia',
                              value:
                                FREQ_LABELS[proj.frequency] ?? proj.frequency,
                            },
                            {
                              label: 'Divisa',
                              value: proj.currency ?? baseCurrency,
                            },
                            { label: 'Cuenta', value: acc?.name ?? '—' },
                            { label: 'Categoría', value: cat?.name ?? '—' },
                          ].map((item) => (
                            <div
                              key={item.label}
                              style={{
                                padding: '0.625rem 0.875rem',
                                borderRadius: '0.75rem',
                                background: T.pageBg,
                                border: `1px solid ${T.cardBorder}`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  color: T.muted,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginBottom: '0.2rem',
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.825rem',
                                  fontWeight: 700,
                                  color: T.title,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}

                          {proj.notes && (
                            <div
                              style={{
                                gridColumn: '1/-1',
                                padding: '0.625rem 0.875rem',
                                borderRadius: '0.75rem',
                                background: T.pageBg,
                                border: `1px solid ${T.cardBorder}`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  color: T.muted,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginBottom: '0.2rem',
                                }}
                              >
                                Notas
                              </div>
                              <div
                                style={{ fontSize: '0.825rem', color: T.body }}
                              >
                                {proj.notes}
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              gridColumn: '1/-1',
                              display: 'flex',
                              gap: '0.5rem',
                            }}
                          >
                            <button
                              onClick={() => toggleActive(proj.id)}
                              style={{
                                padding: '0.55rem 1rem',
                                borderRadius: '0.75rem',
                                border: `1.5px solid ${
                                  isActive ? T.amberBorder : T.greenBorder
                                }`,
                                background: isActive ? T.amberBg : T.greenBg,
                                color: isActive ? T.amber : T.green,
                                fontSize: '0.775rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {isActive
                                ? '⏸ Pausar proyección'
                                : '▶️ Reactivar proyección'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '6rem 2rem',
                color: T.muted,
              }}
            >
              <div
                style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}
              >
                📊
              </div>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                  marginBottom: '0.5rem',
                }}
              >
                {projections.length === 0
                  ? 'Todavía no tienes proyecciones'
                  : 'No hay proyecciones con estos filtros'}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: T.muted,
                  marginBottom: '1.5rem',
                  maxWidth: '28rem',
                  margin: '0 auto 1.5rem',
                }}
              >
                {projections.length === 0
                  ? 'Añade ingresos y gastos recurrentes para ver la proyección de tus finanzas.'
                  : 'Prueba a cambiar los filtros.'}
              </p>
              {projections.length === 0 && (
                <PrimaryBtn onClick={openAdd}>
                  <Plus size={15} />
                  Crear primera proyección
                </PrimaryBtn>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Vista: Análisis ── */}
      {view === 'analysis' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {projections.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '5rem 2rem',
                color: T.muted,
              }}
            >
              <div
                style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}
              >
                📊
              </div>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                  marginBottom: '0.5rem',
                }}
              >
                Aún no hay proyecciones para analizar
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: T.muted,
                  marginBottom: '1.5rem',
                }}
              >
                Crea algunas proyecciones primero y aquí verás el análisis
                completo.
              </p>
              <button
                onClick={() => setView('list')}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '0.875rem',
                  border: 'none',
                  background: T.accent,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Ir a la lista →
              </button>
            </div>
          ) : (
            <>
              {/* Previsión a 6 meses */}
              {/* ── Navegador de mes ── */}
              {(() => {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() + forecastMonthOffset);
                const raw = d.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                });
                const label = raw.charAt(0).toUpperCase() + raw.slice(1);
                const maxOffset = Math.max(0, forecastAll.length - 6);
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.875rem',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}33`,
                    }}
                  >
                    <button
                      onClick={() =>
                        setForecastMonthOffset((o) => Math.max(0, o - 1))
                      }
                      disabled={forecastMonthOffset <= 0}
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: '0.625rem',
                        border: `1px solid ${T.accent}44`,
                        background: T.cardBg,
                        color: forecastMonthOffset <= 0 ? T.muted : T.accent,
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        cursor:
                          forecastMonthOffset <= 0 ? 'default' : 'pointer',
                        opacity: forecastMonthOffset <= 0 ? 0.35 : 1,
                      }}
                    >
                      ←
                    </button>
                    <span
                      style={{
                        fontSize: '0.925rem',
                        fontWeight: 800,
                        color: T.accent,
                        textTransform: 'capitalize',
                        minWidth: '13rem',
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </span>
                    <button
                      onClick={() =>
                        setForecastMonthOffset((o) =>
                          Math.min(maxOffset, o + 1)
                        )
                      }
                      disabled={forecastMonthOffset >= maxOffset}
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: '0.625rem',
                        border: `1px solid ${T.accent}44`,
                        background: T.cardBg,
                        color:
                          forecastMonthOffset >= maxOffset ? T.muted : T.accent,
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        cursor:
                          forecastMonthOffset >= maxOffset
                            ? 'default'
                            : 'pointer',
                        opacity: forecastMonthOffset >= maxOffset ? 0.35 : 1,
                      }}
                    >
                      →
                    </button>
                  </div>
                );
              })()}
              <Card T={T} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: T.muted,
                      textTransform: 'uppercase',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Proyección global
                  </div>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: T.title,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Previsión a 6 meses — Todas las cuentas
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: T.tableHead,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        {[
                          'Mes',
                          'Ingresos',
                          'Gastos',
                          'Neto',
                          'Saldo est.',
                        ].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: i === 0 ? 'left' : 'right',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: T.muted,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {forecastAll
                        .slice(forecastMonthOffset, forecastMonthOffset + 6)
                        .map((m, i) => (
                          <tr
                            key={m.key}
                            style={{
                              background:
                                i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                              borderBottom: `1px solid ${T.tableBorder}`,
                            }}
                          >
                            <td
                              style={{
                                padding: '0.75rem 1.25rem',
                                fontWeight: 700,
                                color: T.title,
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {m.label}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1.25rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: T.green,
                              }}
                            >
                              {fmt(
                                m.income,
                                displayCurrency,
                                baseCurrency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1.25rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: T.red,
                              }}
                            >
                              {fmt(
                                m.expense,
                                displayCurrency,
                                baseCurrency,
                                rates
                              )}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1.25rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: m.net >= 0 ? T.green : T.red,
                              }}
                            >
                              {m.net >= 0 ? '+' : ''}
                              {fmt(m.net, displayCurrency, baseCurrency, rates)}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1.25rem',
                                textAlign: 'right',
                                fontWeight: 800,
                                color: T.accent,
                              }}
                            >
                              {fmt(
                                m.runningBalance,
                                displayCurrency,
                                baseCurrency,
                                rates
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Distribución proyectada por categoría */}
              {topProjectedExpenses.length > 0 && (
                <Card T={T}>
                  <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: T.muted,
                        textTransform: 'uppercase',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Distribución
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 800,
                        color: T.title,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Gastos proyectados por categoría
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0 1.75rem 1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {topProjectedExpenses.map(({ cat, val }) => {
                      const maxVal = Math.max(
                        ...topProjectedExpenses.map((x) => x.val),
                        1
                      );
                      return (
                        <div key={cat!.id}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.4rem',
                            }}
                          >
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.825rem',
                                fontWeight: 600,
                                color: T.body,
                              }}
                            >
                              <span
                                style={{
                                  width: '0.625rem',
                                  height: '0.625rem',
                                  borderRadius: '50%',
                                  background: cat!.color,
                                  display: 'inline-block',
                                  flexShrink: 0,
                                }}
                              />
                              {cat!.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.825rem',
                                fontWeight: 700,
                                color: T.title,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {fmt(val, displayCurrency, baseCurrency, rates)}
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: T.muted,
                                  fontWeight: 400,
                                }}
                              >
                                /mes
                              </span>
                            </span>
                          </div>
                          <div
                            style={{
                              height: '0.375rem',
                              borderRadius: '9999px',
                              background: T.pageBg,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: '9999px',
                                background: cat!.color,
                                width: `${(val / maxVal) * 100}%`,
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modal creación / edición ── */}
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
                maxWidth: '36rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'fadeSlideIn 0.2s ease both',
              }}
            >
              {/* Cabecera sticky */}
              <div
                style={{
                  padding: '1rem 1.5rem 0.75rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'sticky',
                  top: 0,
                  background: T.cardBg,
                  zIndex: 1,
                  borderRadius: '1.5rem 1.5rem 0 0',
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
                    {modal === 'add' ? 'Nueva proyección' : 'Editar proyección'}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    Planifica ingresos y gastos recurrentes
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModal(null);
                    setErrors({});
                    setShowAdvanced(false);
                  }}
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

              <div
                style={{
                  padding: '1rem 1.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Nombre */}
                <Field label="Nombre" error={errors.name}>
                  <Input
                    T={T}
                    error={errors.name}
                    placeholder="Ej: Alquiler mensual"
                    value={form.name}
                    autoFocus
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setErrors((er) => ({ ...er, name: undefined as any }));
                    }}
                  />
                </Field>

                {/* Importe y divisa */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <Field label="Importe" error={errors.amount}>
                    <Input
                      T={T}
                      error={errors.amount}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setForm((f) => ({ ...f, amount: e.target.value }));
                        setErrors((er) => ({
                          ...er,
                          amount: undefined as any,
                        }));
                      }}
                    />
                  </Field>
                  <Field label="Divisa">
                    <Sel
                      T={T}
                      value={form.currency}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setForm((f) => ({ ...f, currency: e.target.value }))
                      }
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </option>
                      ))}
                    </Sel>
                  </Field>
                </div>

                {/* Frecuencia */}
                <Field label="Frecuencia">
                  <Sel
                    T={T}
                    value={form.frequency}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setForm((f) => ({ ...f, frequency: e.target.value }))
                    }
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {FREQ_LABELS[f.value] ?? f.value}
                      </option>
                    ))}
                  </Sel>
                </Field>

                {/* Fechas */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <Field label="Fecha inicio">
                    <Input
                      T={T}
                      type="date"
                      value={form.startDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const newStart = e.target.value;
                        setForm((f) => ({
                          ...f,
                          startDate: newStart,
                          endDate: f.endDate
                            ? syncEndDateDay(newStart, f.endDate)
                            : f.endDate,
                          recurringDay: f.isRecurring
                            ? new Date(newStart + 'T00:00:00').getDate()
                            : f.recurringDay,
                        }));
                      }}
                    />
                  </Field>
                  <Field label="Fecha fin (opcional)" error={errors.endDate}>
                    <Input
                      T={T}
                      error={errors.endDate}
                      type="date"
                      value={form.endDate}
                      min={form.startDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value;
                        const synced = val
                          ? syncEndDateDay(form.startDate, val)
                          : val;
                        setForm((f) => ({ ...f, endDate: synced }));
                        setErrors((er) => ({
                          ...er,
                          endDate: undefined as any,
                        }));
                      }}
                    />
                  </Field>
                </div>

                {/* Info día de cobro */}
                {form.startDate && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: T.muted,
                      padding: '0.6rem 0.875rem',
                      borderRadius: '0.625rem',
                      background: T.pageBg,
                      border: `1px solid ${T.cardBorder}`,
                    }}
                  >
                    📅 El día de cobro/pago será el{' '}
                    <strong style={{ color: T.body }}>
                      día {new Date(form.startDate + 'T00:00:00').getDate()}
                    </strong>{' '}
                    de cada período
                    {form.isRecurring && ' (cargo automático)'}
                    {form.endDate && `. Finaliza el ${form.endDate}`}.
                  </div>
                )}

                {/* Cuenta origen */}
                <Field label={form.type === 'transfer' ? 'Cuenta origen *' : 'Cuenta *'} error={errors.accountId}>
                  <Sel
                    T={T}
                    value={form.accountId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      setForm((f) => ({ ...f, accountId: e.target.value }));
                      setErrors((er) => ({
                        ...er,
                        accountId: undefined as any,
                      }));
                    }}
                  >
                    <option value="">— Selecciona una cuenta —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} disabled={form.type === 'transfer' && a.id === form.toAccountId}>
                        {a.name}
                      </option>
                    ))}
                  </Sel>
                </Field>

                {/* Cuenta destino — solo para transferencias */}
                {form.type === 'transfer' && (
                  <Field label="Cuenta destino *" error={errors.toAccountId}>
                    <Sel
                      T={T}
                      value={form.toAccountId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        setForm((f) => ({ ...f, toAccountId: e.target.value }));
                        setErrors((er) => ({ ...er, toAccountId: undefined as any }));
                      }}
                    >
                      <option value="">— Selecciona una cuenta —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id} disabled={a.id === form.accountId}>
                          {a.name}
                        </option>
                      ))}
                    </Sel>
                  </Field>
                )}

                {/* Tipo */}
                <Field label="Tipo de movimiento">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.625rem',
                    }}
                  >
                    {[
                      { val: 'income'   as const, icon: '📈', label: 'Ingreso',       color: T.green,  bg: T.greenBg,            border: T.greenBorder },
                      { val: 'expense'  as const, icon: '📉', label: 'Gasto',         color: T.red,    bg: T.redBg ?? T.amberBg, border: T.redBorder ?? T.amberBorder },
                      { val: 'transfer' as const, icon: '↔',  label: 'Traspaso entre cuentas', color: T.accent, bg: T.accentLight,        border: T.accent + '33' },
                    ].map(({ val, icon, label, color, bg }) => (
                      <div
                        key={val}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            type: val,
                            categoryId: '',
                            toAccountId: val !== 'transfer' ? '' : f.toAccountId,
                          }))
                        }
                        style={{
                          padding: '0.875rem 0.5rem',
                          borderRadius: '0.875rem',
                          cursor: 'pointer',
                          border: `2px solid ${form.type === val ? color : T.cardBorder}`,
                          background: form.type === val ? bg : T.pageBg,
                          display: 'flex',
                          alignItems: 'center',
                          flexDirection: 'column',
                          gap: '0.375rem',
                          transition: 'all 0.15s',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: form.type === val ? color : T.muted }}>
                          {label}
                        </span>
                        {form.type === val && <Check size={12} color={color} />}
                      </div>
                    ))}
                  </div>
                </Field>

                {/* Categoría — oculta para transferencias */}
                {form.type !== 'transfer' && (<Field label="Categoría *" error={errors.categoryId}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Sel
                        T={T}
                        value={form.categoryId}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          setForm((f) => ({
                            ...f,
                            categoryId: e.target.value,
                          }));
                          setErrors((er) => ({
                            ...er,
                            categoryId: undefined as any,
                          }));
                        }}
                      >
                        <option value="">— Selecciona una categoría —</option>
                        {categories
                          .filter((c) => c.type === form.type)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </Sel>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickCategory(true)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.75rem',
                        border: `1.5px solid ${T.accent}44`,
                        background: T.accentLight,
                        color: T.accent,
                        fontSize: '1rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                  {/* ✅ FIX UX — aviso si no hay categorías del tipo seleccionado */}
                  {categories.filter((c) => c.type === form.type).length ===
                    0 && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.75rem',
                        background: T.amberBg,
                        border: `1px solid ${T.amberBorder}`,
                        fontSize: '0.775rem',
                        color: T.amber,
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️ No tienes categorías de{' '}
                      {form.type === 'income' ? 'ingresos' : 'gastos'} todavía.
                      Créala con el botón <strong>+</strong>.
                    </div>
                  )}
                </Field>)}

                {form.type !== 'transfer' && showQuickCategory && (
                  <QuickCategoryModal
                    T={T}
                    defaultType={form.type as 'income' | 'expense'}
                    onSave={(newCat) => {
                      setForm((f) => ({ ...f, categoryId: newCat.id }));
                      setShowQuickCategory(false);
                    }}
                    onClose={() => setShowQuickCategory(false)}
                  />
                )}

                {/* Notas */}
                <Field label="Notas (opcional)">
                  <textarea
                    placeholder="Descripción opcional..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${T.inputBorder}`,
                      background: T.inputBg,
                      color: T.inputText,
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </Field>

                {/* ✅ FIX UX — Opciones avanzadas colapsibles */}
                <div
                  style={{
                    borderRadius: '0.875rem',
                    border: `1.5px solid ${
                      showAdvanced ? T.accent : T.cardBorder
                    }`,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: showAdvanced ? T.accentLight : T.pageBg,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: showAdvanced ? T.accent : T.title,
                        }}
                      >
                        ⚙️ Opciones avanzadas
                      </span>
                      {(form.isRecurring || form.nextOverrideAmount) && (
                        <span
                          style={{
                            padding: '0.1rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            background: T.accent,
                            color: '#fff',
                          }}
                        >
                          {[
                            form.isRecurring && 'Automático',
                            form.nextOverrideAmount && 'Ajuste próximo mes',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                    {showAdvanced ? (
                      <ChevronUp size={16} color={T.accent} />
                    ) : (
                      <ChevronDown size={16} color={T.muted} />
                    )}
                  </button>

                  {showAdvanced && (
                    <div
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                      }}
                    >
                      {/* Toggle cargo fijo automático */}
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: '0.875rem',
                          background: form.isRecurring
                            ? T.accentLight
                            : T.pageBg,
                          border: `1.5px solid ${
                            form.isRecurring ? T.accent : T.cardBorder
                          }`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.isRecurring ?? false}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                isRecurring: e.target.checked,
                              }))
                            }
                            style={{
                              width: '1.125rem',
                              height: '1.125rem',
                              cursor: 'pointer',
                              accentColor: T.accent,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: form.isRecurring ? T.accent : T.title,
                              }}
                            >
                              🔄 Es un movimiento fijo confirmado
                            </div>
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: T.muted,
                                marginTop: '0.1rem',
                              }}
                            >
                              Se generará como un movimiento real
                              automáticamente al vencer
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Ajuste puntual próximo mes */}
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: '0.875rem',
                          background: form.nextOverrideAmount
                            ? T.amberBg
                            : T.pageBg,
                          border: `1.5px solid ${
                            form.nextOverrideAmount
                              ? T.amberBorder
                              : T.cardBorder
                          }`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: form.nextOverrideAmount ? T.amber : T.muted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.35rem',
                          }}
                        >
                          💶 Ajuste para el próximo mes (opcional)
                        </div>
                        <div
                          style={{
                            fontSize: '0.775rem',
                            color: T.muted,
                            marginBottom: '0.625rem',
                            lineHeight: 1.5,
                          }}
                        >
                          Si este mes el importe será diferente al habitual,
                          indícalo aquí. El siguiente mes volverá
                          automáticamente al importe habitual.
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder={`Importe habitual: ${
                            form.amount || '0.00'
                          }`}
                          value={form.nextOverrideAmount ?? ''}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              nextOverrideAmount: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            }))
                          }
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.875rem',
                            borderRadius: '0.75rem',
                            border: `1.5px solid ${
                              form.nextOverrideAmount
                                ? T.amberBorder
                                : T.inputBorder
                            }`,
                            background: T.inputBg,
                            color: T.inputText,
                            fontSize: '0.875rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {form.nextOverrideAmount && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.625rem',
                              background: T.amberBg,
                              border: `1px solid ${T.amberBorder}`,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.775rem',
                                color: T.amber,
                                fontWeight: 600,
                              }}
                            >
                              ⚠️ Próximo mes:{' '}
                              <strong>
                                {CURRENCIES.find(
                                  (c) =>
                                    c.code ===
                                    (accounts.find(
                                      (a) => a.id === form.accountId
                                    )?.currency ?? baseCurrency)
                                )?.symbol ?? ''}
                                {Number(form.nextOverrideAmount).toLocaleString(
                                  'es-ES',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}{' '}
                                {accounts.find((a) => a.id === form.accountId)
                                  ?.currency ?? baseCurrency}
                              </strong>
                            </span>
                            <button
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  nextOverrideAmount: null,
                                }))
                              }
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.5rem',
                                border: `1px solid ${T.amberBorder}`,
                                background: 'transparent',
                                color: T.amber,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Quitar ajuste
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Toggle proyección activa */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.875rem',
                    background: T.pageBg,
                    border: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: T.title,
                      }}
                    >
                      Proyección activa
                    </div>
                    <div style={{ fontSize: '0.72rem', color: T.muted }}>
                      Las proyecciones pausadas no se incluyen en los cálculos
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, active: !f.active }))
                    }
                    style={{
                      width: '3rem',
                      height: '1.625rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: form.active ? T.accent : T.cardBorder,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.1875rem',
                        left: form.active ? '1.4375rem' : '0.1875rem',
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>

                {/* Botones */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <PrimaryBtn onClick={save} fullWidth>
                    <Check size={15} />
                    {modal === 'add' ? 'Crear proyección' : 'Guardar cambios'}
                  </PrimaryBtn>
                  <SecondaryBtn
                    onClick={() => {
                      setModal(null);
                      setErrors({});
                      setShowAdvanced(false);
                    }}
                    T={T}
                  >
                    Cancelar
                  </SecondaryBtn>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar proyección?"
          message={`Vas a eliminar "${
            projections.find((p) => p.id === confirmDelete)?.name
          }". Esta acción no se puede deshacer.`}
          onConfirm={() => {
            setProjections((p) => p.filter((x) => x.id !== confirmDelete));
            toast('Proyección eliminada', 'success');
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Coach Mark — primera visita ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Tu previsión financiera"
          description="Define aquí tu nómina y tus gastos fijos. La app calculará si llegas a fin de mes antes de que ocurra."
          onDismiss={coachMarkSeen}
          accentColor="#7c3aed"
        />
      )}
      {showFirstWin && (
        <FirstWinToast
          type="projection"
          onDone={() => {
            setShowFirstWin(false);
            localStorage.setItem('fh_setup_highlight', 'true');
            setTab('dashboard');
          }}
        />
      )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Proyecciones" />

    </div>
  );
}
