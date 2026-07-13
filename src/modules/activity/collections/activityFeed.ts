// collections/activityFeed.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * ActivityFeed subcollection: projects/{ACTIVE_PROJECT_SCOPE}/activity_feed
 */
export const activityFeedCollection = createSubcollection<ActivityEntry>({
  path: (projectId: string) => `projects/${projectId}/activity_feed`,
  transform: (raw): WithId<ActivityEntry> => {
    const event = raw as unknown as WithId<ActivityEntry> & {
      resource?: string;
      resourceId?: string;
      action?: string;
      eventType?: string;
      createdAt?: string;
    };
    const resource = event.resource ?? event.eventType?.split('.')[0] ?? 'activity';
    const resourceId = event.resourceId ?? event.id;
    const action = event.action ?? event.eventType?.split('.')[1] ?? 'updated';
    const initials = resource.slice(0, 2).toUpperCase();
    return {
      id: event.id,
      avatar: { initials, color: '#6c63ff' },
      content: `<strong>${resourceId}</strong> ${action}`,
      time: event.createdAt ? new Date(event.createdAt).toLocaleString('vi-VN') : '—',
      badge: resource,
      badgeVariant: resource === 'bugs' ? 'red' : resource === 'tasks' ? 'accent' : 'muted',
    };
  },
})(ACTIVE_PROJECT_SCOPE);
