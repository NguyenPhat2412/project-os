'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Building2, ClipboardList, FolderKanban, UsersRound } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useWorkspace } from '@/lib/api/workspace';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import type { Project } from '@/modules/projects/types/project';

type CurrentProfile = { displayName?: string; email?: string; title?: string };
type PersonalTask = {
  id: string;
  uuid?: string;
  title?: string;
  status?: string;
  deadline?: string;
  dueDate?: string;
};
type TaskWithProject = PersonalTask & { project: Project };

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: 'Quản trị tổ chức',
  HR: 'Nhân sự',
  DEPARTMENT_MANAGER: 'Quản lý',
  EMPLOYEE: 'Nhân viên',
};
const DONE_STATUSES = new Set(['done', 'completed', 'closed']);

export function MyWorkSummary() {
  const workspace = useWorkspace();
  const { projects, isLoading: projectsLoading } = useProjects();
  const profile = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => apiClient.getOne<CurrentProfile>('v1/users/me/profile'),
    staleTime: 30_000,
    retry: false,
  });
  const projectIds = projects.map((project) => project.id);
  const tasks = useQuery({
    queryKey: ['me', 'tasks', workspace.data?.organization.id, projectIds],
    enabled: projectIds.length > 0,
    queryFn: async (): Promise<TaskWithProject[]> => {
      const results = await Promise.all(projects.map(async (project) => {
        const response = await apiClient.getPage<PersonalTask>('v1/me/tasks', { projectId: project.id });
        return response.data.map((task) => ({ ...task, project }));
      }));
      return results.flat();
    },
    staleTime: 30_000,
    retry: false,
  });

  const activeTasks = (tasks.data ?? []).filter((task) => !DONE_STATUSES.has(task.status?.toLowerCase() ?? ''));
  const currentWorkspace = workspace.data;
  const currentProfile = profile.data;
  const permissionGroups = currentWorkspace?.permissionGroups ?? [];
  const fullName = currentProfile?.displayName ?? currentWorkspace?.employee?.fullName ?? 'Tài khoản của bạn';
  const title = currentProfile?.title ?? currentWorkspace?.employee?.title ?? 'Chưa cập nhật chức danh';
  const loading = workspace.isLoading || projectsLoading || profile.isLoading || tasks.isLoading;

  return (
    <section className='space-y-4 rounded-lg border bg-card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h2 className='font-semibold'>Công việc của tôi</h2>
          <p className='mt-1 text-xs text-muted-foreground'>Dữ liệu được xác định từ tài khoản đang đăng nhập; không nhận UserID từ URL.</p>
        </div>
        <span className='rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'>{activeTasks.length} task cần làm</span>
      </div>

      <div className='grid gap-3 md:grid-cols-3'>
        <SummaryCard icon={<UsersRound size={16} />} label='Tài khoản' value={fullName} detail={currentProfile?.email ?? 'Chưa có email'} />
        <SummaryCard icon={<Building2 size={16} />} label='Tổ chức' value={currentWorkspace?.organization.name ?? 'Đang tải'} detail={(ROLE_LABELS[currentWorkspace?.systemRole ?? ''] ?? 'Thành viên') + ' · ' + (currentWorkspace?.departmentName ?? 'Chưa có phòng ban')} />
        <SummaryCard icon={<FolderKanban size={16} />} label='Dự án tham gia' value={String(projects.length) + ' dự án'} detail={title} />
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]'>
        <div className='rounded-md border bg-background'>
          <div className='border-b px-4 py-3 text-sm font-medium'>Task đang cần thực hiện</div>
          {loading ? <p className='p-4 text-sm text-muted-foreground'>Đang tải công việc...</p> : activeTasks.length ? (
            <div className='max-h-72 divide-y overflow-y-auto'>
              {activeTasks.map((task) => (
                <div key={task.project.id + '-' + (task.uuid ?? task.id)} className='flex items-center justify-between gap-4 px-4 py-3 text-sm'>
                  <div className='min-w-0'><p className='truncate font-medium'>{task.title ?? task.id}</p><p className='mt-0.5 truncate text-xs text-muted-foreground'>{task.project.name} · {task.id}</p></div>
                  <div className='shrink-0 text-right text-xs text-muted-foreground'><p>{task.status ?? 'todo'}</p><p className='mt-0.5'>{task.deadline ?? task.dueDate ?? 'Chưa đặt hạn'}</p></div>
                </div>
              ))}
            </div>
          ) : <p className='p-4 text-sm text-muted-foreground'>Không có task đang mở trong các dự án bạn tham gia.</p>}
          {tasks.isError && <p className='border-t px-4 py-3 text-xs text-destructive'>Không thể tải một phần công việc. Hãy tải lại trang.</p>}
        </div>

        <div className='rounded-md border bg-background p-4'>
          <div className='flex items-center gap-2 text-sm font-medium'><ClipboardList size={16} />Nhóm & dự án</div>
          <div className='mt-3'><p className='text-xs text-muted-foreground'>Nhóm quyền</p><div className='mt-1 flex flex-wrap gap-1.5'>{permissionGroups.length ? permissionGroups.map((group) => <span key={group} className='rounded-full bg-muted px-2 py-1 text-xs'>{group}</span>) : <span className='text-sm'>Chưa gán nhóm quyền riêng</span>}</div></div>
          <div className='mt-4'><p className='text-xs text-muted-foreground'>Dự án</p><div className='mt-1 space-y-1.5'>{projects.map((project) => <p key={project.id} className='truncate text-sm'>{project.name}</p>)}{!projects.length && !projectsLoading && <p className='text-sm'>Chưa tham gia dự án.</p>}</div></div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className='rounded-md border bg-background p-3'><div className='flex items-center gap-2 text-xs text-muted-foreground'>{icon}{label}</div><p className='mt-2 truncate text-sm font-medium'>{value}</p><p className='mt-1 truncate text-xs text-muted-foreground'>{detail}</p></div>;
}
