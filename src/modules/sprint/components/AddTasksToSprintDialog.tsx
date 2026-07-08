'use client';
/**
 * AddTasksToSprintDialog
 * ───────────────────────
 * Chọn tasks từ backlog (hoặc sprint khác) để thêm vào sprint hiện tại.
 * Batch update sprintId cho tất cả tasks được chọn.
 */

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { batchWrite } from '@/lib/firestore-rq';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { Input } from '@/components/ui/input';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import type { Task } from '@/modules/tasks/types/task';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

// ── priority badge ────────────────────────────────────────────────────────────
// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  sprint: Sprint & { id: string };
  /** Tất cả tasks trong project */
  allTasks: (Task & { id: string })[];
  /** Sprints để hiện label "đang ở Sprint X" */
  sprints: (Sprint & { id: string })[];
  onClose: () => void;
  onSuccess: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function AddTasksToSprintDialog({ open, sprint, allTasks, sprints, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Tasks chưa thuộc sprint này
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTasks
      .filter((t) => t.sprintId !== sprint.id)
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      .sort((a, b) => {
        // Ưu tiên: no sprint trước, sau đó theo order
        const aHas = a.sprintId ? 1 : 0;
        const bHas = b.sprintId ? 1 : 0;
        if (aHas !== bHas) return aHas - bHas;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [allTasks, sprint.id, search]);

  const sprintById = useMemo(() => Object.fromEntries(sprints.map((s) => [s.id, s])), [sprints]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((t) => t.id)));
    }
  };

  const handleClose = () => {
    if (saving) return;
    setSearch('');
    setSelected(new Set());
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');
    try {
      const bw = batchWrite();
      for (const taskId of selected) {
        bw.update(tasksCollection.path, taskId, { sprintId: sprint.id });
      }
      await bw.commit();
      // Invalidate tasks query so useSprint/useTasks refetch automatically
      queryClient.invalidateQueries({ queryKey: tasksCollection.keys.lists() });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const allChecked = candidates.length > 0 && selected.size === candidates.length;
  const someChecked = selected.size > 0 && selected.size < candidates.length;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      size='md'
      title={`Thêm Tasks vào ${sprint.name}`}
      icon={<span className='text-[20px]'>📋</span>}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit}
      submitDisabled={selected.size === 0 || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang thêm...'
      submitLabel={selected.size > 0 ? `Thêm ${selected.size} task${selected.size > 1 ? 's' : ''}` : 'Chọn task'}
    >
      <div className='flex flex-col' style={{ maxHeight: '60vh' }}>
        {/* Search bar */}
        <div className='px-6 pt-4 pb-3 border-b border-border shrink-0'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Tìm theo tên hoặc ID...' className='pl-8 h-8 text-[12px]' autoFocus />
          </div>
        </div>

        {/* Select all row */}
        {candidates.length > 0 && (
          <div className='px-6 py-2 border-b border-border shrink-0'>
            <label className='flex items-center gap-2.5 cursor-pointer select-none'>
              <input
                type='checkbox'
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked;
                }}
                onChange={toggleAll}
                className='w-3.5 h-3.5 rounded accent-primary'
              />
              <span className='text-[12px] text-muted-foreground font-mono-dm uppercase tracking-wider'>{allChecked ? 'Bỏ chọn tất cả' : `Chọn tất cả (${candidates.length})`}</span>
            </label>
          </div>
        )}

        {/* Task list */}
        <div className='overflow-y-auto flex-1 px-6 py-3 space-y-1'>
          {candidates.length === 0 && <div className='py-10 text-center text-muted-foreground text-[13px]'>{search ? 'Không tìm thấy task nào.' : 'Tất cả tasks đã thuộc sprint này.'}</div>}

          {/* Group: No sprint */}
          {(() => {
            const noSprint = candidates.filter((t) => !t.sprintId);
            if (noSprint.length === 0) return null;
            return (
              <div>
                <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] py-1.5'>Backlog ({noSprint.length})</div>
                {noSprint.map((t) => (
                  <TaskRow key={t.id} task={t} checked={selected.has(t.id)} onToggle={() => toggle(t.id)} sprintLabel={null} />
                ))}
              </div>
            );
          })()}

          {/* Group: In other sprints */}
          {(() => {
            const inOther = candidates.filter((t) => t.sprintId);
            if (inOther.length === 0) return null;
            return (
              <div className='mt-2'>
                <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] py-1.5'>Trong sprint khác ({inOther.length})</div>
                {inOther.map((t) => (
                  <TaskRow key={t.id} task={t} checked={selected.has(t.id)} onToggle={() => toggle(t.id)} sprintLabel={t.sprintId ? (sprintById[t.sprintId]?.name ?? t.sprintId) : null} />
                ))}
              </div>
            );
          })()}
        </div>

        {/* Error */}
        {error && <div className='mx-6 mb-3 bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive shrink-0'>{error}</div>}
      </div>
    </ModalShell>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, checked, onToggle, sprintLabel }: { task: Task & { id: string }; checked: boolean; onToggle: () => void; sprintLabel: string | null }) {
  return (
    <label className={['flex items-start gap-3 px-3 py-2.5 rounded-sm cursor-pointer select-none transition-colors', checked ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-secondary'].join(' ')}>
      <input type='checkbox' checked={checked} onChange={onToggle} className='mt-0.5 w-3.5 h-3.5 rounded shrink-0 accent-primary' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='font-mono-dm text-[12px] text-muted-foreground'>{task.id}</span>
          <span className={`px-1.5 py-0.5 rounded text-[12px] font-medium ${TASK_PRIORITY_META[task.priority].softClass}`}>{task.priority}</span>
          {sprintLabel && <span className='px-1.5 py-0.5 rounded text-[12px] bg-secondary text-muted-foreground font-mono-dm'>{sprintLabel}</span>}
        </div>
        <div className='text-[13px] text-foreground mt-0.5 leading-snug truncate'>{task.title}</div>
      </div>
      {task.points !== undefined && <span className='text-[12px] text-muted-foreground font-mono-dm shrink-0 mt-0.5'>{task.points}pt</span>}
    </label>
  );
}
