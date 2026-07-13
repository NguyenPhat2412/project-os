/**
 * useBacklog
 * ────────────
 * Hook for Backlog module using api-rq collection pattern.
 */

import { epicsCollection } from '@/modules/backlog/collections/epics';
import type { Epic } from '@/modules/backlog/types/backlog';
import type { WithId } from '@/lib/api-rq';

export function useBacklog() {
  // ── API queries ─────────────────────────────────────────
  const { data: epics = [], isLoading } = epicsCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedEpics = epics as WithId<Epic>[];

  // ── CRUD mutations ────────────────────────────────────────────
  const createEpic = epicsCollection.useCreate();
  const updateEpic = epicsCollection.useUpdate();
  const deleteEpic = epicsCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    epics: typedEpics,
    loading: isLoading,
    refresh,
    // CRUD
    createEpic,
    updateEpic,
    deleteEpic,
  };
}
