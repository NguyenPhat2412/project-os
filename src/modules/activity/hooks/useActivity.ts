/**
 * useActivity
 * ────────────
 * Hook for Activity module using api-rq collection pattern.
 */

import { activityFeedCollection } from '@/modules/activity/collections/activityFeed';
import { notificationsCollection } from '@/modules/activity/collections/notifications';
import type { ActivityEntry, Notification } from '@/modules/activity/types/activity';
import type { WithId } from '@/lib/api-rq';

export function useActivity() {
  // ── API queries ─────────────────────────────────────────
  const { data: activityFeed = [], isLoading } = activityFeedCollection.useList();
  const { data: notifications = [] } = notificationsCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedActivityFeed = activityFeed as WithId<ActivityEntry>[];
  const typedNotifications = notifications as WithId<Notification>[];

  // ── CRUD mutations ────────────────────────────────────────────
  const createActivityEntry = activityFeedCollection.useCreate();
  const updateActivityEntry = activityFeedCollection.useUpdate();
  const deleteActivityEntry = activityFeedCollection.useDelete();

  const createNotification = notificationsCollection.useCreate();
  const updateNotification = notificationsCollection.useUpdate();
  const deleteNotification = notificationsCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    activityFeed: typedActivityFeed,
    activityComments: [], // Computed if needed
    notifications: typedNotifications,
    loading: isLoading,
    refresh,
    // CRUD
    createActivityEntry,
    updateActivityEntry,
    deleteActivityEntry,
    createNotification,
    updateNotification,
    deleteNotification,
  };
}
