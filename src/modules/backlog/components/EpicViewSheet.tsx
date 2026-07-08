'use client';
/**
 * EpicViewSheet
 * ─────────────
 * Read-only view of an Epic in a slide-in Sheet.
 */

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageBadge } from '@/components/ui/page-badge';
import { Button } from '@/components/ui/button';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { DialogHeader, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { PencilIcon } from 'lucide-react';
import { formatDateVi } from '@/lib/dayjs';
import type { EpicData, EpicStatus, UserStoryStatus } from '@/modules/backlog/types/backlog';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

type Priority = 'High' | 'Normal' | 'Low';
const storyStatusVariant: Record<UserStoryStatus, 'muted' | 'accent' | 'green' | 'red'> = {
  Todo: 'muted',
  'In Progress': 'accent',
  Done: 'green',
  Blocked: 'red',
};
const statusVariant: Record<EpicStatus, 'muted' | 'accent' | 'green' | 'yellow'> = {
  Planning: 'muted',
  'In Progress': 'accent',
  Done: 'green',
  'On Hold': 'yellow',
};

interface Props {
  open: boolean;
  epic: EpicData | null;
  onClose: () => void;
  onEdit: () => void;
}

export function EpicViewSheet({ open, epic, onClose, onEdit }: Props) {
  if (!epic) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent showCloseButton={false} side='right' className='w-[90vw] md:w-[80vw] lg:w-150 max-w-150 bg-card border-l border-border p-0 flex flex-col'>
        <DialogHeader>
          <ModalHeaderBar
            onClose={onClose}
            heading={
              <div className='flex items-center gap-2'>
                <span className='text-[20px]'>{epic.icon}</span>
                <span className='font-mono-dm text-primary text-[12px]'>{epic.id}</span>
                <span>{epic.name}</span>
              </div>
            }
            leading={null}
          />
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {/* Priority + Status */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Độ ưu tiên'>
              <PageBadge variant={TASK_PRIORITY_META[epic.priority].badgeVariant}>{epic.priority}</PageBadge>
            </Field>
            <Field label='Trạng thái'>
              <PageBadge variant={statusVariant[epic.status]}>{epic.status}</PageBadge>
            </Field>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Tổng User Stories'>
              <span className='font-mono-dm text-[20px] font-bold text-foreground'>{epic.itemCount}</span>
            </Field>
            <Field label='Story Points'>
              <span className='font-mono-dm text-[20px] font-bold text-foreground'>{epic.storyPoints} pts</span>
            </Field>
          </div>

          {/* Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Ngày bắt đầu'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{epic.startDate ? formatDateVi(epic.startDate, 'DD/MM/YYYY') : '—'}</span>
            </Field>
            <Field label='Ngày kết thúc'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>{epic.dueDate ? formatDateVi(epic.dueDate, 'DD/MM/YYYY') : '—'}</span>
            </Field>
          </div>

          {/* Description */}
          <Field label='Mô tả'>{epic.description ? <MarkdownViewer content={epic.description} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* Goals */}
          <Field label='Mục tiêu'>{epic.goals ? <MarkdownViewer content={epic.goals} /> : <span className='text-muted-foreground'>—</span>}</Field>

          {/* User Stories */}
          <Field label={`User Stories (${epic.items.length})`}>
            {epic.items.length === 0 ? (
              <p className='text-[12px] text-muted-foreground'>Chưa có user story nào.</p>
            ) : (
              <div className='space-y-2'>
                {epic.items.map((item) => (
                  <div key={item.id} className='flex items-start gap-2 p-2.5 bg-secondary border border-border panel-inner'>
                    <span className='font-mono-dm text-[12px] text-primary mt-0.5 shrink-0'>{item.id}</span>
                    <span className={`text-[12px] flex-1 ${item.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
                    <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{item.points ?? 0}pt</span>
                    <PageBadge variant={storyStatusVariant[item.status]}>{item.status}</PageBadge>
                  </div>
                ))}
              </div>
            )}
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
