import { useState, useMemo, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ArrowRight, CreditCard } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import type { Account, RealExpense } from '../types';
import { today, convertAmount } from '../utils';
import { Field, Input, Sel, PrimaryBtn, SecondaryBtn } from './UI';
import { calcMinPayment } from '../lib/creditCardUtils';

const uid = () => crypto.randomUUID();

type PaymentPreset = 'min' | 'total' | 'custom';

export function CreditCardPaymentModal({
  card,
  onClose,
}: {
  card: Account;
  onClose: () => void;
}) {
  const {
    T,
    accounts,
    realExpenses,
    setRealExpenses,
    realBalanceMap,
    baseCurrency,
    rates,
  } = useApp();

  const toast = useToast();

  // ── Datos derivados ──────────────────────────────────────────────────────
  const ccInfo = realBalanceMap[card.id];
  const debt = ccInfo?.creditDebt ?? 0;
  const cardCurrency = card.currency ?? baseCurrency;

  const minPayment = useMemo(
    () => calcMinPayment(debt, card.minPaymentPct ?? 5),
    [debt, card.minPaymentPct]
  );

  // Cuentas válidas como origen: cualquier cuenta NO tarjeta de crédito
  const sourceAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.accountType !== 'credit_card' && a.id !== card.id
      ),
    [accounts, card.id]
  );

  // ── Estado del formulario ────────────────────────────────────────────────
  const [fromAccountId, setFromAccountId] = useState(
    sourceAccounts[0]?.id ?? ''
  );
  const [preset, setPreset] = useState<PaymentPreset>(
    debt > 0 ? 'total' : 'custom'
  );
  const [amount, setAmount] = useState<string>(debt > 0 ? debt.toFixed(2) : '');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cambio de preset → recalcula importe sugerido
  const selectPreset = (p: PaymentPreset) => {
    setPreset(p);
    if (p === 'min') setAmount(minPayment.toFixed(2));
    else if (p === 'total') setAmount(debt.toFixed(2));
    // custom: respeta lo que haya escrito
    setErrors((er) => ({ ...er, amount: undefined as any }));
  };

  // Si el usuario edita el importe a mano, pasa a "custom"
  const handleAmountChange = (val: string) => {
    setAmount(val);
    setPreset('custom');
    setErrors((er) => ({ ...er, amount: undefined as any }));
  };

  // ── Validación y guardado ────────────────────────────────────────────────
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fromAccountId) e.fromAccountId = 'Selecciona la cuenta de origen';
    if (!amount || +amount <= 0) e.amount = 'Introduce un importe válido';
    if (+amount > debt + 0.01)
      e.amount = `El importe no puede superar la deuda actual (${debt.toFixed(
        2
      )} ${cardCurrency})`;
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const transferId = uid();
    const amt = +amount;

    // Convertir el importe a la divisa de la cuenta origen si difieren
    const amtInSourceCurrency = convertAmount(
      amt,
      cardCurrency,
      fromAcc?.currency ?? baseCurrency,
      rates
    );

    const outEntry: RealExpense = {
      id: uid(),
      entryDate: date,
      valueDate: date,
      description: `Pago tarjeta ${card.name}`,
      categoryId: '__transfer__',
      amount: amtInSourceCurrency,
      currency: fromAcc?.currency ?? baseCurrency,
      type: 'expense',
      accountId: fromAccountId,
      notes: notes || `Pago a tarjeta de crédito ${card.name}`,
      isTransfer: true,
      transferId,
    };

    const inEntry: RealExpense = {
      id: uid(),
      entryDate: date,
      valueDate: date,
      description: `Pago recibido desde ${fromAcc?.name ?? '—'}`,
      categoryId: '__transfer__',
      amount: amt,
      currency: cardCurrency,
      type: 'income',
      accountId: card.id,
      notes: notes || `Pago desde ${fromAcc?.name ?? '—'}`,
      isTransfer: true,
      transferId,
    };

    setRealExpenses((prev) => [...prev, outEntry, inEntry]);
    toast(`Pago de ${amt.toFixed(2)} ${cardCurrency} registrado`, 'success');
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (sourceAccounts.length === 0) {
    return createPortal(
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
        }}
      >
        <div
          style={{
            background: T.cardBg,
            border: `1px solid ${T.amberBorder}`,
            borderRadius: '1.5rem',
            padding: '1.75rem',
            maxWidth: '26rem',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: T.title,
              margin: '0 0 0.5rem',
            }}
          >
            No hay cuentas disponibles
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: T.muted,
              lineHeight: 1.5,
              margin: '0 0 1.25rem',
            }}
          >
            Para registrar un pago necesitas al menos una cuenta corriente, de
            ahorro o de inversión. Crea una desde la pestaña{' '}
            <strong>Cuentas</strong>.
          </p>
          <PrimaryBtn onClick={onClose} fullWidth>
            Entendido
          </PrimaryBtn>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
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
        {/* Cabecera */}
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
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.625rem',
                background: T.accentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CreditCard size={16} color={T.accent} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: T.title,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Registrar pago de tarjeta
              </h2>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: T.muted,
                  marginTop: '0.15rem',
                }}
              >
                {card.name} · Deuda actual:{' '}
                <strong style={{ color: T.red }}>
                  {debt.toFixed(2)} {cardCurrency}
                </strong>
              </p>
            </div>
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

        <div
          style={{
            padding: '1rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Vista previa origen → destino */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              borderRadius: '1rem',
              background: T.pageBg,
              border: `1.5px solid ${T.accent}33`,
            }}
          >
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.2rem',
                }}
              >
                Pagar desde
              </div>
              <div
                style={{ fontSize: '0.875rem', fontWeight: 800, color: T.red }}
              >
                {accounts.find((a) => a.id === fromAccountId)?.name ?? '—'}
              </div>
            </div>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: T.accentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${T.accent}33`,
              }}
            >
              <ArrowRight size={14} color={T.accent} />
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.2rem',
                }}
              >
                Tarjeta
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.green,
                }}
              >
                {card.name}
              </div>
            </div>
          </div>

          {/* Cuenta origen */}
          <Field label="Cuenta de origen *" error={errors.fromAccountId}>
            <Sel
              T={T}
              value={fromAccountId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setFromAccountId(e.target.value);
                setErrors((er) => ({ ...er, fromAccountId: undefined as any }));
              }}
            >
              <option value="">— Selecciona —</option>
              {sourceAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency ?? baseCurrency})
                </option>
              ))}
            </Sel>
          </Field>

          {/* Presets de importe */}
          {debt > 0 && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748b',
                  marginBottom: '0.5rem',
                }}
              >
                Importe a pagar
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '0.625rem',
                }}
              >
                {(
                  [
                    [
                      'min',
                      `Mínimo`,
                      minPayment.toFixed(2),
                      T.amber,
                      T.amberBg,
                      T.amberBorder,
                    ],
                    [
                      'total',
                      `Total`,
                      debt.toFixed(2),
                      T.green,
                      T.greenBg,
                      T.greenBorder,
                    ],
                    [
                      'custom',
                      `Otro`,
                      '',
                      T.accent,
                      T.accentLight,
                      `${T.accent}33`,
                    ],
                  ] as const
                ).map(([val, label, sub, color, bg, border]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => selectPreset(val as PaymentPreset)}
                    style={{
                      padding: '0.625rem 0.5rem',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      border: `2px solid ${
                        preset === val ? color : T.cardBorder
                      }`,
                      background: preset === val ? bg : T.pageBg,
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: preset === val ? color : T.muted,
                        marginBottom: sub ? '0.15rem' : 0,
                      }}
                    >
                      {label}
                    </div>
                    {sub && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: preset === val ? color : T.muted,
                          opacity: 0.85,
                        }}
                      >
                        {sub} {cardCurrency}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Importe / Fecha */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label={`Importe (${cardCurrency}) *`} error={errors.amount}>
              <Input
                T={T}
                error={errors.amount}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleAmountChange(e.target.value)
                }
              />
            </Field>
            <Field label="Fecha del pago">
              <Input
                T={T}
                type="date"
                value={date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDate(e.target.value)
                }
              />
            </Field>
          </div>

          {/* Notas */}
          <Field label="Notas (opcional)">
            <Input
              T={T}
              placeholder="Añade una nota..."
              value={notes}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNotes(e.target.value)
              }
            />
          </Field>

          {/* Info */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.875rem',
              background: T.accentLight,
              border: `1px solid ${T.accent}33`,
              fontSize: '0.775rem',
              color: T.accent,
              lineHeight: 1.5,
            }}
          >
            💡 Se registrará como una <strong>transferencia</strong>: gasto en
            tu cuenta de origen e ingreso en la tarjeta (reduce la deuda).
            Aparecerá en la pestaña <strong>Transferencias</strong> y puedes
            editarlo o eliminarlo desde ahí.
          </div>

          {/* Botones */}
          <div
            style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}
          >
            <PrimaryBtn onClick={save} fullWidth>
              <Check size={15} /> Registrar pago
            </PrimaryBtn>
            <SecondaryBtn onClick={onClose} T={T}>
              Cancelar
            </SecondaryBtn>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
