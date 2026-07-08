'use client';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { PageBadge } from '@/components/ui/page-badge';
import { cn } from '@/lib/utils';
import type { WithId } from '@/lib/firestore-rq';
import type { Project, ProjectStatus } from '../types/project';

const STATUS_VARIANT: Record<ProjectStatus, 'green' | 'muted' | 'accent'> = {
  active: 'green',
  archived: 'muted',
  completed: 'accent',
};

export function ProjectStatsCards({ projects }: { projects: WithId<Project>[] }) {
  if (projects.length === 0) {
    return (
      <div className='text-center py-16 text-muted-foreground'>
        <p className='text-4xl mb-3'>📁</p>
        <p className='text-[14px] font-medium mb-1'>No projects yet</p>
        <Link href='/admin/projects' className='text-[12px] text-primary hover:underline'>
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
      {projects.map((project) => (
        <Link key={project.id} href={`/admin/projects/${project.id}`} className='bg-card border border-border panel p-5 flex flex-col gap-3 transition-colors hover:border-primary/50 group'>
          {/* Header */}
          <div className='flex items-start gap-3'>
            <div className={cn('w-10 h-10 rounded-sm flex items-center justify-center text-xl bg-linear-to-br shrink-0', project.color)}>{project.icon}</div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='text-[15px] font-semibold truncate'>{project.name}</span>
                <ArrowRightIcon size={13} className='text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />
              </div>
              <PageBadge variant={STATUS_VARIANT[project.status]} className='mt-1'>
                {project.status}
              </PageBadge>
            </div>
          </div>

          {/* Description */}
          {project.description && <p className='text-[12px] text-muted-foreground line-clamp-2 leading-relaxed'>{project.description}</p>}

          {/* Meta */}
          <div className='flex items-center gap-1.5 text-[12px] text-muted-foreground flex-wrap'>
            {project.currentSprint && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.currentSprint}</span>}
            {project.quarter && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.quarter}</span>}
            {project.teamSize && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.teamSize} members</span>}
          </div>

          {/* Tech */}
          {project.techStack && project.techStack.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {project.techStack.slice(0, 3).map((t) => (
                <span key={t} className='text-[12px] px-2 py-0.5 rounded bg-secondary border border-foreground/20 text-muted-foreground font-mono-dm'>
                  {t}
                </span>
              ))}
              {project.techStack.length > 3 && <span className='text-[12px] px-2 py-0.5 rounded bg-secondary border border-foreground/20 text-muted-foreground'>+{project.techStack.length - 3}</span>}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
