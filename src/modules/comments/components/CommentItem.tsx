'use client';

import { useState } from 'react';
import { CornerDownRightIcon, PencilIcon, ReplyIcon, Trash2Icon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { formatDateVi } from '@/lib/dayjs';
import type { Comment } from '@/modules/comments/types/comment';

interface Props {
  comment: Comment;
  currentAuthorId: string;
  isReply?: boolean;
  onReply: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

export function CommentItem({ comment, currentAuthorId, isReply = false, onReply, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = comment.authorId === currentAuthorId;

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(comment.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className={`flex gap-2.5 group/comment ${isReply ? 'ml-8' : ''}`}>
      {/* Thread line for replies */}
      {isReply && (
        <div className='absolute -ml-5 mt-1 text-border'>
          <CornerDownRightIcon size={12} />
        </div>
      )}

      <Avatar initials={comment.authorInitials} gradient={comment.authorGradient} size='sm' />

      <div className='flex-1 min-w-0'>
        {/* Header */}
        <div className='flex items-center gap-2 mb-1'>
          <span className='text-[12px] font-semibold text-foreground'>{comment.authorName}</span>
          <span className='text-[12px] text-muted-foreground'>{formatDateVi(comment.createdAt, 'DD/MM/YYYY HH:mm')}</span>
          {comment.editedAt && <span className='text-[12px] text-muted-foreground italic'>(đã chỉnh sửa)</span>}
        </div>

        {/* Content */}
        <p className='text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words'>{comment.content}</p>

        {/* Action row — visible on hover */}
        <div className='flex items-center gap-2 mt-1.5 opacity-0 group-hover/comment:opacity-100 transition-opacity'>
          {!isReply && (
            <button type='button' onClick={() => onReply(comment)} className='flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors'>
              <ReplyIcon size={11} /> Trả lời
            </button>
          )}
          {isOwn && (
            <>
              <button type='button' onClick={() => onEdit(comment)} className='flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors'>
                <PencilIcon size={11} /> Sửa
              </button>
              <button type='button' onClick={handleDelete} className={`flex items-center gap-1 text-[12px] transition-colors ${confirmDelete ? 'text-red-500 font-semibold' : 'text-muted-foreground hover:text-red-500'}`}>
                <Trash2Icon size={11} />
                {confirmDelete ? 'Xác nhận xoá?' : 'Xoá'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
