/**
 * useTimeline
 * ─────────────
 * Hook for Timeline module using firestore-rq collection pattern.
 */

import { useMemo } from 'react';
import { ganttPhasesCollection } from '@/modules/timeline/collections/ganttPhases';
import { milestonesCollection } from '@/modules/timeline/collections/milestones';
import type { GanttPhase } from '@/modules/timeline/collections/ganttPhases';
import type { Milestone } from '@/modules/timeline/collections/milestones';
import type { WithId } from '@/lib/firestore-rq';
import type { StatData } from '@/lib/types';

export function useTimeline() {
  // ── Firestore queries ─────────────────────────────────────────
  const { data: ganttPhases = [], isLoading } = ganttPhasesCollection.useList();
  const { data: milestones = [] } = milestonesCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedGanttPhases = ganttPhases as WithId<GanttPhase>[];
  const typedMilestones = milestones as WithId<Milestone>[];

  // ── Compute timelineStats from ganttPhases ────────────────────
  const timelineStats = useMemo((): StatData[] => {
    return typedGanttPhases.map((phase) => ({
      label: phase.label,
      value: phase.widthPercent,
      delta: '',
      deltaType: 'neutral' as const,
      color: phase.color as StatData['color'],
    }));
  }, [typedGanttPhases]);

  // ── CRUD mutations ────────────────────────────────────────────
  const createGanttPhase = ganttPhasesCollection.useCreate();
  const updateGanttPhase = ganttPhasesCollection.useUpdate();
  const deleteGanttPhase = ganttPhasesCollection.useDelete();

  const createMilestone = milestonesCollection.useCreate();
  const updateMilestone = milestonesCollection.useUpdate();
  const deleteMilestone = milestonesCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    timelineStats,
    ganttPhases: typedGanttPhases,
    milestones: typedMilestones,
    loading: isLoading,
    refresh,
    // CRUD
    createGanttPhase,
    updateGanttPhase,
    deleteGanttPhase,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
