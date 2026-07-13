// collections/docActivity.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

export interface DocActivity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
}

/**
 * DocActivity subcollection: projects/{ACTIVE_PROJECT_SCOPE}/doc_activity
 */
export const docActivityCollection = createSubcollection<DocActivity>({
  path: (projectId: string) => `projects/${projectId}/doc_activity`,
  transform: (raw): WithId<DocActivity> => raw as unknown as WithId<DocActivity>,
})(ACTIVE_PROJECT_SCOPE);
