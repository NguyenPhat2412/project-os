/**
 * useTasks
 * ────────
 * Hook for Tasks module using firestore-rq collection pattern.
 */

import { useMemo } from 'react';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { teamCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import type { Priority, Task } from '@/modules/tasks/types/task';
import type { TeamMember, Member } from '@/modules/team/types/team';
import type { WithId } from '@/lib/firestore-rq';

interface UseTasksOptions {
  search?: string;
  priority?: Priority | 'all';
  status?: string | 'all';
}

export function useTasks({ search = '', priority = 'all', status = 'all' }: UseTasksOptions = {}) {
  // ── Firestore queries ─────────────────────────────────────────
  const { data: tasks = [], isLoading: tasksLoading } = tasksCollection.useList();
  const { data: projectMembers = [] } = teamCollection.useList();
  const { data: globalMembers = [] } = membersCollection.useList();
  const { data: taskColumns = [] } = taskColumnsCollection.useList();

  // ── Type assertions for filtered data ───────────────────────────
  const typedTasks = tasks as WithId<Task>[];
  // ── Build member lookup map ──────────────────────────────────────
  const memberMap = useMemo(() => new Map((globalMembers as WithId<Member>[]).map((m) => [m.id, m])), [globalMembers]);
  const typedTeamMembers = (projectMembers as WithId<{ id: string }>[])
    .map((pm) => memberMap.get(pm.id))
    .filter(Boolean) as WithId<TeamMember>[];

  // ── Filter tasks client-side (search + priority + status) ──────
  const filtered = useMemo(() => {
    return typedTasks.filter((t) => {
      if (priority !== 'all' && t.priority !== priority) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [typedTasks, search, priority, status]);

  const loading = tasksLoading;

  // ── Computed values ───────────────────────────────────────────
  const nextTaskIndex = typedTasks.length + 1;

  // ── CRUD mutations ────────────────────────────────────────────
  const createTask = tasksCollection.useCreate();
  const updateTask = tasksCollection.useUpdate();
  const deleteTask = tasksCollection.useDelete();

  // ── Refresh (refetch queries) ─────────────────────────────────
  const refresh = () => {
    // React Query sẽ tự invalidate khi mutation hoàn thành
    // Hoặc gọi refetch() từ queryClient nếu cần
  };

  return {
    tasks: filtered,
    allTasks: typedTasks,
    taskColumns,
    teamMembers: typedTeamMembers,
    loading,
    refresh,
    nextTaskIndex,
    // CRUD
    createTask,
    updateTask,
    deleteTask,
  };
}
