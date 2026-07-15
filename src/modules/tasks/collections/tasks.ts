// collections/tasks.ts
import { createSubcollection } from '@/lib/api-rq';
import { toDate } from '@/lib/api-rq/utils/timestamp';
import type { WithId } from '@/lib/api-rq';
import { Task } from '@/lib/types';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * Tasks subcollection: projects/{ACTIVE_PROJECT_SCOPE}/tasks
 */
export const tasksCollection = createSubcollection<Task>({
  path: (projectId: string) => `projects/${projectId}/tasks`,
  transform: (raw): WithId<Task> => {
    const task = raw as unknown as WithId<Task>;
    return {
      ...task,
      uuid: task.uuid ?? task.id,
      dueDate: toDate(task.dueDate),
      createdAt: toDate(task.createdAt) ?? new Date(),
      updatedAt: toDate(task.updatedAt) ?? new Date(),
    };
  },
})(ACTIVE_PROJECT_SCOPE);
