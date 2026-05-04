import { useMemo } from 'react';
import { convertAmount, monthKey } from '../utils';
import type { RealExpense } from '../types';

export function useTrendsData(
  rangeMonths: number | 'all',
  accountFilter: string,
  accounts: any[],
  realExpenses: RealExpense[],
  categories: any[],
  rates: Record<string, number>,
  baseCurrency: string
) {
  return useMemo(() => {
    const now = new Date();
    const allMonthKeys = Array.from(
      new Set(realExpenses.map((e) => e.valueDate.slice(0, 7)))
    ).sort();

    let monthKeys: string[] = [];
    if (rangeMonths === 'all') {
      monthKeys = allMonthKeys;
    } else {
      for (let i = rangeMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthKeys.push(monthKey(d));
      }
    }

    if (monthKeys.length === 0) return null;

    const filteredAccounts =
      accountFilter === 'all'
        ? accounts
        : accounts.filter((a) => a.id === accountFilter);

    const validExpenses = realExpenses.filter((e) => {
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      if (e.valueDate <= acc.date) return false;
      if (accountFilter !== 'all' && e.accountId !== accountFilter)
        return false;
      if (!monthKeys.includes(e.valueDate.slice(0, 7))) return false;
      return true;
    });

    const monthlyData = monthKeys.map((mk) => {
      const monthExpenses = validExpenses.filter(
        (e) => e.valueDate.slice(0, 7) === mk
      );
      const income = monthExpenses
        .filter((e) => e.type === 'income')
        .reduce(
          (sum, e) =>
            sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const expenses = monthExpenses
        .filter((e) => e.type === 'expense')
        .reduce(
          (sum, e) =>
            sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const net = income - expenses;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      });
      return {
        monthKey: mk,
        label,
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        savingsRate: parseFloat(savingsRate.toFixed(1)),
      };
    });

    const balanceData = monthKeys.map((mk) => {
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      });
      const point: Record<string, any> = { monthKey: mk, label };
      filteredAccounts.forEach((acc) => {
        let balance = convertAmount(
          acc.balance,
          acc.currency ?? baseCurrency,
          baseCurrency,
          rates
        );
        realExpenses.forEach((e) => {
          if (e.accountId !== acc.id) return;
          if (e.valueDate <= acc.date) return;
          if (e.valueDate.slice(0, 7) > mk) return;
          const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
          balance += e.type === 'income' ? amt : -amt;
        });
        point[acc.id] = parseFloat(balance.toFixed(2));
        point[`${acc.id}_name`] = acc.name;
      });
      const total = filteredAccounts.reduce(
        (sum, acc) => sum + (point[acc.id] ?? 0),
        0
      );
      point['total'] = parseFloat(total.toFixed(2));
      return point;
    });

    const catTotals: Record<string, number> = {};
    validExpenses
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
        catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + amt;
      });

    const categoryData = Object.entries(catTotals)
      .map(([catId, total]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          name: cat?.name ?? 'Sin categoría',
          color: cat?.color ?? '#94a3b8',
          emoji: cat?.emoji ?? '📦',
          total: parseFloat(total.toFixed(2)),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
    const totalNet = totalIncome - totalExpenses;
    const avgSavingsRate =
      monthlyData.length > 0
        ? monthlyData.reduce((s, m) => s + m.savingsRate, 0) /
          monthlyData.length
        : 0;

    const bestIncomeMonth = [...monthlyData].sort(
      (a, b) => b.income - a.income
    )[0];
    const worstExpenseMonth = [...monthlyData].sort(
      (a, b) => b.expenses - a.expenses
    )[0];
    const topCategory = categoryData[0];

    const half = Math.floor(monthlyData.length / 2);
    const firstHalfSavings =
      monthlyData.slice(0, half).reduce((s, m) => s + m.savingsRate, 0) /
      (half || 1);
    const secondHalfSavings =
      monthlyData.slice(half).reduce((s, m) => s + m.savingsRate, 0) /
      (monthlyData.length - half || 1);
    const trend: 'up' | 'down' | 'stable' =
      secondHalfSavings > firstHalfSavings + 2
        ? 'up'
        : secondHalfSavings < firstHalfSavings - 2
        ? 'down'
        : 'stable';

    return {
      monthlyData,
      balanceData,
      categoryData,
      filteredAccounts,
      stats: {
        totalIncome,
        totalExpenses,
        totalNet,
        avgSavingsRate,
        bestIncomeMonth,
        worstExpenseMonth,
        topCategory,
        trend,
        monthCount: monthKeys.length,
      },
    };
  }, [
    rangeMonths,
    accountFilter,
    accounts,
    realExpenses,
    categories,
    rates,
    baseCurrency,
  ]);
}
