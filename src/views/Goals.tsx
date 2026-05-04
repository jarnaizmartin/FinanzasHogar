import { useState, useMemo, useRef, type ChangeEvent } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { SavingsGoal } from '../types'; // ✅ FIX — importar desde types.ts
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
  const { T, accounts, categories, realExpenses, rates, setGoals, dateFormat } =
    useApp();
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
      {/* Barra de color lateral */}
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
                    {cat && <span>{cat.name}</span>}
                    {goal.accountId !== 'all' && acc && (
                      <span>· {acc.name}</span>
                    )}
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

        {/* Progreso */}
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

        {/* Ritmo — solo modo auto */}
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

        {/* Botón actualizar — solo modo manual */}
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

  // ── Coach Mark ────────────────────────────────────────────────────────────
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
      if (!form.accountId)  e.accountId  = 'Selecciona una cuenta';
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

  // ── Resumen global ─────────────────────────────────────────────────────────
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
        `${globalStats.completed} completado${globalStats.completed !== 1 ? 's' : ''}`
      );
    parts.push(
      fmt(globalStats.totalSaved, displayCurrency, displayCurrency, rates) +
        ' ahorrado'
    );
    return parts.join(' · ');
  }, [globalStats, displayCurrency, rates]);

  // ── Paso 1: nombre, emoji, meta ────────────────────────────────────────────
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

  // ── Paso 2: modo manual vs automático ──────────────────────────────────────
  const renderStep2 = () => {
    // ✅ FIX UX — categorías disponibles para el tipo seleccionado
    const availableCategories = categories.filter(
      (c) => c.type === form.autoType
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
            {/* Tipo de movimiento */}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {([
                  ['income',  '📈', 'Ingresos', T.green, T.greenBg,            T.greenBorder],
                  ['expense', '📉', 'Gastos',   T.red,   T.redBg ?? T.amberBg, T.redBorder ?? T.amberBorder],
                ] as const).map(([val, icon, label, color, bg]) => (
                  <div
                    key={val}
                    onClick={() => setForm((f) => ({ ...f, autoType: val, categoryId: '' }))}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.875rem',
                      cursor: 'pointer',
                      border: `2px solid ${form.autoType === val ? color : T.cardBorder}`,
                      background: form.autoType === val ? bg : T.pageBg,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: form.autoType === val ? color : T.muted }}>
                      {label}
                    </span>
                    {form.autoType === val && <Check size={14} color={color} style={{ marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ FIX UX — aviso si no hay categorías del tipo seleccionado */}
            {availableCategories.length === 0 && (
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
                {form.autoType === 'income' ? 'ingresos' : 'gastos'} creadas.
                Crea una con el botón <strong>"+"</strong> o usa el modo{' '}
                <strong>Manual</strong>.
              </div>
            )}

            <Field label="Categoría que se sumará" error={errors.categoryId}>
              <div
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <div style={{ flex: 1 }}>
                  <Sel
                    T={T}
                    value={form.categoryId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      setForm((f) => ({ ...f, categoryId: e.target.value }));
                      setErrors((er) => ({
                        ...er,
                        categoryId: undefined as any,
                      }));
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

            {showQuickCategory && (
              <QuickCategoryModal
                T={T}
                defaultType={form.autoType as 'income' | 'expense'}
                onSave={(newCat) => {
                  setForm((f) => ({ ...f, categoryId: newCat.id }));
                  setShowQuickCategory(false);
                }}
                onClose={() => setShowQuickCategory(false)}
              />
            )}

<Field label="Cuenta" error={errors.accountId}>
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

  // ── Paso 3: resumen ────────────────────────────────────────────────────────
  const renderStep3 = () => {
    const cat = categories.find((c) => c.id === form.categoryId);
    const acc = accounts.find((a) => a.id === form.accountId);
    const progress =
      form.mode === 'manual' && form.targetAmount > 0
        ? (form.currentAmount / form.targetAmount) * 100
        : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '1.25rem',
            background: T.pageBg,
            border: `2px solid ${form.color}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '0.375rem',
              background: form.color,
              borderRadius: '0.375rem 0 0 0.375rem',
            }}
          />
          <div style={{ marginLeft: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '2rem' }}>{form.emoji}</span>
              <div>
                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: T.title,
                  }}
                >
                  {form.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: T.muted }}>
                  {form.mode === 'manual'
                    ? '✍️ Seguimiento manual'
                    : `⚡ Auto · ${cat?.name ?? '—'}`}
                </div>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: form.color + '22',
                  color: form.color,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {form.mode === 'manual' ? 'Manual' : 'Automático'}
              </div>
            </div>

            {/* Barra de progreso resumen */}
            <div style={{ marginBottom: '0.625rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: T.muted }}>
                  {fmt(
                    form.mode === 'manual' ? form.currentAmount : 0,
                    form.currency,
                    form.currency,
                    rates
                  )}{' '}
                  ahorrado
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: form.color,
                  }}
                >
                  {Math.round(Math.min(progress, 100))}%
                </span>
              </div>
              <div
                style={{
                  height: '0.625rem',
                  borderRadius: '9999px',
                  background: T.cardBorder,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '9999px',
                    background: form.color,
                    width: `${Math.min(progress, 100)}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.3rem',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: T.muted }}>
                  Inicio
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: T.title,
                  }}
                >
                  {fmt(form.targetAmount, form.currency, form.currency, rates)}
                </span>
              </div>
            </div>

            {/* Detalle */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
              }}
            >
              {[
                {
                  label: 'Meta',
                  value: fmt(
                    form.targetAmount,
                    form.currency,
                    form.currency,
                    rates
                  ),
                },
                {
                  label: 'Fecha límite',
                  value: form.deadline
                    ? fmtDateShort(form.deadline, dateFormat)
                    : 'Sin límite',
                },
                ...(form.mode === 'auto'
                  ? [
                      { label: 'Categoría', value: cat?.name ?? '—' },
                      {
                        label: 'Cuenta',
                        value: acc?.name ?? '—',
                      },
                    ]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.625rem',
                    background: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: T.muted,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: T.title,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            fontSize: '0.775rem',
            color: T.green,
            fontWeight: 600,
          }}
        >
          ✅ Todo listo. Pulsa "
          {modal === 'add' ? 'Crear objetivo' : 'Guardar cambios'}" para
          continuar.
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="fh-print-section">
      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Objetivos de Ahorro"
        subtitle={printSubtitle}
      />

      {/* Cabecera */}
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
            Objetivos de ahorro
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Define metas y sigue tu progreso automáticamente
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton
            T={T}
            documentTitle="Objetivos_de_Ahorro"
            sectionTitle="Objetivos de Ahorro"
            subtitle={printSubtitle}
          />
          <div ref={coachRef} style={{ display: 'inline-flex' }}>
            <PrimaryBtn onClick={openAdd}>
              <Plus size={15} />
              Nuevo objetivo
            </PrimaryBtn>
          </div>
        </div>
      </div>

      {/* Resumen global */}
      {goals.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          {[
            {
              label: 'Objetivos activos',
              value: `${globalStats.total}`,
              color: T.accent,
              bg: T.accentLight,
              border: `${T.accent}33`,
            },
            {
              label: 'Completados',
              value: `${globalStats.completed}`,
              color: T.green,
              bg: T.greenBg,
              border: T.greenBorder,
            },
            {
              label: 'Total objetivo',
              value: fmt(
                globalStats.totalTarget,
                displayCurrency,
                displayCurrency,
                rates
              ),
              color: T.muted,
              bg: T.pageBg,
              border: T.cardBorder,
            },
            {
              label: 'Total ahorrado',
              value: fmt(
                globalStats.totalSaved,
                displayCurrency,
                displayCurrency,
                rates
              ),
              color: T.green,
              bg: T.greenBg,
              border: T.greenBorder,
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
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de objetivos */}
      {goals.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))',
            gap: '1.25rem',
          }}
        >
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      ) : (
        <div
          style={{ textAlign: 'center', padding: '6rem 2rem', color: T.muted }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>
            🎯
          </div>
          <p
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: T.title,
              marginBottom: '0.5rem',
            }}
          >
            Todavía no tienes objetivos de ahorro
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
            Define una meta, elige si quieres seguirla manualmente o de forma
            automática vinculándola a tus movimientos reales.
          </p>
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Crear primer objetivo
          </PrimaryBtn>
        </div>
      )}

      {/* Modal creación / edición */}
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
                  position: 'sticky',
                  top: 0,
                  background: T.cardBg,
                  zIndex: 1,
                  borderRadius: '1.5rem 1.5rem 0 0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '0.375rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        height: '0.25rem',
                        borderRadius: '9999px',
                        background: s <= step ? T.accent : T.cardBorder,
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
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
                      {modal === 'add' ? 'Nuevo objetivo' : 'Editar objetivo'}
                    </h2>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: T.muted,
                        marginTop: '0.25rem',
                      }}
                    >
                      Paso {step} de {TOTAL_STEPS} —{' '}
                      {step === 1
                        ? 'Nombre y meta'
                        : step === 2
                        ? 'Seguimiento'
                        : 'Resumen'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
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

              <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1.25rem',
                  }}
                >
                  {step < TOTAL_STEPS ? (
                    <PrimaryBtn onClick={handleNext} fullWidth>
                      Continuar →
                    </PrimaryBtn>
                  ) : (
                    <PrimaryBtn onClick={save} fullWidth>
                      <Check size={15} />
                      {modal === 'add' ? 'Crear objetivo' : 'Guardar cambios'}
                    </PrimaryBtn>
                  )}
                  {step > 1 && (
                    <SecondaryBtn onClick={() => setStep((s) => s - 1)} T={T}>
                      ← Atrás
                    </SecondaryBtn>
                  )}
                  {step === 1 && (
                    <SecondaryBtn onClick={closeModal} T={T}>
                      Cancelar
                    </SecondaryBtn>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar objetivo?"
          message={`Vas a eliminar "${
            goals.find((g) => g.id === confirmDelete)?.name
          }". Esta acción no se puede deshacer.`}
          onConfirm={() => {
            setGoals((prev) => prev.filter((g) => g.id !== confirmDelete));
            toast('Objetivo eliminado', 'success');
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Coach Mark — primera visita ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Ponle nombre a lo que ahorras"
          description="La app calcula automáticamente si vas a llegar a tiempo según tu ritmo actual de ahorro. Sin que hagas nada."
          ctaLabel="Me apunto →"
          onDismiss={coachMarkSeen}
          accentColor="#d97706"
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

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Objetivos de Ahorro" />
    </div>
  );
}
