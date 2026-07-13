// collections/budget.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { BudgetItem } from '@/modules/budget/types/budget';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * BudgetItems subcollection: projects/{ACTIVE_PROJECT_SCOPE}/budget_items
 */
export const budgetItemsCollection = createSubcollection<BudgetItem>({
  path: (projectId: string) => `projects/${projectId}/budget_items`,
  transform: (raw): WithId<BudgetItem> => {
    const value = raw as unknown as Record<string, unknown>;
    const budget = Number(value.budget ?? value.amount ?? 0);
    const spent = Number(value.spent ?? 0);

    return {
      ...(value as unknown as BudgetItem),
      id: String(value.id ?? value.legacyId ?? ''),
      category: String(value.category ?? value.name ?? 'Chưa phân loại'),
      icon: String(value.icon ?? '💰'),
      budget: Number.isFinite(budget) ? budget : 0,
      spent: Number.isFinite(spent) ? spent : 0,
    };
  },
})(ACTIVE_PROJECT_SCOPE);
