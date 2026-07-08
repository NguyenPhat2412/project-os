'use client';
import { useMemo, useState } from 'react';
import dayjs from '@/lib/dayjs';
import { activityCommentsCollection } from '@/modules/activity/collections/activityComments';
import { notificationsCollection } from '@/modules/activity/collections/notifications';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import { meetingsCollection } from '@/modules/meetings/collections/meetings';
import { teamCollection } from '@/modules/team/collections/team';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { PageLoader } from '@/components/ui/page-loader';
import { ActivityPageHeader } from '@/modules/activity/components/ActivityPageHeader';
import { ActivityContent } from '@/modules/activity/components/ActivityContent';
import type { NotificationItem } from '@/modules/activity/components/NotificationsList';
import type { Task } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import { BUG_SEVERITY_META } from '@/lib/constants/work-item-colors';

type WithId<T> = T & { id: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTs(val: Date | string | undefined | null): number {
  if (!val) return 0;
  if (val instanceof Date) return isNaN(val.getTime()) ? 0 : val.getTime();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const d = dayjs(val, 'DD/MM/YYYY');
    return d.isValid() ? d.valueOf() : 0;
  }
  const d = dayjs(val);
  return d.isValid() ? d.valueOf() : 0;
}

function fromNowSafe(val: Date | string | undefined | null): string {
  const ts = parseTs(val);
  return ts ? dayjs(ts).fromNow() : '—';
}

function memberAvatar(
  member: WithId<TeamMember> | undefined,
  fallback: { initials: string; color: string },
) {
  if (!member) return fallback;
  return { initials: member.initials, color: member.gradient ?? fallback.color };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [comment, setComment] = useState('');

  const { data, isLoading } = useBatchFetch([
    createCollectionListItem('teamComments', activityCommentsCollection),
    createCollectionListItem('notifications', notificationsCollection),
    createCollectionListItem('tasks', tasksCollection),
    createCollectionListItem('bugs', bugsCollection),
    createCollectionListItem('sprints', sprintsCollection),
    createCollectionListItem('meetings', meetingsCollection),
    createCollectionListItem('team', teamCollection),
  ]);

  const createComment = activityCommentsCollection.useCreate();

  // Derive activity feed from real module data (must be before any early return)
  const activityFeedData = useMemo<ActivityEntry[]>(() => {
    const tasks = (data.tasks ?? []) as WithId<Task>[];
    const bugs = (data.bugs ?? []) as WithId<Bug>[];
    const sprints = (data.sprints ?? []) as WithId<Sprint>[];
    const meetings = (data.meetings ?? []) as WithId<Meeting>[];
    const team = (data.team ?? []) as WithId<TeamMember>[];

    const getMember = (id?: string) => team.find((m) => m.id === id);

    type SortedEntry = ActivityEntry & { _ts: number };
    const entries: SortedEntry[] = [];

    // ── Tasks ────────────────────────────────────────────────────
    const statusLabel: Record<string, string> = {
      done: 'Done', in_progress: 'In Progress', in_review: 'In Review',
      todo: 'To Do', backlog: 'Backlog',
    };
    const statusVariant: Record<string, ActivityEntry['badgeVariant']> = {
      done: 'green', in_progress: 'accent', in_review: 'yellow',
      todo: 'muted', backlog: 'muted',
    };
    tasks.forEach((task) => {
      const member = getMember(task.assigneeId);
      const ts = parseTs(task.updatedAt) || parseTs(task.createdAt);
      entries.push({
        id: `task-${task.id}`,
        avatar: memberAvatar(member, { initials: task.id.slice(0, 2).toUpperCase(), color: '#6c63ff' }),
        content: `Task <strong>${task.id}: ${task.title}</strong> — ${statusLabel[task.status] ?? task.status}`,
        time: fromNowSafe(task.updatedAt ?? task.createdAt),
        badge: statusLabel[task.status] ?? 'Task',
        badgeVariant: statusVariant[task.status] ?? 'muted',
        _ts: ts,
      });
    });

    // ── Bugs ─────────────────────────────────────────────────────
    const bugStatusVariant: Record<string, ActivityEntry['badgeVariant']> = {
      fixed: 'green', 'in-progress': 'accent', 'in-review': 'yellow',
      open: 'red', 'wont-fix': 'muted',
    };
    const severityVariant: Record<string, ActivityEntry['badgeVariant']> = {
      Critical: BUG_SEVERITY_META.Critical.badgeVariant,
      High: BUG_SEVERITY_META.High.badgeVariant,
      Medium: BUG_SEVERITY_META.Medium.badgeVariant,
      Low: BUG_SEVERITY_META.Low.badgeVariant,
    };
    bugs.forEach((bug) => {
      const member = getMember(bug.assigneeId);
      const ts = parseTs(bug.resolvedAt ?? bug.reportedAt);
      entries.push({
        id: `bug-${bug.id}`,
        avatar: memberAvatar(member, { initials: 'BG', color: '#ef4444' }),
        content: `Bug <strong>${bug.id}: ${bug.title}</strong> — ${bug.severity}`,
        time: fromNowSafe(bug.resolvedAt ?? bug.reportedAt),
        badge: bug.status === 'fixed' ? 'Fixed' : bug.status === 'in-progress' ? 'In Progress' : bug.severity,
        badgeVariant: bugStatusVariant[bug.status] ?? severityVariant[bug.severity] ?? 'muted',
        _ts: ts,
      });
    });

    // ── Sprints ──────────────────────────────────────────────────
    sprints.forEach((sprint) => {
      const ts = parseTs(sprint.status === 'completed' ? sprint.endDate : sprint.startDate);
      const timeLabel =
        sprint.status === 'active'
          ? `${dayjs(sprint.startDate).format('DD/MM')} → ${dayjs(sprint.endDate).format('DD/MM')}`
          : fromNowSafe(sprint.endDate);
      entries.push({
        id: `sprint-${sprint.id}`,
        avatar: { initials: 'SP', color: '#6c63ff' },
        content: `Sprint <strong>${sprint.name}</strong> — ${sprint.goal}`,
        time: timeLabel,
        badge: sprint.status === 'active' ? 'Active' : sprint.status === 'completed' ? 'Completed' : 'Planned',
        badgeVariant: sprint.status === 'active' ? 'green' : sprint.status === 'completed' ? 'accent' : 'muted',
        _ts: ts,
      });
    });

    // ── Meetings ─────────────────────────────────────────────────
    meetings.forEach((meeting) => {
      const ts = parseTs(meeting.date);
      entries.push({
        id: `meeting-${meeting.id}`,
        avatar: { initials: 'MT', color: '#06b6d4' },
        content: `Cuộc họp <strong>${meeting.title}</strong> lúc ${meeting.time} — ${meeting.location}`,
        time: fromNowSafe(meeting.date),
        badge: 'Meeting',
        badgeVariant: 'purple',
        _ts: ts,
      });
    });

    return entries
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest)
      .slice(0, 30);
  }, [data]);

  if (isLoading) {
    return <PageLoader />;
  }

  const teamCommentsData = (data.teamComments ?? []) as unknown[];
  const notificationsData = (data.notifications ?? []) as NotificationItem[];

  const rawTasks = (data.tasks ?? []) as WithId<Task>[];
  const rawBugs = (data.bugs ?? []) as WithId<Bug>[];
  const rawSprints = (data.sprints ?? []) as WithId<Sprint>[];
  const rawMeetings = (data.meetings ?? []) as WithId<Meeting>[];

  const stats = {
    tasksDone: rawTasks.filter(t => t.status === 'done').length,
    tasksTotal: rawTasks.length,
    bugsOpen: rawBugs.filter(b => b.status === 'open' || b.status === 'in-progress').length,
    sprintsActive: rawSprints.filter(s => s.status === 'active').length,
    meetingsTotal: rawMeetings.length,
  };

  const handleSendComment = () => {
    const content = comment.trim();
    if (!content) return;
    createComment.mutate({
      targetId: 'general',
      targetType: 'discussion',
      userId: 'current-user',
      userName: 'Bạn',
      content,
      createdAt: new Date().toISOString(),
    } as never);
    setComment('');
  };

  return (
    <div>
      <ActivityPageHeader />
      <ActivityContent
        activityFeedData={activityFeedData}
        teamCommentsData={teamCommentsData}
        comment={comment}
        onCommentChange={setComment}
        onSendComment={handleSendComment}
        notificationsData={notificationsData}
        stats={stats}
      />
    </div>
  );
}
