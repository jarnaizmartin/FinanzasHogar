import { useState, useMemo, useRef, type ChangeEvent } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { SavingsGoal } from '../types';
import {
  calcGoalProgress,
  convertAmount,
  fmt,
  today,
  fmtDateShort,
  CURRENCIES,
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

const GOAL_EMOJIS = [
  '🎯',
  '🏖️',
  '🚗',
  '🏠',
  '💍',
  '✈️',
  '📱',
  '🎓',
  '💪',
  '🐾',
  '🎸',
  '⛵',
  '🏔️',
  '🍀',
  '💎',
];
const GOAL_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#ea580c',
  '#0d9488',
  '#4f46e5',
];
const uid = () => crypto.randomUUID();

// ─── GoalCard ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}) {
  const { T, accounts, categories, realExpenses, rates, setGoals } = useApp();
  const toast = useToast();
  const prog = calcGoalProgress(goal, realExpenses, accounts, rates);
  const cat = categories.find((c) => c.id === goal.categoryId);
  const acc = accounts.find((a) => a.id === goal.accountId);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingAmountValue, setEditingAmountValue] = useState('');

  const saveAmount = () => {
    const parsed = parseFloat(editingAmountValue);
    if (isNaN(parsed) || parsed < 0) {
      toast('Importe no válido', 'error');
      return;
    }
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, currentAmount: parsed } : g))
    );
    toast('Importe actualizado correctamente', 'success');
    setEditingAmount(false);
    setEditingAmountValue('');
  };

  const catLabel =
    goal.categoryId === '__transfer__' ? (
      <span>↔ Traspasos</span>
    ) : cat ? (
      <span>{cat.name}</span>
    ) : null;

  const accLabel =
    goal.accountId !== 'all' && acc ? <span>· {acc.name}</span> : null;

  return (
    <Card
      T={T}
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: prog.completed
          ? `2px solid ${T.green}`
          : `1px solid ${T.cardBorder}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '0.375rem',
          background: goal.color,
        }}
      />
      <div style={{ padding: '1.5rem 1.5rem 1.5rem 1.875rem' }}>
        {/* Cabecera */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.125rem',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}
          >
            <span style={{ fontSize: '2rem' }}>{goal.emoji}</span>
            <div>
              <div
                style={{ fontSize: '1rem', fontWeight: 800, color: T.title }}
              >
                {goal.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: T.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginTop: '0.1rem',
                }}
              >
                {goal.mode === 'auto' ? (
                  <>
                    <span
                      style={{
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: T.accentLight,
                        color: T.accent,
                        fontWeight: 700,
                      }}
                    >
                      ⚡ Auto
                    </span>
                    {catLabel}
                    {accLabel}
                  </>
                ) : (
                  <span
                    style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      background: T.pageBg,
                      color: T.muted,
                      fontWeight: 700,
                    }}
                  >
                    ✍️ Manual
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            <GhostBtn onClick={() => onEdit(goal)} T={T}>
              <Pencil size={14} />
            </GhostBtn>
            <GhostBtn onClick={() => onDelete(goal.id)} T={T} color={T.red}>
              <Trash2 size={14} />
            </GhostBtn>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: goal.color,
                  letterSpacing: '-0.02em',
                }}
              >
                {fmt(prog.saved, goal.currency, goal.currency, rates)}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  color: T.muted,
                  marginLeft: '0.375rem',
                }}
              >
                de {fmt(goal.targetAmount, goal.currency, goal.currency, rates)}
              </span>
            </div>
            <div
              style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '9999px',
                background: prog.completed ? T.greenBg : goal.color + '15',
                color: prog.completed ? T.green : goal.color,
                fontSize: '0.875rem',
                fontWeight: 800,
                border: `1px solid ${
                  prog.completed ? T.greenBorder : goal.color + '33'
                }`,
              }}
            >
              {Math.round(prog.pct)}%
            </div>
          </div>
          <div
            style={{
              height: '0.75rem',
              borderRadius: '9999px',
              background: T.pageBg,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                background: prog.completed
                  ? T.green
                  : `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`,
                width: `${Math.min(prog.pct, 100)}%`,
                transition: 'width 0.6s ease',
                position: 'relative',
              }}
            >
              {prog.pct > 10 && (
                <div
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(prog.pct)}%
                </div>
              )}
            </div>
          </div>
          {prog.completed && (
            <div
              style={{
                textAlign: 'center',
                marginTop: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                color: T.green,
              }}
            >
              🎉 ¡Objetivo alcanzado!
            </div>
          )}
        </div>

        {/* Métricas */}
        {!prog.completed && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.625rem',
              marginBottom: '1rem',
            }}
          >
            {[
              {
                label: 'Falta',
                value: fmt(prog.remaining, goal.currency, goal.currency, rates),
                color: T.red,
              },
              {
                label: goal.deadline ? 'Meses restantes' : 'Sin límite',
                value:
                  goal.deadline && prog.monthsLeft !== null
                    ? `${prog.monthsLeft} mes${
                        prog.monthsLeft !== 1 ? 'es' : ''
                      }`
                    : '—',
                color: T.muted,
              },
              {
                label: 'Necesitas/mes',
                value:
                  prog.monthlyNeeded !== null
                    ? fmt(
                        prog.monthlyNeeded,
                        goal.currency,
                        goal.currency,
                        rates
                      )
                    : '—',
                color: T.amber,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  background: T.pageBg,
                  border: `1px solid ${T.cardBorder}`,
                  textAlign: 'center',
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
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ritmo auto */}
        {goal.mode === 'auto' && prog.monthlyRate > 0 && !prog.completed && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.875rem',
              marginBottom: '1rem',
              background: prog.onTrack ? T.greenBg : T.amberBg,
              border: `1px solid ${
                prog.onTrack ? T.greenBorder : T.amberBorder
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: prog.onTrack ? T.green : T.amber,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {prog.onTrack
                  ? '✅ Vas por buen camino'
                  : '⚠️ Necesitas acelerar'}
              </div>
              <div
                style={{
                  fontSize: '0.775rem',
                  color: prog.onTrack ? T.green : T.amber,
                  marginTop: '0.1rem',
                }}
              >
                Ritmo actual:{' '}
                <strong>
                  {fmt(prog.monthlyRate, goal.currency, goal.currency, rates)}
                  /mes
                </strong>
                {prog.monthlyNeeded !== null && (
                  <>
                    {' '}
                    · Necesitas:{' '}
                    <strong>
                      {fmt(
                        prog.monthlyNeeded,
                        goal.currency,
                        goal.currency,
                        rates
                      )}
                      /mes
                    </strong>
                  </>
                )}
              </div>
            </div>
            {prog.estimatedDate && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: prog.onTrack ? T.green : T.amber,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                Estimado: {prog.estimatedDate}
              </div>
            )}
          </div>
        )}

        {/* Proyección manual */}
        {goal.mode === 'manual' &&
          goal.deadline &&
          prog.monthlyNeeded !== null &&
          !prog.completed && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}33`,
                fontSize: '0.775rem',
                color: T.accent,
              }}
            >
              💡 Para llegar a tiempo necesitas ahorrar{' '}
              <strong>
                {fmt(prog.monthlyNeeded, goal.currency, goal.currency, rates)}
                /mes
              </strong>
              {prog.monthsLeft !== null &&
                ` en los próximos ${prog.monthsLeft} meses`}
            </div>
          )}

        {/* Botón actualizar manual */}
        {goal.mode === 'manual' && !prog.completed && (
          <button
            onClick={() => setEditingAmount(true)}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${goal.color}44`,
              background: goal.color + '10',
              color: goal.color,
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            ✏️ Actualizar importe ahorrado
          </button>
        )}

        {/* Panel inline actualizar */}
        {editingAmount && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              borderRadius: '0.875rem',
              background: T.accentLight,
              border: `1.5px solid ${T.accent}44`,
              animation: 'fadeSlideIn 0.2s ease both',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: T.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
              }}
            >
              ✏️ Actualizar importe ahorrado
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: T.muted,
                marginBottom: '0.625rem',
              }}
            >
              Importe actual:{' '}
              <strong style={{ color: T.title }}>
                {fmt(goal.currentAmount, goal.currency, goal.currency, rates)}
              </strong>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              autoFocus
              placeholder={`Ej: ${goal.currentAmount || '0.00'}`}
              value={editingAmountValue}
              onChange={(e) => setEditingAmountValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveAmount();
                if (e.key === 'Escape') {
                  setEditingAmount(false);
                  setEditingAmountValue('');
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${T.accent}44`,
                background: T.inputBg,
                color: T.inputText,
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '0.625rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={saveAmount}
                disabled={!editingAmountValue.trim()}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: T.accent,
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: editingAmountValue.trim() ? 'pointer' : 'not-allowed',
                  opacity: editingAmountValue.trim() ? 1 : 0.5,
                }}
              >
                ✅ Guardar
              </button>
              <button
                onClick={() => {
                  setEditingAmount(false);
                  setEditingAmountValue('');
                }}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export function Goals() {
  const {
    T,
    goals,
    setGoals,
    accounts,
    categories,
    realExpenses,
    displayCurrency,
    baseCurrency,
    rates,
    dateFormat,
    setTab,
  } = useApp();
  const toast = useToast();
  const { seen: coachSeen, markSeen: coachMarkSeen } = useCoachMark('goals');
  const coachRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const TOTAL_STEPS = 3;

  const emptyForm: Omit<SavingsGoal, 'id'> = {
    name: '',
    emoji: '🎯',
    color: '#2563eb',
    targetAmount: 0,
    currency: baseCurrency,
    deadline: '',
    mode: 'manual',
    currentAmount: 0,
    categoryId: '',
    accountId: '',
    autoType: 'income',
    autoStartDate: today(),
  };

  const [form, setForm] = useState<Omit<SavingsGoal, 'id'>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = 'El nombre es obligatorio';
      if (!form.targetAmount || form.targetAmount <= 0)
        e.targetAmount = 'Introduce un importe válido';
    }
    if (s === 2 && form.mode === 'auto') {
      if (!form.categoryId) e.categoryId = 'Selecciona una categoría';
      if (!form.accountId) e.accountId = 'Selecciona una cuenta';
    }
    return e;
  };

  const save = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const isFirstGoal = modal === 'add' && goals.length === 0;
    if (modal === 'add') {
      setGoals((prev) => [...prev, { ...form, id: uid() }]);
      toast('Objetivo creado correctamente', 'success');
    } else {
      setGoals((prev) =>
        prev.map((g) => (g.id === modal ? { ...g, ...form } : g))
      );
      toast('Objetivo actualizado correctamente', 'success');
    }
    setModal(null);
    setStep(1);
    setForm(emptyForm);
    setErrors({});
    if (isFirstGoal) setShowFirstWin(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setStep(1);
    setModal('add');
  };

  const openEdit = (goal: SavingsGoal) => {
    setForm({
      ...goal,
      targetAmount: parseFloat(goal.targetAmount.toFixed(2)),
      currentAmount: parseFloat((goal.currentAmount ?? 0).toFixed(2)),
    });
    setErrors({});
    setStep(1);
    setModal(goal.id);
  };

  const handleNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const closeModal = () => {
    setModal(null);
    setStep(1);
    setForm(emptyForm);
    setErrors({});
  };

  const globalStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(
      (g) => calcGoalProgress(g, realExpenses, accounts, rates).completed
    ).length;
    const totalTarget = goals.reduce(
      (s, g) =>
        s + convertAmount(g.targetAmount, g.currency, displayCurrency, rates),
      0
    );
    const totalSaved = goals.reduce(
      (s, g) =>
        s +
        convertAmount(
          calcGoalProgress(g, realExpenses, accounts, rates).saved,
          g.currency,
          displayCurrency,
          rates
        ),
      0
    );
    return { total, completed, totalTarget, totalSaved };
  }, [goals, realExpenses, rates, displayCurrency, accounts]);

  const printSubtitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      `${globalStats.total} objetivo${globalStats.total !== 1 ? 's' : ''}`
    );
    if (globalStats.completed > 0)
      parts.push(
        `${globalStats.completed} completado${
          globalStats.completed !== 1 ? 's' : ''
        }`
      );
    parts.push(
      fmt(globalStats.totalSaved, displayCurrency, displayCurrency, rates) +
        ' ahorrado'
    );
    return parts.join(' · ');
  }, [globalStats, displayCurrency, rates]);

  // ── Paso 1 ────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Field label="Elige un icono">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {GOAL_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setForm((f) => ({ ...f, emoji: e }))}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.625rem',
                border: `2px solid ${
                  form.emoji === e ? T.accent : T.cardBorder
                }`,
                background: form.emoji === e ? T.accentLight : T.pageBg,
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                border:
                  form.color === c
                    ? `3px solid ${T.title}`
                    : '3px solid transparent',
                background: c,
                cursor: 'pointer',
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s',
                boxShadow:
                  form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </Field>

      <Field label="Nombre del objetivo" error={errors.name}>
        <Input
          T={T}
          error={errors.name}
          placeholder="Ej: Vacaciones de verano"
          value={form.name}
          autoFocus
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setErrors((er) => ({ ...er, name: undefined as any }));
          }}
        />
      </Field>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        <Field label="Importe objetivo" error={errors.targetAmount}>
          <Input
            T={T}
            error={errors.targetAmount}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.targetAmount || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setForm((f) => ({
                ...f,
                targetAmount: parseFloat(e.target.value) || 0,
              }));
              setErrors((er) => ({ ...er, targetAmount: undefined as any }));
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

      <Field label="Fecha límite (opcional)">
        <Input
          T={T}
          type="date"
          value={form.deadline}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, deadline: e.target.value }))
          }
        />
      </Field>

      {form.name && form.targetAmount > 0 && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            background: T.accentLight,
            border: `1.5px solid ${form.color}33`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>{form.emoji}</span>
          <div>
            <div
              style={{ fontSize: '0.95rem', fontWeight: 800, color: T.title }}
            >
              {form.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: T.muted }}>
              Meta:{' '}
              {fmt(form.targetAmount, form.currency, form.currency, rates)}
              {form.deadline &&
                ` · Límite: ${fmtDateShort(form.deadline, dateFormat)}`}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              width: '0.75rem',
              height: '2.5rem',
              borderRadius: '9999px',
              background: form.color,
            }}
          />
        </div>
      )}
    </div>
  );

  // ── Paso 2 ────────────────────────────────────────────────────────────────
  const renderStep2 = () => {
    const availableCategories = categories.filter(
      (c) => c.type === form.autoType
    );
    const isTransfer = form.categoryId === '__transfer__';

    // Proyección mensual calculada como variable (evita && JSX que OXC no parsea)
    let projMonths = 0;
    let projMonthly = 0;
    let hasProjection = false;
    if (form.targetAmount > 0 && form.deadline) {
      const now = new Date();
      const end = new Date(form.deadline);
      projMonths = Math.max(
        1,
        Math.round(
          (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        )
      );
      const remaining = Math.max(
        0,
        form.targetAmount - (form.currentAmount ?? 0)
      );
      projMonthly = remaining / projMonths;
      hasProjection = true;
    }

    const projectionBlock = hasProjection ? (
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          fontSize: '0.775rem',
          color: T.accent,
          lineHeight: 1.6,
        }}
      >
        <strong>📊 Proyección:</strong> Para alcanzar{' '}
        <strong>
          {fmt(form.targetAmount, form.currency, form.currency, rates)}
        </strong>{' '}
        en{' '}
        <strong>
          {projMonths} mes{projMonths !== 1 ? 'es' : ''}
        </strong>
        , necesitarás ahorrar{' '}
        <strong>
          {fmt(projMonthly, form.currency, form.currency, rates)}/mes
        </strong>
        .
        {!form.deadline &&
          ' Añade una fecha límite en el paso 1 para ver la proyección.'}
      </div>
    ) : (
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.775rem',
          color: T.muted,
          lineHeight: 1.6,
        }}
      >
        📊 Añade un importe y fecha límite en el paso 1 para ver la proyección
        mensual.
      </div>
    );

    const categoryBlock = isTransfer ? null : (
      <Field label="Categoría que se sumará" error={errors.categoryId}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Sel
              T={T}
              value={form.categoryId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setForm((f) => ({ ...f, categoryId: e.target.value }));
                setErrors((er) => ({ ...er, categoryId: undefined as any }));
              }}
            >
              <option value="">— Selecciona una categoría —</option>
              {availableCategories.map((c) => (
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
    );

    const quickCatBlock =
      !isTransfer && showQuickCategory ? (
        <QuickCategoryModal
          T={T}
          defaultType={form.autoType as 'income' | 'expense'}
          onSave={(newCat) => {
            setForm((f) => ({ ...f, categoryId: newCat.id }));
            setShowQuickCategory(false);
          }}
          onClose={() => setShowQuickCategory(false)}
        />
      ) : null;

    const noCatsBlock =
      !isTransfer && availableCategories.length === 0 ? (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: T.amberBg,
            border: `1px solid ${T.amberBorder}`,
            fontSize: '0.775rem',
            color: T.amber,
            lineHeight: 1.5,
          }}
        >
          ⚠️ No tienes categorías de{' '}
          {form.autoType === 'income' ? 'ingresos' : 'gastos'} creadas. Crea una
          con el botón <strong>"+"</strong> o usa el modo{' '}
          <strong>Manual</strong>.
        </div>
      ) : null;

    const transferInfoBlock = isTransfer ? (
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          fontSize: '0.775rem',
          color: T.accent,
          lineHeight: 1.5,
        }}
      >
        ↔ Se contabilizarán automáticamente los traspasos que lleguen a la
        cuenta seleccionada como progreso hacia tu objetivo.
      </div>
    ) : null;

    const accountBlock = isTransfer ? (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
      >
        <Field label="Cuenta origen (opcional)">
          <Sel
            T={T}
            value={form.fromAccountId ?? ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((f) => ({ ...f, fromAccountId: e.target.value }))
            }
          >
            <option value="">— Cualquier cuenta —</option>
            {accounts
              .filter((a) => a.id !== form.accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </Sel>
          <div
            style={{
              marginTop: '0.375rem',
              fontSize: '0.68rem',
              color: T.muted,
              lineHeight: 1.5,
            }}
          >
            Deja en blanco para contar traspasos de cualquier origen.
          </div>
        </Field>
        <Field
          label="Cuenta destino (donde llega el ahorro) *"
          error={errors.accountId}
        >
          <Sel
            T={T}
            value={form.accountId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setForm((f) => ({ ...f, accountId: e.target.value }));
              setErrors((er) => ({ ...er, accountId: undefined as any }));
            }}
          >
            <option value="">— Selecciona una cuenta —</option>
            {accounts
              .filter((a) => a.id !== (form.fromAccountId ?? ''))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </Sel>
          <div
            style={{
              marginTop: '0.375rem',
              fontSize: '0.68rem',
              color: T.muted,
              lineHeight: 1.5,
            }}
          >
            El progreso se calcula con los traspasos que lleguen aquí.
          </div>
        </Field>
      </div>
    ) : (
      <Field label="Cuenta *" error={errors.accountId}>
        <Sel
          T={T}
          value={form.accountId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setForm((f) => ({ ...f, accountId: e.target.value }));
            setErrors((er) => ({ ...er, accountId: undefined as any }));
          }}
        >
          <option value="">— Selecciona una cuenta —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Sel>
      </Field>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
          }}
        >
          {(
            [
              [
                'manual',
                '✍️',
                'Manual',
                'Introduces tú el importe ahorrado cuando quieras',
              ],
              [
                'auto',
                '⚡',
                'Automático',
                'Suma automáticamente tus movimientos reales',
              ],
            ] as const
          ).map(([val, icon, label, sub]) => (
            <div
              key={val}
              onClick={() => setForm((f) => ({ ...f, mode: val }))}
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                cursor: 'pointer',
                border: `2px solid ${
                  form.mode === val ? T.accent : T.cardBorder
                }`,
                background: form.mode === val ? T.accentLight : T.pageBg,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                {icon}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: T.muted,
                  marginTop: '0.2rem',
                  lineHeight: 1.5,
                }}
              >
                {sub}
              </div>
              {form.mode === val && (
                <Check
                  size={14}
                  color={T.accent}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          ))}
        </div>

        {form.mode === 'manual' && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
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
              ¿Cuánto llevas ahorrado hasta ahora?
            </div>
            <Input
              T={T}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.currentAmount || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({
                  ...f,
                  currentAmount: parseFloat(e.target.value) || 0,
                }))
              }
            />
            <div
              style={{
                fontSize: '0.72rem',
                color: T.muted,
                marginTop: '0.25rem',
              }}
            >
              Puedes actualizarlo en cualquier momento editando el objetivo.
            </div>
          </div>
        )}

        {form.mode === 'auto' && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem',
                }}
              >
                Tipo de movimiento a sumar
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.625rem',
                }}
              >
                {[
                  {
                    val: 'income' as const,
                    icon: '📈',
                    label: 'Ingresos',
                    color: T.green,
                    bg: T.greenBg,
                    isTr: false,
                  },
                  {
                    val: 'expense' as const,
                    icon: '📉',
                    label: 'Gastos',
                    color: T.red,
                    bg: T.redBg ?? T.amberBg,
                    isTr: false,
                  },
                  {
                    val: 'transfer' as const,
                    icon: '↔',
                    label: 'Traspaso entre cuentas',
                    color: T.accent,
                    bg: T.accentLight,
                    isTr: true,
                  },
                ].map(({ val, icon, label, color, bg, isTr }) => {
                  const isActive = isTr
                    ? form.categoryId === '__transfer__'
                    : form.autoType === val &&
                      form.categoryId !== '__transfer__';
                  return (
                    <div
                      key={val}
                      onClick={() => {
                        if (isTr) {
                          setForm((f) => ({
                            ...f,
                            autoType: 'income',
                            categoryId: '__transfer__',
                          }));
                        } else {
                          setForm((f) => ({
                            ...f,
                            autoType: val as 'income' | 'expense',
                            categoryId: '',
                          }));
                        }
                      }}
                      style={{
                        padding: '0.875rem 0.5rem',
                        borderRadius: '0.875rem',
                        cursor: 'pointer',
                        border: `2px solid ${isActive ? color : T.cardBorder}`,
                        background: isActive ? bg : T.pageBg,
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: '0.375rem',
                        transition: 'all 0.15s',
                        textAlign: 'center' as const,
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                      <span
                        style={{
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          color: isActive ? color : T.muted,
                        }}
                      >
                        {label}
                      </span>
                      {isActive && <Check size={12} color={color} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {transferInfoBlock}
            {noCatsBlock}
            {categoryBlock}
            {quickCatBlock}
            {accountBlock}
            {projectionBlock}

            <Field label="Contar movimientos desde">
              <Input
                T={T}
                type="date"
                value={form.autoStartDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, autoStartDate: e.target.value }))
                }
              />
            </Field>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}33`,
                fontSize: '0.75rem',
                color: T.accent,
                lineHeight: 1.5,
              }}
            >
              💡 La app sumará automáticamente todos los movimientos reales que
              coincidan con estos criterios y actualizará el progreso en tiempo
              real.
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Paso 3 ────────────────────────────────────────────────────────────────
  const renderStep3 = () => {
    const acc = accounts.find((a) => a.id === form.accountId);
    const cat = categories.find((c) => c.id === form.categoryId);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            background: T.accentLight,
            border: `1.5px solid ${form.color}33`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>{form.emoji}</span>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: '1.1rem', fontWeight: 800, color: T.title }}
            >
              {form.name}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: T.muted,
                marginTop: '0.2rem',
              }}
            >
              Meta:{' '}
              <strong>
                {fmt(form.targetAmount, form.currency, form.currency, rates)}
              </strong>
              {form.deadline &&
                ` · Límite: ${fmtDateShort(form.deadline, dateFormat)}`}
            </div>
          </div>
          <div
            style={{
              width: '0.75rem',
              height: '3rem',
              borderRadius: '9999px',
              background: form.color,
              flexShrink: 0,
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
          }}
        >
          {[
            {
              label: 'Modo',
              value: form.mode === 'manual' ? '✍️ Manual' : '⚡ Automático',
            },
            { label: 'Divisa', value: form.currency },
            {
              label: form.mode === 'auto' ? 'Tipo' : 'Ahorrado',
              value:
                form.mode === 'auto'
                  ? form.categoryId === '__transfer__'
                  ? '↔ Traspaso entre cuentas'
                  : cat?.name ?? '—'
                  : fmt(
                      form.currentAmount,
                      form.currency,
                      form.currency,
                      rates
                    ),
            },
            {
              label: 'Cuenta',
              value:
                acc?.name ??
                (form.categoryId === '__transfer__' ? 'Traspaso entre cuentas' : '—'),
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
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
                  marginBottom: '0.25rem',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: T.title,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: '0.875rem',
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            fontSize: '0.775rem',
            color: T.green,
            lineHeight: 1.5,
          }}
        >
          ✅ Todo listo. Pulsa <strong>Guardar</strong> para crear tu objetivo.
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="fh-print-section" style={{ padding: '1.5rem 1rem' }}>
      <PrintHeader title="Objetivos de ahorro" subtitle={printSubtitle} />

      <div className="fh-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.title, margin: 0 }}>🎯 Objetivos</h1>
          <p
            style={{
              fontSize: '0.825rem',
              color: T.muted,
              margin: '0.25rem 0 0',
            }}
          >
            {globalStats.total === 0
              ? 'Crea tu primer objetivo de ahorro'
              : `${globalStats.total} objetivo${
                  globalStats.total !== 1 ? 's' : ''
                } · ${globalStats.completed} completado${
                  globalStats.completed !== 1 ? 's' : ''
                }`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
        <PrintButton T={T} documentTitle="Objetivos de ahorro" sectionTitle="Objetivos de ahorro" subtitle={printSubtitle} />
        <div ref={coachRef} style={{ display: 'inline-block' }}>
            <PrimaryBtn onClick={openAdd} T={T}>
              <Plus size={16} /> Nuevo objetivo
            </PrimaryBtn>
          </div>
        </div>
      </div>

      {goals.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            {
              label: 'Total objetivos',
              value: String(globalStats.total),
              color: T.accent,
            },
            {
              label: 'Completados',
              value: String(globalStats.completed),
              color: T.green,
            },
            {
              label: 'Total ahorrado',
              value: fmt(
                globalStats.totalSaved,
                displayCurrency,
                displayCurrency,
                rates
              ),
              color: T.title,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '1rem',
                borderRadius: '1rem',
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.375rem',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: item.color,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

{!coachSeen && goals.length === 0 && (
        <CoachMark
          targetRef={coachRef}
          title="¡Empieza a ahorrar!"
          description="Pulsa aquí para crear tu primer objetivo. La app calculará automáticamente cuánto necesitas ahorrar cada mes para llegar a tiempo."
          onDismiss={coachMarkSeen}
        />
      )}

      {goals.length === 0 ? (
        <div
          style={{ textAlign: 'center', padding: '4rem 2rem', color: T.muted }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: T.title,
              marginBottom: '0.5rem',
            }}
          >
            Sin objetivos todavía
          </div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Crea tu primer objetivo para empezar a ahorrar con propósito.
          </div>
          <PrimaryBtn onClick={openAdd} T={T}>
            <Plus size={16} /> Crear objetivo
          </PrimaryBtn>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))',
            gap: '1rem',
          }}
        >
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={(id) => setConfirmDelete(id)}
            />
          ))}
        </div>
      )}

<PrintFooter section="Objetivos de ahorro" />

      {modal !== null &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '32rem',
                maxHeight: '92vh',
                overflow: 'auto',
                background: T.cardBg,
                borderRadius: '1.5rem 1.5rem 0 0',
                padding: '1.5rem',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.title,
                    }}
                  >
                    {modal === 'add'
                      ? '🎯 Nuevo objetivo'
                      : '✏️ Editar objetivo'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      marginTop: '0.1rem',
                    }}
                  >
                    Paso {step} de {TOTAL_STEPS}
                  </div>
                </div>
                <GhostBtn onClick={closeModal} T={T}>
                  <X size={18} />
                </GhostBtn>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.375rem',
                  marginBottom: '1.5rem',
                }}
              >
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: '0.25rem',
                      borderRadius: '9999px',
                      background: i < step ? T.accent : T.cardBorder,
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div
                style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}
              >
                {step > 1 && (
                  <SecondaryBtn
                    onClick={() => setStep((s) => s - 1)}
                    T={T}
                    style={{ flex: 1 }}
                  >
                    ← Atrás
                  </SecondaryBtn>
                )}
                {step < TOTAL_STEPS ? (
                  <PrimaryBtn onClick={handleNext} T={T} style={{ flex: 2 }}>
                    Siguiente →
                  </PrimaryBtn>
                ) : (
                  <PrimaryBtn onClick={save} T={T} style={{ flex: 2 }}>
                    <Check size={16} /> Guardar objetivo
                  </PrimaryBtn>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar objetivo?"
          message="Esta acción no se puede deshacer."
          onConfirm={() => {
            setGoals((prev) => prev.filter((g) => g.id !== confirmDelete));
            toast('Objetivo eliminado', 'success');
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

{showFirstWin && (
        <FirstWinToast
          type="goal"
          onDone={() => {
            setShowFirstWin(false);
            localStorage.setItem('fh_setup_highlight', 'true');
            setTab('dashboard');
          }}
        />
      )}
    </div>
  );
}
