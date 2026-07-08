'use client';
import { CommentBox } from '@/components/ui/shared/comment-box';
import { CommentInput } from '@/components/ui/shared/comment-input';
import { ActivityLogTable } from '@/modules/activity/components/ActivityLogTable';
import type { ActivityEntry } from '@/modules/activity/types/activity';

interface ActivityFeedSectionProps {
  activityFeedData: ActivityEntry[];
  teamCommentsData: unknown[];
  comment: string;
  onCommentChange: (v: string) => void;
  onSendComment: () => void;
}

export function ActivityFeedSection({ activityFeedData, teamCommentsData, comment, onCommentChange, onSendComment }: ActivityFeedSectionProps) {
  return (
    <>
      <div className='bg-card border border-border panel p-5 mb-4.5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Nhật ký hoạt động</div>
        <ActivityLogTable entries={activityFeedData} />
      </div>

      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Thảo luận nhóm</div>
        {teamCommentsData.map((c: unknown) => {
          const commentItem = c as {
            id: string;
            userName?: string;
            author?: string;
            avatar?: { initials: string; color?: string };
            time?: string;
            createdAt?: string;
            content: string;
          };
          const author = commentItem.author ?? commentItem.userName ?? 'Ẩn danh';
          const time = commentItem.time ?? (commentItem.createdAt ? new Date(commentItem.createdAt).toLocaleString('vi-VN') : '');
          const avatar = commentItem.avatar ?? {
            initials:
              author
                .split(' ')
                .slice(-2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('')
                .slice(0, 2) || '?',
            color: ['#6c63ff', '#22c55e', '#f97316', '#06b6d4', '#a855f7', '#14b8a6'][author.charCodeAt(0) % 6],
          };
          return <CommentBox key={commentItem.id} author={author} avatar={avatar} time={time} content={commentItem.content} />;
        })}
        <CommentInput value={comment} onChange={onCommentChange} onSubmit={onSendComment} placeholder='Viết bình luận...' />
      </div>
    </>
  );
}
