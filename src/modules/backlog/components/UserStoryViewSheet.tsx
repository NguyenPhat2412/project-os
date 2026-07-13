'use client';
/**
 * UserStoryViewSheet
 * ──────────────────
 * Read-only view of a User Story in a slide-in Sheet.
 */

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { DialogHeader, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { PencilIcon } from 'lucide-react';
import { formatDateVi } from '@/lib/dayjs';
import type { EpicData, EpicItem, UserStoryStatus } from '@/modules/backlog/types/backlog';
import type { TeamMember } from '@/modules/team/types/team';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

const statusVariant: Record<UserStoryStatus, 'muted' | 'accent' | 'green' | 'red'> = {
  Todo: 'muted',
  'In Progress': 'accent',
  Done: 'green',
  Blocked: 'red',
};

interface Props {
  open: boolean;
  epic: EpicData | null;
  story: EpicItem | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onEdit: () => void;
}

export function UserStoryViewSheet({ open, epic, story, teamMembers, onClose, onEdit }: Props) {
  if (!epic || !story) return null;
  const assignee = teamMembers.find((m) => m.id === story.assigneeId);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent showCloseButton={false} side='right' className='w-[90vw] md:w-[80vw] lg:w-150 max-w-150 bg-card border-l border-border p-0 flex flex-col'>
        <DialogHeader>
          <ModalHeaderBar
            onClose={onClose}
            heading={
              <div className='flex items-center gap-2'>
                <span className='text-[20px]'>{epic.icon}</span>
                <span className='font-mono-dm text-primary text-[12px]'>{story.id}</span>
                <span>{story.label}</span>
              </div>
            }
            leading={null}
          />
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {/* Priority + Status */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Độ ưu tiên'>
              <PageBadge variant={TASK_PRIORITY_META[story.priority].badgeVariant}>{story.priority}</PageBadge>
            </Field>
            <Field label='Trạng thái'>
              <PageBadge variant={statusVariant[story.status]}>{story.status}</PageBadge>
            </Field>
          </div>

          {/* Story Points */}
          <Field label='Story Points'>
            <span className='font-mono-dm text-[20px] font-bold text-foreground'>{story.points ?? 0} pt</span>
          </Field>

          {/* Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày bắt đầu'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{story.startDate ? formatDateVi(story.startDate, 'DD/MM/YYYY') : '—'}</span>
            </Field>
            <Field label='Ngày kết thúc'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{story.dueDate ? formatDateVi(story.dueDate, 'DD/MM/YYYY') : '—'}</span>
            </Field>
          </div>

          {/* Assignee */}
          <Field label='Người xử lý'>
            {assignee ? (
              <div className='flex items-center gap-2'>
                <Avatar initials={assignee.initials} gradient={assignee.gradient} size='sm' />
                <span className='text-[13px]'>{assignee.name}</span>
              </div>
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </Field>

          {/* Description */}
          <Field label='Mô tả'>{story.description ? <MarkdownViewer content={story.description} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Acceptance Criteria */}
          <Field label='Tiêu chí chấp nhận'>{story.goals ? <MarkdownViewer content={story.goals} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Parent Epic */}
          <Field label='Thuộc Epic'>
            <div className='flex items-center gap-2 p-2.5 bg-secondary rounded-sm'>
              <span className='text-[16px]'>{epic.icon}</span>
              <div>
                <div className='text-[13px] font-semibold'>{epic.name}</div>
                <div className='font-mono-dm text-[12px] text-muted-foreground'>{epic.id}</div>
              </div>
            </div>
          </Field>
        </div>

        <div className='sticky bottom-0 px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0'>
          <Button size='sm' onClick={onEdit} className='gap-1.5 text-[12px]'>
            <PencilIcon size={13} /> Chỉnh sửa
          </Button>
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
