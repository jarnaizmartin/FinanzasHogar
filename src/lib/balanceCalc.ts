import { convertAmount } from '../utils';
import type { RealExpense } from '../types';

export function calcRealBalance(
  account: {
    id: string;
    balance: number;
    date: string;
    currency: string;
    acknowledgedExpenseIds?: string[];
  },
  realExpenses: RealExpense[],
  rates: Record<string, number>,
  baseCurrency: string
): {
  realBalance: number;
  ignoredCount: number;
  appliedCount: number;
} {
  const accountDate = account.date;
  const acknowledged = new Set(account.acknowledgedExpenseIds ?? []);
  const accountMovements = realExpenses.filter(
    (e) => e.accountId === account.id
  );

  let delta = 0;
  let appliedCount = 0;
  let ignoredCount = 0;

  accountMovements.forEach((e) => {
    if (acknowledged.has(e.id)) return;
    if (e.valueDate > accountDate) {
      const amountInAccountCurrency = convertAmount(
        e.amount,
        e.currency,
        account.currency ?? baseCurrency,
        rates
      );
      if (e.type === 'income') delta += amountInAccountCurrency;
      else delta -= amountInAccountCurrency;
      appliedCount++;
    } else {
      ignoredCount++;
    }
  });

  return {
    realBalance: account.balance + delta,
    ignoredCount,
    appliedCount,
  };
}
