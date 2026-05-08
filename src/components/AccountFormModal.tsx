// ─────────────────────────────────────────────────────────────────────────────
// AccountFormModal.tsx
// Modal reutilizable para crear/editar una cuenta o tarjeta de crédito.
// Sigue el mismo patrón visual que el resto de modales (createPortal + overlay
// global) para no quedar encajonado en la pantalla que lo invoca.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Home,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Field, Input, Sel, PrimaryBtn, SecondaryBtn } from './UI';
import { InstitutionSelector } from './InstitutionSelector';
import { CURRENCIES } from '../utils';
import type { Account } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

// ── Tipos exportados ────────────────────────────────────────────────────────
export type AccountForm = {
  name: string;
  institution: string;
  balance: string | number;
  date: string;
  minBalance: string | number;
  currency: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
  creditLimit: string | number;
  billingDay: string | number;
  paymentDueDay: string | number;
  interestRate: string | number;
  minPaymentPct: string | number;
  // ── Préstamos ──
  loanType: 'mortgage' | 'personal';
  monthlyPayment: string | number;
  paymentsRemaining: string | number;
  interestType: 'fixed' | 'variable';
  paymentDay: string | number;
  paymentAccountId: string;
};

export type AccountFormEntry = {
  name: string;
  institution?: string;
  balance: number;
  date: string;
  minBalance: number;
  currency: string;
  accountType: AccountForm['accountType'];
  creditLimit?: number;
  billingDay?: number;
  paymentDueDay?: number;
  interestRate?: number;
  minPaymentPct?: number;
  // ── Préstamos ──
  loanType?: 'mortgage' | 'personal';
  monthlyPayment?: number;
  paymentsRemaining?: number;
  interestType?: 'fixed' | 'variable';
  paymentDay?: number;
  paymentAccountId?: string;
};

type Props = {
  mode: 'add' | 'edit';
  account?: Account;
  onSave: (entry: AccountFormEntry) => void;
  onClose: () => void;
};

const ACCOUNT_TYPES: Array<{
  value: AccountForm['accountType'];
  label: string;
  icon: typeof Wallet;
}> = [
  { value: 'checking', label: 'Corriente', icon: Wallet },
  { value: 'savings', label: 'Ahorro', icon: PiggyBank },
  { value: 'credit_card', label: 'Tarjeta', icon: CreditCard },
  { value: 'investment', label: 'Inversión', icon: TrendingUp },
  { value: 'loan', label: 'Préstamo', icon: Home },
];

export function AccountFormModal({ mode, account, onSave, onClose }: Props) {
  const { T, baseCurrency } = useApp();

  const [form, setForm] = useState<AccountForm>(() => {
    if (mode === 'edit' && account) {
      return {
        name: account.name,
        institution: account.institution ?? '',
        balance: account.balance.toFixed(2),
        date: account.date,
        minBalance: (account.minBalance ?? 0).toFixed(2),
        currency: account.currency ?? baseCurrency,
        accountType: account.accountType ?? 'checking',
        creditLimit:
          account.creditLimit != null ? account.creditLimit.toFixed(2) : '',
        billingDay: account.billingDay ?? '',
        paymentDueDay: account.paymentDueDay ?? '',
        interestRate: account.interestRate ?? '',
        minPaymentPct: account.minPaymentPct ?? '5',
        // ── Préstamos ──
        loanType: account.loanType ?? 'mortgage',
        monthlyPayment:
          account.monthlyPayment != null
            ? account.monthlyPayment.toFixed(2)
            : '',
        paymentsRemaining: account.paymentsRemaining ?? '',
        interestType: account.interestType ?? 'fixed',
        paymentDay: account.paymentDay ?? '',
        paymentAccountId: account.paymentAccountId ?? '',
      };
    }
    return {
      name: '',
      institution: '',
      balance: '',
      date: today(),
      minBalance: '',
      currency: baseCurrency,
      accountType: 'checking',
      creditLimit: '',
      billingDay: '',
      paymentDueDay: '',
      interestRate: '',
      minPaymentPct: '5',
      // ── Préstamos (defaults) ──
      loanType: 'mortgage',
      monthlyPayment: '',
      paymentsRemaining: '',
      interestType: 'fixed',
      paymentDay: '',
      paymentAccountId: '',
    };
  });

  const isCreditCard = form.accountType === 'credit_card';
  const isLoan = form.accountType === 'loan';

  // Cuentas no-préstamo y no-tarjeta para el selector de "cuenta de cargo"
  const { accounts: allAccounts } = useApp();
  const payerAccounts = allAccounts.filter(
    (a) =>
      a.accountType !== 'credit_card' &&
      a.accountType !== 'loan' &&
      a.id !== account?.id
  );

  const isValid =
    form.name.trim() !== '' &&
    form.balance !== '' &&
    !Number.isNaN(+form.balance) &&
    (!isCreditCard ||
      (form.creditLimit !== '' && !Number.isNaN(+form.creditLimit))) &&
    (!isLoan ||
      (form.monthlyPayment !== '' &&
        !Number.isNaN(+form.monthlyPayment) &&
        form.paymentAccountId !== ''));

  const handleSubmit = () => {
    if (!isValid) return;

    const entry: AccountFormEntry = {
      name: form.name.trim(),
      institution:
        form.institution.trim() !== '' ? form.institution.trim() : undefined,
      balance: +form.balance,
      date: form.date,
      minBalance:
        isCreditCard || isLoan
          ? 0
          : form.minBalance === ''
          ? 0
          : +(form.minBalance || 0),
      currency: form.currency,
      accountType: form.accountType,
      creditLimit:
        isCreditCard && form.creditLimit !== '' ? +form.creditLimit : undefined,
      billingDay:
        isCreditCard && form.billingDay !== '' ? +form.billingDay : undefined,
      paymentDueDay:
        isCreditCard && form.paymentDueDay !== ''
          ? +form.paymentDueDay
          : undefined,
      // interestRate sirve tanto para tarjetas como para préstamos
      interestRate:
        (isCreditCard || isLoan) && form.interestRate !== ''
          ? +form.interestRate
          : undefined,
      minPaymentPct:
        isCreditCard && form.minPaymentPct !== ''
          ? +form.minPaymentPct
          : undefined,
      // ── Préstamos ──
      loanType: isLoan ? form.loanType : undefined,
      monthlyPayment:
        isLoan && form.monthlyPayment !== '' ? +form.monthlyPayment : undefined,
      paymentsRemaining:
        isLoan && form.paymentsRemaining !== ''
          ? +form.paymentsRemaining
          : undefined,
      interestType: isLoan ? form.interestType : undefined,
      paymentDay:
        isLoan && form.paymentDay !== '' ? +form.paymentDay : undefined,
      paymentAccountId:
        isLoan && form.paymentAccountId !== ''
          ? form.paymentAccountId
          : undefined,
    };

    onSave(entry);
  };

  const update = <K extends keyof AccountForm>(key: K, value: AccountForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
        {/* Header */}
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
              {mode === 'add' ? 'Nueva cuenta' : 'Editar cuenta'}
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
            onClick={onClose}
            aria-label="Cerrar"
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

        {/* Body */}
        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
          {/* Entidad financiera (PRIMER CAMPO, opcional) */}
          <Field label="Entidad financiera (opcional)">
            <InstitutionSelector
              T={T}
              value={form.institution}
              onChange={(newValue) => update('institution', newValue)}
            />
            <p
              style={{
                fontSize: '0.68rem',
                color: T.muted,
                marginTop: '0.25rem',
              }}
            >
              💡 Te ayuda a identificar visualmente tus cuentas
            </p>
          </Field>

          {/* Tipo de cuenta */}
          <Field label="Tipo de cuenta">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
              }}
            >
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => {
                const selected = form.accountType === value;
                return (
                  <div
                    key={value}
                    onClick={() => update('accountType', value)}
                    style={{
                      padding: '0.875rem 0.5rem',
                      borderRadius: '0.875rem',
                      cursor: 'pointer',
                      border: `2px solid ${selected ? T.accent : T.cardBorder}`,
                      background: selected ? T.accentLight : T.pageBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={18} color={selected ? T.accent : T.muted} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: selected ? T.accent : T.muted,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Field>

          {/* Nombre */}
          <Field label="Nombre de la cuenta">
            <Input
              T={T}
              type="text"
              placeholder="Ej: Cuenta nómina"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update('name', e.target.value)
              }
              autoFocus
            />
          </Field>

          {/* Divisa + Fecha */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Divisa">
              <Sel
                T={T}
                value={form.currency}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  update('currency', e.target.value)
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </Sel>
            </Field>
            <Field
              label={
                isCreditCard
                  ? 'Fecha del saldo'
                  : isLoan
                  ? 'Capital pendiente a fecha de'
                  : 'Saldo a fecha de'
              }
            >
              <Input
                T={T}
                type="date"
                value={form.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  update('date', e.target.value)
                }
              />
            </Field>
          </div>

          {/* Saldo */}
          <Field
            label={
              isCreditCard
                ? 'Deuda actual (0 si no debes nada)'
                : isLoan
                ? 'Capital pendiente HOY'
                : 'Saldo actual'
            }
          >
            <Input
              T={T}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.balance}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update('balance', e.target.value)
              }
            />
          </Field>

          {/* Saldo mínimo (solo cuentas normales — no aplica a tarjetas ni préstamos) */}
          {!isCreditCard && !isLoan && (
            <Field label="Saldo mínimo de aviso (opcional)">
              <Input
                T={T}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.minBalance}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  update('minBalance', e.target.value)
                }
              />
            </Field>
          )}

          {/* Campos exclusivos de tarjeta de crédito */}
          {isCreditCard && (
            <>
              <Field label="Límite de crédito">
                <Input
                  T={T}
                  type="number"
                  step="0.01"
                  placeholder="Ej: 3000"
                  value={form.creditLimit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    update('creditLimit', e.target.value)
                  }
                />
              </Field>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <Field label="Día de corte (1-31)">
                  <Input
                    T={T}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 25"
                    value={form.billingDay}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('billingDay', e.target.value)
                    }
                  />
                </Field>
                <Field label="Día de pago (1-31)">
                  <Input
                    T={T}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 5"
                    value={form.paymentDueDay}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('paymentDueDay', e.target.value)
                    }
                  />
                </Field>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <Field label="TAE % (opcional)">
                  <Input
                    T={T}
                    type="number"
                    step="0.1"
                    placeholder="Ej: 24.9"
                    value={form.interestRate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('interestRate', e.target.value)
                    }
                  />
                </Field>
                <Field label="Pago mínimo % (opcional)">
                  <Input
                    T={T}
                    type="number"
                    step="0.1"
                    placeholder="Ej: 5"
                    value={form.minPaymentPct}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('minPaymentPct', e.target.value)
                    }
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── Campos exclusivos de préstamos/hipotecas ── */}
          {isLoan && (
            <>
              {/* Banner explicativo */}
              <div
                style={{
                  padding: '0.75rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: T.accentLight,
                  border: `1px solid ${T.accent}33`,
                  fontSize: '0.75rem',
                  color: T.accent,
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                }}
              >
                💡 <strong>Introduce los datos que conoces HOY</strong> (los ves
                en tu última cuota o en la app del banco). No necesitas recordar
                el capital inicial ni la fecha de firma.
              </div>

              {/* Tipo de préstamo */}
              <Field label="Tipo de préstamo">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                  }}
                >
                  {(
                    [
                      ['mortgage', '🏠', 'Hipoteca'],
                      ['personal', '💰', 'Préstamo personal'],
                    ] as const
                  ).map(([val, icon, label]) => {
                    const selected = form.loanType === val;
                    return (
                      <div
                        key={val}
                        onClick={() => update('loanType', val)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.75rem',
                          cursor: 'pointer',
                          border: `2px solid ${
                            selected ? T.accent : T.cardBorder
                          }`,
                          background: selected ? T.accentLight : T.pageBg,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                        <span
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            color: selected ? T.accent : T.muted,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Field>

              {/* Cuota mensual (obligatorio) */}
              <Field label="Cuota mensual *">
                <Input
                  T={T}
                  type="number"
                  step="0.01"
                  placeholder="Ej: 750.00"
                  value={form.monthlyPayment}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    update('monthlyPayment', e.target.value)
                  }
                />
              </Field>

              {/* Cuotas restantes + Día de cargo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <Field label="Cuotas restantes">
                  <Input
                    T={T}
                    type="number"
                    min="1"
                    placeholder="Ej: 240"
                    value={form.paymentsRemaining}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('paymentsRemaining', e.target.value)
                    }
                  />
                </Field>
                <Field label="Día de cargo (1-31)">
                  <Input
                    T={T}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 1"
                    value={form.paymentDay}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('paymentDay', e.target.value)
                    }
                  />
                </Field>
              </div>

              {/* Tipo de interés + % aplicable */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <Field label="Tipo de interés">
                  <Sel
                    T={T}
                    value={form.interestType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      update(
                        'interestType',
                        e.target.value as 'fixed' | 'variable'
                      )
                    }
                  >
                    <option value="fixed">Fijo</option>
                    <option value="variable">Variable</option>
                  </Sel>
                </Field>
                <Field label="% aplicable actual">
                  <Input
                    T={T}
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.50"
                    value={form.interestRate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update('interestRate', e.target.value)
                    }
                  />
                </Field>
              </div>

              {/* Cuenta de cargo (obligatorio) */}
              <Field label="Cuenta desde la que se paga la cuota *">
                <Sel
                  T={T}
                  value={form.paymentAccountId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    update('paymentAccountId', e.target.value)
                  }
                >
                  <option value="">— Selecciona una cuenta —</option>
                  {payerAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      🏦 {a.name} ({a.currency ?? baseCurrency})
                    </option>
                  ))}
                </Sel>
                {payerAccounts.length === 0 && (
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: T.amber,
                      marginTop: '0.35rem',
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ Necesitas tener al menos una cuenta corriente o de ahorro
                    para poder asociar un préstamo.
                  </p>
                )}
              </Field>
            </>
          )}

          {/* Botones acción (mismo patrón que RealExpenses) */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <PrimaryBtn onClick={handleSubmit} fullWidth disabled={!isValid}>
              <Check size={15} />
              {mode === 'add' ? 'Crear cuenta' : 'Guardar cambios'}
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
