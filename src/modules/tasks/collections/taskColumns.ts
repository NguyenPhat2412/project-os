// collections/taskColumns.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { TaskColumn } from '@/modules/tasks/types/task';
import { PROJECT_ID } from '@/lib/project';

/**
 * TaskColumns subcollection: projects/{PROJECT_ID}/task_columns
 */
export const taskColumnsCollection = createSubcollection<TaskColumn>({
  path: (projectId: string) => `projects/${projectId}/task_columns`,
  transform: (raw): WithId<TaskColumn> => raw as unknown as WithId<TaskColumn>,
})(PROJECT_ID);
