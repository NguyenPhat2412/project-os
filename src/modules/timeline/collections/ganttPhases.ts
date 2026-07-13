// collections/ganttPhases.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

export interface GanttPhase {
  rowLabel: string;
  label: string;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

/**
 * GanttPhases subcollection: projects/{ACTIVE_PROJECT_ID}/gantt_phases
 */
export const ganttPhasesCollection = createSubcollection<GanttPhase>({
  path: (projectId: string) => `projects/${projectId}/gantt_phases`,
  transform: (raw): WithId<GanttPhase> => raw as unknown as WithId<GanttPhase>,
})(ACTIVE_PROJECT_ID);
