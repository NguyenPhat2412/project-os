/**
 * useBacklog
 * ────────────
 * Hook for Backlog module using firestore-rq collection pattern.
 */

import { epicsCollection } from '@/modules/backlog/collections/epics';
import type { Epic } from '@/modules/backlog/types/backlog';
import type { WithId } from '@/lib/firestore-rq';

export function useBacklog() {
  // ── Firestore queries ─────────────────────────────────────────
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
