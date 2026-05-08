import { useState, useMemo, useRef, useEffect } from 'react';
import { useCoachMark, CoachMark } from '../components/CoachMark';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  Receipt,
  CreditCard,
  Eye,
  Home,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmt, fmtDateDMY, convertAmount } from '../utils';
import {
  daysUntilBilling,
  daysUntilPayment,
  getCreditHealthScore,
  getCreditHealthColors,
  calcMinPayment,
  calcYearlyInterestCost,
} from '../lib/creditCardUtils';
import {
  estimateLoanInterest,
  calcLoanProgress,
  getLoanTypeLabel,
  getLoanTypeIcon,
} from '../lib/loanUtils';
import {
  Card,
  ConfirmModal,
  PrimaryBtn,
  SecondaryBtn,
  DangerBtn,
  PrintButton,
  PrintHeader,
  PrintFooter,
} from '../components/UI';
import { FirstWinToast } from '../components/FirstWinToast';
import { CreditCardDetailView } from '../components/CreditCardDetailView';
import { AccountFormModal, type AccountFormEntry } from '../components/AccountFormModal';
import { InstitutionLogo } from '../components/InstitutionLogo';
import { AmortizationFormModal } from '../components/AmortizationFormModal';
import { AmortizationHistory } from '../components/AmortizationHistory';
import { LoanDetailView } from '../components/LoanDetailView';
import type { AmortizationMode } from '../lib/loanUtils';

const uid = () => crypto.randomUUID();

// ── Paleta por tipo de cuenta (cuentas normales: no tarjeta, no préstamo) ──
const ACCOUNT_TYPE_STYLES: Record<string, { tintBg: string; tintBorder: string; accent: string; label: string }> = {
  checking:   { tintBg: '#dbeafe55', tintBorder: '#3b82f633', accent: '#2563eb', label: 'Cuenta Corriente' },
  savings:    { tintBg: '#d1fae555', tintBorder: '#10b98133', accent: '#059669', label: 'Cuenta de Ahorro' },
  investment: { tintBg: '#ede9fe66', tintBorder: '#8b5cf633', accent: '#7c3aed', label: 'Cuenta de Inversión' },
  cash:       { tintBg: '#fef3c755', tintBorder: '#f59e0b33', accent: '#d97706', label: 'Efectivo' },
};
const getAccountStyle = (type?: string, T?: any) =>
  ACCOUNT_TYPE_STYLES[type ?? 'checking'] ?? { tintBg: T?.pageBg ?? '#f8fafc', tintBorder: T?.cardBorder ?? '#e2e8f0', accent: T?.accent ?? '#3b82f6', label: 'Cuenta' };

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
    setRealAccountFilter,
    setRealReturnTo,
    setTab,
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
  const creditCardAccounts = accounts.filter(a => a.accountType === 'credit_card');
  const loanAccounts = accounts.filter(a => a.accountType === 'loan');
  const totalBase = accounts.filter(a => a.accountType !== 'credit_card' && a.accountType !== 'loan').reduce((s, a) => s + a.balance, 0);
  const totalReal = accounts.reduce(
    (s, a) => s + (realBalanceMap[a.id]?.realBalance ?? a.balance),
    0
  );
  const totalCreditDebt = creditCardAccounts.reduce(
    (s, a) => s + (realBalanceMap[a.id]?.creditDebt ?? 0),
    0
  );
  const totalLoanDebt = loanAccounts.reduce(
    (s, a) => s + (realBalanceMap[a.id]?.loanDebt ?? a.balance),
    0
  );

  // Items del resumen (pre-computados, OXC-safe)
  const summaryItems = [
    { label: 'Saldo inicial', value: fmtAccount(totalBase, baseCurrency), color: T.accent, bg: T.accentLight, border: `${T.accent}33` },
    { label: 'Saldo real actual', value: fmtAccount(totalReal, baseCurrency), color: totalReal >= 0 ? T.green : T.red, bg: totalReal >= 0 ? T.greenBg : (T.redBg ?? T.amberBg), border: totalReal >= 0 ? T.greenBorder : (T.redBorder ?? T.amberBorder) },
    ...(creditCardAccounts.length > 0 ? [{ label: '💳 Deuda tarjetas', value: fmtAccount(totalCreditDebt, baseCurrency), color: totalCreditDebt > 0 ? T.red : T.green, bg: totalCreditDebt > 0 ? (T.redBg ?? T.amberBg) : T.greenBg, border: totalCreditDebt > 0 ? (T.redBorder ?? T.amberBorder) : T.greenBorder }] : []),
    ...(loanAccounts.length > 0 ? [{ label: '🏠 Deuda préstamos', value: fmtAccount(totalLoanDebt, baseCurrency), color: totalLoanDebt > 0 ? T.red : T.green, bg: totalLoanDebt > 0 ? (T.redBg ?? T.amberBg) : T.greenBg, border: totalLoanDebt > 0 ? (T.redBorder ?? T.amberBorder) : T.greenBorder }] : []),
    { label: 'Cuentas activas', value: `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}`, color: T.muted, bg: T.pageBg, border: T.cardBorder },
  ];

  // ── UIContext: modal de pago global y peticiones del simulador ─────────────
  const {
    openPaymentModal,
    simulatorRequestAccountId,
    consumeSimulatorRequest,
  } = useApp();

  // ── Estado con tipos explícitos ────────────────────────────────────────────
  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string | null>(null);
  const [amortizingLoanId, setAmortizingLoanId] = useState<string | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [undoAmortization, setUndoAmortization] = useState<{ loanId: string; amortizationId: string } | null>(null);

  // Refs por tarjeta para hacer scroll cuando una alerta abre el simulador
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Procesar petición de "abrir simulador desde alerta" ────────────────────
  // Cuando AlertsBanner llama a requestOpenSimulator(id):
  //  1. UIContext cambia tab a 'accounts' y guarda el id
  //  2. Este efecto detecta el id, abre el simulador, hace scroll y resalta
  //  3. Consume la petición para que no se vuelva a disparar
  // Cuando AlertsBanner pide abrir el simulador de una tarjeta:
  //  → ahora navegamos directamente a la vista detalle (donde vive el simulador en su tab)
  useEffect(() => {
    if (!simulatorRequestAccountId) return;
    setSelectedCreditCardId(simulatorRequestAccountId);
    consumeSimulatorRequest();
  }, [simulatorRequestAccountId, consumeSimulatorRequest]);

  // ── Handlers del modal (ahora delegado a AccountFormModal) ───────────────
  const openAdd = () => setModal('add');
  const openEdit = (acc: (typeof accounts)[number]) => setModal(acc.id);

  const handleSaveAccount = (entry: AccountFormEntry) => {
    const isFirstAccount = modal === 'add' && accounts.length === 0;

    if (modal === 'add') {
      const newAccountId = uid();
      let linkedProjectionId: string | undefined;

      // ── Auto-crear proyección vinculada para préstamos ──
      if (
        entry.accountType === 'loan' &&
        entry.monthlyPayment &&
        entry.monthlyPayment > 0 &&
        entry.paymentAccountId
      ) {
        linkedProjectionId = uid();
        const chargeDay = entry.paymentDay && entry.paymentDay >= 1 && entry.paymentDay <= 31
          ? entry.paymentDay
          : 1;
        // Fecha de inicio = primer día de cargo (este mes o el siguiente)
        const today = new Date();
        const startThisMonth = new Date(today.getFullYear(), today.getMonth(), chargeDay);
        const start = startThisMonth >= today
          ? startThisMonth
          : new Date(today.getFullYear(), today.getMonth() + 1, chargeDay);
        const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

        setProjections((prev) => [
          ...prev,
          {
            id: linkedProjectionId,
            name: `Cuota: ${entry.name}`,
            accountId: entry.paymentAccountId!,    // Cuenta origen (corriente)
            toAccountId: newAccountId,             // Préstamo (destino)
            categoryId: '__transfer__',
            type: 'transfer',
            amount: entry.monthlyPayment,
            frequency: 'monthly',
            startDate,
            endDate: '',
            isRecurring: true,
            recurringDay: chargeDay,
            linkedLoanId: newAccountId,             // Marca la proyección como vinculada
          },
        ]);
      }

      setAccounts((p) => [
        ...p,
        { ...entry, id: newAccountId, linkedProjectionId, acknowledgedExpenseIds: [] },
      ]);
      toast(
        entry.accountType === 'loan'
          ? 'Préstamo creado. Se ha generado automáticamente una proyección mensual para la cuota.'
          : 'Cuenta creada correctamente',
        'success'
      );
    } else {
      const existingAccount = accounts.find((a) => a.id === modal);
      const dateChanged =
        existingAccount && entry.date !== existingAccount.date;

      // ── Sincronizar proyección vinculada si es un préstamo ──
      if (
        existingAccount?.accountType === 'loan' &&
        existingAccount.linkedProjectionId
      ) {
        const cuotaCambio =
          entry.monthlyPayment !== undefined &&
          entry.monthlyPayment !== existingAccount.monthlyPayment;
        const diaCambio =
          entry.paymentDay !== undefined &&
          entry.paymentDay !== existingAccount.paymentDay;
        const cuentaCambio =
          entry.paymentAccountId !== undefined &&
          entry.paymentAccountId !== existingAccount.paymentAccountId;

        if (cuotaCambio || diaCambio || cuentaCambio) {
          setProjections((prev) =>
            prev.map((p) => {
              if (p.id !== existingAccount.linkedProjectionId) return p;
              return {
                ...p,
                amount: entry.monthlyPayment ?? p.amount,
                accountId: entry.paymentAccountId ?? p.accountId,
                recurringDay: entry.paymentDay ?? p.recurringDay,
                name: `Cuota: ${entry.name}`,
              };
            })
          );
        }
      }

      setAccounts((p) =>
        p.map((a) => {
          if (a.id !== modal) return a;
          let acknowledgedExpenseIds = a.acknowledgedExpenseIds ?? [];
          if (dateChanged) {
            const newlyAcknowledged = realExpenses
              .filter(
                (e) =>
                  e.accountId === a.id &&
                  e.valueDate <= entry.date &&
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

  // Cuenta que se está editando (si modal es un id de cuenta existente)
  const editingAccount =
    modal && modal !== 'add' ? accounts.find((a) => a.id === modal) : undefined;

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
    const deletedAccount = accounts.find((a) => a.id === deletedId);
    setAccounts((p) => p.filter((a) => a.id !== deletedId));
    // ✅ FIX — sin variable shadowing: prev/proj en lugar de p/p
    setRealExpenses((prev) => prev.filter((e) => e.accountId !== deletedId));
    setProjections((prev) =>
      prev.filter((proj) => {
        // Borra proyecciones cuya cuenta origen es la eliminada
        if (proj.accountId === deletedId) return false;
        // Borra también la proyección vinculada si la cuenta era un préstamo
        if (
          deletedAccount?.accountType === 'loan' &&
          proj.id === deletedAccount.linkedProjectionId
        ) {
          return false;
        }
        // Borra cualquier proyección tipo transfer cuyo destino era el préstamo
        if (proj.type === 'transfer' && proj.toAccountId === deletedId) {
          return false;
        }
        return true;
      })
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

  // ── Handler de amortización parcial (Fase 2.1) ────────────────────────────
  // 1. Crea un movimiento real (income) en el préstamo → reduce la deuda
  // 2. Crea un movimiento real (expense) en la cuenta origen → registra el gasto
  // 3. Si hay comisión, crea un segundo expense en la cuenta origen
  // 4. Actualiza el préstamo: cuota o cuotas restantes según modo
  // 5. Añade entrada al histórico amortizations[]
  // 6. Sincroniza la proyección vinculada si cambia la cuota
  const handleAmortization = (
    loan: typeof accounts[number],
    data: { amount: number; fee: number; mode: AmortizationMode; fromAccountId: string }
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const transferId = uid();
    const currency = loan.currency ?? baseCurrency;
    const currentDebt = realBalanceMap[loan.id]?.loanDebt ?? loan.balance;
    const currentPayment = loan.monthlyPayment ?? 0;
    const currentTerm = loan.paymentsRemaining ?? 0;
    const annualRate = loan.interestRate ?? 0;

    // Simulación final (para snapshot del histórico)
    const isFullPayoff = data.amount >= currentDebt;
    const newPrincipal = Math.max(0, currentDebt - data.amount);
    let newPayment = currentPayment;
    let newTerm = currentTerm;

    if (!isFullPayoff && newPrincipal > 0) {
      if (data.mode === 'reduce_payment') {
        // Mismo plazo, recalcular cuota
        if (annualRate > 0 && currentTerm > 0) {
          const i = annualRate / 100 / 12;
          newPayment = (newPrincipal * i) / (1 - Math.pow(1 + i, -currentTerm));
        } else if (currentTerm > 0) {
          newPayment = newPrincipal / currentTerm;
        }
      } else {
        // Misma cuota, recalcular plazo
        if (annualRate > 0 && currentPayment > 0) {
          const i = annualRate / 100 / 12;
          if (currentPayment > newPrincipal * i) {
            newTerm = Math.ceil(
              -Math.log(1 - (newPrincipal * i) / currentPayment) / Math.log(1 + i)
            );
          }
        } else if (currentPayment > 0) {
          newTerm = Math.ceil(newPrincipal / currentPayment);
        }
      }
    } else if (isFullPayoff) {
      newPayment = 0;
      newTerm = 0;
    }

    const interestSavedEstimate = (() => {
      const prevInterest = currentPayment * currentTerm - currentDebt;
      const newInterest = newPayment * newTerm - newPrincipal;
      return Math.max(0, prevInterest - newInterest - data.fee);
    })();

    // ── 1. Movimiento ENTRANTE al préstamo (reduce deuda) ──
    const incomeId = uid();
    const expenseId = uid();
    const newMovements: typeof realExpenses = [
      {
        id: incomeId,
        entryDate: today,
        valueDate: today,
        description: `Amortización parcial${data.mode === 'reduce_term' ? ' (reduce plazo)' : ' (reduce cuota)'}`,
        categoryId: '__transfer__',
        amount: data.amount,
        currency,
        type: 'income',
        accountId: loan.id,
        isTransfer: true,
        transferId,
      },
      // ── 2. Movimiento SALIENTE de la cuenta origen ──
      {
        id: expenseId,
        entryDate: today,
        valueDate: today,
        description: `Amortización: ${loan.name}`,
        categoryId: '__transfer__',
        amount: data.amount,
        currency,
        type: 'expense',
        accountId: data.fromAccountId,
        isTransfer: true,
        transferId,
      },
    ];

    // ── 3. Comisión (si aplica) ──
    if (data.fee > 0) {
      newMovements.push({
        id: uid(),
        entryDate: today,
        valueDate: today,
        description: `Comisión amortización: ${loan.name}`,
        categoryId: '__transfer__',
        amount: data.fee,
        currency,
        type: 'expense',
        accountId: data.fromAccountId,
      });
    }

    setRealExpenses((prev) => [...prev, ...newMovements]);

    // ── 4. Actualizar el préstamo (cuota / plazo / histórico) ──
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== loan.id) return a;
        const newAmortization = {
          id: uid(),
          date: today,
          amount: data.amount,
          fee: data.fee,
          mode: data.mode,
          fromAccountId: data.fromAccountId,
          prevMonthlyPayment: currentPayment,
          newMonthlyPayment: newPayment,
          prevPaymentsRemaining: currentTerm,
          newPaymentsRemaining: newTerm,
          interestSavedEstimate,
        };
        return {
          ...a,
          monthlyPayment: newPayment,
          paymentsRemaining: newTerm,
          amortizations: [...(a.amortizations ?? []), newAmortization],
        };
      })
    );

    // ── 5. Sincronizar proyección vinculada (si cambia la cuota) ──
    if (loan.linkedProjectionId && newPayment !== currentPayment) {
      setProjections((prev) =>
        prev.map((p) =>
          p.id === loan.linkedProjectionId
            ? { ...p, amount: newPayment }
            : p
        )
      );
    }

    // ── 6. Si quedó liquidado, eliminar la proyección vinculada ──
    if (isFullPayoff && loan.linkedProjectionId) {
      setProjections((prev) => prev.filter((p) => p.id !== loan.linkedProjectionId));
    }

    // ── 7. Toast con resumen ──
    if (isFullPayoff) {
      toast(`🎉 ¡Préstamo liquidado! Has ahorrado ~${fmtAccount(interestSavedEstimate, currency)} en intereses.`, 'success');
    } else if (data.mode === 'reduce_term') {
      const monthsSaved = currentTerm - newTerm;
      toast(`💸 Amortización aplicada. Terminarás ${monthsSaved} ${monthsSaved === 1 ? 'mes' : 'meses'} antes y ahorrarás ~${fmtAccount(interestSavedEstimate, currency)} en intereses.`, 'success');
    } else {
      const reduction = currentPayment - newPayment;
      toast(`💸 Amortización aplicada. Tu nueva cuota es ${fmtAccount(newPayment, currency)} (−${fmtAccount(reduction, currency)}/mes).`, 'success');
    }

    setAmortizingLoanId(null);
  };

  // ── Deshacer última amortización (Fase 2.1.4) ──────────────────────────
  // Revierte TODOS los efectos de una amortización:
  //   1. Elimina los movimientos asociados (income al préstamo + expense origen + comisión)
  //   2. Restaura monthlyPayment y paymentsRemaining anteriores
  //   3. Resincroniza la proyección vinculada con la cuota anterior
  //   4. Quita la entrada del array amortizations[]
  //
  // ⚠️ Solo se permite deshacer la ÚLTIMA amortización (la más reciente) para
  // evitar inconsistencias en cascada (cada amortización se calculó sobre el
  // capital resultante de la anterior).
  const handleUndoAmortization = (loanId: string, amortizationId: string) => {
    const loan = accounts.find((a) => a.id === loanId);
    if (!loan || !loan.amortizations) return;
    const amort = loan.amortizations.find((a) => a.id === amortizationId);
    if (!amort) return;

    // 1. Borrar movimientos asociados
    //    - Los 2 movimientos del transfer (income al préstamo + expense origen) tienen el mismo transferId.
    //      Los identificamos por: misma fecha, mismo importe, descripción que empieza por "Amortización".
    //    - La comisión es un expense suelto con descripción "Comisión amortización: <nombre>".
    setRealExpenses((prev) =>
      prev.filter((e) => {
        // Movimiento income al préstamo
        if (
          e.accountId === loanId &&
          e.valueDate === amort.date &&
          e.amount === amort.amount &&
          e.type === 'income' &&
          e.isTransfer &&
          e.description.startsWith('Amortización')
        ) {
          return false;
        }
        // Movimiento expense en cuenta origen
        if (
          e.accountId === amort.fromAccountId &&
          e.valueDate === amort.date &&
          e.amount === amort.amount &&
          e.type === 'expense' &&
          e.isTransfer &&
          e.description.startsWith('Amortización:')
        ) {
          return false;
        }
        // Comisión (si la hubo)
        if (
          amort.fee > 0 &&
          e.accountId === amort.fromAccountId &&
          e.valueDate === amort.date &&
          e.amount === amort.fee &&
          e.type === 'expense' &&
          e.description.startsWith('Comisión amortización:')
        ) {
          return false;
        }
        return true;
      })
    );

    // 2. Restaurar préstamo: cuota, plazo y quitar del histórico
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== loanId) return a;
        return {
          ...a,
          monthlyPayment: amort.prevMonthlyPayment ?? a.monthlyPayment,
          paymentsRemaining: amort.prevPaymentsRemaining ?? a.paymentsRemaining,
          amortizations: (a.amortizations ?? []).filter((x) => x.id !== amortizationId),
        };
      })
    );

    // 3. Resincronizar proyección vinculada (si existe y la cuota cambió)
    if (loan.linkedProjectionId && amort.prevMonthlyPayment != null && amort.prevMonthlyPayment !== amort.newMonthlyPayment) {
      setProjections((prev) =>
        prev.map((p) =>
          p.id === loan.linkedProjectionId
            ? { ...p, amount: amort.prevMonthlyPayment! }
            : p
        )
      );
    }

    toast(`✅ Amortización deshecha. Se han revertido los movimientos y restaurado la cuota anterior.`, 'success');
    setUndoAmortization(null);
  };

  // Préstamo seleccionado para amortizar
  const amortizingLoan = amortizingLoanId
    ? accounts.find((a) => a.id === amortizingLoanId && a.accountType === 'loan')
    : null;

  // ── Vista de detalle de tarjeta (modo "drill-down") ─────────────────────
  // Si hay una tarjeta seleccionada, renderizamos la vista detalle dedicada
  // en lugar de la lista de cuentas. Patrón fintech estándar.
  const selectedCreditCard = selectedCreditCardId
    ? accounts.find((a) => a.id === selectedCreditCardId && a.accountType === 'credit_card')
    : null;

    const selectedLoan = selectedLoanId
      ? accounts.find((a) => a.id === selectedLoanId && a.accountType === 'loan')
      : null;

    if (selectedLoan) {
      return (
        <>
          <LoanDetailView
            loan={selectedLoan}
            onBack={() => setSelectedLoanId(null)}
            onEdit={(l) => openEdit(l)}
            onDelete={(id) => setConfirmDelete(id)}
            onAmortize={(id) => setAmortizingLoanId(id)}
            onUndoAmortization={(amortId) => setUndoAmortization({ loanId: selectedLoan.id, amortizationId: amortId })}
          />

          {modal && (
            <AccountFormModal
              mode={modal === 'add' ? 'add' : 'edit'}
              account={editingAccount}
              onSave={handleSaveAccount}
              onClose={() => setModal(null)}
            />
          )}

          {amortizingLoan && (
            <AmortizationFormModal
              loan={amortizingLoan}
              onConfirm={(data) => handleAmortization(amortizingLoan, data)}
              onClose={() => setAmortizingLoanId(null)}
            />
          )}

{confirmDelete && deleteImpact && (
            <ConfirmModal
              T={T}
              title="¿Eliminar préstamo?"
              message={`Vas a eliminar "${accToDelete?.name}"${
                deleteImpact.parts.length > 0
                  ? ` y todos sus datos asociados: ${deleteImpact.parts.join(', ')}.`
                  : '. No tiene datos asociados.'
              } Esta acción no se puede deshacer.`}
              onConfirm={() => {
                confirmDel();
                setSelectedLoanId(null);
              }}
              onCancel={() => setConfirmDelete(null)}
            />
          )}

          {/* Confirm deshacer amortización (también disponible desde vista detalle) */}
          {undoAmortization && (() => {
            const l = accounts.find((a) => a.id === undoAmortization.loanId);
            const am = l?.amortizations?.find((a) => a.id === undoAmortization.amortizationId);
            if (!l || !am) return null;
            const cur = l.currency ?? baseCurrency;
            return (
              <ConfirmModal
                T={T}
                title="¿Deshacer amortización?"
                message={`Vas a deshacer la amortización de ${fmtAccount(am.amount, cur)} del ${am.date}. Se eliminarán los movimientos asociados${am.fee > 0 ? ' (incluida la comisión)' : ''} y se restaurará la cuota anterior (${fmtAccount(am.prevMonthlyPayment ?? 0, cur)}). Esta acción no se puede deshacer.`}
                onConfirm={() => handleUndoAmortization(undoAmortization.loanId, undoAmortization.amortizationId)}
                onCancel={() => setUndoAmortization(null)}
              />
            );
          })()}
        </>
      );
    }

    if (selectedCreditCard) {
      return (
        <>
          <CreditCardDetailView
            account={selectedCreditCard}
            onBack={() => setSelectedCreditCardId(null)}
            onEdit={(acc) => openEdit(acc)}
            onDelete={(id) => setConfirmDelete(id)}
          />
  
          {/* Modal de edición (reutilizable, también funciona desde el detalle) */}
          {modal && (
            <AccountFormModal
              mode={modal === 'add' ? 'add' : 'edit'}
              account={editingAccount}
              onSave={handleSaveAccount}
              onClose={() => setModal(null)}
            />
          )}
  
          {/* Confirm delete (también disponible en vista detalle) */}
          {confirmDelete && deleteImpact && (
            <ConfirmModal
              T={T}
              title="¿Eliminar cuenta?"
              message={`Vas a eliminar "${accToDelete?.name}"${
                deleteImpact.parts.length > 0
                  ? ` y todos sus datos asociados: ${deleteImpact.parts.join(', ')}.`
                  : '. No tiene datos asociados.'
              } Esta acción no se puede deshacer.`}
              onConfirm={() => {
                confirmDel();
                setSelectedCreditCardId(null);
              }}
              onCancel={() => setConfirmDelete(null)}
            />
          )}
        </>
      );
    }
  
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
          gridTemplateColumns: `repeat(${summaryItems.length}, 1fr)`,
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {summaryItems.map((item) => (
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
          const isCreditCard = acc.accountType === 'credit_card';
          const ccInfo = isCreditCard ? realBalanceMap[acc.id] : null;

          // ── Renderizado de tarjeta de crédito ──────────────────────────────
          if (isCreditCard && ccInfo) {
            const { creditDebt, creditAvailable, utilizationPct } = ccInfo;

            // Health score (verde/ámbar/rojo/crítico) — single source of truth
            const health = getCreditHealthScore(utilizationPct);
            const { color: utilColor, bg: utilBg, border: utilBorder, bar: utilBar } =
              getCreditHealthColors(health.intent, T);
            const utilLabel = health.label;

            // Días hasta corte y pago — desde helper centralizado
            const dBilling = daysUntilBilling(acc);
            const dPayment = daysUntilPayment(acc);

            const showDays = dBilling !== null || dPayment !== null;
            const showInterest = !!(acc.interestRate || acc.minPaymentPct);
            const showSimulator = !!(creditDebt > 0 && acc.minPaymentPct);

            const isHighlighted = highlightedCardId === acc.id;
            const borderColor = isHighlighted
              ? T.accent
              : utilizationPct >= 70
              ? (T.redBorder ?? T.amberBorder)
              : T.cardBorder;

            return (
              <Card
                key={acc.id}
                T={T}
                ref={(el) => { cardRefs.current[acc.id] = el; }}
                style={{
                  border: `2px solid ${borderColor}`,
                  overflow: 'hidden',
                  boxShadow: isHighlighted ? `0 0 0 4px ${T.accent}33, 0 12px 32px ${T.accent}22` : undefined,
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {/* Header tipo tarjeta física */}
                <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #1e293b 100%)', padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-1.5rem', right: '-1.5rem', width: '6rem', height: '6rem', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '-0.75rem', right: '3rem', width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CreditCard size={20} color="#94a3b8" />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {acc.institution && (
                            <>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#93c5fd' }}>
                                <InstitutionLogo name={acc.institution} size={14} color="93c5fd" />
                                {acc.institution}
                              </span>
                              <span style={{ color: '#64748b', fontWeight: 400 }}>—</span>
                            </>
                          )}
                          <span>{acc.name}</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>
                          Tarjeta de crédito · {acc.currency ?? baseCurrency}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      {/* Mini-badge Health Score (clickable → entra al detalle) */}
                      <button
                        onClick={() => setSelectedCreditCardId(acc.id)}
                        title={`Salud financiera: ${health.score}/100 · ${health.label}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem 0.25rem 0.45rem',
                          borderRadius: '9999px',
                          border: `1px solid ${utilBorder}`,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#f1f5f9',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          marginRight: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: utilBar,
                          }}
                        />
                        {health.score}
                      </button>
                      <button onClick={() => setSelectedCreditCardId(acc.id)} title="Ver análisis completo" style={{ padding: '0.35rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={13} /></button>
                      <button onClick={() => openEdit(acc)} title="Editar" style={{ padding: '0.35rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Pencil size={13} /></button>
                      <button onClick={() => setConfirmDelete(acc.id)} title="Eliminar" style={{ padding: '0.35rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Deuda actual</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: creditDebt > 0 ? '#f87171' : '#4ade80', lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {fmtAccount(creditDebt, acc.currency ?? baseCurrency)}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {/* Barra de utilización con semáforo */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Utilización del límite</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '9999px', background: utilBg, color: utilColor, border: `1px solid ${utilBorder}` }}>
                        {Math.round(utilizationPct)}% · {utilLabel}
                      </span>
                    </div>
                    <div style={{ height: '0.5rem', borderRadius: '9999px', background: T.pageBg, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '9999px', width: `${Math.min(100, utilizationPct)}%`, transition: 'width 0.6s ease', background: utilBar }} />
                    </div>
                  </div>

                  {/* Disponible / Límite */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: T.pageBg, border: `1px solid ${T.cardBorder}` }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Disponible</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.green }}>{fmtAccount(creditAvailable, acc.currency ?? baseCurrency)}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: T.pageBg, border: `1px solid ${T.cardBorder}` }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Límite total</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.title }}>{fmtAccount(acc.creditLimit ?? 0, acc.currency ?? baseCurrency)}</div>
                    </div>
                  </div>

                  {/* Días hasta corte y pago */}
                  {showDays && (
                    <div style={{ display: 'grid', gridTemplateColumns: dBilling !== null && dPayment !== null ? '1fr 1fr' : '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      {dBilling !== null && (
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: T.accentLight, border: `1px solid ${T.accent}33`, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✂️ Corte</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: T.accent }}>{dBilling === 0 ? 'Hoy' : `${dBilling}d`}</div>
                        </div>
                      )}
                      {dPayment !== null && (
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: dPayment <= 3 ? (T.redBg ?? T.amberBg) : T.pageBg, border: `1px solid ${dPayment <= 3 ? (T.redBorder ?? T.amberBorder) : T.cardBorder}`, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: dPayment <= 3 ? T.red : T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>💳 Pago</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: dPayment <= 3 ? T.red : T.title }}>{dPayment === 0 ? '¡Hoy!' : `${dPayment}d`}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAE e info financiera */}
                  {showInterest && (
                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.75rem', background: T.pageBg, border: `1px solid ${T.cardBorder}`, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {acc.interestRate ? <span style={{ fontSize: '0.72rem', color: T.muted }}>TAE: <strong style={{ color: T.title }}>{acc.interestRate}%</strong></span> : null}
                      {acc.minPaymentPct ? <span style={{ fontSize: '0.72rem', color: T.muted }}>Pago mín: <strong style={{ color: T.title }}>{acc.minPaymentPct}%</strong></span> : null}
                      {acc.interestRate && creditDebt > 0 ? <span style={{ fontSize: '0.72rem', color: T.amber }}>≈{fmtAccount(calcYearlyInterestCost(creditDebt, acc.interestRate), acc.currency ?? baseCurrency)}/año</span> : null}
                    </div>
                  )}

                  {/* Resumen rápido pago mínimo (siempre visible si hay deuda) */}
                  {showSimulator && (
                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.75rem', background: T.amberBg, border: `1px solid ${T.amberBorder}`, marginBottom: '0.75rem', fontSize: '0.72rem', color: T.amber, lineHeight: 1.5 }}>
                      💡 Pago mínimo: <strong>{fmtAccount(calcMinPayment(creditDebt, acc.minPaymentPct ?? 5), acc.currency ?? baseCurrency)}</strong>
                      {' · '}Pago total (sin intereses): <strong>{fmtAccount(creditDebt, acc.currency ?? baseCurrency)}</strong>
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {creditDebt > 0 && (
                      <button
                        onClick={() => openPaymentModal(acc.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.65rem 0.875rem', borderRadius: '0.75rem', border: 'none', background: T.green, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', flex: 1, justifyContent: 'center' }}
                      >
                        💸 Registrar pago
                      </button>
                    )}
                    <button
onClick={() => {
  setRealAccountFilter(acc.id);
  setRealReturnTo({ label: 'Cuentas', tab: 'accounts' });
  setTab('real');
}}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.65rem 0.875rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', flex: 1, justifyContent: 'center' }}
                    >
                      <Receipt size={14} /> Movimientos
                    </button>
                  </div>
                  </div>
              </Card>
            );
          }

          // ── Renderizado de cuenta tipo PRÉSTAMO ─────────────────────────────
          if (acc.accountType === 'loan') {
            const loanInfo = realBalanceMap[acc.id];
            const currentDebt = loanInfo?.loanDebt ?? acc.balance;
            const initialDebt = loanInfo?.loanInitialDebt ?? acc.balance;
            const appliedCount = loanInfo?.appliedCount ?? 0;
            const interestEstimate = estimateLoanInterest(acc, currentDebt);
            const progress = calcLoanProgress(acc, appliedCount);
            const currency = acc.currency ?? baseCurrency;
            const loanIcon = getLoanTypeIcon(acc.loanType);
            const loanLabel = getLoanTypeLabel(acc.loanType);
            const payerAcc = acc.paymentAccountId
              ? accounts.find((a) => a.id === acc.paymentAccountId)
              : null;
            const isPaidOff = currentDebt <= 0;

            return (
              <Card
                key={acc.id}
                T={T}
                style={{
                  border: `2px solid ${isPaidOff ? T.greenBorder : T.cardBorder}`,
                  overflow: 'hidden',
                }}
              >
                {/* Header oscuro tipo "carta financiera" */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #14532d 0%, #166534 60%, #14532d 100%)',
                    padding: '1.25rem 1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-1.5rem',
                      right: '-1.5rem',
                      width: '6rem',
                      height: '6rem',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{loanIcon}</span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {acc.institution && (
                            <>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#86efac' }}>
                                <InstitutionLogo name={acc.institution} size={14} color="86efac" />
                                {acc.institution}
                              </span>
                              <span style={{ color: '#64748b', fontWeight: 400 }}>—</span>
                            </>
                          )}
                          <span>{acc.name}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            color: '#86efac',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginTop: '0.2rem',
                          }}
                        >
                          {loanLabel} · {currency}
                          {acc.interestType && ` · ${acc.interestType === 'fixed' ? 'Tipo fijo' : 'Tipo variable'}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(acc)}
                        title="Editar"
                        style={{
                          padding: '0.35rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(acc.id)}
                        title="Eliminar"
                        style={{
                          padding: '0.35rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'transparent',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: '#86efac',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Capital pendiente
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: isPaidOff ? '#4ade80' : '#fef3c7',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtAccount(currentDebt, currency)}
                    </div>
                    {!isPaidOff && initialDebt !== currentDebt && (
                      <div style={{ fontSize: '0.65rem', color: '#86efac', marginTop: '0.3rem' }}>
                        Inicial: {fmtAccount(initialDebt, currency)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {isPaidOff ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: T.green }}>
                        ¡Préstamo liquidado!
                      </div>
                      <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: '0.3rem' }}>
                        Ya no debes nada. Puedes eliminar este préstamo cuando quieras.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Barra de progreso "% pagado" */}
                      {progress.monthsToFinish !== null && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.375rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: T.muted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Progreso del préstamo
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: T.green,
                              }}
                            >
                              {Math.round(progress.paidPct)}% pagado
                            </span>
                          </div>
                          <div
                            style={{
                              height: '0.5rem',
                              borderRadius: '9999px',
                              background: T.pageBg,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: '9999px',
                                width: `${Math.min(100, progress.paidPct)}%`,
                                transition: 'width 0.6s ease',
                                background: T.green,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Cuota mensual + cuotas restantes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {acc.monthlyPayment != null && (
                          <div
                            style={{
                              padding: '0.75rem',
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
                              Cuota mensual
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.title }}>
                              {fmtAccount(acc.monthlyPayment, currency)}
                            </div>
                          </div>
                        )}
                        {progress.monthsToFinish !== null && (
                          <div
                            style={{
                              padding: '0.75rem',
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
                              Cuotas restantes
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.title }}>
                              {progress.monthsToFinish}
                            </div>
                            {progress.estimatedEndDate && (
                              <div style={{ fontSize: '0.65rem', color: T.muted, marginTop: '0.15rem' }}>
                                hasta ~{progress.estimatedEndDate}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Estimación intereses */}
                      {interestEstimate.hasEnoughData && (
                        <div
                          style={{
                            padding: '0.75rem 0.875rem',
                            borderRadius: '0.75rem',
                            background: T.accentLight,
                            border: `1px solid ${T.accent}33`,
                            marginBottom: '1rem',
                            fontSize: '0.75rem',
                            color: T.accent,
                            lineHeight: 1.5,
                          }}
                        >
                          💡 De tu cuota de{' '}
                          <strong>{fmtAccount(acc.monthlyPayment ?? 0, currency)}</strong>:
                          <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span>↘ Capital: <strong>{fmtAccount(interestEstimate.monthlyPrincipal, currency)}</strong></span>
                            <span>↗ Intereses: <strong>{fmtAccount(interestEstimate.monthlyInterest, currency)}</strong></span>
                          </div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.75, marginTop: '0.3rem' }}>
                            Estimación basada en tu capital pendiente y tipo {acc.interestRate}%. El banco lo calcula con precisión cada mes.
                          </div>
                        </div>
                      )}

                      {/* Cuenta de cargo */}
                      {payerAcc && (
                        <div
                          style={{
                            padding: '0.6rem 0.875rem',
                            borderRadius: '0.75rem',
                            background: T.pageBg,
                            border: `1px solid ${T.cardBorder}`,
                            marginBottom: '1rem',
                            fontSize: '0.72rem',
                            color: T.muted,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <span>
                            🏦 Se paga desde: <strong style={{ color: T.title }}>{payerAcc.name}</strong>
                          </span>
                          {acc.paymentDay && (
                            <span>
                              📅 Día <strong style={{ color: T.title }}>{acc.paymentDay}</strong> de cada mes
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!isPaidOff && (
                      <button
                        onClick={() => setAmortizingLoanId(acc.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.65rem 0.875rem',
                          borderRadius: '0.75rem',
                          border: 'none',
                          background: T.green,
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flex: 1,
                          justifyContent: 'center',
                        }}
                        >
                        💸 Amortizar
                      </button>
                    )}
                    {(acc.amortizations?.length ?? 0) > 0 && (
                      <button
                        onClick={() => setSelectedLoanId(acc.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.65rem 0.875rem',
                          borderRadius: '0.75rem',
                          border: `1.5px solid ${T.green}55`,
                          background: T.greenBg,
                          color: T.green,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flex: 1,
                          justifyContent: 'center',
                        }}
                      >
                        📜 Historial ({acc.amortizations!.length})
                      </button>
                    )}
                    <button
onClick={() => {
  setRealAccountFilter(acc.id);
  setRealReturnTo({ label: 'Cuentas', tab: 'accounts' });
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
                      <Receipt size={14} /> Movimientos
                    </button>
                  </div>
                </div>
              </Card>
            );
          }

          // ── Renderizado de cuenta normal ────────────────────────────────────
          const accStyle = getAccountStyle(acc.accountType, T);
          const headerAccent = warn ? T.amber : accStyle.accent;
          const headerBg = warn ? T.amberBg : accStyle.tintBg;
          const headerBorder = warn ? T.amberBorder : accStyle.tintBorder;

          return (
            <Card
              key={acc.id}
              T={T}
              style={{
                border: `2px solid ${warn ? T.amberBorder : T.cardBorder}`,
                overflow: 'hidden',
              }}
            >
              {/* ─────────────────────────────────────────────────────────
                   BANDA SUPERIOR — diseño unificado tipo fintech
                   Estructura fija (3 filas) para todas las cuentas:
                     1. Entidad bancaria (top-left) + Acciones (top-right)
                     2. Icono + Nombre cuenta + Subtítulo
                     3. Saldo real (label izq · valor der)
                  ───────────────────────────────────────────────────────── */}
              <div
                style={{
                  background: headerBg,
                  borderBottom: `1px solid ${headerBorder}`,
                  padding: '1.25rem 1.5rem 1.1rem',
                }}
              >
                {/* Fila 1 — Entidad + Acciones */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    minHeight: '1.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: headerAccent,
                      letterSpacing: '-0.01em',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acc.institution ? (
                      <>
                        <InstitutionLogo name={acc.institution} size={16} />
                        {acc.institution}
                      </>
                    ) : (
                      <span style={{ opacity: 0.6, fontWeight: 700 }}>Sin entidad</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {warn && <AlertTriangle size={16} color={T.amber} />}
                    <button
                      onClick={() => openEdit(acc)}
                      title="Editar"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${headerBorder}`,
                        background: '#ffffff99',
                        color: T.muted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(acc.id)}
                      title="Eliminar"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.redBorder ?? T.amberBorder}`,
                        background: '#ffffff99',
                        color: T.red,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Fila 2 — Icono + Nombre cuenta + Subtítulo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.1rem',
                  }}
                >
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '0.75rem',
                      background: '#ffffffcc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${headerBorder}`,
                      flexShrink: 0,
                    }}
                  >
                    <Wallet size={16} color={headerAccent} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: T.title,
                        letterSpacing: '-0.01em',
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                      }}
                    >
                      {acc.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: headerAccent,
                        opacity: 0.75,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop: '0.15rem',
                      }}
                    >
                      {accStyle.label} · {acc.currency ?? baseCurrency}
                    </div>
                  </div>
                </div>

                {/* Fila 3 — Saldo real (label izq · valor der) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    paddingTop: '0.85rem',
                    borderTop: `1px dashed ${headerBorder}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                        color: headerAccent,
                        opacity: 0.85,
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Saldo real
                    </div>
                    <div style={{ fontSize: '0.68rem', color: T.muted, lineHeight: 1.4 }}>
                      Base {fmtAccount(acc.balance, acc.currency ?? baseCurrency)} · {fmtDateDMY(acc.date, dateFormat)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: T.muted, lineHeight: 1.4 }}>
                      Mínimo: {fmtAccount(acc.minBalance, acc.currency ?? baseCurrency)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 'clamp(1.5rem, 4.5vw, 2rem)',
                        fontWeight: 800,
                        color: warn ? T.amber : headerAccent,
                        letterSpacing: '-0.03em',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}
                    >
                      {fmtAccount(
                        realBalanceMap[acc.id]?.realBalance ?? acc.balance,
                        acc.currency ?? baseCurrency
                      )}
                    </div>
                    {(realBalanceMap[acc.id]?.appliedCount > 0 || realBalanceMap[acc.id]?.ignoredCount > 0) && (
                      <div
                        style={{
                          marginTop: '0.4rem',
                          display: 'flex',
                          gap: '0.35rem',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap',
                        }}
                      >
                        {realBalanceMap[acc.id]?.appliedCount > 0 && (
                          <span
                            title={`${realBalanceMap[acc.id].appliedCount} movimiento${realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''} real${realBalanceMap[acc.id].appliedCount !== 1 ? 'es' : ''} aplicado${realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}`}
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '9999px',
                              background: '#ffffffcc',
                              color: T.green,
                              border: `1px solid ${T.greenBorder}`,
                            }}
                          >
                            ✓ {realBalanceMap[acc.id].appliedCount}
                          </span>
                        )}
                        {realBalanceMap[acc.id]?.ignoredCount > 0 && (
                          <span
                            title={`${realBalanceMap[acc.id].ignoredCount} movimiento${realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''} ignorado${realBalanceMap[acc.id].ignoredCount !== 1 ? 's' : ''} (anterior${realBalanceMap[acc.id].ignoredCount !== 1 ? 'es' : ''} al saldo base)`}
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '9999px',
                              background: '#ffffffcc',
                              color: T.amber,
                              border: `1px solid ${T.amberBorder}`,
                            }}
                          >
                            ⚠ {realBalanceMap[acc.id].ignoredCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body (fondo normal, debajo de la banda de color) */}
              <div style={{ padding: '1.25rem 1.75rem 1.5rem' }}>
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
      {/* ── Modal de creación / edición (componente reutilizable) ── */}
      {modal && (
        <AccountFormModal
          mode={modal === 'add' ? 'add' : 'edit'}
          account={editingAccount}
          onSave={handleSaveAccount}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal de amortización parcial (Fase 2.1) ── */}
      {amortizingLoan && (
        <AmortizationFormModal
          loan={amortizingLoan}
          onConfirm={(data) => handleAmortization(amortizingLoan, data)}
          onClose={() => setAmortizingLoanId(null)}
        />
      )}
      {/* ── Confirm deshacer amortización (Fase 2.1.4) ── */}
      {undoAmortization && (() => {
        const loan = accounts.find((a) => a.id === undoAmortization.loanId);
        const amort = loan?.amortizations?.find((a) => a.id === undoAmortization.amortizationId);
        if (!loan || !amort) return null;
        const currency = loan.currency ?? baseCurrency;
        return (
          <ConfirmModal
            T={T}
            title="¿Deshacer amortización?"
            message={`Vas a deshacer la amortización de ${fmtAccount(amort.amount, currency)} del ${amort.date}. Se eliminarán los movimientos asociados${amort.fee > 0 ? ' (incluida la comisión)' : ''} y se restaurará la cuota anterior (${fmtAccount(amort.prevMonthlyPayment ?? 0, currency)}). Esta acción no se puede deshacer.`}
            onConfirm={() => handleUndoAmortization(undoAmortization.loanId, undoAmortization.amortizationId)}
            onCancel={() => setUndoAmortization(null)}
          />
        );
      })()}

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
