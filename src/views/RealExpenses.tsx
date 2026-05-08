import { useState, useMemo, useEffect, useRef, type ChangeEvent } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Receipt,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { RealExpense } from '../types';
import { CURRENCIES, convertAmount, fmt, today, fmtDateShort } from '../utils';
import {
  Card,
  ConfirmModal,
  Field,
  Input,
  Sel,
  PrimaryBtn,
  SecondaryBtn,
  GhostBtn,
  Badge,
  PrintButton,
  PrintHeader,
  PrintFooter,
  QuickCategoryModal,
} from '../components/UI';
import { BankImportModal } from '../BankImportModal';
import { FirstWinToast } from '../components/FirstWinToast';
import { ProjectedVsReal } from './ProjectedVsReal';

const uid = () => crypto.randomUUID();

export function RealExpenses() {
  const {
    T,
    accounts,
    setAccounts,
    categories,
    baseCurrency,
    displayCurrency,
    rates,
    realExpenses,
    setRealExpenses,
    realFilterType,
    setRealFilterType,
    realFilterAccount,
    setRealFilterAccount,
    realFilterCategory,
    setRealFilterCategory,
    realFilterDateMode,
    setRealFilterDateMode,
    realFilterPreset,
    setRealFilterPreset,
    realFilterDateFrom,
    setRealFilterDateFrom,
    realFilterDateTo,
    setRealFilterDateTo,
    realAccountFilter,
    setRealAccountFilter,
    realReturnTo,
    setRealReturnTo,
    dateFormat,
    setTab,
  } = useApp();

  const toast = useToast();

  // ── Coach Mark ────────────────────────────────────────────────────────────
  const { seen: coachSeen, markSeen: coachMarkSeen } = useCoachMark('real');
  const coachRef = useRef<HTMLButtonElement>(null);

  // ── Estado ────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [warningModal, setWarningModal] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [analysisMonthOffset, setAnalysisMonthOffset] = useState(0);

  // ── Sub-tab view ──────────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'analysis'>(
    () =>
      (localStorage.getItem('fh_view_real') as 'list' | 'analysis') ?? 'list'
  );

  // Aliases locales para los filtros persistidos en contexto
  const filterType = realFilterType;
  const setFilterType = setRealFilterType;
  const filterAccount = realFilterAccount;
  const setFilterAccount = setRealFilterAccount;
  const filterCategory = realFilterCategory;
  const setFilterCategory = setRealFilterCategory;
  const filterDateMode = realFilterDateMode;
  const setFilterDateMode = setRealFilterDateMode;
  const filterPreset = realFilterPreset;
  const setFilterPreset = setRealFilterPreset;
  const filterDateFrom = realFilterDateFrom;
  const setFilterDateFrom = setRealFilterDateFrom;
  const filterDateTo = realFilterDateTo;
  const setFilterDateTo = setRealFilterDateTo;

  // Cuando se navega a esta pestaña con una cuenta específica (desde Cuentas,
  // LoanDetailView, etc.) aplicamos el filtro de cuenta y reseteamos el resto
  // para garantizar que el usuario vea TODOS los movimientos de esa cuenta.
  useEffect(() => {
    if (realAccountFilter && realAccountFilter !== 'all') {
      setFilterAccount(realAccountFilter);
      setFilterType('all');
      setFilterCategory('all');
      setFilterPreset('all');
      setFilterDateMode('preset');
      setFilterDateFrom('');
      setFilterDateTo('');
      setRealAccountFilter('all');
    }
  }, [realAccountFilter]);

  const emptyForm = {
    entryDate: today(),
    valueDate: today(),
    description: '',
    categoryId: '',
    amount: '',
    currency: accounts[0]?.currency ?? baseCurrency,
    type: 'expense' as 'income' | 'expense',
    accountId: accounts[0]?.id ?? '',
    notes: '',
  };

  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const handleAccountChange = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    setForm((f) => ({
      ...f,
      accountId,
      currency: acc?.currency ?? baseCurrency,
    }));
    setErrors((e) => ({ ...e, accountId: undefined as any }));
  };

  const openAdd = () => {
    const firstAcc = accounts[0];
    setForm({
      ...emptyForm,
      accountId: firstAcc?.id ?? '',
      currency: firstAcc?.currency ?? baseCurrency,
    });
    setErrors({});
    setModal('add');
  };

  const openEdit = (expense: RealExpense) => {
    setForm({ ...expense, amount: expense.amount.toFixed(2) });
    setErrors({});
    setModal(expense.id);
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.description.trim())
      e.description = 'La descripción es obligatoria';
    if (!form.accountId) e.accountId = 'Debes seleccionar una cuenta';
    if (!form.categoryId) e.categoryId = 'Debes seleccionar una categoría';
    if (!form.amount || +form.amount <= 0)
      e.amount = 'Introduce un importe válido';
    if (!form.entryDate) e.entryDate = 'La fecha de apunte es obligatoria';
    if (!form.valueDate) e.valueDate = 'La fecha de valor es obligatoria';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const entry = { ...form, amount: +form.amount };
    const linkedAccount = accounts.find((a) => a.id === form.accountId);
    const isBeforeBase = linkedAccount && form.valueDate <= linkedAccount.date;
    const isFirstExpense = modal === 'add' && realExpenses.length === 0;

    if (modal === 'add') {
      setRealExpenses((p) => [...p, { ...entry, id: uid() }]);
      if (isBeforeBase) {
        setWarningModal(
          `El movimiento se ha guardado correctamente, pero su fecha de valor (${form.valueDate}) es anterior o igual a la fecha del saldo base de la cuenta "${linkedAccount.name}" (${linkedAccount.date}).\n\nEste movimiento NO se aplicará al saldo real calculado, ya que se considera incluido en el saldo base que introdujiste.`
        );
      } else {
        toast('Movimiento registrado correctamente', 'success');
      }
    } else {
      setRealExpenses((p) =>
        p.map((x) => (x.id === modal ? { ...x, ...entry } : x))
      );
      if (isBeforeBase) {
        setWarningModal(
          `El movimiento se ha actualizado correctamente, pero su fecha de valor (${form.valueDate}) es anterior o igual a la fecha del saldo base de la cuenta "${linkedAccount.name}" (${linkedAccount.date}).\n\nEste movimiento NO se aplicará al saldo real calculado, ya que se considera incluido en el saldo base que introdujiste.`
        );
      } else {
        toast('Movimiento actualizado correctamente', 'success');
      }
    }
    setModal(null);
    if (isFirstExpense) setShowFirstWin(true);
  };

  const del = (id: string) => setConfirmDelete(id);

  const confirmDel = () => {
    const deletedId = confirmDelete!;
    setRealExpenses((p) => p.filter((x) => x.id !== deletedId));
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        acknowledgedExpenseIds: (a.acknowledgedExpenseIds ?? []).filter(
          (id) => id !== deletedId
        ),
      }))
    );
    toast('Movimiento eliminado', 'success');
    setConfirmDelete(null);
  };

  const expenseToDelete = realExpenses.find((e) => e.id === confirmDelete);

  const dismissDuplicateWarning = (id: string) => {
    setRealExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, isDuplicateWarning: false, duplicateReviewed: true }
          : e
      )
    );
  };

  // ── Rango de fechas ───────────────────────────────────────────────────────
  const activeDateRange = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (filterDateMode === 'range')
      return { from: filterDateFrom || null, to: filterDateTo || null };

    switch (filterPreset) {
      case 'this_month':
        return {
          from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
          to: ymd(now),
        };
      case 'last_month': {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
          to: ymd(last),
        };
      }
      case 'last_3': {
        const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return {
          from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
          to: ymd(now),
        };
      }
      case 'last_6': {
        const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return {
          from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
          to: ymd(now),
        };
      }
      case 'this_year':
        return { from: `${now.getFullYear()}-01-01`, to: ymd(now) };
      default:
        return { from: null, to: null };
    }
  }, [filterDateMode, filterPreset, filterDateFrom, filterDateTo]);

  const filtered = useMemo(
    () =>
      realExpenses
        .filter((e) => filterType === 'all' || e.type === filterType)
        .filter((e) => filterAccount === 'all' || e.accountId === filterAccount)
        .filter(
          (e) => filterCategory === 'all' || e.categoryId === filterCategory
        )
        .filter((e) => {
          if (!activeDateRange.from && !activeDateRange.to) return true;
          const d = e.entryDate;
          if (activeDateRange.from && d < activeDateRange.from) return false;
          if (activeDateRange.to && d > activeDateRange.to) return false;
          return true;
        })
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate)),
    [realExpenses, filterType, filterAccount, filterCategory, activeDateRange]
  );

  const totalIncome = useMemo(
    () =>
      filtered
        .filter((e) => e.type === 'income' && !e.isTransfer)
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, displayCurrency, rates),
          0
        ),
    [filtered, displayCurrency, rates]
  );

  const totalExpense = useMemo(
    () =>
      filtered
        .filter((e) => e.type === 'expense' && !e.isTransfer)
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, displayCurrency, rates),
          0
        ),
    [filtered, displayCurrency, rates]
  );

  // ── Top categorías de gasto — mes actual ──────────────────────────────────
  const topRealCategories = useMemo(() => {
    const now = new Date();
    const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    const map: Record<string, number> = {};
    realExpenses
    .filter((e) => e.type === 'expense' && e.entryDate.slice(0, 7) === mk)
    .forEach((e) => {
        map[e.categoryId] =
          (map[e.categoryId] || 0) +
          convertAmount(e.amount, e.currency, displayCurrency, rates);
      });
    return Object.entries(map)
      .map(([id, val]) => ({ cat: categories.find((c) => c.id === id), val }))
      .filter((x) => x.cat)
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [realExpenses, categories, displayCurrency, rates]);

  const currencySymbol = (code: string): string =>
    CURRENCIES.find((c) => c.code === code)?.symbol ?? code;

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAccount !== 'all' ||
    filterCategory !== 'all' ||
    filterPreset !== 'all' ||
    filterDateFrom !== '' ||
    filterDateTo !== '';

    const printSubtitle = useMemo(() => {
      const parts: string[] = [];
    
      if (filterType !== 'all')
        parts.push(filterType === 'income' ? 'Tipo: Ingresos' : 'Tipo: Gastos');
    
      if (filterAccount !== 'all') {
        const acc = accounts.find((a) => a.id === filterAccount);
        if (acc) parts.push(`Cuenta: ${acc.name}`);
      }
    
      if (filterCategory !== 'all') {
        const cat = categories.find((c) => c.id === filterCategory);
        if (cat) parts.push(`Categoría: ${cat.name}`);
      }
    
      if (filterDateMode === 'range' && (filterDateFrom || filterDateTo)) {
        parts.push(`Período: ${filterDateFrom || '…'} → ${filterDateTo || '…'}`);
      } else if (filterPreset !== 'all') {
        const labels: Record<string, string> = {
          this_month: 'Este mes',
          last_month: 'Mes anterior',
          last_3: 'Últimos 3 meses',
          last_6: 'Últimos 6 meses',
          this_year: 'Este año',
        };
        parts.push(`Período: ${labels[filterPreset] ?? filterPreset}`);
      }
    
      parts.push(`${filtered.length} movimiento${filtered.length !== 1 ? 's' : ''}`);
    
      return parts.join(' · ');
    }, [
      filterType,
      filterAccount,
      filterCategory,
      filterDateMode,
      filterPreset,
      filterDateFrom,
      filterDateTo,
      filtered.length,
      accounts,
      categories,
    ]);
    
    const clearAllFilters = () => {
    setFilterType('all');
    setFilterAccount('all');
    setFilterCategory('all');
    setFilterPreset('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateMode('preset');
  };

  return (
    <div className="fh-print-section">

      {/* ── Botón "Volver a..." contextual ──────────────────────────────────
          Solo aparece si se llegó a esta vista desde otra pantalla (Cuentas,
          detalle de préstamo, detalle de tarjeta...). Si se accede directamente
          desde el menú principal, no se muestra. */}
      {realReturnTo && (
        <button
          className="fh-no-print"
          onClick={() => {
            const target = realReturnTo;
            setRealReturnTo(null);
            setTab(target.tab);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.65rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.muted,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          ← Volver a {realReturnTo.label}
        </button>
      )}

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Movimientos Reales"
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
            Seguimiento
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
            Movimientos Reales
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Registra tus movimientos de ingresos y gastos
          </p>
        </div>
        <div
          ref={coachRef}
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
<PrintButton
  T={T}
  documentTitle="Movimientos_Reales"
  sectionTitle="Movimientos Reales"
  subtitle={printSubtitle}
/>
          <button
            onClick={() => setShowImport(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.125rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.greenBorder}`,
              background: T.greenBg,
              color: T.green,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📥 Cargar extracto del banco
          </button>
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} /> Nuevo movimiento
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Resumen de totales ── */}
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
            label: 'Total ingresos',
            value: fmt(totalIncome, displayCurrency, displayCurrency, rates),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Total gastos',
            value: fmt(totalExpense, displayCurrency, displayCurrency, rates),
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
          },
          {
            label: 'Balance real',
            value: fmt(
              totalIncome - totalExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: totalIncome - totalExpense >= 0 ? T.green : T.red,
            bg: totalIncome - totalExpense >= 0 ? T.greenBg : T.redBg,
            border:
              totalIncome - totalExpense >= 0 ? T.greenBorder : T.redBorder,
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
                fontSize: '0.7rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.4rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.03em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
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
                localStorage.setItem('fh_view_real', val);
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
            Proyectado vs real por mes
          </span>
        )}
      </div>

      {/* ── Vista: Lista ── */}
      {view === 'list' && (
        <>
          {/* Filtros */}
          <div className="fh-no-print" style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.5rem',
                borderRadius: '1rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}33`,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.375rem',
                  color: T.muted,
                  flexShrink: 0,
                }}
              >
                <Filter size={14} />
              </div>
              <div
                style={{
                  width: '1px',
                  height: '1.25rem',
                  background: T.cardBorder,
                  flexShrink: 0,
                }}
              />

              {/* Tipo */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['all', 'income', 'expense'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterType(v)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      border: 'none',
                      background: filterType === v ? T.accent : 'transparent',
                      color: filterType === v ? '#fff' : T.muted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v === 'all'
                      ? 'Todos'
                      : v === 'income'
                      ? '📈 Ingresos'
                      : '📉 Gastos'}
                  </button>
                ))}
              </div>
              <div
                style={{
                  width: '1px',
                  height: '1.25rem',
                  background: T.cardBorder,
                  flexShrink: 0,
                }}
              />

              {/* Cuenta */}
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                style={{
                  padding: '0.35rem 0.625rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${
                    filterAccount !== 'all' ? T.accent : 'transparent'
                  }`,
                  background:
                    filterAccount !== 'all' ? T.accentLight : 'transparent',
                  color: filterAccount !== 'all' ? T.accent : T.muted,
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todas las cuentas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  width: '1px',
                  height: '1.25rem',
                  background: T.cardBorder,
                  flexShrink: 0,
                }}
              />

              {/* Categoría */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '0.35rem 0.625rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${
                    filterCategory !== 'all' ? T.accent : 'transparent'
                  }`,
                  background:
                    filterCategory !== 'all' ? T.accentLight : 'transparent',
                  color: filterCategory !== 'all' ? T.accent : T.muted,
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  width: '1px',
                  height: '1.25rem',
                  background: T.cardBorder,
                  flexShrink: 0,
                }}
              />

              {/* Fechas */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <select
                  value={
                    filterDateMode === 'range' ? '__range__' : filterPreset
                  }
                  onChange={(e) => {
                    if (e.target.value === '__range__') {
                      setFilterDateMode('range');
                    } else {
                      setFilterDateMode('preset');
                      setFilterPreset(e.target.value);
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }
                  }}
                  style={{
                    padding: '0.35rem 0.625rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${
                      filterPreset !== 'all' || filterDateMode === 'range'
                        ? T.accent
                        : 'transparent'
                    }`,
                    background:
                      filterPreset !== 'all' || filterDateMode === 'range'
                        ? T.accentLight
                        : 'transparent',
                    color:
                      filterPreset !== 'all' || filterDateMode === 'range'
                        ? T.accent
                        : T.muted,
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Todas las fechas</option>
                  <option value="this_month">Este mes</option>
                  <option value="last_month">Mes anterior</option>
                  <option value="last_3">Últimos 3 meses</option>
                  <option value="last_6">Últimos 6 meses</option>
                  <option value="this_year">Este año</option>
                  <option value="__range__">Rango personalizado…</option>
                </select>
                {filterDateMode === 'range' && (
                  <>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: T.inputBg,
                        color: T.inputText,
                        fontSize: '0.72rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: T.muted }}>
                      →
                    </span>
                    <input
                      type="date"
                      value={filterDateTo}
                      min={filterDateFrom}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: T.inputBg,
                        color: T.inputText,
                        fontSize: '0.72rem',
                        outline: 'none',
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Chips filtros activos */}
            {hasActiveFilters && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.75rem',
                  background: T.accent + '22',
                  border: `1px solid ${T.accent}55`,
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '0.375rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: T.accent,
                      marginRight: '0.125rem',
                    }}
                  >
                    Filtros activos:
                  </span>
                  {filterType !== 'all' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        background: T.cardBg,
                        border: `1px solid ${T.accent}44`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.accent,
                      }}
                    >
                      {filterType === 'income' ? '↑ Ingresos' : '↓ Gastos'}
                      <button
                        onClick={() => setFilterType('all')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: T.accent,
                          padding: 0,
                          lineHeight: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {filterAccount !== 'all' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        background: T.cardBg,
                        border: `1px solid ${T.accent}44`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.accent,
                      }}
                    >
                      🏦{' '}
                      {accounts.find((a) => a.id === filterAccount)?.name ??
                        filterAccount}
                      <button
                        onClick={() => setFilterAccount('all')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: T.accent,
                          padding: 0,
                          lineHeight: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {filterCategory !== 'all' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        background: T.cardBg,
                        border: `1px solid ${T.accent}44`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.accent,
                      }}
                    >
                      🏷️{' '}
                      {categories.find((c) => c.id === filterCategory)?.name ??
                        filterCategory}
                      <button
                        onClick={() => setFilterCategory('all')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: T.accent,
                          padding: 0,
                          lineHeight: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {(filterPreset !== 'all' || filterDateMode === 'range') && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        background: T.cardBg,
                        border: `1px solid ${T.accent}44`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.accent,
                      }}
                    >
                      📅{' '}
                      {filterDateMode === 'range'
                        ? `${filterDateFrom || '…'} → ${filterDateTo || '…'}`
                        : (
                            {
                              this_month: 'Este mes',
                              last_month: 'Mes anterior',
                              last_3: 'Últimos 3 meses',
                              last_6: 'Últimos 6 meses',
                              this_year: 'Este año',
                            } as Record<string, string>
                          )[filterPreset]}
                      <button
                        onClick={() => {
                          setFilterPreset('all');
                          setFilterDateMode('preset');
                          setFilterDateFrom('');
                          setFilterDateTo('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: T.accent,
                          padding: 0,
                          lineHeight: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: T.accent,
                    }}
                  >
                    {filtered.length} resultado
                    {filtered.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearAllFilters}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${T.accent}44`,
                      background: T.cardBg,
                      color: T.accent,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de movimientos */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            {filtered.map((expense) => {
              const cat = categories.find((c) => c.id === expense.categoryId);
              const acc = accounts.find((a) => a.id === expense.accountId);
              const amountInDisplay = convertAmount(
                expense.amount,
                expense.currency,
                displayCurrency,
                rates
              );
              return (
                <Card key={expense.id} T={T}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      padding: '1.125rem 1.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '0.25rem',
                        alignSelf: 'stretch',
                        borderRadius: '9999px',
                        background: cat?.color || T.cardBorder,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '0.75rem',
                        background: (cat?.color ?? '#ccc') + '22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {expense.type === 'income' ? (
                        <ArrowUpCircle
                          size={16}
                          color={cat?.color || T.green}
                        />
                      ) : (
                        <ArrowDownCircle
                          size={16}
                          color={cat?.color || T.red}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: T.title,
                          }}
                        >
                          {expense.description}
                        </span>
                        {expense.isTransfer ? (
                          <span style={{
                            padding: '0.1rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: T.accentLight,
                            color: T.accent,
                            border: `1px solid ${T.accent}33`,
                            whiteSpace: 'nowrap',
                          }}>
                            ↔ Transferencia
                          </span>
                        ) : (
                          <Badge type={expense.type} T={T} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: T.muted }}>
                        {expense.isTransfer
                          ? `↔ Transferencia · ${acc?.name ?? '—'}`
                          : `${cat?.name ?? '—'} · ${acc?.name ?? '—'}`}{' '}
                        · {fmtDateShort(expense.entryDate, dateFormat)}
                        {expense.notes?.includes('recurrente') && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '9999px',
                              background: T.accentLight,
                              color: T.accent,
                              border: `1px solid ${T.accent}33`,
                              verticalAlign: 'middle',
                            }}
                          >
                            🔄 Recurrente
                          </span>
                        )}
                        {expense.isDuplicateWarning &&
                          !expense.duplicateReviewed && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                marginLeft: '0.5rem',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.5rem',
                                borderRadius: '9999px',
                                background: '#fff1f1',
                                color: '#e53e3e',
                                border: '1px solid #fed7d7',
                                verticalAlign: 'middle',
                                cursor: 'pointer',
                              }}
                              title="Haz clic para marcar como revisado"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                dismissDuplicateWarning(expense.id);
                              }}
                            >
                              ⚠️ Posible duplicado
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 900,
                                  lineHeight: 1,
                                  opacity: 0.7,
                                  marginLeft: '0.1rem',
                                }}
                              >
                                ✕
                              </span>
                            </span>
                          )}
                        {expense.notes &&
                          !expense.notes.includes('recurrente') && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontStyle: 'italic',
                              }}
                            >
                              · {expense.notes}
                            </span>
                          )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 800,
                          color: expense.type === 'income' ? T.green : T.red,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {expense.type === 'income' ? '+' : '-'}
                        {currencySymbol(expense.currency)}
                        {expense.amount.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {expense.currency}
                      </div>
                      {expense.currency !== displayCurrency && (
                        <div style={{ fontSize: '0.75rem', color: T.muted }}>
                          ≈{' '}
                          {fmt(
                            amountInDisplay,
                            displayCurrency,
                            displayCurrency,
                            rates
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="fh-no-print"
                      style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}
                    >
                      {!expense.isTransfer && (
                        <>
                          <GhostBtn onClick={() => openEdit(expense)} T={T}>
                            <Pencil size={15} />
                          </GhostBtn>
                          <GhostBtn
                            onClick={() => del(expense.id)}
                            T={T}
                            color={T.red}
                          >
                            <Trash2 size={15} />
                          </GhostBtn>
                        </>
                      )}
                      {expense.isTransfer && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontStyle: 'italic',
                          padding: '0.4rem 0.5rem',
                          alignSelf: 'center',
                        }}>
                          Gestionar en Transferencias
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '5rem 2rem',
                  color: T.muted,
                }}
              >
                <Receipt
                  size={48}
                  color={T.muted}
                  style={{ margin: '0 auto 1rem', opacity: 0.2 }}
                />
                <p
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: T.title,
                    marginBottom: '0.5rem',
                  }}
                >
                  {realExpenses.length === 0
                    ? 'Todavía no tienes movimientos registrados'
                    : 'No hay movimientos con estos filtros'}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: T.muted,
                    marginBottom: '1.5rem',
                  }}
                >
                  {realExpenses.length === 0
                    ? 'Registra tu primer movimiento real para empezar el seguimiento.'
                    : 'Prueba a cambiar los filtros.'}
                </p>
                {realExpenses.length === 0 && (
                  <PrimaryBtn onClick={openAdd}>
                    <Plus size={15} /> Registrar primer movimiento
                  </PrimaryBtn>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Vista: Análisis ── */}
      {view === 'analysis' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {realExpenses.length === 0 ? (
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
                Aún no hay datos para analizar
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: T.muted,
                  marginBottom: '1.5rem',
                }}
              >
                Registra algunos movimientos primero y aquí verás el análisis
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
              {/* ── Navegador de mes ── */}
              {(() => {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() + analysisMonthOffset);
                const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                const isCurrentMonth = analysisMonthOffset >= 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0.625rem 1rem', borderRadius: '0.875rem', background: T.accentLight, border: `1px solid ${T.accent}33` }}>
                    <button
                      onClick={() => setAnalysisMonthOffset(o => o - 1)}
                      style={{ padding: '0.35rem 0.875rem', borderRadius: '0.625rem', border: `1px solid ${T.accent}44`, background: T.cardBg, color: T.accent, fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}
                    >
                      ←
                    </button>
                    <span style={{ fontSize: '0.925rem', fontWeight: 800, color: T.accent, textTransform: 'capitalize', minWidth: '13rem', textAlign: 'center' }}>
                      {label}
                    </span>
                    <button
                      onClick={() => setAnalysisMonthOffset(o => Math.min(0, o + 1))}
                      disabled={isCurrentMonth}
                      style={{ padding: '0.35rem 0.875rem', borderRadius: '0.625rem', border: `1px solid ${T.accent}44`, background: T.cardBg, color: isCurrentMonth ? T.muted : T.accent, fontWeight: 800, fontSize: '1.1rem', cursor: isCurrentMonth ? 'default' : 'pointer', opacity: isCurrentMonth ? 0.35 : 1 }}
                    >
                      →
                    </button>
                  </div>
                );
              })()}
              <ProjectedVsReal monthOffset={analysisMonthOffset} />

              {topRealCategories.length > 0 && (
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
                      Desglose
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 800,
                        color: T.title,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Gastos reales por categoría — Este mes
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
                    {topRealCategories.map(({ cat, val }) => {
                      const maxVal = Math.max(
                        ...topRealCategories.map((x) => x.val),
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
                              {fmt(
                                val,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
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

      {/* ── Modal alta / edición ── */}
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
                    {modal === 'add' ? 'Nuevo movimiento' : 'Editar movimiento'}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    Registra un ingreso o gasto real
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
                {/* Tipo */}
                <Field label="Tipo de movimiento">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    {([
                      ['income',  '📈', 'Ingreso', T.green, T.greenBg,         T.greenBorder],
                      ['expense', '📉', 'Gasto',   T.red,   T.redBg ?? T.amberBg, T.redBorder ?? T.amberBorder],
                    ] as const).map(([val, icon, label, color, bg]) => (
                      <div
                        key={val}
                        onClick={() => setForm((f) => ({ ...f, type: val, categoryId: '' }))}
                        style={{
                          padding: '1rem',
                          borderRadius: '0.875rem',
                          cursor: 'pointer',
                          border: `2px solid ${form.type === val ? color : T.cardBorder}`,
                          background: form.type === val ? bg : T.pageBg,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: form.type === val ? color : T.muted }}>
                          {label}
                        </span>
                        {form.type === val && <Check size={14} color={color} style={{ marginLeft: 'auto' }} />}
                      </div>
                    ))}
                  </div>
                </Field>

                <Field label="Descripción" error={errors.description}>
                  <Input
                    T={T}
                    error={errors.description}
                    placeholder="Ej: Compra supermercado"
                    value={form.description}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setForm({ ...form, description: e.target.value });
                      setErrors((er) => ({
                        ...er,
                        description: undefined as any,
                      }));
                    }}
                  />
                </Field>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <Field label="Cuenta *" error={errors.accountId}>
                    <Sel
                      T={T}
                      value={form.accountId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleAccountChange(e.target.value)}
                      >
                      <option value="">— Cuenta —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Sel>
                  </Field>
                  <Field label="Categoría *" error={errors.categoryId}>
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
                            setForm({ ...form, categoryId: e.target.value });
                            setErrors((er) => ({
                              ...er,
                              categoryId: undefined as any,
                            }));
                          }}
                        >
                          <option value="">— Categoría —</option>
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
                  </Field>
                </div>

                {showQuickCategory && (
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
                        setForm({ ...form, amount: e.target.value });
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
                        setForm({ ...form, currency: e.target.value })
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

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <Field label="Fecha de apunte" error={errors.entryDate}>
                    <Input
                      T={T}
                      error={errors.entryDate}
                      type="date"
                      value={form.entryDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setForm({ ...form, entryDate: e.target.value });
                        setErrors((er) => ({
                          ...er,
                          entryDate: undefined as any,
                        }));
                      }}
                    />
                    <p
                      style={{
                        fontSize: '0.68rem',
                        color: T.muted,
                        marginTop: '0.25rem',
                      }}
                    >
                      📋 Cuándo lo registras tú
                    </p>
                  </Field>
                  <Field label="Fecha de valor" error={errors.valueDate}>
                    <Input
                      T={T}
                      error={errors.valueDate}
                      type="date"
                      value={form.valueDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setForm({ ...form, valueDate: e.target.value });
                        setErrors((er) => ({
                          ...er,
                          valueDate: undefined as any,
                        }));
                      }}
                    />
                    <p
                      style={{
                        fontSize: '0.68rem',
                        color: T.muted,
                        marginTop: '0.25rem',
                      }}
                    >
                      💸 Cuándo salió el dinero realmente
                    </p>
                  </Field>
                </div>

                <Field label="Notas (opcional)">
                  <Input
                    T={T}
                    placeholder="Añade una nota..."
                    value={form.notes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </Field>

                <div
                  style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}
                >
                  <PrimaryBtn onClick={save} fullWidth>
                    <Check size={15} /> Guardar movimiento
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
      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar movimiento?"
          message={`Vas a eliminar "${expenseToDelete?.description}". Esta acción no se puede deshacer.`}
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Warning modal ── */}
      {warningModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
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
              border: `1px solid ${T.amberBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '28rem',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: T.amberBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AlertTriangle size={20} color={T.amber} />
            </div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: T.title,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.02em',
              }}
            >
              ⚠️ Movimiento guardado — fuera del rango calculado
            </h3>
            <p
              style={{
                fontSize: '0.825rem',
                color: T.muted,
                lineHeight: 1.6,
                margin: '0 0 0.75rem',
                whiteSpace: 'pre-line',
              }}
            >
              {warningModal}
            </p>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: T.amberBg,
                border: `1px solid ${T.amberBorder}`,
                fontSize: '0.775rem',
                color: T.amber,
                lineHeight: 1.5,
                marginBottom: '1.25rem',
              }}
            >
              💡 Si quieres que este movimiento afecte al saldo calculado, edita
              la <strong>Fecha del saldo base</strong> de la cuenta a una fecha
              anterior a la del movimiento.
            </div>
            <button
              onClick={() => setWarningModal(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: T.amber,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Import ── */}
      {showImport && <BankImportModal onClose={() => setShowImport(false)} />}

      {/* ── Coach Mark ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Registra tus movimientos"
          description="Añádelos uno a uno con '+ Nuevo movimiento', o importa todos de golpe desde el CSV de tu banco (Santander, BBVA, CaixaBank, ING, Revolut...)."
          ctaLabel="¡Entendido! →"
          onDismiss={coachMarkSeen}
          accentColor="#16a34a"
        />
      )}

{showFirstWin && (
        <FirstWinToast
          type="movement"
          onDone={() => {
            setShowFirstWin(false);
            localStorage.setItem('fh_setup_highlight', 'true');
            setTab('dashboard');
          }}
        />
      )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Movimientos Reales" />

    </div>
  );
}
