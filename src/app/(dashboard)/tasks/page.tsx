/* eslint-disable react-hooks/exhaustive-deps */
'use client';
/**
 * /tasks page
 * ───────────
 * Task management page with 3 views: List, Kanban, Calendar.
 * Filter bar: search + priority + status.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { KanbanView } from '@/components/ui/shared/kaban-view';
import { PageLoader } from '@/components/ui/page-loader';
import { Pagination } from '@/components/ui/pagination';
import { batchWrite } from '@/lib/api-rq';
import { createCollectionListItem, useBatchFetch } from '@/lib/api-rq/hooks/useBatchFetch';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { TaskCalendarView } from '@/modules/tasks/components/TaskCalendarView';
import { TaskDialog } from '@/modules/tasks/components/TaskDialog';
import { TaskFilterBar } from '@/modules/tasks/components/TaskFilterBar';
import { TaskPageHeader } from '@/modules/tasks/components/TaskPageHeader';
import { TaskStatsPanel } from '@/modules/tasks/components/TaskStatsPanel';
import { TaskTable } from '@/modules/tasks/components/TaskTable';
import { TaskViewSheet } from '@/modules/tasks/components/TaskViewSheet';
import { DEFAULT_TASK_COLUMNS, resolveTaskColumns } from '@/modules/tasks/utils/taskColumns';
import { membersCollection } from '@/modules/team/collections/members';
import { teamCollection } from '@/modules/team/collections/team';

import type { Task, Priority, TaskColumn } from '@/modules/tasks/types/task';
import type { TeamMember, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';

type ViewMode = 'list' | 'kanban' | 'calendar';

const ALL = 'all' as const;

export default function TasksPage() {
  // Batch fetch all data in parallel - much faster than multiple useList() calls
  const {
    data,
    isLoading,
    refetch: _refetch,
  } = useBatchFetch([
    createCollectionListItem('tasks', tasksCollection),
    createCollectionListItem('taskColumns', taskColumnsCollection),
    createCollectionListItem('teamMembers', teamCollection),
    createCollectionListItem('rootMembers', membersCollection),
    createCollectionListItem('sprints', sprintsCollection),
  ]);
  const loading = isLoading;

  // Optimistic task updates — merged with batch data, no refetch needed
  const [optimisticTasks, setOptimisticTasks] = useState<Record<string, Partial<Task>>>({});

  // Keep optimistic map in sync with server data when it changes
  const tasks = ((data.tasks ?? []) as Task[]).map((t) => ({ ...t, ...optimisticTasks[t.id] }));

  useEffect(() => {
    setOptimisticTasks({});
  }, [(data.tasks ?? []) as Task[]]);
  const taskColumnsData = (data.taskColumns ?? []) as TaskColumn[];
  const projectMemberEntries = (data.teamMembers ?? []) as unknown as (ProjectTeamMember & { id: string })[];
  const rootMembers = (data.rootMembers ?? []) as TeamMember[];
  const teamMembers = useMemo((): TeamMemberWithRole[] => {
    const map = new Map(rootMembers.map((m) => [m.id, m]));
    return projectMemberEntries
      .map((pm) => {
        const root = map.get(pm.id);
        if (!root) return null;
        return { ...root, roles: pm.roles } as TeamMemberWithRole;
      })
      .filter((m): m is TeamMemberWithRole => m !== null);
  }, [projectMemberEntries, rootMembers]);
  const sprints = ((data.sprints ?? []) as (Sprint & { id: string })[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Use default columns if no columns in database
  const taskColumns = taskColumnsData.length > 0 ? taskColumnsData : DEFAULT_TASK_COLUMNS;
  const resolvedTaskColumns = useMemo(() => resolveTaskColumns(taskColumns), [taskColumns]);
  const defaultColumnId = resolvedTaskColumns[0]?.id ?? '';

  // ── View ──────────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewMode>('list');

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | typeof ALL>(ALL);
  const [filterStatus, setFilterStatus] = useState<string | typeof ALL>(ALL);
  const [filterSprint, setFilterSprint] = useState<string | typeof ALL>(ALL);
  const [groupBy, setGroupBy] = useState('none');

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState(defaultColumnId);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [inlineUpdatingIds, setInlineUpdatingIds] = useState<Set<string>>(new Set());
  const { data: freshTaskData } = tasksCollection.useDocument(viewTask?.id ?? null, { staleTime: 0 });
  const { data: freshSelectedTaskData } = tasksCollection.useDocument(selectedTask?.id ?? null, { staleTime: 0 });

  // Mutation helpers — defined at component level (not inside handlers)
  const deleteTaskMutation = tasksCollection.useDelete();
  const updateTaskMutation = tasksCollection.useUpdate();

  // ── Inline update handler (used by TaskTable for quick field edits) ──────
  // Applies optimistic patch locally → Select reflects new value instantly, no refetch needed
  const handleInlineUpdate = useCallback(
    async (taskId: string, patch: Partial<Task>) => {
      setInlineUpdatingIds((prev) => new Set(prev).add(taskId));
      setOptimisticTasks((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...patch } }));
      try {
        await updateTaskMutation.mutateAsync({ id: taskId, data: patch });
      } finally {
        setInlineUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [updateTaskMutation],
  );

  // Track which column is updating — drives per-column spinner, not per-row
  const [updatingColumn, setUpdatingColumn] = useState<string | null>(null);

  // Wrap handler to also set the column being updated
  const handleInlineUpdateWithIndicator = useCallback(
    async (taskId: string, patch: Partial<Task>, column: string) => {
      setUpdatingColumn(column);
      await handleInlineUpdate(taskId, patch);
      setUpdatingColumn(null);
    },
    [handleInlineUpdate],
  );

  const activeFilterStatus = filterStatus !== ALL && resolvedTaskColumns.some((column) => column.id === filterStatus) ? filterStatus : ALL;
  const effectiveDefaultStatus = resolvedTaskColumns.some((column) => column.id === defaultStatus) ? defaultStatus : defaultColumnId;

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPriority !== ALL && t.priority !== filterPriority) return false;
      if (activeFilterStatus !== ALL && t.status !== activeFilterStatus) return false;
      if (filterSprint !== ALL) {
        if (filterSprint === 'none') {
          if (t.sprintId) return false;
        } else {
          if (t.sprintId !== filterSprint) return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filterPriority, activeFilterStatus, filterSprint, search]);

  // ── Client-side pagination ───────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [filterPriority, filterStatus, filterSprint, search]);

  // Slice filtered tasks for current page
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, page]);

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);

  const nextTaskIndex = useMemo(() => {
    if (tasks.length === 0) return 1;
    const maxId = Math.max(
      0,
      ...tasks.map((t) => {
        const m = t.id.match(/^TASK-(\d+)$/i);
        return m ? parseInt(m[1], 10) : 0;
      }),
    );
    return maxId + 1;
  }, [tasks]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = (status: string = defaultColumnId) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleSuccess = () => {
    _refetch();
  };

  const handleMoveTask = async (taskId: string, toStatus: string, beforeTaskId?: string) => {
    const movedTask = tasks.find((task) => task.id === taskId);
    if (!movedTask) return;

    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
    const byStatus = new Map<string, Task[]>();

    for (const column of resolvedTaskColumns) {
      byStatus.set(column.id, []);
    }

    for (const task of sortedTasks) {
      const bucket = byStatus.get(task.status);
      if (bucket) {
        bucket.push(task);
      } else {
        byStatus.set(task.status, [task]);
      }
    }

    const sourceBucket = byStatus.get(movedTask.status) ?? [];
    const targetBucket = byStatus.get(toStatus) ?? [];
    const movingTask = sourceBucket.find((task) => task.id === taskId);
    if (!movingTask) return;

    const sourceWithoutMoved = sourceBucket.filter((task) => task.id !== taskId);
    byStatus.set(movedTask.status, sourceWithoutMoved);

    const targetBase = movedTask.status === toStatus ? sourceWithoutMoved : targetBucket;
    const movedTaskNext = { ...movingTask, status: toStatus };

    if (beforeTaskId) {
      const insertIndex = targetBase.findIndex((task) => task.id === beforeTaskId);
      if (insertIndex >= 0) {
        byStatus.set(toStatus, [...targetBase.slice(0, insertIndex), movedTaskNext, ...targetBase.slice(insertIndex)]);
      } else {
        byStatus.set(toStatus, [...targetBase, movedTaskNext]);
      }
    } else {
      byStatus.set(toStatus, [...targetBase, movedTaskNext]);
    }

    if (movedTask.status === toStatus && beforeTaskId === taskId) return;

    const nextTasks: Task[] = [];
    const knownTaskIds = new Set<string>();

    for (const column of resolvedTaskColumns) {
      const bucket = byStatus.get(column.id) ?? [];
      for (const task of bucket) {
        nextTasks.push(task);
        knownTaskIds.add(task.id);
      }
    }

    const orphanTasks = sortedTasks.filter((task) => !knownTaskIds.has(task.id));
    nextTasks.push(...orphanTasks);

    const originalById = new Map(tasks.map((task) => [task.id, task]));

    const updates = nextTasks
      .map((task, order) => ({ task, order }))
      .filter(({ task, order }) => {
        const original = originalById.get(task.id);
        if (!original) return true;
        return original.status !== task.status || original.order !== order;
      })
      .map(({ task, order }) => ({
        id: task.id,
        status: task.status,
        order,
      }));

    if (updates.length === 0) return;

    const bw = batchWrite();
    updates.forEach((update) => {
      bw.update(tasksCollection.path, update.id, {
        status: update.status,
        order: update.order,
      });
    });

    await bw.commit();
    _refetch();
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;
    await deleteTaskMutation.mutateAsync(deletingTask.id);
    setDeletingTask(null);
    if (viewTask?.id === deletingTask.id) setViewTask(null);
    if (selectedTask?.id === deletingTask.id) {
      setSelectedTask(null);
      setDialogOpen(false);
    }
    _refetch();
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='space-y-4'>
      {/* ── Page Header ── */}
      <TaskPageHeader tasks={tasks} columns={resolvedTaskColumns} />

      {/* ── Stats Panel ── */}
      <TaskStatsPanel tasks={tasks as Task[]} columns={resolvedTaskColumns} />

      {/* ── Filter bar ── */}
      <TaskFilterBar
        search={search}
        onSearchChange={setSearch}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterSprint={filterSprint}
        onSprintChange={setFilterSprint}
        columns={resolvedTaskColumns}
        sprints={sprints}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        view={activeView}
        onViewChange={setActiveView}
        onCreate={() => openCreate()}
        filteredTasksCount={filteredTasks.length}
      />

      {/* ── View Content ── */}
      {activeView === 'kanban' ? (
        <KanbanView<Task>
          columns={resolvedTaskColumns}
          items={filteredTasks as Task[]}
          statusField='status'
          itemMapper={(task) => {
            const member = teamMembers.find((m) => m.id === task.assigneeId);
            return {
              tag: task.id,
              category: (() => {
                const source = `${task.title} ${task.description ?? ''}`.toLowerCase();
                if (/(ui|ux|frontend|front-end|component|page|screen|layout)/.test(source)) return 'Frontend';
                if (/(api|backend|back-end|service|database|db|query|auth|server)/.test(source)) return 'Backend';
                if (/(test|testing|qa|bug|e2e|unit test)/.test(source)) return 'Testing';
                if (/(deploy|infra|infrastructure|devops|docker|ci\/cd|pipeline|cloud)/.test(source)) return 'DevOps';
                if (/(doc|wiki|spec|tài liệu|document)/.test(source)) return 'Docs';
                if (/(design|figma|prototype)/.test(source)) return 'Design';
                return 'General';
              })(),
              title: task.title,
              priority: task.priority,
              points: task.points,
              assigneeInitials: member?.initials,
              assigneeColor: member?.gradient,
              assigneePhotoURL: member?.photoURL,
              progress: resolvedTaskColumns.find((c) => c.id === task.status)?.progress,
            };
          }}
          onItemClick={openEdit}
          onCreateItem={openCreate}
          onMoveItem={handleMoveTask}
          createItemLabel='+ Thêm task'
        />
      ) : (
        <div className='bg-card border border-border panel p-5'>
          {activeView === 'list' && (
            <>
              <TaskTable
                tasks={groupBy !== 'none' ? filteredTasks : paginatedTasks}
                columns={resolvedTaskColumns}
                teamMembers={teamMembers}
                sprints={sprints}
                groupBy={groupBy}
                onEditTask={openEdit}
                onDeleteTask={setDeletingTask}
                onViewTask={setViewTask}
                onUpdateTask={handleInlineUpdateWithIndicator}
                inlineUpdatingIds={inlineUpdatingIds}
                updatingColumn={updatingColumn}
              />
              {groupBy === 'none' && <Pagination page={page} totalPages={totalPages} total={filteredTasks.length} limit={PAGE_SIZE} onPageChange={(p) => setPage(p)} />}
            </>
          )}
          {activeView === 'calendar' && <TaskCalendarView tasks={filteredTasks} onEditTask={openEdit} />}
        </div>
      )}

      {/* ── Task Dialog — conditional render ensures clean unmount/remount ── */}
      {dialogOpen && (
        <TaskDialog
          open={dialogOpen}
          task={selectedTask ? ((freshSelectedTaskData as Task | null) ?? selectedTask) : null}
          nextTaskIndex={nextTaskIndex}
          teamMembers={teamMembers}
          statusOptions={resolvedTaskColumns}
          sprints={sprints}
          defaultStatus={effectiveDefaultStatus}
          onClose={handleDialogClose}
          onSuccess={handleSuccess}
        />
      )}
      {deletingTask && <ConfirmDialog title='Xoá task' message={`Bạn có chắc muốn xoá task "${deletingTask.title}"? Hành động này không thể hoàn tác.`} confirmLabel='Xoá task' danger onConfirm={confirmDeleteTask} onCancel={() => setDeletingTask(null)} />}
      <TaskViewSheet
        open={!!viewTask}
        task={(freshTaskData as Task | null) ?? viewTask}
        columns={resolvedTaskColumns}
        sprints={sprints}
        teamMembers={teamMembers}
        onClose={() => setViewTask(null)}
        onEdit={() => {
          if (viewTask) {
            openEdit(viewTask);
            setViewTask(null);
          }
        }}
        onDelete={() => {
          if (viewTask) setDeletingTask(viewTask);
        }}
      />
    </div>
  );
}
