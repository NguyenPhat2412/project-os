// collections/taskColumns.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { TaskColumn } from '@/modules/tasks/types/task';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * TaskColumns subcollection: projects/{ACTIVE_PROJECT_SCOPE}/task_columns
 */
export const taskColumnsCollection = createSubcollection<TaskColumn>({
  path: (projectId: string) => `projects/${projectId}/task_columns`,
  transform: (raw): WithId<TaskColumn> => raw as unknown as WithId<TaskColumn>,
})(ACTIVE_PROJECT_SCOPE);
