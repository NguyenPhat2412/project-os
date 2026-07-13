// collections/epics.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';
// Types live in: @/modules/backlog/types/backlog
import type { Epic } from '@/modules/backlog/types/backlog';

/**
 * Epics subcollection: projects/{ACTIVE_PROJECT_SCOPE}/epics
 */
export const epicsCollection = createSubcollection<Epic>({
  path: (projectId: string) => `projects/${projectId}/epics`,
  transform: (raw): WithId<Epic> => raw as unknown as WithId<Epic>,
})(ACTIVE_PROJECT_SCOPE);
