'use client';
import { FolderKanbanIcon, CheckCircleIcon, ArchiveIcon } from 'lucide-react';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { ProjectStatsCards } from '@/modules/projects/components/ProjectStatsCards';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import { PageLoader } from '@/components/ui/page-loader';

function StatItem({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className='bg-card border border-border panel p-4 flex items-center gap-3'>
      <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className='text-[20px] font-bold leading-tight'>{value}</div>
        <div className='text-[12px] text-muted-foreground font-mono-dm uppercase tracking-wider'>{label}</div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();

  if (isLoading) return <PageLoader />;

  const active = projects.filter((p) => p.status === 'active').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const archived = projects.filter((p) => p.status === 'archived').length;

  return (
    <div>
      <SimplePageHeader title='Projects' summary={`${projects.length} project${projects.length !== 1 ? 's' : ''} overview`} segments={BREADCRUMBS.projects} />

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
        <StatItem icon={FolderKanbanIcon} label='Total' value={projects.length} color='bg-primary/15 text-primary' />
        <StatItem icon={FolderKanbanIcon} label='Active' value={active} color='bg-green-500/15 text-green-500' />
        <StatItem icon={CheckCircleIcon} label='Completed' value={completed} color='bg-blue-500/15 text-blue-400' />
        <StatItem icon={ArchiveIcon} label='Archived' value={archived} color='bg-muted/15 text-muted-foreground' />
      </div>

      {/* Project cards */}
      <ProjectStatsCards projects={projects} />
    </div>
  );
}
