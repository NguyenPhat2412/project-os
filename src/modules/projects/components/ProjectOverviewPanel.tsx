'use client';
import { CalendarIcon, UsersIcon, LayersIcon, RocketIcon } from 'lucide-react';
import { PageBadge } from '@/components/ui/page-badge';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/firestore-rq/utils/timestamp';
import type { WithId } from '@/lib/firestore-rq';
import type { Project, ProjectStatus } from '../types/project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeStr(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  const d = toDate(value);
  return d ? d.toLocaleDateString('vi-VN') : undefined;
}

const STATUS_VARIANT: Record<ProjectStatus, 'green' | 'muted' | 'accent'> = {
  active: 'green',
  archived: 'muted',
  completed: 'accent',
};

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className='flex items-center gap-2.5 text-[13px]'>
      <Icon size={14} className='text-muted-foreground shrink-0' />
      <span className='text-muted-foreground'>{label}:</span>
      <span className='font-medium'>{value}</span>
    </div>
  );
}

export function ProjectOverviewPanel({ project }: { project: WithId<Project> }) {
  return (
    <div className='space-y-6'>
      {/* Header card */}
      <div className='bg-card border border-border panel p-6'>
        <div className='flex items-start gap-4'>
          <div className={cn('w-14 h-14 rounded-sm flex items-center justify-center text-3xl bg-linear-to-br shrink-0', project.color)}>{project.icon}</div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2.5 mb-1'>
              <h2 className='text-[18px] font-semibold'>{project.name}</h2>
              <PageBadge variant={STATUS_VARIANT[project.status]}>{project.status}</PageBadge>
            </div>
            {project.description && <p className='text-[13px] text-muted-foreground leading-relaxed max-w-2xl'>{project.description}</p>}
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div className='bg-card border border-border panel p-6'>
        <h3 className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-4'>Project Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <MetaItem icon={RocketIcon} label='Sprint' value={project.currentSprint} />
          <MetaItem icon={CalendarIcon} label='Quarter' value={project.quarter} />
          <MetaItem icon={CalendarIcon} label='Start' value={safeStr(project.startDate)} />
          <MetaItem icon={CalendarIcon} label='End' value={safeStr(project.endDate)} />
          <MetaItem icon={UsersIcon} label='Team Size' value={project.teamSize} />
          <MetaItem icon={LayersIcon} label='Created' value={safeStr(project.createdAt)} />
        </div>
      </div>

      {/* Tech stack */}
      {project.techStack && project.techStack.length > 0 && (
        <div className='bg-card border border-border panel p-6'>
          <h3 className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-4'>Tech Stack</h3>
          <div className='flex flex-wrap gap-2'>
            {project.techStack.map((tech) => (
              <span key={tech} className='text-[12px] px-3 py-1 rounded-sm bg-secondary border border-foreground/20 text-foreground font-mono-dm'>
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
