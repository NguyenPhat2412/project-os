/**
 * useTeam
 * ────────
 * Hook for Team module — reads denormalized project members subcollection.
 * Workload stats are computed from real tasks + bugs data.
 */

import { useMemo } from 'react';
import { teamCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { getStatusFromWorkload } from '@/modules/team/types/team';
import type { TeamMemberWithRole, ProjectTeamMember, Member } from '@/modules/team/types/team';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { WithId } from '@/lib/firestore-rq';
import type { StatData } from '@/lib/types';

const DONE_BUG_STATUSES = new Set(['fixed', 'wont-fix']);

export function useTeam() {
  // ── Firestore queries ─────────────────────────────────────────
  const { data: _projectEntries = [], isLoading: isLoading } = teamCollection.useList();
  const { data: _globalMembers = [] } = membersCollection.useList();
  const { data: _tasks = [] } = tasksCollection.useList();
  const { data: _columns = [] } = taskColumnsCollection.useList();
  const { data: _bugs = [] } = bugsCollection.useList();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectMembers = _projectEntries as any as WithId<ProjectTeamMember>[];
  const globalMembers = _globalMembers as unknown as WithId<Member>[];
  const tasks = _tasks as unknown as WithId<Task>[];
  const columns = _columns as unknown as WithId<TaskColumn>[];
  const bugs = _bugs as unknown as WithId<Bug>[];

  // ── Build member lookup map (root member id → member data) ─────
  const memberMap = useMemo(() => new Map(globalMembers.map((m) => [m.id, m])), [globalMembers]);

  // ── Build set of "done" column IDs ────────────────────────────
  const doneColumnIds = useMemo(() => {
    const set = new Set<string>();
    for (const col of columns) {
      if (col.isDone) set.add(col.id);
    }
    return set;
  }, [columns]);

  // ── Read denormalized data + compute workload ─────────────────
  const teamMembers = useMemo((): TeamMemberWithRole[] => {
    return projectMembers
      .map((pm) => {
        const root = memberMap.get(pm.id);
        if (!root) return null;
        const activeTasks = tasks.filter(
          (t) => t.assigneeId === pm.id && !doneColumnIds.has(t.status),
        ).length;
        const activeBugs = bugs.filter(
          (b) => b.assigneeId === pm.id && !DONE_BUG_STATUSES.has(b.status),
        ).length;
        const taskCount = activeTasks + activeBugs;
        const workload = Math.min(100, Math.round((taskCount / 10) * 100));
        const status = getStatusFromWorkload(workload);

        return {
          id: root.id,
          name: root.name,
          displayName: root.displayName ?? root.name,
          email: root.email,
          initials: root.initials,
          gradient: root.gradient,
          photoURL: root.photoURL,
          roles: pm.roles,
          taskCount,
          workload,
          status,
        } as TeamMemberWithRole;
      })
      .filter(Boolean) as TeamMemberWithRole[];
  }, [projectMembers, memberMap, tasks, bugs, doneColumnIds]);

  // ── Compute teamStats ─────────────────────────────────────────
  const teamStats = useMemo((): StatData[] => {
    const active = teamMembers.filter((m) => m.status === 'Active').length;
    const overloaded = teamMembers.filter((m) => m.status === 'Overloaded').length;
    return [
      { label: 'Active', value: active, delta: '', deltaType: 'positive' as const, color: 'green' as const },
      { label: 'Overloaded', value: overloaded, delta: '', deltaType: 'negative' as const, color: 'red' as const },
      { label: 'Total', value: teamMembers.length, delta: '', deltaType: 'neutral' as const, color: 'accent' as const },
    ];
  }, [teamMembers]);

  // ── CRUD mutations ─────────────────────────────────────────────
  const setMember = teamCollection.useSet();
  const updateMember = teamCollection.useUpdate();
  const deleteMember = teamCollection.useDelete();

  return {
    teamMembers,
    teamStats,
    loading: isLoading,
    refresh: () => {},
    setMember,
    updateMember,
    deleteMember,
  };
}
