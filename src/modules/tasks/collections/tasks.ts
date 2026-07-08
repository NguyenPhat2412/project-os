// collections/tasks.ts
import { createSubcollection } from '@/lib/firestore-rq';
import { toDate } from '@/lib/firestore-rq/utils/timestamp';
import type { WithId } from '@/lib/firestore-rq';
import { Task } from '@/lib/types';
import { PROJECT_ID } from '@/lib/project';

/**
 * Tasks subcollection: projects/{PROJECT_ID}/tasks
 */
export const tasksCollection = createSubcollection<Task>({
  path: (projectId: string) => `projects/${projectId}/tasks`,
  transform: (raw): WithId<Task> => ({
    ...(raw as unknown as WithId<Task>),
    dueDate: toDate(raw.dueDate),
    createdAt: toDate(raw.createdAt) ?? new Date(),
    updatedAt: toDate(raw.updatedAt) ?? new Date(),
  }),
})(PROJECT_ID);
