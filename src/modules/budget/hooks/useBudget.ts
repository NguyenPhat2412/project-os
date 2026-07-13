/**
 * useBudget
 * ──────────
 * Hook for Budget module using api-rq collection pattern.
 */

import { useMemo } from 'react';
import { budgetItemsCollection } from '@/modules/budget/collections/budget';
import { expensesCollection } from '@/modules/budget/collections/expenses';
import type { BudgetItem, ExpenseEntry } from '@/modules/budget/types/budget';
import type { WithId } from '@/lib/api-rq';

export function useBudget() {
  // ── API queries ─────────────────────────────────────────
  const { data: budgetItems = [] } = budgetItemsCollection.useList();
  const { data: expenses = [] } = expensesCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedBudgetItems = budgetItems as WithId<BudgetItem>[];
  const typedExpenses = expenses as WithId<ExpenseEntry>[];

  // ── Compute budgetSummary from budgetItems ─────────────────────
  const budgetSummary = useMemo(() => {
    return typedBudgetItems.map((item) => ({
      label: item.category,
      value: item.spent,
      total: item.budget,
      icon: item.icon,
      delta: '',
      deltaType: 'neutral' as const,
      color: 'accent' as const,
    }));
  }, [typedBudgetItems]);

  // ── CRUD mutations ────────────────────────────────────────────
  const createBudgetItem = budgetItemsCollection.useCreate();
  const updateBudgetItem = budgetItemsCollection.useUpdate();
  const deleteBudgetItem = budgetItemsCollection.useDelete();

  const createExpense = expensesCollection.useCreate();
  const updateExpense = expensesCollection.useUpdate();
  const deleteExpense = expensesCollection.useDelete();

  // ── Refresh (refetch queries) ─────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    budgetItems: typedBudgetItems,
    expenses: typedExpenses,
    budgetSummary,
    refresh,
    // CRUD
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
