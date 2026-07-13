// collections/epics.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { ACTIVE_PROJECT_ID } from '@/lib/project';
// Types live in: @/modules/backlog/types/backlog
import type { Epic } from '@/modules/backlog/types/backlog';

/**
 * Epics subcollection: projects/{ACTIVE_PROJECT_ID}/epics
 */
export const epicsCollection = createSubcollection<Epic>({
  path: (projectId: string) => `projects/${projectId}/epics`,
  transform: (raw): WithId<Epic> => raw as unknown as WithId<Epic>,
})(ACTIVE_PROJECT_ID);
