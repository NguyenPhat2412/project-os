'use client';
import { NotificationsList } from '@/modules/activity/components/NotificationsList';
import { ActivityFeedSection } from '@/modules/activity/components/ActivityFeedSection';
import { ActivityStatsPanel } from '@/modules/activity/components/ActivityStatsPanel';
import type { NotificationItem } from '@/modules/activity/components/NotificationsList';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import type { ActivityStatsProps } from '@/modules/activity/components/ActivityStatsPanel';

interface ActivityContentProps {
  activityFeedData: ActivityEntry[];
  teamCommentsData: unknown[];
  comment: string;
  onCommentChange: (v: string) => void;
  onSendComment: () => void;
  notificationsData: NotificationItem[];
  stats: ActivityStatsProps;
}

export function ActivityContent({
  activityFeedData,
  teamCommentsData,
  comment,
  onCommentChange,
  onSendComment,
  notificationsData,
  stats,
}: ActivityContentProps) {
  return (
    <>
      <ActivityStatsPanel {...stats} />
      <div className='grid grid-cols-[2fr_1fr] max-lg:grid-cols-1 gap-4.5'>
        <ActivityFeedSection
          activityFeedData={activityFeedData}
          teamCommentsData={teamCommentsData}
          comment={comment}
          onCommentChange={onCommentChange}
          onSendComment={onSendComment}
        />
        <NotificationsList notifications={notificationsData} />
      </div>
    </>
  );
}
