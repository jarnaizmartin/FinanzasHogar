// ─────────────────────────────────────────────────────────────────────────────
// creditCardUtils.ts
// Funciones puras para cálculos de tarjetas de crédito.
// Single source of truth para deuda, fechas, health score y costes financieros.
// ─────────────────────────────────────────────────────────────────────────────

import type { Account, RealExpense } from '../types';
import { convertAmount } from '../utils';

// ─── Deuda y disponible ──────────────────────────────────────────────────────
export type CreditCardDebtInfo = {
  debt: number;
  available: number;
  utilizationPct: number;
  appliedCount: number;
  ignoredCount: number;
};

/**
 * Calcula la deuda actual de una tarjeta de crédito a partir del saldo base
 * y los movimientos reales posteriores a la fecha del saldo base.
 *
 * Convención: para tarjetas, `acc.balance` representa la DEUDA inicial.
 * - Gastos posteriores → aumentan la deuda
 * - Ingresos (pagos) posteriores → reducen la deuda
 */
export function calcCreditCardDebt(
  acc: Account,
  realExpenses: RealExpense[],
  rates: Record<string, number>,
  baseCurrency: string
): CreditCardDebtInfo {
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
    if (e.type === 'expense') debt += amount;
    else debt -= amount;
  });

  debt = Math.max(0, debt);
  const limit = acc.creditLimit ?? 0;

  return {
    debt,
    available: limit > 0 ? Math.max(0, limit - debt) : 0,
    utilizationPct: limit > 0 ? Math.min(100, (debt / limit) * 100) : 0,
    appliedCount,
    ignoredCount,
  };
}

// ─── Días hasta próxima fecha (corte / pago) ─────────────────────────────────

/**
 * Calcula los días desde hoy (o `fromDate`) hasta el próximo día del mes indicado.
 * Si el día ya pasó este mes, devuelve los días hasta ese día del mes siguiente.
 * Maneja correctamente meses con menos de 31 días (ej: día 31 en febrero → día 28/29).
 */
export function daysUntilDayOfMonth(
  targetDay: number | undefined | null,
  fromDate: Date = new Date()
): number | null {
  if (!targetDay || targetDay < 1 || targetDay > 31) return null;

  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDate();

  if (currentDay <= targetDay) {
    const lastDayThisMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const effectiveDay = Math.min(targetDay, lastDayThisMonth);
    return effectiveDay - currentDay;
  }

  const nextMonthLast = new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    0
  ).getDate();
  const effectiveDay = Math.min(targetDay, nextMonthLast);
  const target = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    effectiveDay
  );
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export const daysUntilBilling = (
  acc: Account,
  fromDate?: Date
): number | null => daysUntilDayOfMonth(acc.billingDay, fromDate);

export const daysUntilPayment = (
  acc: Account,
  fromDate?: Date
): number | null => daysUntilDayOfMonth(acc.paymentDueDay, fromDate);

// ─── Health Score ────────────────────────────────────────────────────────────

export type CreditHealthLevel = 'excellent' | 'moderate' | 'high' | 'critical';
export type CreditHealthIntent = 'success' | 'warning' | 'danger' | 'critical';

export type CreditHealthScore = {
  level: CreditHealthLevel;
  label: string;
  intent: CreditHealthIntent;
};

/**
 * Clasifica el nivel de salud financiera de una tarjeta según su % de utilización.
 *   < 30%   → Excelente   (verde)
 *   30-69%  → Moderado    (ámbar)
 *   70-89%  → Alto riesgo (rojo)
 *   >= 90%  → Crítico     (rojo intenso)
 */
export function getCreditHealthScore(
  utilizationPct: number
): CreditHealthScore {
  if (utilizationPct >= 90)
    return { level: 'critical', label: 'Crítico', intent: 'critical' };
  if (utilizationPct >= 70)
    return { level: 'high', label: 'Alto riesgo', intent: 'danger' };
  if (utilizationPct >= 30)
    return { level: 'moderate', label: 'Moderado', intent: 'warning' };
  return { level: 'excellent', label: 'Excelente', intent: 'success' };
}

/**
 * Mapea un intent a los colores del tema activo.
 * Se mantiene aquí para que la UI no tenga que repetir la lógica de mapeo.
 */
export function getCreditHealthColors(
  intent: CreditHealthIntent,
  T: any
): { color: string; bg: string; border: string; bar: string } {
  switch (intent) {
    case 'critical':
      return {
        color: T.red,
        bg: T.redBg ?? T.amberBg,
        border: T.redBorder ?? T.amberBorder,
        bar: '#dc2626',
      };
    case 'danger':
      return {
        color: T.red,
        bg: T.redBg ?? T.amberBg,
        border: T.redBorder ?? T.amberBorder,
        bar: '#ef4444',
      };
    case 'warning':
      return {
        color: T.amber,
        bg: T.amberBg,
        border: T.amberBorder,
        bar: '#f59e0b',
      };
    case 'success':
      return {
        color: T.green,
        bg: T.greenBg,
        border: T.greenBorder,
        bar: '#22c55e',
      };
  }
}

// ─── Cálculos financieros ────────────────────────────────────────────────────

/**
 * Pago mínimo recomendado por el banco.
 * Generalmente es un % del saldo, con un suelo absoluto (típicamente 10-30 €).
 */
export function calcMinPayment(
  debt: number,
  minPaymentPct: number | undefined | null,
  floor: number = 10
): number {
  if (!minPaymentPct || minPaymentPct <= 0 || debt <= 0) return 0;
  return Math.max(floor, debt * (minPaymentPct / 100));
}

/**
 * Coste anual estimado en intereses si se mantiene la deuda actual sin pagar.
 * Aproximación lineal (no considera capitalización mensual).
 */
 export function calcYearlyInterestCost(
  debt: number,
  interestRate: number | undefined | null
): number {
  if (!interestRate || interestRate <= 0 || debt <= 0) return 0;
  return debt * (interestRate / 100);
}

// ─── Simulación de amortización ──────────────────────────────────────────────

export type AmortizationMonth = {
  month: number;          // 1, 2, 3...
  startingDebt: number;   // deuda al inicio del mes
  interest: number;       // intereses cobrados ese mes
  principal: number;      // capital amortizado ese mes
  payment: number;        // pago realizado ese mes
  endingDebt: number;     // deuda al final del mes
};

export type AmortizationResult = {
  feasible: boolean;              // false si el pago no cubre ni los intereses
  months: number;                 // meses hasta liquidar (0 si no feasible)
  totalPaid: number;              // suma total desembolsada
  totalInterest: number;          // intereses totales pagados
  schedule: AmortizationMonth[];  // detalle mes a mes (vacío si no feasible)
  monthlyInterestFirstMonth: number; // intereses del primer mes (útil para mostrar el umbral mínimo)
};

/**
 * Simula la amortización de la deuda de una tarjeta de crédito pagando
 * un importe fijo cada mes, con capitalización mensual.
 *
 * Modelo financiero (revolving estándar):
 *   tasaMensual = TAE / 12 / 100
 *   intereses_mes = deuda × tasaMensual
 *   capital_mes   = pago − intereses_mes
 *   nueva_deuda   = deuda − capital_mes
 *
 * @param debt          Deuda inicial (€)
 * @param annualRatePct TAE en % (ej: 21.5 = 21,5%)
 * @param monthlyPayment Pago fijo mensual (€)
 * @param maxMonths     Tope de seguridad (default 600 = 50 años)
 */
export function simulateAmortization(
  debt: number,
  annualRatePct: number,
  monthlyPayment: number,
  maxMonths: number = 600
): AmortizationResult {
  const empty: AmortizationResult = {
    feasible: false,
    months: 0,
    totalPaid: 0,
    totalInterest: 0,
    schedule: [],
    monthlyInterestFirstMonth: 0,
  };

  if (debt <= 0 || monthlyPayment <= 0) return empty;

  const monthlyRate = Math.max(0, annualRatePct) / 12 / 100;
  const firstMonthInterest = debt * monthlyRate;

  // Caso no viable: el pago no cubre ni los intereses → deuda crecería indefinidamente
  if (monthlyPayment <= firstMonthInterest && monthlyRate > 0) {
    return { ...empty, monthlyInterestFirstMonth: firstMonthInterest };
  }

  const schedule: AmortizationMonth[] = [];
  let currentDebt = debt;
  let totalPaid = 0;
  let totalInterest = 0;
  let month = 0;

  while (currentDebt > 0 && month < maxMonths) {
    month++;
    const interest = currentDebt * monthlyRate;
    // Último pago: ajustar para no pasarse
    const grossPayment = Math.min(monthlyPayment, currentDebt + interest);
    const principal = grossPayment - interest;
    const endingDebt = Math.max(0, currentDebt - principal);

    schedule.push({
      month,
      startingDebt: currentDebt,
      interest,
      principal,
      payment: grossPayment,
      endingDebt,
    });

    totalPaid += grossPayment;
    totalInterest += interest;
    currentDebt = endingDebt;
  }

  return {
    feasible: currentDebt <= 0,
    months: month,
    totalPaid,
    totalInterest,
    schedule,
    monthlyInterestFirstMonth: firstMonthInterest,
  };
}

/**
 * Compara dos escenarios de pago y devuelve el ahorro del escenario "mejor"
 * frente al escenario "base". Útil para mostrar mensajes tipo
 * "Pagando 50 € más al mes ahorras 340 € e 8 meses".
 */
 export function compareAmortizations(
  base: AmortizationResult,
  better: AmortizationResult
): { interestSaved: number; monthsSaved: number } {
  if (!base.feasible || !better.feasible) {
    return { interestSaved: 0, monthsSaved: 0 };
  }
  return {
    interestSaved: Math.max(0, base.totalInterest - better.totalInterest),
    monthsSaved: Math.max(0, base.months - better.months),
  };
}

// ─── Histórico de deuda mes a mes ────────────────────────────────────────────

export type DebtHistoryPoint = {
  monthKey: string;        // 'YYYY-MM'
  monthLabel: string;      // 'ene 24' (formato corto en español)
  endingDebt: number;      // deuda al final del mes (en moneda de la cuenta)
  expenses: number;        // gastos del mes (aumentan deuda)
  payments: number;        // pagos/abonos del mes (reducen deuda)
  utilizationPct: number;  // % de utilización al final del mes
};

/**
 * Reconstruye la evolución mes a mes de la deuda de una tarjeta de crédito,
 * partiendo del saldo base (`acc.balance` en `acc.date`) y aplicando los
 * movimientos reales en orden cronológico.
 *
 * Devuelve los últimos `monthsBack` meses (incluyendo el mes actual).
 * Si la cuenta es más reciente que `monthsBack`, devuelve solo los meses
 * disponibles desde `acc.date`.
 *
 * @param acc           Cuenta de tipo 'credit_card'
 * @param realExpenses  Lista global de movimientos reales
 * @param rates         Tabla de tipos de cambio
 * @param baseCurrency  Divisa base de la app
 * @param monthsBack    Cuántos meses mostrar (por defecto 6)
 * @param fromDate      Fecha de referencia para "el mes actual" (testing)
 */
export function calcDebtHistory(
  acc: Account,
  realExpenses: RealExpense[],
  rates: Record<string, number>,
  baseCurrency: string,
  monthsBack: number = 6,
  fromDate: Date = new Date()
): DebtHistoryPoint[] {
  if (acc.accountType !== 'credit_card') return [];

  const currency = acc.currency ?? baseCurrency;
  const limit = acc.creditLimit ?? 0;

  // Parsear acc.date como local (no UTC) para evitar desfases horarios
  const [by, bm, bd] = acc.date.split('-').map(Number);
  if (!by || !bm || !bd) return [];

  // Movimientos posteriores al saldo base, ordenados cronológicamente
  const movs = realExpenses
    .filter((e) => e.accountId === acc.id && e.valueDate > acc.date)
    .sort((a, b) => a.valueDate.localeCompare(b.valueDate));

  // Cursor mensual: empezamos en el mes del saldo base, terminamos en el mes actual
  let cursor = new Date(by, bm - 1, 1);
  const today = new Date(fromDate);
  const lastMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const result: DebtHistoryPoint[] = [];
  let currentDebt = acc.balance;

  while (cursor.getTime() <= lastMonth.getTime()) {
    const year = cursor.getFullYear();
    const monthIdx = cursor.getMonth(); // 0-11
    const mm = String(monthIdx + 1).padStart(2, '0');
    const monthKey = `${year}-${mm}`;

    // Rango YYYY-MM-DD del mes
    const firstOfMonth = `${year}-${mm}-01`;
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const lastOfMonth = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

    let expenses = 0;
    let payments = 0;
    movs.forEach((e) => {
      if (e.valueDate >= firstOfMonth && e.valueDate <= lastOfMonth) {
        const amount = convertAmount(e.amount, e.currency, currency, rates);
        if (e.type === 'expense') expenses += amount;
        else payments += amount;
      }
    });

    currentDebt = Math.max(0, currentDebt + expenses - payments);

    const utilizationPct =
      limit > 0 ? Math.min(100, (currentDebt / limit) * 100) : 0;

    const monthLabel = cursor.toLocaleDateString('es-ES', {
      month: 'short',
      year: '2-digit',
    });

    result.push({
      monthKey,
      monthLabel,
      endingDebt: currentDebt,
      expenses,
      payments,
      utilizationPct,
    });

    // Avanzar al siguiente mes
    cursor = new Date(year, monthIdx + 1, 1);
  }

  // Devolver solo los últimos N meses
  return result.slice(-monthsBack);
}

// ─── Health Score 0-100 (con desglose transparente) ──────────────────────────

export type HealthFactor = {
  key: 'utilization' | 'trend' | 'paymentMargin' | 'interestCost' | 'consistency';
  label: string;          // Texto humano: "Utilización actual"
  score: number;          // Puntos obtenidos por este factor
  maxScore: number;       // Puntos máximos posibles
  detail: string;         // Explicación corta: "25% utilización · ¡Excelente!"
  intent: 'success' | 'warning' | 'danger' | 'neutral';
};

export type HealthScoreResult = {
  score: number;          // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;          // "Excelente" / "Bueno" / "Mejorable" / "Crítico"
  intent: 'success' | 'warning' | 'danger' | 'critical';
  factors: HealthFactor[];
  summary: string;        // Frase resumen accionable
};

/**
 * Calcula un Health Score 0-100 para una tarjeta de crédito basado en
 * 5 factores ponderados. Todos los pesos suman exactamente 100.
 *
 * Filosofía: TRANSPARENCIA. El usuario debe entender cada punto.
 *
 * @param acc           Tarjeta de crédito
 * @param history       Histórico de deuda (de calcDebtHistory)
 * @param utilizationPct Utilización actual (de calcCreditCardDebt)
 * @param currentDebt   Deuda actual
 */
export function calcHealthScore(
  acc: Account,
  history: { endingDebt: number; payments: number; expenses: number }[],
  utilizationPct: number,
  currentDebt: number
): HealthScoreResult {
  const factors: HealthFactor[] = [];

  // ── 1. UTILIZACIÓN ACTUAL (35 pts) ─────────────────────────────────────
  // <30% = excelente · 30-49% = bueno · 50-69% = regular · 70%+ = mal
  let utilScore = 0;
  let utilDetail = '';
  let utilIntent: HealthFactor['intent'] = 'neutral';
  if (utilizationPct < 30) {
    utilScore = 35;
    utilDetail = `${Math.round(utilizationPct)}% · Excelente, muy por debajo del 30% recomendado`;
    utilIntent = 'success';
  } else if (utilizationPct < 50) {
    utilScore = 25;
    utilDetail = `${Math.round(utilizationPct)}% · Bueno, intenta mantenerlo bajo el 30%`;
    utilIntent = 'success';
  } else if (utilizationPct < 70) {
    utilScore = 15;
    utilDetail = `${Math.round(utilizationPct)}% · Moderado, empieza a impactar tu salud financiera`;
    utilIntent = 'warning';
  } else if (utilizationPct < 90) {
    utilScore = 5;
    utilDetail = `${Math.round(utilizationPct)}% · Alto, reduce gastos o aumenta pagos`;
    utilIntent = 'danger';
  } else {
    utilScore = 0;
    utilDetail = `${Math.round(utilizationPct)}% · Crítico, riesgo de impago inminente`;
    utilIntent = 'danger';
  }
  factors.push({
    key: 'utilization',
    label: 'Utilización del crédito',
    score: utilScore,
    maxScore: 35,
    detail: utilDetail,
    intent: utilIntent,
  });

  // ── 2. TENDENCIA DE DEUDA (25 pts) ─────────────────────────────────────
  // Compara deuda hace ~3 meses vs hoy. Premia bajadas, penaliza subidas.
  let trendScore = 0;
  let trendDetail = '';
  let trendIntent: HealthFactor['intent'] = 'neutral';
  if (history.length < 2) {
    trendScore = 12; // Neutral hasta tener historia
    trendDetail = 'Aún no hay datos suficientes para evaluar tendencia';
    trendIntent = 'neutral';
  } else {
    const oldest = history[0].endingDebt;
    const newest = history[history.length - 1].endingDebt;
    const delta = newest - oldest;
    const pctChange = oldest > 0 ? (delta / oldest) * 100 : 0;

    if (currentDebt === 0) {
      trendScore = 25;
      trendDetail = '¡Sin deuda! Estás en la mejor situación posible';
      trendIntent = 'success';
    } else if (pctChange <= -20) {
      trendScore = 25;
      trendDetail = `Bajando fuerte (-${Math.abs(Math.round(pctChange))}% en ${history.length} meses)`;
      trendIntent = 'success';
    } else if (pctChange <= -5) {
      trendScore = 20;
      trendDetail = `Bajando (-${Math.abs(Math.round(pctChange))}% en ${history.length} meses)`;
      trendIntent = 'success';
    } else if (pctChange < 5) {
      trendScore = 12;
      trendDetail = `Estable (${pctChange >= 0 ? '+' : ''}${Math.round(pctChange)}% en ${history.length} meses)`;
      trendIntent = 'neutral';
    } else if (pctChange < 20) {
      trendScore = 6;
      trendDetail = `Subiendo (+${Math.round(pctChange)}% en ${history.length} meses)`;
      trendIntent = 'warning';
    } else {
      trendScore = 0;
      trendDetail = `Subiendo rápido (+${Math.round(pctChange)}% en ${history.length} meses)`;
      trendIntent = 'danger';
    }
  }
  factors.push({
    key: 'trend',
    label: 'Tendencia reciente',
    score: trendScore,
    maxScore: 25,
    detail: trendDetail,
    intent: trendIntent,
  });

  // ── 3. MARGEN AL PAGO (15 pts) ─────────────────────────────────────────
  // Días hasta el próximo pago. Mucho margen = mejor planificación.
  let marginScore = 0;
  let marginDetail = '';
  let marginIntent: HealthFactor['intent'] = 'neutral';
  const dPayment = daysUntilPayment(acc);
  if (currentDebt === 0) {
    marginScore = 15;
    marginDetail = 'Sin deuda pendiente';
    marginIntent = 'success';
  } else if (dPayment === null) {
    marginScore = 8;
    marginDetail = 'Día de pago no configurado';
    marginIntent = 'neutral';
  } else if (dPayment >= 14) {
    marginScore = 15;
    marginDetail = `${dPayment} días hasta el pago · Tienes margen de sobra`;
    marginIntent = 'success';
  } else if (dPayment >= 7) {
    marginScore = 12;
    marginDetail = `${dPayment} días hasta el pago · Margen aceptable`;
    marginIntent = 'success';
  } else if (dPayment >= 3) {
    marginScore = 6;
    marginDetail = `${dPayment} días hasta el pago · Empieza a planificar`;
    marginIntent = 'warning';
  } else {
    marginScore = 0;
    marginDetail = `${dPayment === 0 ? '¡Vence hoy!' : `Solo ${dPayment} día${dPayment !== 1 ? 's' : ''}`} · Urgente`;
    marginIntent = 'danger';
  }
  factors.push({
    key: 'paymentMargin',
    label: 'Margen al próximo pago',
    score: marginScore,
    maxScore: 15,
    detail: marginDetail,
    intent: marginIntent,
  });

  // ── 4. COSTE EN INTERESES (15 pts) ─────────────────────────────────────
  // Estima el coste anual y lo compara con la deuda. Más coste = peor score.
  let interestScore = 0;
  let interestDetail = '';
  let interestIntent: HealthFactor['intent'] = 'neutral';
  if (currentDebt === 0) {
    interestScore = 15;
    interestDetail = 'Sin deuda, sin intereses';
    interestIntent = 'success';
  } else if (!acc.interestRate) {
    interestScore = 8;
    interestDetail = 'TAE no configurada';
    interestIntent = 'neutral';
  } else {
    const yearlyInterest = calcYearlyInterestCost(currentDebt, acc.interestRate);
    const interestRatio = yearlyInterest / currentDebt; // Equivale a TAE/100
    if (acc.interestRate <= 12) {
      interestScore = 15;
      interestDetail = `TAE ${acc.interestRate}% · Coste bajo`;
      interestIntent = 'success';
    } else if (acc.interestRate <= 20) {
      interestScore = 10;
      interestDetail = `TAE ${acc.interestRate}% · Coste medio (~${Math.round(yearlyInterest)}€/año)`;
      interestIntent = 'warning';
    } else if (acc.interestRate <= 28) {
      interestScore = 5;
      interestDetail = `TAE ${acc.interestRate}% · Coste alto (~${Math.round(yearlyInterest)}€/año)`;
      interestIntent = 'danger';
    } else {
      interestScore = 0;
      interestDetail = `TAE ${acc.interestRate}% · Coste muy elevado (~${Math.round(yearlyInterest)}€/año)`;
      interestIntent = 'danger';
    }
  }
  factors.push({
    key: 'interestCost',
    label: 'Coste en intereses',
    score: interestScore,
    maxScore: 15,
    detail: interestDetail,
    intent: interestIntent,
  });

  // ── 5. CONSISTENCIA DE PAGOS (10 pts) ──────────────────────────────────
  // ¿Cuántos meses del histórico tienen al menos un pago registrado?
  let consistencyScore = 0;
  let consistencyDetail = '';
  let consistencyIntent: HealthFactor['intent'] = 'neutral';
  if (currentDebt === 0 && history.every((h) => h.endingDebt === 0)) {
    consistencyScore = 10;
    consistencyDetail = 'Nunca has tenido deuda · Perfecto';
    consistencyIntent = 'success';
  } else if (history.length === 0) {
    consistencyScore = 5;
    consistencyDetail = 'Sin historial todavía';
    consistencyIntent = 'neutral';
  } else {
    const monthsWithPayments = history.filter((h) => h.payments > 0).length;
    const ratio = monthsWithPayments / history.length;
    if (ratio >= 0.8) {
      consistencyScore = 10;
      consistencyDetail = `Pagos en ${monthsWithPayments}/${history.length} meses · Excelente hábito`;
      consistencyIntent = 'success';
    } else if (ratio >= 0.5) {
      consistencyScore = 7;
      consistencyDetail = `Pagos en ${monthsWithPayments}/${history.length} meses · Buen ritmo`;
      consistencyIntent = 'success';
    } else if (ratio >= 0.25) {
      consistencyScore = 3;
      consistencyDetail = `Pagos en ${monthsWithPayments}/${history.length} meses · Irregular`;
      consistencyIntent = 'warning';
    } else {
      consistencyScore = 0;
      consistencyDetail = `Pagos en ${monthsWithPayments}/${history.length} meses · Muy poco frecuente`;
      consistencyIntent = 'danger';
    }
  }
  factors.push({
    key: 'consistency',
    label: 'Consistencia de pagos',
    score: consistencyScore,
    maxScore: 10,
    detail: consistencyDetail,
    intent: consistencyIntent,
  });

  // ── Suma total y clasificación ─────────────────────────────────────────
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

  let level: HealthScoreResult['level'];
  let label: string;
  let intent: HealthScoreResult['intent'];
  let summary: string;

  if (totalScore >= 80) {
    level = 'excellent';
    label = 'Excelente';
    intent = 'success';
    summary = '¡Lo estás haciendo genial! Mantén estos hábitos financieros.';
  } else if (totalScore >= 60) {
    level = 'good';
    label = 'Bueno';
    intent = 'success';
    summary = 'Vas por buen camino. Pequeños ajustes te llevarán a la excelencia.';
  } else if (totalScore >= 40) {
    level = 'fair';
    label = 'Mejorable';
    intent = 'warning';
    summary = 'Hay margen de mejora. Revisa los factores en rojo para subir tu score.';
  } else {
    level = 'poor';
    label = 'Crítico';
    intent = 'critical';
    summary = 'Tu salud financiera está en riesgo. Es momento de actuar para evitar problemas mayores.';
  }

  return { score: totalScore, level, label, intent, factors, summary };
}

// ─── Métricas históricas (intereses, ahorros, picos) ────────────────────────

export type HistoricalMetrics = {
  totalPaid: number;              // Total amortizado (suma de pagos)
  totalSpent: number;             // Total gastado con la tarjeta
  estimatedInterestPaid: number;  // Intereses estimados pagados
  savedVsMinimum: number;         // Ahorro estimado por pagar más del mínimo
  peakMonth: {                    // Mes con más gasto
    label: string;
    amount: number;
  } | null;
  monthsTracked: number;          // Cuántos meses cubre el análisis
  hasEnoughData: boolean;         // ≥2 meses con actividad
};

/**
 * Calcula métricas acumulativas a partir del histórico de deuda.
 *
 * Modelo de intereses (estimación):
 *   Para cada mes, asumimos que la deuda media = (deudaInicio + deudaFin) / 2
 *   intereses_mes ≈ deudaMedia × (TAE / 12 / 100)
 *
 * Modelo de ahorro vs mínimo:
 *   Para cada mes, calculamos cuánto se hubiera pagado solo con el mínimo
 *   y comparamos con el pago real.
 *
 * @param history       Histórico mes a mes (de calcDebtHistory, ideal 12M)
 * @param interestRate  TAE de la tarjeta
 * @param minPaymentPct % de pago mínimo de la tarjeta
 */
export function calcHistoricalMetrics(
  history: {
    monthLabel: string;
    endingDebt: number;
    expenses: number;
    payments: number;
  }[],
  interestRate: number | undefined | null,
  minPaymentPct: number | undefined | null
): HistoricalMetrics {
  if (history.length === 0) {
    return {
      totalPaid: 0,
      totalSpent: 0,
      estimatedInterestPaid: 0,
      savedVsMinimum: 0,
      peakMonth: null,
      monthsTracked: 0,
      hasEnoughData: false,
    };
  }

  const monthlyRate = interestRate && interestRate > 0 ? interestRate / 12 / 100 : 0;
  const minPct = minPaymentPct && minPaymentPct > 0 ? minPaymentPct / 100 : 0;

  let totalPaid = 0;
  let totalSpent = 0;
  let estimatedInterestPaid = 0;
  let savedVsMinimum = 0;

  let peakMonth: HistoricalMetrics['peakMonth'] = null;
  let monthsWithActivity = 0;

  // Calcular deuda al inicio de cada mes (la del cierre del anterior)
  let previousEndingDebt = 0;

  history.forEach((m, idx) => {
    totalPaid += m.payments;
    totalSpent += m.expenses;

    // Pico de gasto
    if (!peakMonth || m.expenses > peakMonth.amount) {
      if (m.expenses > 0) {
        peakMonth = { label: m.monthLabel, amount: m.expenses };
      }
    }

    if (m.expenses > 0 || m.payments > 0) monthsWithActivity++;

    // ── Intereses estimados ──
    // Para el primer mes no podemos saber la deuda inicial real, usamos 0 como base
    // (subestimación conservadora; mejor que sobrestimar)
    const startingDebt = idx === 0 ? Math.max(0, m.endingDebt - m.expenses + m.payments) : previousEndingDebt;
    const avgDebt = (startingDebt + m.endingDebt) / 2;
    if (monthlyRate > 0 && avgDebt > 0) {
      estimatedInterestPaid += avgDebt * monthlyRate;
    }

    // ── Ahorro vs pago mínimo ──
    // Pago mínimo del mes = max(10€, deudaInicial × minPct)
    if (minPct > 0 && startingDebt > 0) {
      const minimumPayment = Math.max(10, startingDebt * minPct);
      // Si el usuario pagó MÁS del mínimo, ese exceso evita intereses futuros
      // Aproximación: el exceso × tasa mensual = ahorro mensual recurrente
      const excessOverMinimum = Math.max(0, m.payments - minimumPayment);
      if (excessOverMinimum > 0 && monthlyRate > 0) {
        // El exceso ahorra intereses de forma recurrente; estimamos el ahorro
        // proyectado a los meses restantes del análisis
        const monthsRemaining = history.length - idx;
        savedVsMinimum += excessOverMinimum * monthlyRate * monthsRemaining;
      }
    }

    previousEndingDebt = m.endingDebt;
  });

  return {
    totalPaid,
    totalSpent,
    estimatedInterestPaid,
    savedVsMinimum,
    peakMonth,
    monthsTracked: history.length,
    hasEnoughData: monthsWithActivity >= 2,
  };
}

// ─── Top categorías de gasto en una tarjeta ─────────────────────────────────

export type CategorySpend = {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  categoryIcon?: string;
  amount: number;
  pct: number;          // % sobre el total gastado
  movementCount: number;
};

export type TopCategoriesResult = {
  topCategories: CategorySpend[];
  totalSpent: number;
  uncategorizedAmount: number;
  hasData: boolean;
};

/**
 * Calcula las top N categorías donde más se ha gastado con una tarjeta concreta.
 * Solo considera movimientos de tipo 'expense' posteriores a la fecha de saldo
 * base de la cuenta. Excluye transferencias.
 *
 * @param acc           Tarjeta de crédito
 * @param realExpenses  Lista global de movimientos
 * @param categories    Lista global de categorías
 * @param rates         Tabla de tipos de cambio
 * @param baseCurrency  Divisa base
 * @param topN          Número máximo de categorías a devolver (default 5)
 */
export function calcTopCategoriesForCard(
  acc: Account,
  realExpenses: RealExpense[],
  categories: Category[],
  rates: Record<string, number>,
  baseCurrency: string,
  topN: number = 5
): TopCategoriesResult {
  const currency = acc.currency ?? baseCurrency;

  // Filtrar gastos de esta tarjeta, posteriores al saldo base, no transferencias
  const cardExpenses = realExpenses.filter(
    (e) =>
      e.accountId === acc.id &&
      e.type === 'expense' &&
      e.valueDate > acc.date &&
      !e.isTransfer
  );

  if (cardExpenses.length === 0) {
    return {
      topCategories: [],
      totalSpent: 0,
      uncategorizedAmount: 0,
      hasData: false,
    };
  }

  // Agrupar por categoría
  const byCat = new Map<
    string,
    { amount: number; count: number }
  >();

  cardExpenses.forEach((e) => {
    const amt = convertAmount(e.amount, e.currency, currency, rates);
    const catId = e.categoryId || '__uncategorized__';
    const prev = byCat.get(catId) ?? { amount: 0, count: 0 };
    byCat.set(catId, { amount: prev.amount + amt, count: prev.count + 1 });
  });

  const totalSpent = Array.from(byCat.values()).reduce(
    (s, v) => s + v.amount,
    0
  );

  // Construir lista enriquecida con datos de categoría
  const enriched: CategorySpend[] = Array.from(byCat.entries()).map(
    ([categoryId, data]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        categoryColor: cat?.color,
        categoryIcon: cat?.icon,
        amount: data.amount,
        pct: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
        movementCount: data.count,
      };
    }
  );

  // Ordenar por importe descendente y tomar top N
  enriched.sort((a, b) => b.amount - a.amount);
  const topCategories = enriched.slice(0, topN);

  // Importe en categoría "sin categorizar" (informativo)
  const uncategorizedAmount =
    enriched.find((c) => c.categoryId === '__uncategorized__')?.amount ?? 0;

  return {
    topCategories,
    totalSpent,
    uncategorizedAmount,
    hasData: true,
  };
}
