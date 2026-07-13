'use client';
import { CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProject } from '@/store/project-store';
import { cn } from '@/lib/utils';
import { useProjects } from '@/modules/projects/hooks/useProjects';

import type { WithId } from '@/lib/api-rq';
import type { Project } from '@/modules/projects/types/project';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  archived: 'bg-muted',
  completed: 'bg-blue-500',
};

function ProjectDropdownItem({ project, isActive }: { project: WithId<Project>; isActive: boolean }) {
  const { switchProject } = useProject();
  return (
    <DropdownMenuItem
      key={project.id}
      onClick={() => {
        if (!isActive) switchProject(project.id);
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
  const { projectId } = useProject();
  const { projects, isLoading } = useProjects();

  const current = projects.find((p) => p.id === projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='bg-secondary border border-border rounded-sm px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:border-primary transition-colors text-left'>
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
            <ProjectDropdownItem key={project.id} project={project} isActive={project.id === projectId} />
          ))}
          {projects.length === 0 && !isLoading && (
            <DropdownMenuItem disabled className='px-3 py-4 text-center text-muted-foreground'>
              No projects found
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href='/admin/projects' className='flex items-center gap-2 px-2.5 py-1.5'>
            <PlusIcon size={12} />
            Quản lý dự án
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
