'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { ganttPhasesCollection, type GanttPhase } from '@/modules/timeline/collections/ganttPhases';

type TimelinePhase = GanttPhase & { id: string };

const COLOR_OPTIONS = [
  { value: 'accent', label: 'Xanh dương', className: 'bg-blue-500' },
  { value: 'success', label: 'Xanh lá', className: 'bg-emerald-500' },
  { value: 'warning', label: 'Cam', className: 'bg-amber-500' },
  { value: 'danger', label: 'Đỏ', className: 'bg-red-500' },
  { value: 'purple', label: 'Tím', className: 'bg-violet-500' },
] as const;

function colorClass(color: string) {
  return COLOR_OPTIONS.find((option) => option.value === color)?.className ?? 'bg-blue-500';
}

interface PhaseDialogProps {
  phase: TimelinePhase | null;
  onClose: () => void;
}

function PhaseDialog({ phase, onClose }: PhaseDialogProps) {
  const [rowLabel, setRowLabel] = useState(phase?.rowLabel ?? 'Dự án');
  const [label, setLabel] = useState(phase?.label ?? '');
  const [leftPercent, setLeftPercent] = useState(phase?.leftPercent ?? 0);
  const [widthPercent, setWidthPercent] = useState(phase?.widthPercent ?? 25);
  const [color, setColor] = useState(phase?.color ?? 'accent');
  const [apiError, setApiError] = useState('');

  const createPhase = ganttPhasesCollection.useCreate();
  const updatePhase = ganttPhasesCollection.useUpdate();
  const saving = createPhase.isPending || updatePhase.isPending;
  const isValid = rowLabel.trim().length > 0 && label.trim().length > 0 && leftPercent >= 0 && leftPercent <= 100 && widthPercent > 0 && leftPercent + widthPercent <= 100;

  const submit = async () => {
    if (!isValid || saving) return;
    setApiError('');
    const payload: GanttPhase = {
      rowLabel: rowLabel.trim(),
      label: label.trim(),
      leftPercent,
      widthPercent,
      color,
    };
    try {
      if (phase) {
        await updatePhase.mutateAsync({ id: phase.id, data: payload });
      } else {
        await createPhase.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không thể lưu giai đoạn.');
    }
  };

  return (
    <ModalShell
      open
      size='sm'
      title={phase ? 'Chỉnh sửa giai đoạn' : 'Thêm giai đoạn dự án'}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={submit}
      submitLabel={phase ? 'Lưu thay đổi' : 'Thêm giai đoạn'}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitDisabled={!isValid || saving}
      cancelDisabled={saving}
      closeDisabled={saving}
    >
      <div className='space-y-4 px-6 py-5'>
        <div className='space-y-1.5'>
          <Label htmlFor='phase-label'>Tên giai đoạn</Label>
          <input id='phase-label' value={label} onChange={(event) => setLabel(event.target.value)} disabled={saving} placeholder='Ví dụ: Phân tích và thiết kế' className='h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm outline-none focus:border-primary' />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='phase-row-label'>Nhóm hiển thị</Label>
          <input id='phase-row-label' value={rowLabel} onChange={(event) => setRowLabel(event.target.value)} disabled={saving} placeholder='Dự án' className='h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm outline-none focus:border-primary' />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='phase-left'>Bắt đầu (%)</Label>
            <input id='phase-left' type='number' min={0} max={100} value={leftPercent} onChange={(event) => setLeftPercent(Number(event.target.value))} disabled={saving} className='h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm outline-none focus:border-primary' />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='phase-width'>Độ dài (%)</Label>
            <input id='phase-width' type='number' min={1} max={100} value={widthPercent} onChange={(event) => setWidthPercent(Number(event.target.value))} disabled={saving} className='h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm outline-none focus:border-primary' />
          </div>
        </div>
        {leftPercent + widthPercent > 100 ? <p className='text-xs text-destructive'>Điểm kết thúc không được vượt quá 100%.</p> : null}
        <div className='space-y-1.5'>
          <Label htmlFor='phase-color'>Màu hiển thị</Label>
          <select id='phase-color' value={color} onChange={(event) => setColor(event.target.value)} disabled={saving} className='h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm outline-none focus:border-primary'>
            {COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {apiError ? <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive'>{apiError}</div> : null}
      </div>
    </ModalShell>
  );
}

interface TimelinePhasesSectionProps {
  phases: TimelinePhase[];
}

export function TimelinePhasesSection({ phases }: TimelinePhasesSectionProps) {
  const [editingPhase, setEditingPhase] = useState<TimelinePhase | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TimelinePhase | null>(null);
  const deletePhase = ganttPhasesCollection.useDelete();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePhase.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <section className='mb-6 rounded-lg border border-border bg-card'>
      <div className='flex items-center justify-between border-b border-border px-4 py-3'>
        <div>
          <h2 className='text-sm font-semibold text-foreground'>Giai đoạn dự án</h2>
          <p className='mt-0.5 text-xs text-muted-foreground'>Dữ liệu Timeline do Operations service quản lý.</p>
        </div>
        <Button size='sm' onClick={() => setEditingPhase(null)}>
          <PlusIcon /> Thêm giai đoạn
        </Button>
      </div>

      {phases.length === 0 ? (
        <div className='px-4 py-8 text-center text-sm text-muted-foreground'>Chưa có giai đoạn dự án.</div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-4 py-2.5 font-medium'>Giai đoạn</th>
                <th className='px-4 py-2.5 font-medium'>Nhóm</th>
                <th className='px-4 py-2.5 font-medium'>Tiến trình</th>
                <th className='px-4 py-2.5 text-right font-medium'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {phases.map((phase) => (
                <tr key={phase.id}>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2 font-medium text-foreground'>
                      <span className={`size-2.5 rounded-full ${colorClass(phase.color)}`} />
                      {phase.label}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>{phase.rowLabel}</td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {phase.leftPercent}% → {phase.leftPercent + phase.widthPercent}%
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex justify-end gap-1'>
                      <Button variant='ghost' size='icon-sm' aria-label={`Chỉnh sửa ${phase.label}`} onClick={() => setEditingPhase(phase)}>
                        <PencilIcon />
                      </Button>
                      <Button variant='ghost' size='icon-sm' aria-label={`Xóa ${phase.label}`} className='text-destructive hover:text-destructive' onClick={() => setDeleteTarget(phase)}>
                        <Trash2Icon />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPhase !== undefined ? <PhaseDialog key={editingPhase?.id ?? 'new'} phase={editingPhase} onClose={() => setEditingPhase(undefined)} /> : null}
      {deleteTarget ? <ConfirmDialog danger title='Xóa giai đoạn' message={`Bạn có chắc muốn xóa “${deleteTarget.label}”?`} confirmLabel='Xóa' onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}
    </section>
  );
}
