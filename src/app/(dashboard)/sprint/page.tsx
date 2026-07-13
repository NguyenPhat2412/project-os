'use client';
/**
 * /sprint page — JIRA-style sprint board
 * ──────────────────────────────────────
 * - Sprint tabs (planned / active / completed) with switcher
 * - Sprint header: name, dates, goal, task progress
 * - Sprint actions: Add sprint, Edit sprint, Start / Complete sprint
 * - Kanban board: uses generic KanbanView (shared with /tasks) for drag-drop consistency
 */

import { useState, useMemo } from 'react';
import { BugIcon, CheckSquareIcon, PlusIcon } from 'lucide-react';
import { KanbanView } from '@/components/ui/shared/kaban-view';
import { SprintDialog } from '@/modules/sprint/components/SprintDialog';
import { AddTasksToSprintDialog } from '@/modules/sprint/components/AddTasksToSprintDialog';
import { SprintSelectorBar } from '@/modules/sprint/components/SprintSelectorBar';
import { SprintHeader } from '@/modules/sprint/components/SprintHeader';
import { SprintPageHeader } from '@/modules/sprint/components/SprintPageHeader';
import { PageLoader } from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { teamCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { useBatchFetch, createCollectionListItem } from '@/lib/api-rq/hooks/useBatchFetch';
import { resolveTaskColumns } from '@/modules/tasks/utils/taskColumns';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { Bug, BugStatus } from '@/modules/bugs/types/bug';
import type { Priority } from '@/components/ui/shared/kaban-view/types';
import type { TeamMember, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { WithId } from '@/lib/api-rq';

export default function SprintPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<(Sprint & { id: string }) | null>(null);
  const [addTasksOpen, setAddTasksOpen] = useState(false);

  // ── Batch fetch: sprints + taskColumns + teamMembers + tasks + bugs ─────────
  const { data, isLoading, refetch } = useBatchFetch([
    createCollectionListItem('sprints', sprintsCollection),
    createCollectionListItem('taskColumns', taskColumnsCollection),
    createCollectionListItem('teamMembers', teamCollection),
    createCollectionListItem('rootMembers', membersCollection),
    createCollectionListItem('tasks', tasksCollection),
    createCollectionListItem('bugs', bugsCollection),
  ]);

  const sprints = ((data.sprints ?? []) as (Sprint & { id: string })[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const projectMemberEntries = useMemo(
    () => (data.teamMembers ?? []) as unknown as (ProjectTeamMember & { id: string })[],
    [data.teamMembers],
  );
  const rootMembers = useMemo(() => (data.rootMembers ?? []) as TeamMember[], [data.rootMembers]);
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
  const allTasks = (data.tasks ?? []) as (Task & { id: string })[];
  const allBugs = (data.bugs ?? []) as (Bug & { id: string })[];
  const taskColumns = (data.taskColumns ?? []) as TaskColumn[];

  const viewedSprint: WithId<Sprint> | null = sprints.find((s) => s.id === selectedId) ?? sprints.find((s) => s.status === 'active') ?? sprints[0] ?? null;
  const viewedTasks = viewedSprint ? allTasks.filter((t) => t.sprintId === viewedSprint.id) : [];
  const viewedBugs = viewedSprint ? allBugs.filter((b) => b.sprintId === viewedSprint.id) : [];

  const resolvedColumns = resolveTaskColumns(taskColumns);
  const updateSprint = sprintsCollection.useUpdate();

  // ── Sprint progress ────────────────────────────────────────────────────────
  const doneCol = resolvedColumns.find((c) => c.isDone);
  const doneTasks = viewedTasks.filter((t) => (doneCol ? t.status === doneCol.id : t.status === 'done'));
  const pct = viewedTasks.length > 0 ? Math.round((doneTasks.length / viewedTasks.length) * 100) : 0;

  // ── Kanban: combined items (tasks + bugs) ─────────────────────────────────
  const sprintItems = [...viewedTasks.map((t) => ({ ...t, _type: 'task' as const })), ...viewedBugs.map((b) => ({ ...b, _type: 'bug' as const }))];

  const itemMapper = (item: (typeof sprintItems)[number]) => {
    const member = teamMembers.find((m) => m.id === item.assigneeId);
    if (item._type === 'bug') {
      return {
        tag: item.id,
        category: item.severity,
        title: item.title,
        priority: (item.severity === 'Critical' || item.severity === 'High' ? 'High' : item.severity === 'Medium' ? 'Normal' : 'Low') as Priority,
        points: undefined,
        assigneeInitials: member?.initials,
        assigneeColor: member?.gradient,
        assigneePhotoURL: member?.photoURL,
        faded: item.status === 'fixed' || item.status === 'wont-fix',
        itemTypeIcon: <BugIcon size={11} />,
      };
    }
    return {
      tag: item.id,
      category: '',
      title: item.title,
      priority: item.priority,
      points: item.points,
      assigneeInitials: member?.initials,
      assigneeColor: member?.gradient,
      assigneePhotoURL: member?.photoURL,
      itemTypeIcon: <CheckSquareIcon size={11} />,
    };
  };

  // ── Kanban move item ──────────────────────────────────────────────────────
  const handleMoveItem = async (itemId: string, toStatus: string) => {
    const task = allTasks.find((t) => t.id === itemId);
    const bug = allBugs.find((b) => b.id === itemId);
    if (task) {
      await tasksCollection.helpers.update(itemId, { status: toStatus });
    } else if (bug) {
      const updates: Record<string, unknown> = { status: toStatus as BugStatus, sprintId: viewedSprint!.id };
      if (toStatus === 'fixed' && !bug.resolvedAt) {
        updates.resolvedAt = new Date().toISOString().slice(0, 10);
      }
      await bugsCollection.helpers.update(itemId, updates as Parameters<typeof bugsCollection.helpers.update>[1]);
    }
    refetch();
  };

  // ── Sprint status transitions ──────────────────────────────────────────────
  const handleStartSprint = () => {
    if (viewedSprint) updateSprint.mutate({ id: viewedSprint.id, data: { status: 'active' } as never });
  };
  const handleCompleteSprint = () => {
    if (viewedSprint) updateSprint.mutate({ id: viewedSprint.id, data: { status: 'completed' } as never });
  };
  const transitioning = updateSprint.isPending;

  // ── Dialog handlers ─────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingSprint(null);
    setDialogOpen(true);
  };
  const openEditSprint = (sprint: WithId<Sprint>) => {
    setEditingSprint(sprint as Sprint & { id: string });
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSprint(null);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* ── Sprint selector bar ── */}
      <SprintPageHeader />
      <SprintSelectorBar sprints={sprints} selectedId={viewedSprint?.id ?? null} onSelect={setSelectedId} onCreate={openCreate} />

      {/* ── No sprints empty state ── */}
      {sprints.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground'>
          <span className='text-4xl'>🏁</span>
          <p className='font-sans text-[15px]'>Chưa có sprint nào.</p>
          <Button onClick={openCreate} className='text-[13px] font-semibold'>
            <PlusIcon />
            Tạo Sprint đầu tiên
          </Button>
        </div>
      )}

      {/* ── Sprint detail ── */}
      {viewedSprint && (
        <>
          <SprintHeader
            sprint={viewedSprint as Sprint & { id: string }}
            taskCount={viewedTasks.length}
            doneCount={doneTasks.length}
            bugCount={viewedBugs.length}
            progressPct={pct}
            onStart={handleStartSprint}
            onComplete={handleCompleteSprint}
            onAddTasks={() => setAddTasksOpen(true)}
            onEdit={() => openEditSprint(viewedSprint)}
            transitioning={transitioning}
          />

          {/* Kanban board */}
          <KanbanView
            columns={resolvedColumns}
            items={sprintItems}
            statusField='status'
            itemMapper={itemMapper}
            onItemClick={() => {}}
            onCreateItem={() => setAddTasksOpen(true)}
            onMoveItem={handleMoveItem}
            createItemLabel='+ Thêm task'
            columnEditable={false}
          />
        </>
      )}

      {/* ── Sprint dialog ── */}
      <SprintDialog open={dialogOpen} sprint={editingSprint} nextOrder={sprints.length} onClose={handleDialogClose} onSuccess={handleDialogClose} />

      {/* ── Add Tasks to Sprint dialog ── */}
      {viewedSprint && addTasksOpen && (
        <AddTasksToSprintDialog
          open={addTasksOpen}
          sprint={viewedSprint as Sprint & { id: string }}
          allTasks={allTasks}
          sprints={sprints}
          onClose={() => setAddTasksOpen(false)}
          onSuccess={() => {
            setAddTasksOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
