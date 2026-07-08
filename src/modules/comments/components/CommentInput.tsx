'use client';

import { useRef, useState, useEffect } from 'react';
import { SendIcon, XIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { Comment } from '@/modules/comments/types/comment';

interface Props {
  authorInitials: string;
  authorGradient: string;
  replyingTo?: Comment;
  editingComment?: Comment;
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

export function CommentInput({ authorInitials, authorGradient, replyingTo, editingComment, onSubmit, onCancelReply, onCancelEdit }: Props) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill content when entering edit mode
  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
      textareaRef.current?.focus();
    } else {
      setContent('');
    }
  }, [editingComment]);

  // Focus when replying
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed, replyingTo?.id);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (editingComment) onCancelEdit();
      else if (replyingTo) onCancelReply();
    }
  };

  const isEditing = !!editingComment;
  const placeholder = isEditing ? 'Chỉnh sửa bình luận...' : replyingTo ? `Trả lời ${replyingTo.authorName}...` : 'Viết bình luận... (Ctrl+Enter để gửi)';

  return (
    <div className='space-y-2'>
      {/* Reply / Edit context label */}
      {(replyingTo || isEditing) && (
        <div className='flex items-center justify-between px-3 py-1.5 bg-secondary border border-border panel-inner'>
          <span className='text-[12px] text-muted-foreground'>{isEditing ? 'Đang chỉnh sửa bình luận' : `Đang trả lời ${replyingTo!.authorName}`}</span>
          <button type='button' onClick={isEditing ? onCancelEdit : onCancelReply} className='text-muted-foreground hover:text-foreground transition-colors'>
            <XIcon size={13} />
          </button>
        </div>
      )}

      <div className='flex gap-2.5 items-start'>
        <Avatar initials={authorInitials} gradient={authorGradient} size='sm' />

        <div className='flex-1 relative'>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={submitting}
            rows={2}
            className='w-full resize-none rounded-sm border border-border bg-secondary px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors disabled:opacity-50 pr-9'
          />
          <button type='button' onClick={handleSubmit} disabled={!content.trim() || submitting} className='absolute right-2.5 bottom-2.5 text-primary hover:opacity-80 disabled:opacity-30 transition-opacity'>
            <SendIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
