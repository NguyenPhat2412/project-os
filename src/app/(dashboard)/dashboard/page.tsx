'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ListChecks, BugIcon, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import type { DashboardConfig, SprintConfig } from '@/lib/project-config';
import { apiClient } from '@/lib/api/client';
import { useProject } from '@/store/project-store';
import { useBatchFetch } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { PageLoader } from '@/components/ui/page-loader';
import { StatCard } from '@/components/ui/shared/stat-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { MiniStatRow } from '@/components/ui/shared/mini-stat-row';
import { EnvRow } from '@/components/ui/shared/env-row';
import { TaskRow } from '@/components/ui/shared/task-row';
import { DashboardSection } from '@/components/ui/shared/dashboard-section';
import { MeetingRow } from '@/modules/meetings/components/MeetingRow';
import { TaskStatsPanel } from '@/modules/tasks/components/TaskStatsPanel';
import { BugStatsPanel } from '@/modules/bugs/components/BugStatsPanel';
import { RiskStatsPanel } from '@/modules/risk/components/RiskStatsPanel';
import { TeamStatsPanel } from '@/modules/team/components/TeamStatsPanel';
import { DashboardPageHeader } from '@/modules/dashboard/components/DashboardPageHeader';
import { DEFAULT_TASK_COLUMNS, resolveTaskColumns } from '@/modules/tasks/utils/taskColumns';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { Risk } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

export const dynamic = 'force-dynamic';

function SectionLink({ href }: { href: string }) {
  return (
    <Link href={href} className='flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors'>
      Xem chi tiết <ArrowRight size={11} />
    </Link>
  );
}

export default function DashboardPage() {
  const { projectId } = useProject();
  const { data: dashboardConfigData, isLoading: dashLoading } = useQuery<DashboardConfig | null>({
    queryKey: ['config', projectId, 'dashboard', '__default__'],
    queryFn: () => apiClient.getOne<DashboardConfig>(`/config/${projectId}/dashboard`),
    staleTime: 60_000,
  });
  const { data: sprintConfigData, isLoading: sprintLoading } = useQuery<SprintConfig | null>({
    queryKey: ['config', projectId, 'sprint', '__default__'],
    queryFn: () => apiClient.getOne<SprintConfig>(`/config/${projectId}/sprint`),
    staleTime: 60_000,
  });

  const batchItems = useMemo(() => [
    { key: 'meetings', fetcher: () => apiClient.get(`projects/${projectId}/meetings`) },
    { key: 'tasks', fetcher: () => apiClient.get(`projects/${projectId}/tasks`) },
    { key: 'taskColumns', fetcher: () => apiClient.get(`projects/${projectId}/task_columns`) },
    { key: 'bugs', fetcher: () => apiClient.get(`projects/${projectId}/bugs`) },
    { key: 'risks', fetcher: () => apiClient.get(`projects/${projectId}/risks`) },
    { key: 'team', fetcher: () => apiClient.get(`projects/${projectId}/members`) },
  ], [projectId]);

  const { data, isLoading } = useBatchFetch(batchItems, `dashboard-${projectId}`);

  const loading = isLoading || dashLoading || sprintLoading;

  const tasks = (data.tasks ?? []) as Task[];
  const bugs = (data.bugs ?? []) as Bug[];
  const risks = (data.risks ?? []) as Risk[];
  const team = (data.team ?? []) as TeamMember[];

  const resolvedTaskColumns = useMemo(() => {
    const cols = data.taskColumns as TaskColumn[] | undefined;
    return resolveTaskColumns(cols?.length ? cols : DEFAULT_TASK_COLUMNS);
  }, [data.taskColumns]);

  if (loading) {
    return <PageLoader />;
  }

  const dashboardConfig_ = dashboardConfigData ?? {};
  const sprintConfig_ = sprintConfigData ?? {};
  const meetings = data.meetings ?? [];

  void sprintConfig_;

  const dashboardStats = (dashboardConfig_.stats ?? []) as { label: string; value: string; icon?: string; trend?: string }[];
  const sprintProgress = (dashboardConfig_.sprintProgress ?? { current: 0, label: '' }) as { current: number; label: string };
  const priorityTasks = (dashboardConfig_.priorityTasks ?? []) as { id: string; label: string; done: boolean; priority: string }[];
  const baStats = (dashboardConfig_.baStats ?? []) as { value: number; label: string }[];
  const baProgress = (dashboardConfig_.baProgress ?? []) as { label: string; value: number }[];
  const qaStats = (dashboardConfig_.qaStats ?? []) as { value: string; label: string; color?: string }[];
  const deployEnvs = (dashboardConfig_.deployEnvs ?? []) as { status: 'ok' | 'warn' | 'error'; name: string; badge: { label: string; variant: 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted' }; meta: string }[];
  const upcomingMeetings = (meetings as unknown[]).slice(0, 2) as { id: string; day: string; month: string; title: string; time: string; location?: string; attendees: { initials: string; color: string }[]; important?: boolean }[];

  return (
    <div>
      <DashboardPageHeader />
      {/* ── Top stat cards ── */}
      <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4.5 mb-8'>
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
          <div className='font-sans text-[16px] font-bold mb-3.5'>Sprint 08 Progress</div>
          <ProgressBar label='Tiến độ sprint' value={sprintProgress.current} />
          <div className='text-[12px] text-muted-foreground mt-2'>{sprintProgress.label}</div>
        </div>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3.5'>Task ưu tiên cao</div>
          {priorityTasks.map((t) => (
            <TaskRow key={t.id} label={t.label} done={t.done} priority={t.priority as 'High' | 'Normal' | 'Low'} />
          ))}
        </div>
      </div>

      {/* ── BA / QA / CI·CD ── */}
      <div className='grid grid-cols-3 max-lg:grid-cols-1 gap-4.5 mb-4.5'>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3'>BA / Phân tích nghiệp vụ</div>
          <MiniStatRow stats={baStats.map((s) => ({ ...s, value: String(s.value) }))} />
          {baProgress.map((p, i) => (
            <ProgressBar key={i} label={p.label} value={p.value} color='var(--primary)' />
          ))}
        </div>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3'>QA / Kiểm thử</div>
          <MiniStatRow stats={qaStats} />
        </div>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3'>Triển khai / CI·CD</div>
          {deployEnvs.map((env, i) => (
            <EnvRow key={i} {...env} />
          ))}
        </div>
      </div>

      {/* ── Upcoming meetings ── */}
      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-3'>Cuộc họp sắp tới</div>
        {upcomingMeetings.map((m) => (
          <MeetingRow key={m.id} day={m.day} month={m.month} title={m.title} time={`${m.time} · ${m.location ?? ''}`} attendees={m.attendees} badge={m.important ? { label: 'Quan trọng', variant: 'accent' } : undefined} />
        ))}
      </div>
    </div>
  );
}
