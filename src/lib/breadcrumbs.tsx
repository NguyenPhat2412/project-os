// Shared static breadcrumb definitions — imported by page components and PageHeader
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Fragment } from 'react';

export type BreadcrumbSegment = { label: string; href?: string };

export const BREADCRUMBS = {
  dashboard: [{ label: 'Dashboard', href: '/dashboard' }] as BreadcrumbSegment[],
  tasks: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tasks' }] as BreadcrumbSegment[],
  sprints: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sprints' }] as BreadcrumbSegment[],
  backlog: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Backlog' }] as BreadcrumbSegment[],
  timeline: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Timeline' }] as BreadcrumbSegment[],
  team: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nhóm' }] as BreadcrumbSegment[],
  budget: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ngân sách' }] as BreadcrumbSegment[],
  risk: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rủi ro' }] as BreadcrumbSegment[],
  reports: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Báo cáo' }] as BreadcrumbSegment[],
  reportsTasks: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Báo cáo', href: '/reports' }, { label: 'Tasks' }] as BreadcrumbSegment[],
  reportsBugs: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Báo cáo', href: '/reports' }, { label: 'Bugs' }] as BreadcrumbSegment[],
  reportsRisks: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Báo cáo', href: '/reports' }, { label: 'Rủi ro' }] as BreadcrumbSegment[],
  docs: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tài liệu' }] as BreadcrumbSegment[],
  wiki: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Wiki' }] as BreadcrumbSegment[],
  meetings: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cuộc họp' }] as BreadcrumbSegment[],
  bugs: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bugs' }] as BreadcrumbSegment[],
  activity: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Hoạt động' }] as BreadcrumbSegment[],
  profile: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Hồ sơ' }] as BreadcrumbSegment[],
  admin: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }] as BreadcrumbSegment[],
  adminProjects: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Projects' }] as BreadcrumbSegment[],
  adminTasks: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Tasks' }] as BreadcrumbSegment[],
  adminBugs: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Bugs' }] as BreadcrumbSegment[],
  adminSettings: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Settings' }] as BreadcrumbSegment[],
  adminMembers: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Members' }] as BreadcrumbSegment[],
  adminRoles: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Vai trò (Roles)' }] as BreadcrumbSegment[],
  adminProjectDetail: (name: string) =>
    [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Projects', href: '/admin/projects' }, { label: name }] as BreadcrumbSegment[],
  adminProjectRoles: (projectId: string) =>
    [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin', href: '/admin' }, { label: 'Projects', href: '/admin/projects' }, { label: `Project ${projectId}` }, { label: 'Vai trò' }] as BreadcrumbSegment[],
  projects: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projects' }] as BreadcrumbSegment[],
} as const;

export function buildBreadcrumb(segments: BreadcrumbSegment[]) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => (
          <Fragment key={`${seg.href ?? seg.label}-${i}`}>
            <BreadcrumbItem>
              {seg.href ? (
                <BreadcrumbLink asChild>
                  <Link href={seg.href}>{seg.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{seg.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {i < segments.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
