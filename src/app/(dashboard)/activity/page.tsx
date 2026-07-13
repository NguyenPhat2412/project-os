'use client';

import { useState } from 'react';
import { activityCommentsCollection } from '@/modules/activity/collections/activityComments';
import { activityFeedCollection } from '@/modules/activity/collections/activityFeed';
import { notificationsCollection } from '@/modules/activity/collections/notifications';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { useDashboardReadModel } from '@/lib/api/read-models';
import { PageLoader } from '@/components/ui/page-loader';
import { ActivityPageHeader } from '@/modules/activity/components/ActivityPageHeader';
import { ActivityContent } from '@/modules/activity/components/ActivityContent';
import type { NotificationItem } from '@/modules/activity/components/NotificationsList';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import { useAuth } from '@/contexts/auth-context';

export default function ActivityPage() {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const { data, isLoading } = useBatchFetch([
    createCollectionListItem('activity', activityFeedCollection),
    createCollectionListItem('comments', activityCommentsCollection),
    createCollectionListItem('notifications', notificationsCollection),
  ]);
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardReadModel();
  const createComment = activityCommentsCollection.useCreate();

  if (isLoading || dashboardLoading) return <PageLoader />;

  const tasks = dashboard?.tasks ?? [];
  const bugs = dashboard?.bugs ?? [];
  const meetings = dashboard?.meetings ?? [];
  const stats = {
    tasksDone: tasks.filter((task) => task.status === 'done').length,
    tasksTotal: tasks.length,
    bugsOpen: bugs.filter((bug) => bug.status !== 'fixed' && bug.status !== 'wont-fix').length,
    sprintsActive: 0,
    meetingsTotal: meetings.length,
  };

  const handleSendComment = () => {
    const content = comment.trim();
    if (!content) return;
    createComment.mutate({
      targetId: 'general',
      targetType: 'discussion',
      userId: user?.uid ?? '',
      userName: user?.displayName ?? user?.email ?? 'Bạn',
      content,
      createdAt: new Date().toISOString(),
    } as never);
    setComment('');
  };

  return (
    <div>
      <ActivityPageHeader />
      <ActivityContent
        activityFeedData={(data.activity ?? []) as ActivityEntry[]}
        teamCommentsData={(data.comments ?? []) as unknown[]}
        comment={comment}
        onCommentChange={setComment}
        onSendComment={handleSendComment}
        notificationsData={(data.notifications ?? []) as NotificationItem[]}
        stats={stats}
      />
    </div>
  );
}
