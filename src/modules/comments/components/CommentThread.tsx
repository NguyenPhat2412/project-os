'use client';

import { CommentItem } from './CommentItem';
import type { Comment, CommentThread as CommentThreadType } from '@/modules/comments/types/comment';

interface Props {
  thread: CommentThreadType;
  currentAuthorId: string;
  onReply: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

export function CommentThread({ thread, currentAuthorId, onReply, onEdit, onDelete }: Props) {
  return (
    <div className='space-y-4'>
      <CommentItem comment={thread.comment} currentAuthorId={currentAuthorId} onReply={onReply} onEdit={onEdit} onDelete={onDelete} />

      {thread.replies.length > 0 && (
        <div className='relative space-y-4 pl-0'>
          {/* Vertical thread line */}
          <div className='absolute left-3.5 top-0 bottom-0 w-px bg-border' />
          {thread.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} currentAuthorId={currentAuthorId} isReply onReply={onReply} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
