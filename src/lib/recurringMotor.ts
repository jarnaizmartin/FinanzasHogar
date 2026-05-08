import { FREQUENCIES } from '../utils';
import type { Projection, RealExpense } from '../types';

const uid = () => crypto.randomUUID();

export function applyRecurringProjections(
  projections: Projection[],
  realExpenses: RealExpense[],
  setRealExpenses: React.Dispatch<React.SetStateAction<RealExpense[]>>,
  setProjections: React.Dispatch<React.SetStateAction<Projection[]>>,
  accounts: any[],
  baseCurrency: string
): { applied: number; duplicates: number; duplicateDetails: any[] } {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
  const currentDay = now.getDate();

  const recurringProjs = projections.filter((p) => p.isRecurring === true);

  let applied = 0;
  let duplicates = 0;
  const duplicateDetails: {
    projectionName: string;
    amount: number;
    currency: string;
    monthKey: string;
  }[] = [];

  const newExpenses: RealExpense[] = [];
  const updatedProjections = projections.map((p) => ({ ...p }));

  recurringProjs.forEach((proj) => {
    if (proj.lastApplied === currentMonthKey) return;

    const chargeDay = proj.recurringDay ?? new Date(proj.startDate).getDate();
    if (currentDay < chargeDay) return;

    const start = new Date(proj.startDate);
    const end = proj.endDate ? new Date(proj.endDate) : null;
    const freq = FREQUENCIES.find((f) => f.value === proj.frequency);
    if (!freq) return;

    const diffMonths =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (diffMonths < 0) return;
    if (end && now > end) return;
    if (diffMonths % freq.months !== 0) return;

    const amount = proj.nextOverrideAmount ?? proj.amount;
    const chargeDate = `${currentMonthKey}-${String(chargeDay).padStart(
      2,
      '0'
    )}`;

    const isDuplicate = [...realExpenses, ...newExpenses].some((e) => {
      if (e.categoryId !== proj.categoryId) return false;
      if (e.accountId !== proj.accountId) return false;
      if (e.type !== proj.type) return false;
      if (Math.abs(e.amount - amount) > amount * 0.05) return false;
      if (e.valueDate.slice(0, 7) !== currentMonthKey) return false;
      return true;
    });

    if (isDuplicate) {
      duplicates++;
      const idx = updatedProjections.findIndex((p) => p.id === proj.id);
      if (idx !== -1) {
        updatedProjections[idx] = {
          ...updatedProjections[idx],
          hasDuplicateWarning: true,
          duplicateWarningMonth: currentMonthKey,
          lastApplied: currentMonthKey,
          nextOverrideAmount: null,
        };
      }
      const acc = accounts.find((a) => a.id === proj.accountId);
      duplicateDetails.push({
        projectionName: proj.name,
        amount,
        currency: acc?.currency ?? baseCurrency,
        monthKey: currentMonthKey,
      });
      return;
    }

    const acc = accounts.find((a) => a.id === proj.accountId);
    const currency = acc?.currency ?? baseCurrency;

    if (proj.type === 'transfer' && proj.toAccountId) {
      const transferId = uid();
      const toAcc = accounts.find((a) => a.id === proj.toAccountId);
      const toCurrency = toAcc?.currency ?? baseCurrency;
      newExpenses.push(
        {
          id: uid(),
          entryDate: chargeDate,
          valueDate: chargeDate,
          description: `🔄 ${proj.name}`,
          categoryId: '__transfer__',
          amount,
          currency,
          type: 'expense',
          accountId: proj.accountId,
          notes: 'Generado automáticamente por transferencia recurrente',
          isTransfer: true,
          transferId,
        },
        {
          id: uid(),
          entryDate: chargeDate,
          valueDate: chargeDate,
          description: `🔄 ${proj.name}`,
          categoryId: '__transfer__',
          amount,
          currency: toCurrency,
          type: 'income',
          accountId: proj.toAccountId,
          notes: 'Generado automáticamente por transferencia recurrente',
          isTransfer: true,
          transferId,
        }
      );
    } else {
      newExpenses.push({
        id: uid(),
        entryDate: chargeDate,
        valueDate: chargeDate,
        description: `🔄 ${proj.name}`,
        categoryId: proj.categoryId,
        amount,
        currency,
        type: proj.type as 'income' | 'expense',
        accountId: proj.accountId,
        notes: 'Generado automáticamente por cargo recurrente',
      });
    }

    applied++;

    const idx = updatedProjections.findIndex((p) => p.id === proj.id);
    if (idx !== -1) {
      updatedProjections[idx] = {
        ...updatedProjections[idx],
        lastApplied: currentMonthKey,
        nextOverrideAmount: null,
      };
    }
  });

  if (newExpenses.length > 0) {
    setRealExpenses((prev) => [...prev, ...newExpenses]);
  }
  if (applied > 0 || duplicates > 0) {
    setProjections(updatedProjections);
  }

  return { applied, duplicates, duplicateDetails };
}
