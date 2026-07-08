// collections/notifications.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Notification } from '@/modules/activity/types/activity';
import { PROJECT_ID } from '@/lib/project';

/**
 * Notifications subcollection: projects/{PROJECT_ID}/notifications
 */
export const notificationsCollection = createSubcollection<Notification>({
  path: (projectId: string) => `projects/${projectId}/notifications`,
  transform: (raw): WithId<Notification> => raw as unknown as WithId<Notification>,
})(PROJECT_ID);
