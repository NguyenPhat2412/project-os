// collections/notifications.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { Notification } from '@/modules/activity/types/activity';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * Notifications subcollection: projects/{ACTIVE_PROJECT_SCOPE}/notifications
 */
export const notificationsCollection = createSubcollection<Notification>({
  path: (projectId: string) => `projects/${projectId}/notifications`,
  transform: (raw): WithId<Notification> => raw as unknown as WithId<Notification>,
})(ACTIVE_PROJECT_SCOPE);
