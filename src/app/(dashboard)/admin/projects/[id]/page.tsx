'use client';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon, InfoIcon, ShieldIcon } from 'lucide-react';
import Link from 'next/link';
import { createSubcollection } from '@/lib/api-rq';
import { useProjectDetail } from '@/modules/projects/hooks/useProjectDetail';
import { ProjectOverviewPanel } from '@/modules/projects/components/ProjectOverviewPanel';
import { ProjectMembersPanel } from '@/modules/projects/components/ProjectMembersPanel';
import { ProjectRolesPanel } from '@/modules/project-roles/components/ProjectRolesPanel';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageLoader } from '@/components/ui/page-loader';
import type { TeamMember } from '@/modules/team/types/team';
import type { WithId } from '@/lib/api-rq';

function useTeamCount(projectId: string) {
  const col = useMemo(
    () =>
      createSubcollection<TeamMember>({
        path: (pid: string) => `projects/${pid}/members`,
        transform: (raw): WithId<TeamMember> => raw as unknown as WithId<TeamMember>,
      })(projectId),
    [projectId],
  );
  const { data } = col.useList();
  return ((data ?? []) as TeamMember[]).length;
}

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { project, isLoading } = useProjectDetail(projectId);
  const memberCount = useTeamCount(projectId);

  if (isLoading) return <PageLoader />;

  if (!project) {
    return (
      <div className='text-center py-20 text-muted-foreground'>
        <p className='text-4xl mb-3'>404</p>
        <p className='text-[14px] mb-4'>Project not found</p>
        <Link href='/admin/projects' className='text-primary text-[13px] hover:underline'>
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SimplePageHeader
        title={project.name}
        summary={`${memberCount} thanh vien`}
        segments={BREADCRUMBS.adminProjectDetail(project.name)}
        actions={
          <Link href='/admin/projects' className='flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors'>
            <ArrowLeftIcon size={13} /> Back to Projects
          </Link>
        }
      />

      <Tabs defaultValue='overview' className='mt-2'>
        <TabsList variant='line' className='mb-5'>
          <TabsTrigger value='overview' className='gap-1.5 text-[13px] px-3'>
            <InfoIcon size={14} /> Thông tin chung
          </TabsTrigger>
          <TabsTrigger value='members' className='gap-1.5 text-[13px] px-3'>
            <UsersIcon size={14} /> Thành viên ({memberCount})
          </TabsTrigger>
          <TabsTrigger value='roles' className='gap-1.5 text-[13px] px-3'>
            <ShieldIcon size={14} /> Vai trò (Roles)
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-0'>
          <ProjectOverviewPanel project={project} />
        </TabsContent>

        <TabsContent value='members' className='mt-0'>
          <ProjectMembersPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value='roles' className='mt-0'>
          <ProjectRolesPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
