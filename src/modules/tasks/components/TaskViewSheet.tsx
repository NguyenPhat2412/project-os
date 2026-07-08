'use client';
/**
 * TaskViewSheet
 * ─────────────
 * Read-only view of a Task in a slide-in Sheet.
 * Contains an "Edit" button to transition to TaskDialog.
 */

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageBadge } from '@/components/ui/page-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { AttachmentList } from '@/components/ui/shared/attachment-list';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { DialogHeader, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { Button } from '@/components/ui/button';
import { PencilIcon, SquareCheckBigIcon, Trash2Icon } from 'lucide-react';
import { formatDateVi } from '@/lib/dayjs';
import { getTaskColumnBadgeVariant, getTaskColumnLabel } from '@/modules/tasks/utils/taskColumns';
import { CommentsPanel } from '@/modules/comments/components/CommentsPanel';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

interface Props {
  open: boolean;
  task: Task | null;
  columns: TaskColumn[];
  teamMembers: TeamMember[];
  sprints?: (Sprint & { id: string })[];
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export function TaskViewSheet({ open, task, columns, teamMembers, sprints = [], onClose, onEdit, onDelete }: Props) {
  if (!task) return null;

  const sprint = sprints.find((s) => s.id === task.sprintId);
  const assignee = teamMembers.find((m) => m.id === task.assigneeId);
  const reporter = teamMembers.find((m) => m.id === task.reporterId);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent showCloseButton={false} side='right' className='w-[90vw] md:w-[80vw] lg:w-150 max-w-150 bg-card border-l border-border p-0 flex flex-col'>
        <DialogHeader>
          <ModalHeaderBar
            onClose={onClose}
            heading={
              <div className='flex items-center gap-2'>
                <SquareCheckBigIcon size={16} className='text-primary' />
                <span className='font-mono-dm text-primary'>{task.id}</span>
                <span>{task.title}</span>
              </div>
            }
            leading={null}
          />
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {/* Description */}
          <Field label='Mô tả'>{task.description ? <MarkdownViewer content={task.description} /> : <span className='text-muted-foreground'>—</span>}</Field>
          {/* Priority + Status */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Độ ưu tiên'>
              <PageBadge variant={TASK_PRIORITY_META[task.priority].badgeVariant}>{task.priority}</PageBadge>
            </Field>
            <Field label='Trạng thái'>
              <PageBadge variant={getTaskColumnBadgeVariant(task.status, columns)}>{getTaskColumnLabel(task.status, columns)}</PageBadge>
            </Field>
          </div>

          {/* Start Date + Deadline */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày bắt đầu'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{task.startDate ? formatDateVi(task.startDate, 'DD/MM/YYYY') : '—'}</span>
            </Field>
            <Field label='Ngày hết hạn'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{formatDateVi(task.deadline, 'DD/MM/YYYY')}</span>
            </Field>
          </div>

          {/* Completed At + Story Points */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày hoàn thành'>{task.completedAt ? <span className='font-mono-dm text-[12px] text-green-500'>{formatDateVi(task.completedAt, 'DD/MM/YYYY')}</span> : <span className='text-muted-foreground'>—</span>}</Field>
            <Field label='Story Points'>
              <span className='font-mono-dm text-[13px] font-bold'>{task.points !== undefined ? `${task.points} pt` : '—'}</span>
            </Field>
          </div>

          {/* Assignee + Reporter */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Người xử lý'>
              {assignee ? (
                <div className='flex items-center gap-2'>
                  <UserAvatar user={assignee} size='sm' />
                  <span className='text-[13px]'>{assignee.name}</span>
                </div>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </Field>
            <Field label='Người nhận báo cáo'>
              {reporter ? (
                <div className='flex items-center gap-2'>
                  <UserAvatar user={reporter} size='sm' />
                  <span className='text-[13px]'>{reporter.name}</span>
                </div>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </Field>
          </div>

          {/* Sprint */}
          <Field label='Sprint'>{sprint ? <span className='text-[13px] text-primary'>{sprint.name}</span> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Attachments */}
          <Field label={task.attachments?.length ? `Đính kèm (${task.attachments.length})` : 'Đính kèm'}>{task.attachments?.length ? <AttachmentList attachments={task.attachments} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Comments */}
          <div className='border-t border-border pt-5'>
            <CommentsPanel entityType='task' entityId={task.id} />
          </div>
        </div>

        <div className='sticky bottom-0 px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0'>
          {onDelete && (
            <Button variant='ghost' size='sm' onClick={onDelete} className='gap-1.5 text-[12px] text-red-500 hover:text-red-500 hover:bg-red-500/10'>
              <Trash2Icon size={13} /> Xoá
            </Button>
          )}
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
