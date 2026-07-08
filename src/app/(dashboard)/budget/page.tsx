'use client';
import { useMemo } from 'react';
import { budgetItemsCollection } from '@/modules/budget/collections/budget';
import { expensesCollection } from '@/modules/budget/collections/expenses';
import { teamCollection } from '@/modules/team/collections/team';
import { budgetConfig } from '@/lib/project-config';
import { PageLoader } from '@/components/ui/page-loader';
import { BudgetTable } from '@/modules/budget/components/BudgetTable';
import { ExpenseTable } from '@/modules/budget/components/ExpenseTable';
import { BudgetStatsPanel } from '@/modules/budget/components/BudgetStatsPanel';
import { BudgetPageHeader } from '@/modules/budget/components/BudgetPageHeader';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import type { BudgetItem, ExpenseEntry } from '@/modules/budget/types/budget';
import type { TeamMember } from '@/modules/team/types/team';

export default function BudgetPage() {
  // Config document — fetched with React Query (auto-refetch on window focus)
  const { isLoading: configLoading } = budgetConfig.useDocument('budget');

  // Collections - fetch with useBatchFetch
  const batchItems = useMemo(() => [
    createCollectionListItem('budgetItems', budgetItemsCollection),
    createCollectionListItem('expenses', expensesCollection),
    createCollectionListItem('teamMembers', teamCollection),
  ], []);

  const { data, isLoading, refetch } = useBatchFetch(batchItems);

  const loading = isLoading || configLoading;

  const budgetItems = (data.budgetItems ?? []) as BudgetItem[];
  const expenses = (data.expenses ?? []) as ExpenseEntry[];
  const teamMembers = (data.teamMembers ?? []) as TeamMember[];

  // CRUD handlers
  const handleSuccess = () => {
    refetch();
    // React Query will auto-refetch budgetConfig on next access; no manual invalidation needed
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <BudgetPageHeader />
      <BudgetStatsPanel budgetItems={budgetItems} expenses={expenses} />

      <div className='grid grid-cols-2 max-lg:grid-cols-1 gap-4.5'>
        <BudgetTable budgetItems={budgetItems} onSuccess={handleSuccess} />
        <ExpenseTable expenses={expenses} budgetItems={budgetItems} teamMembers={teamMembers} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
