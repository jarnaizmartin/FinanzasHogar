import { useState, useMemo, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { RealExpense } from '../types';
import { CURRENCIES, fmt, today, fmtDateShort, convertAmount } from '../utils';
import {
  Card,
  ConfirmModal,
  Field,
  Input,
  Sel,
  PrimaryBtn,
  SecondaryBtn,
  PrintButton,
  PrintHeader,
  PrintFooter,
} from '../components/UI';
import { createEntity } from '../lib/entityHelpers';


const uid = () => crypto.randomUUID();

// ─── Tipos ───────────────────────────────────────────────────────────────────
type TransferForm = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  currency: string;
  date: string;
  description: string;
  notes: string;
};

type TransferPair = {
  transferId: string;
  outLeg: RealExpense;
  inLeg: RealExpense;
};

// ─── Helper: agrupa los pares de transferencia ───────────────────────────────
function getTransferPairs(realExpenses: RealExpense[]): TransferPair[] {
  const map = new Map<string, { outLeg?: RealExpense; inLeg?: RealExpense }>();

  realExpenses.forEach((e) => {
    if (!e.isTransfer || !e.transferId) return;
    if (!map.has(e.transferId)) map.set(e.transferId, {});
    const pair = map.get(e.transferId)!;
    if (e.type === 'expense') pair.outLeg = e;
    else pair.inLeg = e;
  });

  return Array.from(map.entries())
    .map(([id, pair]) => ({
      transferId: id,
      outLeg: pair.outLeg!,
      inLeg: pair.inLeg!,
    }))
    .filter((p) => p.outLeg && p.inLeg)
    .sort((a, b) => b.outLeg.entryDate.localeCompare(a.outLeg.entryDate));
}

// ─── Transfers ───────────────────────────────────────────────────────────────
export function Transfers() {
  const {
    T,
    accounts,
    realExpenses,
    setRealExpenses,
    displayCurrency,
    baseCurrency,
    rates,
    dateFormat,
  } = useApp();

  const toast = useToast();

  const [modal, setModal] = useState<null | 'add'>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const buildEmptyForm = (): TransferForm => ({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    currency: baseCurrency,
    date: today(),
    description: 'Traspaso entre cuentas',
    notes: '',
  });

  const [form, setForm] = useState<TransferForm>(buildEmptyForm);

  const transfers = useMemo(() => getTransferPairs(realExpenses), [realExpenses]);

  const totalTransferred = useMemo(
    () =>
      transfers.reduce(
        (sum, t) =>
          sum + convertAmount(t.outLeg.amount, t.outLeg.currency, displayCurrency, rates),
        0
      ),
    [transfers, displayCurrency, rates]
  );

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fromAccountId) e.fromAccountId = 'Selecciona la cuenta origen';
    if (!form.toAccountId) e.toAccountId = 'Selecciona la cuenta destino';
    if (form.fromAccountId && form.fromAccountId === form.toAccountId)
      e.toAccountId = 'Las cuentas deben ser diferentes';
    if (!form.amount || +form.amount <= 0) e.amount = 'Introduce un importe válido';
    if (!form.description.trim()) e.description = 'La descripción es obligatoria';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const transferId = uid();
    const fromAcc = accounts.find((a) => a.id === form.fromAccountId);
    const toAcc = accounts.find((a) => a.id === form.toAccountId);
    const descOut = form.description || `Transferencia → ${toAcc?.name}`;
    const descIn = form.description || `Transferencia ← ${fromAcc?.name}`;

    const outEntry = createEntity<RealExpense>({
      entryDate: form.date,
      valueDate: form.date,
      description: descOut,
      categoryId: '__transfer__',
      amount: +form.amount,
      currency: form.currency,
      type: 'expense',
      accountId: form.fromAccountId,
      notes: form.notes || `Transferencia a ${toAcc?.name}`,
      isTransfer: true,
      transferId,
    });

    const inEntry = createEntity<RealExpense>({
      entryDate: form.date,
      valueDate: form.date,
      description: descIn,
      categoryId: '__transfer__',
      amount: +form.amount,
      currency: form.currency,
      type: 'income',
      accountId: form.toAccountId,
      notes: form.notes || `Transferencia desde ${fromAcc?.name}`,
      isTransfer: true,
      transferId,
    });

    setRealExpenses((prev) => [...prev, outEntry, inEntry]);
    toast('Transferencia registrada correctamente', 'success');
    setModal(null);
    setForm(buildEmptyForm());
    setErrors({});
  };

  const deleteTransfer = (transferId: string) => {
    setRealExpenses((prev) => prev.filter((e) => e.transferId !== transferId));
    toast('Transferencia eliminada', 'success');
    setConfirmDelete(null);
  };

  const transferToDelete = transfers.find((t) => t.transferId === confirmDelete);

  const printSubtitle = `${transfers.length} traspaso${transfers.length !== 1 ? 's' : ''} · Total movido: ${fmt(totalTransferred, displayCurrency, displayCurrency, rates)}`;

  return (
    <div className="fh-print-section">

      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader title="Traspasos entre cuentas" subtitle={printSubtitle} />

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
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            Movimientos
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: T.title,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            Traspasos entre cuentas
          </h2>
          <p style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}>
            Mueve dinero entre tus cuentas sin alterar tu patrimonio
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <PrintButton
            T={T}
            documentTitle="Traspasos entre cuentas"
            sectionTitle="Traspasos entre cuentas"
            subtitle={printSubtitle}
          />
          <PrimaryBtn
            onClick={() => { setForm(buildEmptyForm()); setErrors({}); setModal('add'); }}
          >
            <Plus size={15} />
            Nuevo traspaso
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Aviso si menos de 2 cuentas ── */}
      {accounts.length < 2 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.amberBg,
          border: `1px solid ${T.amberBorder}`,
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: T.amber,
          fontWeight: 600,
          lineHeight: 1.6,
        }}>
          ⚠️ Necesitas al menos <strong>2 cuentas</strong> para hacer transferencias. Ve a la pestaña <strong>Cuentas</strong> y añade una segunda cuenta.
        </div>
      )}

      {/* ── Resumen de tarjetas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        {[
          {
            label: 'Total traspasos',
            value: `${transfers.length}`,
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Volumen total movido',
            value: fmt(totalTransferred, displayCurrency, displayCurrency, rates),
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Efecto en patrimonio',
            value: '✓ Neutro',
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
        ].map((item) => (
          <div key={item.label} style={{
            padding: '1rem 1.25rem',
            borderRadius: '1rem',
            background: item.bg,
            border: `1px solid ${item.border}`,
          }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: item.color,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.35rem',
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: item.color,
              letterSpacing: '-0.02em',
              textAlign: 'right',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Caja informativa ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        background: T.accentLight,
        border: `1px solid ${T.accent}33`,
        marginBottom: '1.5rem',
      }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: '0.8rem', color: T.accent, lineHeight: 1.6 }}>
          <strong>¿Qué es una transferencia?</strong> Es un movimiento de dinero entre dos de tus propias cuentas.
          El sistema genera automáticamente un <strong>gasto en la cuenta origen</strong> y un <strong>ingreso en la cuenta destino</strong>.
          El efecto en tu patrimonio total es <strong>neutro</strong> y las transferencias no cuentan como ingresos ni gastos reales en los informes.
        </div>
      </div>

      {/* ── Lista de transferencias ── */}
      {transfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: T.muted }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>↔️</div>
          <p style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title, marginBottom: '0.5rem' }}>
          Todavía no tienes traspasos registrados
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: T.muted,
            marginBottom: '1.5rem',
            maxWidth: '28rem',
            margin: '0 auto 1.5rem',
          }}>
            Usa los traspasos para registrar movimientos de dinero entre tus propias cuentas sin distorsionar tus estadísticas.
          </p>
          {accounts.length >= 2 && (
            <PrimaryBtn onClick={() => { setForm(buildEmptyForm()); setErrors({}); setModal('add'); }}>
              <Plus size={15} />
              Registrar primer traspaso
            </PrimaryBtn>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {transfers.map(({ transferId, outLeg, inLeg }) => {
            const fromAcc = accounts.find((a) => a.id === outLeg.accountId);
            const toAcc = accounts.find((a) => a.id === inLeg.accountId);
            const amtDisplay = fmt(outLeg.amount, outLeg.currency, displayCurrency, rates);
            const showOriginal = outLeg.currency !== displayCurrency;

            return (
              <Card key={transferId} T={T} style={{ border: `1.5px solid ${T.accent}33` }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.125rem 1.5rem',
                }}>
                  {/* Icono */}
                  <div style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '0.875rem',
                    background: T.accentLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    border: `1px solid ${T.accent}33`,
                  }}>
                    ↔️
                  </div>

                  {/* Cuentas — visualización origen → destino */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    flex: 1,
                    minWidth: 0,
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Desde
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: T.red }}>
                        {fromAcc?.name ?? '—'}
                      </div>
                    </div>
                    <ArrowRight size={16} color={T.muted} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Hacia
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: T.green }}>
                        {toAcc?.name ?? '—'}
                      </div>
                    </div>
                    <div style={{
                      marginLeft: '0.5rem',
                      padding: '0.2rem 0',
                      borderLeft: `1px solid ${T.cardBorder}`,
                      paddingLeft: '0.875rem',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: T.muted }}>
                        {outLeg.description}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: T.muted, marginTop: '0.1rem' }}>
                        {fmtDateShort(outLeg.entryDate, dateFormat)}
                        {outLeg.notes && outLeg.notes !== outLeg.description && (
                          <span style={{ fontStyle: 'italic', marginLeft: '0.375rem' }}>· {outLeg.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Importe */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: T.accent,
                      whiteSpace: 'nowrap',
                    }}>
                      {showOriginal
                        ? `${outLeg.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${outLeg.currency}`
                        : amtDisplay}
                    </div>
                    {showOriginal && (
                      <div style={{ fontSize: '0.72rem', color: T.muted }}>≈ {amtDisplay}</div>
                    )}
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      background: T.accentLight,
                      color: T.accent,
                      border: `1px solid ${T.accent}33`,
                      display: 'inline-block',
                      marginTop: '0.25rem',
                    }}>
                      ↔ Patrimonio neutro
                    </span>
                  </div>

                  {/* Eliminar */}
                  <div className="fh-no-print" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => setConfirmDelete(transferId)}
                      title="Eliminar transferencia"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.625rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: 'transparent',
                        color: T.red,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal nueva transferencia ── */}
      {modal === 'add' &&
        createPortal(
          <div style={{
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
          }}>
            <div style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '34rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'fadeSlideIn 0.2s ease both',
            }}>
              {/* Cabecera sticky */}
              <div style={{
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
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: T.title,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}>
                    Nuevo traspaso
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: T.muted, marginTop: '0.25rem' }}>
                    Mueve dinero entre tus cuentas sin afectar al patrimonio
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

              <div style={{
                padding: '1rem 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>

                {/* Vista previa origen → destino */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  background: T.pageBg,
                  border: `1.5px solid ${T.accent}33`,
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                      Origen
                    </div>
                    <div style={{ fontSize: '0.925rem', fontWeight: 800, color: T.red }}>
                      {accounts.find((a) => a.id === form.fromAccountId)?.name ?? '—'}
                    </div>
                  </div>
                  <div style={{
                    width: '2.25rem', height: '2.25rem',
                    borderRadius: '50%',
                    background: T.accentLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${T.accent}33`,
                  }}>
                    <ArrowRight size={16} color={T.accent} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                      Destino
                    </div>
                    <div style={{ fontSize: '0.925rem', fontWeight: 800, color: T.green }}>
                      {accounts.find((a) => a.id === form.toAccountId)?.name ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Cuenta origen / destino */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Cuenta origen *" error={errors.fromAccountId}>
                    <Sel
                      T={T}
                      value={form.fromAccountId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        const id = e.target.value;
                        const acc = accounts.find((a) => a.id === id);
                        setForm((f) => ({ ...f, fromAccountId: id, currency: acc?.currency ?? baseCurrency }));
                        setErrors((er) => ({ ...er, fromAccountId: undefined as any }));
                      }}
                    >
                      <option value="">— Selecciona —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id} disabled={a.id === form.toAccountId}>
                          {a.name}
                        </option>
                      ))}
                    </Sel>
                  </Field>
                  <Field label="Cuenta destino *" error={errors.toAccountId}>
                    <Sel
                      T={T}
                      value={form.toAccountId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        setForm((f) => ({ ...f, toAccountId: e.target.value }));
                        setErrors((er) => ({ ...er, toAccountId: undefined as any }));
                      }}
                    >
                      <option value="">— Selecciona —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id} disabled={a.id === form.fromAccountId}>
                          {a.name}
                        </option>
                      ))}
                    </Sel>
                  </Field>
                </div>

                {/* Importe / Divisa */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Importe *" error={errors.amount}>
                    <Input
                      T={T}
                      error={errors.amount}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setForm((f) => ({ ...f, amount: e.target.value }));
                        setErrors((er) => ({ ...er, amount: undefined as any }));
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

                {/* Fecha */}
                <Field label="Fecha de transferencia">
                  <Input
                    T={T}
                    type="date"
                    value={form.date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </Field>

                {/* Descripción */}
                <Field label="Descripción *" error={errors.description}>
                  <Input
                    T={T}
                    error={errors.description}
                    placeholder="Ej: Transferencia ahorro mensual"
                    value={form.description}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setForm((f) => ({ ...f, description: e.target.value }));
                      setErrors((er) => ({ ...er, description: undefined as any }));
                    }}
                  />
                </Field>

                {/* Notas */}
                <Field label="Notas (opcional)">
                  <Input
                    T={T}
                    placeholder="Añade una nota..."
                    value={form.notes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </Field>

                {/* Info */}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.875rem',
                  background: T.accentLight,
                  border: `1px solid ${T.accent}33`,
                  fontSize: '0.775rem',
                  color: T.accent,
                  lineHeight: 1.5,
                }}>
                  💡 Se creará un <strong>gasto en la cuenta origen</strong> y un <strong>ingreso en la cuenta destino</strong> con el mismo importe. Tu patrimonio total permanecerá igual y las transferencias no aparecen en los informes de ingresos/gastos.
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <PrimaryBtn onClick={save} fullWidth>
                    <Check size={15} />
                    Registrar traspaso
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
          title="¿Eliminar traspaso?"
          message={`Vas a eliminar el traspaso "${transferToDelete?.outLeg?.description ?? ''}". Se eliminarán los dos movimientos vinculados (gasto e ingreso). Esta acción no se puede deshacer.`}
          onConfirm={() => deleteTransfer(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Traspasos entre cuentas" />

    </div>
  );
}
