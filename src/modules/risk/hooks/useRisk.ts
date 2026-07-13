/**
 * useRisk
 * ──────────
 * Hook for Risk module using api-rq collection pattern.
 */

import { risksCollection } from '@/modules/risk/collections/risks';
import type { Risk } from '@/modules/risk/types/risk';
import type { WithId } from '@/lib/api-rq';

export function useRisk() {
  // ── API queries ─────────────────────────────────────────
  const { data: risks = [], isLoading } = risksCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedRisks = risks as WithId<Risk>[];

  // ── CRUD mutations ────────────────────────────────────────────
  const createRisk = risksCollection.useCreate();
  const updateRisk = risksCollection.useUpdate();
  const deleteRisk = risksCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    risks: typedRisks,
    riskStats: [], // Computed if needed
    loading: isLoading,
    refresh,
    // CRUD
    createRisk,
    updateRisk,
    deleteRisk,
  };
}
