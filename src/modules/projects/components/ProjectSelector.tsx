'use client';
import { useCallback, useEffect } from 'react';
import { CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProject } from '@/store/project-store';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/lib/api/workspace';
import { useProjects } from '@/modules/projects/hooks/useProjects';

import type { WithId } from '@/lib/api-rq';
import type { Project } from '@/modules/projects/types/project';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  archived: 'bg-muted',
  completed: 'bg-blue-500',
};

function ProjectDropdownItem({ project, isActive, onSelect }: { project: WithId<Project>; isActive: boolean; onSelect: (projectId: string) => void }) {
  return (
    <DropdownMenuItem
      key={project.id}
      onSelect={() => {
        if (!isActive) onSelect(project.id);
      }}
      className={cn('flex items-center gap-2.5 px-2.5 py-2 cursor-pointer', isActive && 'bg-primary/10 text-primary')}
    >
      <div className='flex-1 min-w-0'>
        <div className='text-[12px] font-medium truncate'>{project.name}</div>
        <div className='flex items-center gap-1.5 mt-0.5'>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[project.status])} />
          <span className='text-[12px] text-muted-foreground capitalize'>{project.status}</span>
          {project.currentSprint && <span className='text-[12px] text-muted-foreground'>· {project.currentSprint}</span>}
        </div>
      </div>
      {isActive && <CheckIcon size={12} className='shrink-0' />}
    </DropdownMenuItem>
  );
}

export function ProjectSelector() {
  const { projectId, hydrated, switchProject } = useProject();
  const { projects, isLoading } = useProjects();
  const { data: workspace } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();

  const current = projects.find((p) => p.id === projectId);
  const manageProjectsHref = workspace?.organization.id
    ? `/admin/projects?organizationId=${workspace.organization.id}`
    : '/admin/projects';

  const selectProject = useCallback((nextProjectId: string) => {
    switchProject(nextProjectId);

    const detailPath = pathname.match(/^\/admin\/projects\/[^/]+(\/.*)?$/);
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', nextProjectId);
    url.searchParams.delete('taskId');
    if (detailPath) url.pathname = `/admin/projects/${nextProjectId}${detailPath[1] ?? ''}`;
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [pathname, router, switchProject]);

  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (projects.length === 0) {
      if (projectId) switchProject('');
      return;
    }
    if (!current) selectProject(projects[0].id);
  }, [current, hydrated, isLoading, projectId, projects, selectProject, switchProject]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label='Chọn dự án' className='bg-secondary border border-border rounded-sm px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:border-primary transition-colors text-left'>
          <div className='flex-1 min-w-0'>
            <div className='text-[13px] font-semibold truncate text-foreground'>{current?.name ?? (isLoading ? '...' : 'Select project')}</div>
          </div>
          <ChevronDownIcon size={13} className='text-muted-foreground shrink-0' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='bottom' align='start' sideOffset={4} className='w-56 p-0'>
        <DropdownMenuLabel className='px-2.5 py-2 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border'>Projects</DropdownMenuLabel>
        <div className='py-1'>
          {projects.map((project) => (
            <ProjectDropdownItem key={project.id} project={project} isActive={project.id === projectId} onSelect={selectProject} />
          ))}
          {projects.length === 0 && !isLoading && (
            <DropdownMenuItem disabled className='px-3 py-4 text-center text-muted-foreground'>
              No projects found
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href={manageProjectsHref} className='flex items-center gap-2 px-2.5 py-1.5'>
            <PlusIcon size={12} />
            Quản lý dự án
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
