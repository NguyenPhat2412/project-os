'use client';
/**
 * MeetingViewSheet
 * ────────────────
 * Read-only view of a Meeting in a slide-in Sheet.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { AttachmentList } from '@/components/ui/shared/attachment-list';
import { CommentsPanel } from '@/modules/comments/components/CommentsPanel';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';

interface Props {
  open: boolean;
  meeting: (Meeting & { id: string }) | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export function MeetingViewSheet({ open, meeting, teamMembers, onClose, onEdit, onDelete }: Props) {
  if (!meeting) return null;

  const attendees = (meeting.attendeeIds ?? [])
    .map((id) => teamMembers.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ initials: m!.initials, gradient: m!.gradient }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side='right' className='w-95 sm:max-w-95 bg-card border-l border-border p-0 flex flex-col'>
        <SheetHeader className='p-5 border-b border-border shrink-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-mono-dm text-[12px] text-muted-foreground'>{meeting.id}</span>
            {meeting.important && <PageBadge variant='accent'>Quan trọng</PageBadge>}
          </div>
          <SheetTitle className='font-sans text-[16px] font-bold text-foreground leading-snug'>{meeting.title}</SheetTitle>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          <Field label='Ngày'>
            <span className='font-mono-dm text-[20px] font-bold text-foreground'>
              {meeting.day} <span className='text-[14px] font-normal text-muted-foreground'>{meeting.month}</span>
            </span>
          </Field>

          <Field label='Thời gian'>
            <span className='text-[13px]'>{meeting.time}</span>
          </Field>

          <Field label='Địa điểm'>
            <span className='text-[13px]'>{meeting.location}</span>
          </Field>

          {attendees.length > 0 && (
            <Field label={`Người tham dự (${attendees.length})`}>
              <AvatarStack avatars={attendees} size='md' />
            </Field>
          )}

          {/* Meeting-level attachments */}
          {meeting.attachments && meeting.attachments.length > 0 && (
            <Field label={`Đính kèm cuộc họp (${meeting.attachments.length})`}>
              <AttachmentList attachments={meeting.attachments} />
            </Field>
          )}

          {/* Embedded meeting notes */}
          {meeting.notes && meeting.notes.length > 0 && (
            <Field label={`Biên bản họp (${meeting.notes.length})`}>
              <div className='space-y-4'>
                {meeting.notes.map((note) => (
                  <div key={note.id} className='bg-secondary border border-foreground/20 rounded-sm p-3'>
                    <div className='font-semibold text-[13px] mb-1'>{note.title}</div>
                    <div className='font-mono-dm text-[12px] text-muted-foreground mb-2'>
                      {note.date} · {note.author} · {note.actionCount} actions
                    </div>
                    {note.attachments && note.attachments.length > 0 && <AttachmentList attachments={note.attachments} />}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {/* Comments */}
          <div className='border-t border-border pt-5'>
            <CommentsPanel entityType='meeting' entityId={meeting.id} />
          </div>
        </div>

        <div className='p-5 border-t border-border shrink-0 flex gap-2'>
          <Button onClick={onEdit} className='flex-1 h-9'>
            Chỉnh sửa
          </Button>
          {onDelete && (
            <Button variant='outline' onClick={onDelete} className='border-border text-muted-foreground hover:border-red-500 hover:text-red-500 h-9'>
              Xoá
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] mb-1.5'>{label}</div>
      {children}
    </div>
  );
}
