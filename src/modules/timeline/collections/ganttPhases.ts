// collections/ganttPhases.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

export interface GanttPhase {
  rowLabel: string;
  label: string;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

/**
 * GanttPhases subcollection: projects/{ACTIVE_PROJECT_SCOPE}/gantt_phases
 */
export const ganttPhasesCollection = createSubcollection<GanttPhase>({
  path: (projectId: string) => `projects/${projectId}/gantt_phases`,
  transform: (raw): WithId<GanttPhase> => {
    const value = raw as unknown as Record<string, unknown>;
    const leftPercent = Number(value.leftPercent ?? 0);
    const widthPercent = Number(value.widthPercent ?? 25);

    return {
      ...(value as unknown as GanttPhase),
      id: String(value.id ?? value.legacyId ?? ''),
      rowLabel: String(value.rowLabel ?? value.name ?? 'Giai đoạn'),
      label: String(value.label ?? value.name ?? 'Giai đoạn'),
      leftPercent: Number.isFinite(leftPercent) ? leftPercent : 0,
      widthPercent: Number.isFinite(widthPercent) ? widthPercent : 25,
      color: String(value.color ?? 'accent'),
    };
  },
})(ACTIVE_PROJECT_SCOPE);
