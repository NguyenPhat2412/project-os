'use client';
import { TeamPageHeader } from '@/modules/team/components/TeamPageHeader';
import { ProjectMembersPanel } from '@/modules/projects/components/ProjectMembersPanel';
import { useProject } from '@/store/project-store';

export default function TeamPage() {
  const { projectId } = useProject();
  return (
    <div className='space-y-4'>
      <TeamPageHeader />
      <ProjectMembersPanel projectId={projectId} />
    </div>
  );
}
