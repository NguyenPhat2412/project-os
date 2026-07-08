'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import { isTaskDoneStatus } from '@/modules/tasks/utils/taskColumns';

interface TaskPageHeaderProps {
  tasks: Task[];
  columns: TaskColumn[];
}

export function TaskPageHeader({ tasks, columns }: TaskPageHeaderProps) {
  return <PageHeader title='Quản lý công việc (Tasks)' summary={`${tasks.length} tasks · ${tasks.filter((task) => isTaskDoneStatus(task.status, columns)).length} hoàn thành`} breadcrumb={buildBreadcrumb(BREADCRUMBS.tasks)} />;
}
