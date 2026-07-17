import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { DEFAULT_TASK_COLUMNS } from '@/modules/tasks/utils/taskColumns';

import type { Attachment } from '@/lib/types/attachment';
import type { Priority, TaskColumn } from '@/modules/tasks/types/task';

export type TaskDialogTask = {
  id: string;
  uuid?: string;
  title: string;
  priority: Priority;
  status: string;
  description?: string;
  deadline?: string;
  startDate?: string;
  completedAt?: string;
  points?: number;
  assigneeId?: string;
  reporterId?: string;
  sprintId?: string;
  attachments?: Attachment[];
};

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  priority: z.enum(['High', 'Normal', 'Low'] as const),
  status: z.string().trim().min(1, 'Trạng thái không được để trống'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  completedAt: z.string().optional(),
  points: z.string().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  sprintId: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export function useTaskForm({ open, task, statusOptions, defaultStatus, defaultSprintId }: { open: boolean; task: TaskDialogTask | null; statusOptions: TaskColumn[]; defaultStatus: string; defaultSprintId?: string }) {
  const resolvedStatusOptions = statusOptions.length > 0 ? statusOptions : DEFAULT_TASK_COLUMNS;
  const initialValues = useMemo<TaskFormValues>(() => {
    const status = task?.status || (resolvedStatusOptions.some((option) => option.id === defaultStatus) ? defaultStatus : resolvedStatusOptions[0]?.id ?? '');
    return {
      title: task?.title ?? '',
      priority: task?.priority ?? 'Normal',
      status,
      description: task?.description ?? '',
      deadline: task?.deadline ?? '',
      startDate: task?.startDate ?? '',
      completedAt: task?.completedAt ?? '',
      points: task?.points !== undefined ? String(task.points) : '',
      assigneeId: task?.assigneeId ?? '',
      reporterId: task?.reporterId ?? '',
      sprintId: task?.sprintId ?? defaultSprintId ?? '',
    };
  }, [defaultSprintId, defaultStatus, resolvedStatusOptions, task]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) form.reset(initialValues);
  }, [form, initialValues, open]);

  return { ...form, resolvedStatusOptions };
}
