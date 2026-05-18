import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import {
  Card,
  Modal,
  ConfirmModal,
  Field,
  Input,
  Sel,
  PrimaryBtn,
  SecondaryBtn,
  GhostBtn,
  QuickCategoryModal,
} from '../components/UI';
import { createEntity, touchEntity } from '../lib/entityHelpers';

const uid = () => crypto.randomUUID();

const CATEGORY_COLORS = [
  '#1d4ed8',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#0d9488',
  '#4f46e5',
];

// ─── Group ────────────────────────────────────────────────────────────────────
function Group({
  title,
  items,
  type,
  T,
  projections,
  openEdit,
  del,
}: {
  title: string;
  items: any[];
  type: 'income' | 'expense';
  T: any;
  projections: any[];
  openEdit: (cat: any) => void;
  del: (id: string) => void;
}) {
  const { realExpenses, goals } = useApp();

  return (
    <Card T={T}>
      <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '0.25rem',
          }}
        >
          {type === 'income' ? (
            <ArrowUpCircle size={18} color={T.green} />
          ) : (
            <ArrowDownCircle size={18} color={T.red} />
          )}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: type === 'income' ? T.green : T.red,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            letterSpacing: '-0.02em',
          }}
        >
          {items.length} categorías
        </div>
      </div>
      <div
        style={{
          padding: '0 1.75rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {items.map((cat) => {
          const usedByProjections = projections.filter(
            (p) => p.categoryId === cat.id
          );
          const usedByReals = realExpenses.filter(
            (e) => e.categoryId === cat.id
          );
          const usedByGoals = goals.filter(
            (g) => g.mode === 'auto' && g.categoryId === cat.id
          );

          return (
            <div
              key={cat.id}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: T.body,
                  }}
                >
                  {cat.name}
                </span>

                {usedByProjections.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: T.amberBg,
                      color: T.amber,
                      border: `1px solid ${T.amberBorder}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📈 {usedByProjections.length} proyección
                    {usedByProjections.length !== 1 ? 'es' : ''}
                  </span>
                )}

                {usedByReals.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: T.redBg,
                      color: T.red,
                      border: `1px solid ${T.redBorder}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🧾 {usedByReals.length} gasto
                    {usedByReals.length !== 1 ? 's reales' : ' real'}
                  </span>
                )}

                {usedByGoals.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: T.accentLight,
                      color: T.accent,
                      border: `1px solid ${T.accent}33`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🎯 {usedByGoals.length} objetivo
                    {usedByGoals.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <GhostBtn
                  onClick={() => openEdit(cat)}
                  T={T}
                  aria-label={`Editar ${cat.name}`}
                >
                  <Pencil size={14} />
                </GhostBtn>
                <GhostBtn
                  onClick={() => del(cat.id)}
                  T={T}
                  color={T.red}
                  aria-label={`Eliminar ${cat.name}`}
                >
                  <Trash2 size={14} />
                </GhostBtn>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              color: T.muted,
              fontSize: '0.875rem',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              Sin categorías de {type === 'income' ? 'ingreso' : 'gasto'}
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Usa el botón "Nueva categoría" para añadir una.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function Categories() {
  const { T, categories, setCategories, projections, realExpenses, goals, categoryRules, setCategoryRules } =
    useApp();
  const toast = useToast();

  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({ categoryId: '', keywords: '' });

  const saveRule = () => {
    if (!ruleForm.categoryId || !ruleForm.keywords.trim()) return;
    const keywords = ruleForm.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (editingRule) {
      setCategoryRules((prev: any[]) =>
        prev.map((r: any) => r.id === editingRule.id ? { ...r, categoryId: ruleForm.categoryId, keywords } : r)
      );
    } else {
      setCategoryRules((prev: any[]) => [...prev, { id: uid(), categoryId: ruleForm.categoryId, keywords }]);
    }
    setEditingRule(null);
    setRuleForm({ categoryId: '', keywords: '' });
    toast('Regla guardada', 'success');
  };
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    color: CATEGORY_COLORS[0],
  });

  const openAdd = () => {
    setForm({ name: '', type: 'expense', color: CATEGORY_COLORS[0] });
    setModal('add');
  };

  const openEdit = (cat: any) => {
    setForm({ ...cat });
    setModal(cat.id);
  };

  const save = () => {
    if (!form.name) return;
    if (modal === 'add') {
      // ✨ MIGRADO: createEntity añade id + createdAt + updatedAt
      setCategories((p: any[]) => [...p, createEntity({ ...form })]);
      toast('Categoría creada correctamente', 'success');
    } else {
      // ✨ MIGRADO: touchEntity refresca updatedAt preservando createdAt
      setCategories((p: any[]) =>
        p.map((c) => (c.id === modal ? touchEntity(c, form) : c))
      );
      toast('Categoría actualizada correctamente', 'success');
    }
    setModal(null);
  };

  const del = (id: string) => {
    const usedByProjections = projections.filter(
      (p: any) => p.categoryId === id
    );
    const usedByReals = realExpenses.filter((e: any) => e.categoryId === id);
    const usedByGoals = goals.filter(
      (g: any) => g.mode === 'auto' && g.categoryId === id
    );
    setConfirmDelete({ id, usedByProjections, usedByReals, usedByGoals });
  };

  const confirmDel = () => {
    setCategories((p: any[]) => p.filter((c) => c.id !== confirmDelete.id));
    toast('Categoría eliminada', 'success');
    setConfirmDelete(null);
  };

  const catToDelete = confirmDelete
    ? categories.find((c: any) => c.id === confirmDelete.id)
    : null;

  const hasImpact =
    confirmDelete &&
    (confirmDelete.usedByProjections.length > 0 ||
      confirmDelete.usedByReals.length > 0 ||
      confirmDelete.usedByGoals.length > 0);

  return (
    <div className="fh-print-section">
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
            Organización
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
            Categorías
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Clasifica tus ingresos y gastos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowRulesModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.125rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.pageBg,
              color: T.body,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ⚙️ Reglas automáticas
            {categoryRules.length > 0 && (
              <span style={{
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: T.accentLight,
                color: T.accent,
                fontSize: '0.65rem',
                fontWeight: 800,
              }}>
                {categoryRules.length}
              </span>
            )}
          </button>
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nueva categoría
          </PrimaryBtn>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
        }}
      >
        <Group
          title="Ingresos"
          items={categories.filter((c: any) => c.type === 'income')}
          type="income"
          T={T}
          projections={projections}
          openEdit={openEdit}
          del={del}
        />
        <Group
          title="Gastos"
          items={categories.filter((c: any) => c.type === 'expense')}
          type="expense"
          T={T}
          projections={projections}
          openEdit={openEdit}
          del={del}
        />
      </div>

            {/* ── Modal reglas de auto-categorización ── */}
            {showRulesModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', overflowY: 'auto' }}>
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: '1.5rem', boxShadow: T.cardShadowLg, width: '100%', maxWidth: '36rem', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeSlideIn 0.2s ease both' }}>
            {/* Cabecera sticky */}
            <div style={{ padding: '1rem 1.5rem 0.75rem', borderBottom: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', position: 'sticky', top: 0, background: T.cardBg, zIndex: 1, borderRadius: '1.5rem 1.5rem 0 0' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.title, letterSpacing: '-0.02em', margin: 0 }}>
                  ⚙️ Reglas de auto-categorización
                </h2>
                <p style={{ fontSize: '0.8rem', color: T.muted, marginTop: '0.25rem', lineHeight: 1.5, margin: '0.25rem 0 0' }}>
                  La app busca estas palabras en la descripción del movimiento bancario al importar y asigna la categoría automáticamente.
                </p>
              </div>
              <button
                onClick={() => { setShowRulesModal(false); setEditingRule(null); setRuleForm({ categoryId: '', keywords: '' }); }}
                style={{ padding: '0.4rem', borderRadius: '0.625rem', border: 'none', background: T.btnSecBg, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Lista de reglas existentes */}
              {categoryRules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {categoryRules.map((rule: any) => {
                    const cat = categories.find((c: any) => c.id === rule.categoryId);
                    return (
                      <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: T.pageBg, border: `1px solid ${T.cardBorder}` }}>
                        <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: cat?.color ?? T.cardBorder, display: 'inline-block', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}>{cat?.name ?? 'Sin categoría'}</div>
                          <div style={{ fontSize: '0.72rem', color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rule.keywords.join(', ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                          <GhostBtn onClick={() => { setEditingRule(rule); setRuleForm({ categoryId: rule.categoryId, keywords: rule.keywords.join(', ') }); }} T={T}>
                            <Pencil size={14} />
                          </GhostBtn>
                          <GhostBtn onClick={() => { setCategoryRules((prev: any[]) => prev.filter((r: any) => r.id !== rule.id)); toast('Regla eliminada', 'success'); }} T={T} color={T.red}>
                            <Trash2 size={14} />
                          </GhostBtn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 2rem', color: T.muted }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.3 }}>⚙️</div>
                  <p style={{ fontWeight: 700, color: T.title, marginBottom: '0.25rem', fontSize: '1rem' }}>Aún no tienes reglas</p>
                  <p style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
                    Añade reglas para que al importar extractos bancarios la categorización sea automática.
                  </p>
                </div>
              )}

              {/* Formulario nueva / editar regla */}
              <div style={{ padding: '1.25rem', borderRadius: '1rem', background: editingRule ? T.accentLight : T.pageBg, border: `1.5px solid ${editingRule ? T.accent : T.cardBorder}`, transition: 'all 0.2s' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: editingRule ? T.accent : T.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
                  {editingRule ? '✏️ Editando regla' : '➕ Nueva regla'}
                </div>
                <Field label="Categoría">
                  <Sel T={T} value={ruleForm.categoryId} onChange={(e: any) => setRuleForm((r) => ({ ...r, categoryId: e.target.value }))}>
                    <option value="">— Selecciona una categoría —</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Ingreso' : 'Gasto'})</option>
                    ))}
                  </Sel>
                </Field>
                <Field label="Palabras clave (separadas por comas)">
                  <Input
                    T={T}
                    placeholder="Ej: mercadona, lidl, supermercado"
                    value={ruleForm.keywords}
                    onChange={(e: any) => setRuleForm((r) => ({ ...r, keywords: e.target.value }))}
                  />
                </Field>
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                  <PrimaryBtn
                    onClick={saveRule}
                    fullWidth
                    disabled={!ruleForm.categoryId || !ruleForm.keywords.trim()}
                  >
                    <Check size={15} />
                    {editingRule ? 'Actualizar regla' : 'Guardar regla'}
                  </PrimaryBtn>
                  {editingRule && (
                    <SecondaryBtn onClick={() => { setEditingRule(null); setRuleForm({ categoryId: '', keywords: '' }); }} T={T}>
                      Cancelar
                    </SecondaryBtn>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                    {modal === 'add' ? 'Nueva categoría' : 'Editar categoría'}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                    }}
                  >
                    Define nombre, tipo y color
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
                <Field label="Nombre">
                  <Input
                    T={T}
                    placeholder="Ej: Alimentación"
                    value={form.name}
                    onChange={(e: any) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </Field>

                <Field label="Tipo">
                  <Sel
                    T={T}
                    value={form.type}
                    onChange={(e: any) =>
                      setForm({ ...form, type: e.target.value })
                    }
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </Sel>
                </Field>

                <Field label="Color identificativo">
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.625rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '50%',
                          border:
                            form.color === c
                              ? `3px solid ${T.title}`
                              : '3px solid transparent',
                          background: c,
                          cursor: 'pointer',
                          transform:
                            form.color === c ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.15s',
                          boxShadow:
                            form.color === c
                              ? `0 0 0 2px white, 0 0 0 4px ${c}`
                              : 'none',
                        }}
                      />
                    ))}
                  </div>
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
                    Guardar
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

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          danger={true}
          title="¿Eliminar categoría?"
          message={
            <>
              <span>
                Vas a eliminar la categoría{' '}
                <strong>"{catToDelete?.name}"</strong>.
              </span>

              {hasImpact && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: T.amberBg,
                    border: `1px solid ${T.amberBorder}`,
                    fontSize: '0.775rem',
                    color: T.amber,
                    lineHeight: 1.6,
                  }}
                >
                  ⚠️ Los siguientes elementos se quedarán{' '}
                  <strong>sin categoría asignada</strong>:
                  <span style={{ display: 'block', marginTop: '0.375rem' }}>
                    {confirmDelete.usedByReals.length > 0 && (
                      <span style={{ display: 'block' }}>
                        🧾 <strong>{confirmDelete.usedByReals.length}</strong>{' '}
                        gasto
                        {confirmDelete.usedByReals.length !== 1
                          ? 's reales'
                          : ' real'}
                      </span>
                    )}
                    {confirmDelete.usedByProjections.length > 0 && (
                      <span style={{ display: 'block' }}>
                        📈{' '}
                        <strong>
                          {confirmDelete.usedByProjections.length}
                        </strong>{' '}
                        proyección
                        {confirmDelete.usedByProjections.length !== 1
                          ? 'es'
                          : ''}
                      </span>
                    )}
                    {confirmDelete.usedByGoals.length > 0 && (
                      <span style={{ display: 'block' }}>
                        🎯 <strong>{confirmDelete.usedByGoals.length}</strong>{' '}
                        objetivo
                        {confirmDelete.usedByGoals.length !== 1
                          ? 's de ahorro automático'
                          : ' de ahorro automático'}
                      </span>
                    )}
                  </span>
                </span>
              )}

              {!hasImpact && (
                <span style={{ display: 'block', marginTop: '0.5rem' }}>
                  Esta categoría no tiene elementos asignados. Podrás crearla de
                  nuevo si la necesitas.
                </span>
              )}
            </>
          }
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
