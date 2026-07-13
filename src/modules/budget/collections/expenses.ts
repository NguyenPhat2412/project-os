// collections/expenses.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { ExpenseEntry } from '@/modules/budget/types/budget';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

/**
 * Expenses subcollection: projects/{ACTIVE_PROJECT_ID}/expenses
 */
export const expensesCollection = createSubcollection<ExpenseEntry>({
  path: (projectId: string) => `projects/${projectId}/expenses`,
  transform: (raw): WithId<ExpenseEntry> => raw as unknown as WithId<ExpenseEntry>,
})(ACTIVE_PROJECT_ID);
