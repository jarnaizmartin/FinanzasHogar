// ─────────────────────────────────────────────────────────────────────────────
// loanUtils.ts
// Funciones puras para cálculos de préstamos e hipotecas.
// Filosofía: cálculos honestos y aproximados, NO un cuadro francés exacto.
// El usuario introduce el capital pendiente y la cuota actual; el banco hace
// el cálculo exacto cada mes en su simulador. Aquí solo damos perspectiva.
// ─────────────────────────────────────────────────────────────────────────────

import type { Account, RealExpense } from '../types';
import { convertAmount } from '../utils';

// ─── Cálculo de deuda actual ────────────────────────────────────────────────
export type LoanDebtInfo = {
  debt: number; // Capital pendiente HOY
  initialDebt: number; // Capital pendiente en la fecha de alta (acc.balance)
  appliedCount: number; // Movimientos aplicados (pagos + amortizaciones)
  ignoredCount: number; // Movimientos anteriores al saldo base
};

/**
 * Calcula la deuda actual de un préstamo a partir del capital pendiente
 * inicial y los movimientos reales posteriores.
 *
 * Convención (idéntica a tarjetas de crédito):
 * - `acc.balance` representa el CAPITAL PENDIENTE en la fecha `acc.date`
 * - Movimientos tipo 'income' o 'transfer entrante' → REDUCEN la deuda (pago de cuota)
 * - Movimientos tipo 'expense' → AUMENTAN la deuda (raro, solo en errores/refinanciación)
 */
export function calcLoanDebt(
  acc: Account,
  realExpenses: RealExpense[],
  rates: Record<string, number>,
  baseCurrency: string
): LoanDebtInfo {
  const currency = acc.currency ?? baseCurrency;
  let debt = acc.balance;
  let appliedCount = 0;
  let ignoredCount = 0;

  realExpenses.forEach((e) => {
    if (e.accountId !== acc.id) return;
    if (e.valueDate <= acc.date) {
      ignoredCount++;
      return;
    }
    appliedCount++;
    const amount = convertAmount(e.amount, e.currency, currency, rates);
    // Las cuotas llegan como 'income' (transferencia entrante al préstamo)
    if (e.type === 'income') debt -= amount;
    else debt += amount;
  });

  return {
    debt: Math.max(0, debt),
    initialDebt: acc.balance,
    appliedCount,
    ignoredCount,
  };
}

// ─── Cálculo informativo de intereses ───────────────────────────────────────

export type LoanInterestEstimate = {
  yearlyInterest: number; // Aprox. intereses anuales con la deuda actual
  monthlyInterest: number; // Aprox. intereses del próximo mes
  monthlyPrincipal: number; // Aprox. capital amortizado por mes (cuota − intereses)
  hasEnoughData: boolean; // false si falta tipo o cuota
};

/**
 * Estimación honesta y simple de cuánto de la cuota mensual va a intereses
 * y cuánto a amortización del capital.
 *
 *   intereses_anuales ≈ deuda_actual × (tipo / 100)
 *   intereses_mes      ≈ intereses_anuales / 12
 *   capital_mes        ≈ cuota_mensual − intereses_mes
 *
 * NO es un cuadro francés exacto. Es una aproximación pensada para que el
 * usuario entienda la PROPORCIÓN, no para reemplazar al banco.
 */
export function estimateLoanInterest(
  acc: Account,
  currentDebt: number
): LoanInterestEstimate {
  const rate = acc.interestRate ?? 0;
  const cuota = acc.monthlyPayment ?? 0;

  if (rate <= 0 || cuota <= 0 || currentDebt <= 0) {
    return {
      yearlyInterest: 0,
      monthlyInterest: 0,
      monthlyPrincipal: cuota,
      hasEnoughData: false,
    };
  }

  const yearlyInterest = currentDebt * (rate / 100);
  const monthlyInterest = yearlyInterest / 12;
  const monthlyPrincipal = Math.max(0, cuota - monthlyInterest);

  return {
    yearlyInterest,
    monthlyInterest,
    monthlyPrincipal,
    hasEnoughData: true,
  };
}

// ─── Progreso del préstamo ──────────────────────────────────────────────────

export type LoanProgress = {
  paidPct: number; // % pagado (basado en cuotas aplicadas vs totales estimadas)
  monthsToFinish: number | null; // Meses restantes (= paymentsRemaining)
  estimatedEndDate: string | null; // 'YYYY-MM' aprox cuando termina
};

/**
 * Calcula el progreso del préstamo basado en las cuotas restantes.
 * Si no hay paymentsRemaining configurado, devuelve nulls.
 */
export function calcLoanProgress(
  acc: Account,
  appliedCount: number
): LoanProgress {
  const remaining = acc.paymentsRemaining;
  if (!remaining || remaining <= 0) {
    return { paidPct: 0, monthsToFinish: null, estimatedEndDate: null };
  }

  // % pagado = cuotas ya pagadas (aproximación: appliedCount) / total estimado
  const totalEstimated = appliedCount + remaining;
  const paidPct =
    totalEstimated > 0 ? (appliedCount / totalEstimated) * 100 : 0;

  // Fecha estimada de fin = hoy + remaining meses
  const end = new Date();
  end.setMonth(end.getMonth() + remaining);
  const estimatedEndDate = `${end.getFullYear()}-${String(
    end.getMonth() + 1
  ).padStart(2, '0')}`;

  return {
    paidPct: Math.min(100, Math.max(0, paidPct)),
    monthsToFinish: remaining,
    estimatedEndDate,
  };
}

// ─── Etiqueta humana del tipo de préstamo ───────────────────────────────────

export function getLoanTypeLabel(loanType: Account['loanType']): string {
  switch (loanType) {
    case 'mortgage':
      return 'Hipoteca';
    case 'personal':
      return 'Préstamo personal';
    default:
      return 'Préstamo';
  }
}

export function getLoanTypeIcon(loanType: Account['loanType']): string {
  switch (loanType) {
    case 'mortgage':
      return '🏠';
    case 'personal':
      return '💰';
    default:
      return '💸';
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  AMORTIZACIÓN PARCIAL — Helpers de cálculo (Fase 2.1)
// ════════════════════════════════════════════════════════════════════════════
//
//  Fórmula francesa estándar bancaria (cuota constante):
//
//    cuota = C · i / (1 - (1 + i)^-n)
//
//  Donde:
//    C = capital pendiente
//    i = TIN mensual = TIN anual / 12 / 100
//    n = nº de cuotas restantes
//
//  Nota: usamos el TIN aproximado a partir del campo acc.interestRate (TAE).
//  Para nuestro propósito (dar perspectiva al usuario, no reemplazar al banco)
//  esta aproximación es suficiente.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcula la cuota mensual dado capital, tipo anual (%) y nº de cuotas.
 * Si el tipo es 0, devuelve simplemente capital / n.
 */
export function calcLoanPayment(
  principal: number,
  annualRatePct: number,
  n: number
): number {
  if (n <= 0) return 0;
  if (annualRatePct <= 0) return principal / n;
  const i = annualRatePct / 100 / 12;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

/**
 * Calcula el nº de cuotas necesarias dado capital, tipo anual (%) y cuota mensual.
 * Devuelve un nº entero (redondeado hacia arriba). Devuelve Infinity si la cuota
 * no cubre ni los intereses (préstamo nunca se amortiza).
 */
export function calcLoanTerm(
  principal: number,
  annualRatePct: number,
  monthlyPayment: number
): number {
  if (monthlyPayment <= 0) return 0;
  if (annualRatePct <= 0) return Math.ceil(principal / monthlyPayment);
  const i = annualRatePct / 100 / 12;
  if (monthlyPayment <= principal * i) return Infinity;
  const n = -Math.log(1 - (principal * i) / monthlyPayment) / Math.log(1 + i);
  return Math.ceil(n);
}

/**
 * Calcula los intereses totales que se pagarán en el resto del préstamo
 * dado capital, tipo y nº cuotas restantes.
 */
export function calcRemainingInterest(
  principal: number,
  annualRatePct: number,
  n: number
): number {
  if (n <= 0 || principal <= 0) return 0;
  const payment = calcLoanPayment(principal, annualRatePct, n);
  return Math.max(0, payment * n - principal);
}

/**
 * Genera el calendario de amortización completo (capital + intereses por mes).
 * Útil para gráficas comparativas "antes vs después".
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  n: number
): Array<{ month: number; balance: number; principal: number; interest: number; payment: number }> {
  if (n <= 0 || principal <= 0) return [];
  const payment = calcLoanPayment(principal, annualRatePct, n);
  const i = annualRatePct / 100 / 12;
  const schedule: Array<{ month: number; balance: number; principal: number; interest: number; payment: number }> = [];
  let balance = principal;
  for (let m = 1; m <= n; m++) {
    const interest = balance * i;
    const principalPart = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month: m,
      balance,
      principal: principalPart,
      interest,
      payment: principalPart + interest,
    });
    if (balance <= 0) break;
  }
  return schedule;
}

// ────────────────────────────────────────────────────────────────────────────
//  Simulador de amortización parcial
// ────────────────────────────────────────────────────────────────────────────

export type AmortizationMode = 'reduce_payment' | 'reduce_term';

export interface AmortizationSimulation {
  // Antes
  prevPayment: number;
  prevTerm: number;
  prevTotalInterest: number;
  prevTotalCost: number;            // capital + intereses restantes
  // Después
  newPrincipal: number;             // capital tras amortizar
  newPayment: number;
  newTerm: number;
  newTotalInterest: number;
  newTotalCost: number;
  // Diferencias
  interestSaved: number;            // (prev - new) - comisión
  monthsSaved: number;
  paymentReduction: number;
  // Comisión
  feeAmount: number;
  totalCashOut: number;             // amortización + comisión
  // Validación
  isValid: boolean;
  errorMsg?: string;
}

/**
 * Simula una amortización parcial y devuelve un escenario completo
 * comparativo para mostrar al usuario antes de confirmar.
 */
export function simulateAmortization(opts: {
  currentPrincipal: number;
  annualRatePct: number;
  currentPayment: number;
  currentTerm: number;
  amortizationAmount: number;
  mode: AmortizationMode;
  feePct?: number;
}): AmortizationSimulation {
  const {
    currentPrincipal,
    annualRatePct,
    currentPayment,
    currentTerm,
    amortizationAmount,
    mode,
    feePct = 0,
  } = opts;

  const feeAmount = (amortizationAmount * feePct) / 100;
  const totalCashOut = amortizationAmount + feeAmount;

  // Estado actual
  const prevTotalInterest = calcRemainingInterest(currentPrincipal, annualRatePct, currentTerm);
  const prevTotalCost = currentPrincipal + prevTotalInterest;

  // Validaciones
  if (amortizationAmount <= 0) {
    return {
      prevPayment: currentPayment, prevTerm: currentTerm, prevTotalInterest, prevTotalCost,
      newPrincipal: currentPrincipal, newPayment: currentPayment, newTerm: currentTerm,
      newTotalInterest: prevTotalInterest, newTotalCost: prevTotalCost,
      interestSaved: 0, monthsSaved: 0, paymentReduction: 0,
      feeAmount: 0, totalCashOut: 0,
      isValid: false, errorMsg: 'El importe debe ser mayor que 0',
    };
  }
  if (amortizationAmount >= currentPrincipal) {
    // Liquidación total
    return {
      prevPayment: currentPayment, prevTerm: currentTerm, prevTotalInterest, prevTotalCost,
      newPrincipal: 0, newPayment: 0, newTerm: 0,
      newTotalInterest: 0, newTotalCost: 0,
      interestSaved: Math.max(0, prevTotalInterest - feeAmount),
      monthsSaved: currentTerm, paymentReduction: currentPayment,
      feeAmount, totalCashOut,
      isValid: true,
    };
  }

  // Aplicar amortización
  const newPrincipal = currentPrincipal - amortizationAmount;
  let newPayment: number;
  let newTerm: number;

  if (mode === 'reduce_payment') {
    // Mismo plazo, cuota menor
    newTerm = currentTerm;
    newPayment = calcLoanPayment(newPrincipal, annualRatePct, newTerm);
  } else {
    // Misma cuota, plazo menor
    newPayment = currentPayment;
    newTerm = calcLoanTerm(newPrincipal, annualRatePct, currentPayment);
  }

  const newTotalInterest = calcRemainingInterest(newPrincipal, annualRatePct, newTerm);
  const newTotalCost = newPrincipal + newTotalInterest;

  return {
    prevPayment: currentPayment,
    prevTerm: currentTerm,
    prevTotalInterest,
    prevTotalCost,
    newPrincipal,
    newPayment,
    newTerm,
    newTotalInterest,
    newTotalCost,
    interestSaved: Math.max(0, prevTotalInterest - newTotalInterest - feeAmount),
    monthsSaved: Math.max(0, currentTerm - newTerm),
    paymentReduction: Math.max(0, currentPayment - newPayment),
    feeAmount,
    totalCashOut,
    isValid: true,
  };
}
