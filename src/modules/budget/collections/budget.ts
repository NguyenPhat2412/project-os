// collections/budget.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { BudgetItem } from '@/modules/budget/types/budget';
import { PROJECT_ID } from '@/lib/project';

/**
 * BudgetItems subcollection: projects/{PROJECT_ID}/budget_items
 */
export const budgetItemsCollection = createSubcollection<BudgetItem>({
  path: (projectId: string) => `projects/${projectId}/budget_items`,
  transform: (raw): WithId<BudgetItem> => raw as unknown as WithId<BudgetItem>,
})(PROJECT_ID);
