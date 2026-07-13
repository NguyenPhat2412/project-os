// collections/actionItems.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

export interface ActionItem {
  id: string;
  label: string;
  assignee?: string;
  done: boolean;
}

/**
 * ActionItems subcollection: projects/{ACTIVE_PROJECT_SCOPE}/action_items
 */
export const actionItemsCollection = createSubcollection<ActionItem>({
  path: (projectId: string) => `projects/${projectId}/action_items`,
  transform: (raw): WithId<ActionItem> => raw as unknown as WithId<ActionItem>,
})(ACTIVE_PROJECT_SCOPE);
