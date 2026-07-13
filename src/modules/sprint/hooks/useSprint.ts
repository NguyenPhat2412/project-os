// hooks/useSprint.ts
import { useMemo } from 'react';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { WithId } from '@/lib/api-rq';

/**
 * useSprint — JIRA-style sprint hook.
 *
 * Returns all sprints sorted by order + all tasks + task columns.
 * The page is responsible for managing which sprint is "selected".
 * Convenience field `activeSprint` points to the one with status === 'active'.
 *
 * @param selectedSprintId  optional — filters sprintTasks to this sprint.
 *                          Falls back to activeSprint if omitted.
 */
export function useSprint(selectedSprintId?: string) {
  const sprintsResult = sprintsCollection.useList() as { data: WithId<Sprint>[] | undefined; isLoading: boolean };
  const tasksResult = tasksCollection.useList() as { data: WithId<Task>[] | undefined; isLoading: boolean };
  const columnsResult = taskColumnsCollection.useList() as { data: WithId<TaskColumn>[] | undefined; isLoading: boolean };

  const allSprints: WithId<Sprint>[] = useMemo(
    () => [...(sprintsResult.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sprintsResult.data],
  );

  const allTasks: WithId<Task>[] = useMemo(() => tasksResult.data ?? [], [tasksResult.data]);
  const columns: WithId<TaskColumn>[] = columnsResult.data ?? [];

  const activeSprint = useMemo(() => allSprints.find((s) => s.status === 'active') ?? null, [allSprints]);

  const effectiveSprintId = selectedSprintId ?? activeSprint?.id ?? null;

  const sprintTasks = useMemo(
    () => (effectiveSprintId ? allTasks.filter((t) => t.sprintId === effectiveSprintId) : []),
    [allTasks, effectiveSprintId],
  );

  const nextOrder = useMemo(() => {
    if (allSprints.length === 0) return 1;
    return Math.max(...allSprints.map((s) => s.order ?? 0)) + 1;
  }, [allSprints]);

  const loading = sprintsResult.isLoading || tasksResult.isLoading || columnsResult.isLoading;

  return {
    sprints: allSprints,
    activeSprint,
    sprintTasks,
    allTasks,
    columns,
    nextOrder,
    loading,
  };
}
