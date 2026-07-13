'use client';
import type { ComponentProps } from 'react';
import Link from 'next/link';
import { ListChecks, BugIcon, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useProject } from '@/store/project-store';
import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '@/components/ui/page-loader';
import { StatCard } from '@/components/ui/shared/stat-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TaskRow } from '@/components/ui/shared/task-row';
import { DashboardSection } from '@/components/ui/shared/dashboard-section';
import { MeetingRow } from '@/modules/meetings/components/MeetingRow';
import { TaskStatsPanel } from '@/modules/tasks/components/TaskStatsPanel';
import { BugStatsPanel } from '@/modules/bugs/components/BugStatsPanel';
import { RiskStatsPanel } from '@/modules/risk/components/RiskStatsPanel';
import { TeamStatsPanel } from '@/modules/team/components/TeamStatsPanel';
import { DashboardPageHeader } from '@/modules/dashboard/components/DashboardPageHeader';
import { DEFAULT_TASK_COLUMNS, isTaskDoneStatus, resolveTaskColumns } from '@/modules/tasks/utils/taskColumns';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { Risk } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

export const dynamic = 'force-dynamic';

interface DashboardReadModel {
  meetings: unknown[];
  tasks: (Task & { id: string })[];
  taskColumns: TaskColumn[];
  bugs: Bug[];
  risks: Risk[];
  team: TeamMember[];
}

function SectionLink({ href }: { href: string }) {
  return (
    <Link href={href} className='flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors'>
      Xem chi tiết <ArrowRight size={11} />
    </Link>
  );
}

export default function DashboardPage() {
  const { projectId } = useProject();

  const { data: readModel, isLoading } = useQuery({
    queryKey: ['read-model', 'dashboard', projectId],
    queryFn: () => apiClient.getOne<DashboardReadModel>(`projects/${projectId}/read-model/dashboard`),
    enabled: !!projectId,
  });
  const data: DashboardReadModel = readModel ?? {
    meetings: [],
    tasks: [],
    taskColumns: [],
    bugs: [],
    risks: [],
    team: [],
  };

  const loading = isLoading;

  const tasks = data.tasks;
  const bugs = data.bugs;
  const risks = data.risks;
  const team = data.team;

  const resolvedTaskColumns = resolveTaskColumns(
    data.taskColumns?.length ? data.taskColumns : DEFAULT_TASK_COLUMNS,
  );

  if (loading) {
    return <PageLoader />;
  }

  const meetings = data.meetings;

  const doneTasks = tasks.filter((task) => isTaskDoneStatus(task.status, resolvedTaskColumns)).length;
  const taskDoneRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const openBugs = bugs.filter((bug) => bug.status !== 'fixed' && bug.status !== 'wont-fix').length;
  const openRisks = risks.filter((risk) => !/đã giảm thiểu|da giam thieu|closed|resolved|mitigated/i.test(risk.status ?? '')).length;
  const priorityTasks = tasks
    .filter((task) => task.priority === 'High' && !isTaskDoneStatus(task.status, resolvedTaskColumns))
    .slice(0, 5);
  const dashboardStats = [
    { label: 'Tasks', value: tasks.length, delta: `${doneTasks} done · ${taskDoneRate}%`, deltaType: tasks.length > 0 ? 'positive' : 'neutral', color: 'accent' },
    { label: 'Open bugs', value: openBugs, delta: `${bugs.length} total`, deltaType: openBugs > 0 ? 'negative' : 'neutral', color: 'red' },
    { label: 'Open risks', value: openRisks, delta: `${risks.length} total`, deltaType: openRisks > 0 ? 'negative' : 'neutral', color: 'yellow' },
    { label: 'Team members', value: team.length, delta: 'Project members', deltaType: 'neutral', color: 'purple' },
  ] satisfies ComponentProps<typeof StatCard>[];
  const upcomingMeetings = (meetings as unknown[]).slice(0, 2) as { id: string; day: string; month: string; title: string; time: string; location?: string; attendees: { initials: string; color: string }[]; important?: boolean }[];

  return (
    <div>
      <DashboardPageHeader />
      {/* ── Top stat cards ── */}
      <div className='grid grid-cols-4 max-xl:grid-cols-2 max-sm:grid-cols-1 gap-4.5 mb-8'>
        {dashboardStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── Tasks ── */}
      <DashboardSection icon={<ListChecks size={16} />} iconColor='var(--primary)' title='Tasks' subtitle='Tiến độ và chất lượng công việc trong dự án' action={<SectionLink href='/tasks' />}>
        <TaskStatsPanel tasks={tasks} columns={resolvedTaskColumns} />
      </DashboardSection>

      {/* ── Bugs ── */}
      <DashboardSection icon={<BugIcon size={16} />} iconColor='oklch(0.577 0.245 27.325)' title='Bugs' subtitle='Theo dõi lỗi và chất lượng phần mềm' action={<SectionLink href='/backlog' />}>
        <BugStatsPanel bugs={bugs as (Bug & { id: string })[]} />
      </DashboardSection>

      {/* ── Risk ── */}
      <DashboardSection icon={<ShieldAlert size={16} />} iconColor='#f59e0b' title='Rủi ro' subtitle='Quản lý và giảm thiểu rủi ro dự án' action={<SectionLink href='/risk' />}>
        <RiskStatsPanel risks={risks as (Risk & { id: string })[]} />
      </DashboardSection>

      {/* ── Team ── */}
      <DashboardSection icon={<Users size={16} />} iconColor='oklch(0.646 0.222 142.116)' title='Nhân sự' subtitle='Workload và sức khoẻ nhân sự' action={<SectionLink href='/team' />}>
        <TeamStatsPanel members={team} />
      </DashboardSection>

      {/* ── Sprint & priority tasks ── */}
      <div className='grid grid-cols-2 max-lg:grid-cols-1 gap-4.5 mb-4.5'>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3.5'>Project task progress</div>
          <ProgressBar label='Completion rate' value={taskDoneRate} />
          <div className='text-[12px] text-muted-foreground mt-2'>{doneTasks}/{tasks.length} tasks done</div>
        </div>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3.5'>High priority tasks</div>
          {priorityTasks.length > 0 ? (
            priorityTasks.map((task) => (
              <TaskRow key={task.id} label={task.title} done={false} priority={task.priority} />
            ))
          ) : (
            <div className='text-[13px] text-muted-foreground'>No high priority open tasks.</div>
          )}
        </div>
      </div>

      {/* ── Upcoming meetings ── */}
      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-3'>Upcoming meetings</div>
        {upcomingMeetings.length > 0 ? (
          upcomingMeetings.map((m) => (
            <MeetingRow key={m.id} day={m.day} month={m.month} title={m.title} time={`${m.time} · ${m.location ?? ''}`} attendees={m.attendees} badge={m.important ? { label: 'Quan trọng', variant: 'accent' } : undefined} />
          ))
        ) : (
          <div className='text-[13px] text-muted-foreground'>No meetings scheduled.</div>
        )}
      </div>
    </div>
  );
}
