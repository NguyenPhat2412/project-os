'use client';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { AttachmentList } from '@/components/ui/shared/attachment-list';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { DialogHeader, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { formatDateVi } from '@/lib/dayjs';
import { BugIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { CommentsPanel } from '@/modules/comments/components/CommentsPanel';
import type { Bug, BugSeverity, BugStatus } from '@/modules/bugs/types/bug';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { BUG_SEVERITY_META } from '@/lib/constants/work-item-colors';

type BugWithId = Bug & { id: string };

const severityVariant: Record<BugSeverity, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Critical: BUG_SEVERITY_META.Critical.badgeVariant,
  High: BUG_SEVERITY_META.High.badgeVariant,
  Medium: BUG_SEVERITY_META.Medium.badgeVariant,
  Low: BUG_SEVERITY_META.Low.badgeVariant,
};
const statusVariant: Record<BugStatus, 'red' | 'accent' | 'yellow' | 'green' | 'muted'> = {
  open: 'red',
  'in-progress': 'accent',
  'in-review': 'yellow',
  fixed: 'green',
  'wont-fix': 'muted',
};

interface Field {
  label: string;
  children: React.ReactNode;
}
function Field({ label, children }: Field) {
  return (
    <div>
      <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] mb-1.5'>{label}</div>
      {children}
    </div>
  );
}

interface Props {
  open: boolean;
  bug: BugWithId | null;
  teamMembers: TeamMember[];
  sprints: (Sprint & { id: string })[];
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export function BugViewSheet({ open, bug, teamMembers, sprints, onClose, onEdit, onDelete }: Props) {
  if (!bug) return null;
  const member = teamMembers.find((m) => m.id === bug.assigneeId);
  const reporter = teamMembers.find((m) => m.id === bug.reporterId);
  const sprint = sprints.find((s) => s.id === bug.sprintId);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent showCloseButton={false} className='w-[90vw] md:w-[80vw] lg:w-150 max-w-150 bg-card border-l border-border p-0 flex flex-col'>
        <DialogHeader>
          <ModalHeaderBar
            onClose={onClose}
            heading={
              <div className='flex items-center gap-2'>
                <BugIcon size={16} className='text-red-500' />
                <span className='font-mono-dm text-red-500'>{bug.id}</span>
                <span>{bug.title}</span>
              </div>
            }
            leading={null}
          />
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {/* Description */}
          <Field label='Mô tả'>{bug.description ? <MarkdownViewer content={bug.description} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Steps to Reproduce */}
          <Field label='Các bước tái hiện'>
            {bug.stepsToReproduce ? (
              <div className='space-y-1'>
                {bug.stepsToReproduce
                  .split('\n')
                  .filter((l) => l.trim())
                  .map((line, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <span className='w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-muted-foreground select-none'>{i + 1}</span>
                      <div className='flex-1 h-8 flex items-center bg-secondary border border-border rounded-sm px-2.5'>
                        <span className='text-[13px] text-foreground'>{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </Field>
          {/* Severity + Status */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Mức độ'>
              <PageBadge variant={severityVariant[bug.severity]}>{bug.severity}</PageBadge>
            </Field>
            <Field label='Trạng thái'>
              <PageBadge variant={statusVariant[bug.status]}>{bug.status}</PageBadge>
            </Field>
          </div>
          {/* Start Date + Deadline */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày bắt đầu'>{bug.startDate ? formatDateVi(bug.startDate, 'DD/MM/YYYY') : <span className='text-muted-foreground'>—</span>}</Field>
            <Field label='Ngày hết hạn'>{bug.deadline ? formatDateVi(bug.deadline, 'DD/MM/YYYY') : <span className='text-muted-foreground'>—</span>}</Field>
          </div>

          {/* Completed At + Reported At */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày hoàn thành'>{bug.completedAt ? <span className='text-green-500'>{formatDateVi(bug.completedAt, 'DD/MM/YYYY')}</span> : <span className='text-muted-foreground'>—</span>}</Field>
            <Field label='Ngày phát hiện'>{bug.reportedAt ? formatDateVi(bug.reportedAt, 'DD/MM/YYYY') : <span className='text-muted-foreground'>—</span>}</Field>
          </div>

          {/* Resolved At */}
          <Field label='Ngày fix xong'>{bug.resolvedAt ? formatDateVi(bug.resolvedAt, 'DD/MM/YYYY') : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Assignee + Reporter */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Người xử lý'>
              {member ? (
                <div className='flex items-center gap-2'>
                  <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
                  <span>{member.name}</span>
                </div>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </Field>
            <Field label='Người nhận báo cáo'>
              {reporter ? (
                <div className='flex items-center gap-2'>
                  <Avatar initials={reporter.initials} gradient={reporter.gradient} size='sm' />
                  <span>{reporter.name}</span>
                </div>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </Field>
          </div>

          {/* Sprint */}
          <Field label='Sprint'>{sprint ? <span className='text-primary'>{sprint.name}</span> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Attachments */}
          <Field label={bug.attachments?.length ? `Đính kèm (${bug.attachments.length})` : 'Đính kèm'}>{bug.attachments?.length ? <AttachmentList attachments={bug.attachments} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Comments */}
          <div className='border-t border-border pt-5'>
            <CommentsPanel entityType='bug' entityId={bug.id} />
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
