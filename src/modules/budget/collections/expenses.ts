// collections/expenses.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { ExpenseEntry } from '@/modules/budget/types/budget';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * Expenses subcollection: projects/{ACTIVE_PROJECT_SCOPE}/expenses
 */
export const expensesCollection = createSubcollection<ExpenseEntry>({
  path: (projectId: string) => `projects/${projectId}/expenses`,
  transform: (raw): WithId<ExpenseEntry> => {
    const value = raw as unknown as Record<string, unknown>;
    const amount = Number(value.amount ?? 0);

    return {
      ...(value as unknown as ExpenseEntry),
      id: String(value.id ?? value.legacyId ?? ''),
      date: String(value.date ?? ''),
      category: String(value.category ?? 'Chưa phân loại'),
      description: String(value.description ?? value.name ?? ''),
      amount: Number.isFinite(amount) ? amount : 0,
      status: value.status === 'Paid' || value.status === 'paid' ? 'Paid' : 'Pending',
    };
  },
})(ACTIVE_PROJECT_SCOPE);
