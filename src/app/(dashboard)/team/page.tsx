'use client';
import { TeamPageHeader } from '@/modules/team/components/TeamPageHeader';
import { ProjectMembersPanel } from '@/modules/projects/components/ProjectMembersPanel';
import { PROJECT_ID } from '@/lib/project';

export default function TeamPage() {
  return (
    <div className='space-y-4'>
      <TeamPageHeader />
      <ProjectMembersPanel projectId={PROJECT_ID} />
    </div>
  );
}
