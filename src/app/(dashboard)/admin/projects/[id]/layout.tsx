'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PageLoader } from '@/components/ui/page-loader';
import { useProject } from '@/store/project-store';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ProjectDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, setProjectId } = useProject();

  const linkedProjectId = searchParams.get('projectId');
  // The route is the canonical project identity for a project-detail page.
  // A stale query parameter must not send the user back to a previous project.
  const selectedProjectId = UUID_PATTERN.test(routeProjectId)
    ? routeProjectId
    : linkedProjectId && UUID_PATTERN.test(linkedProjectId)
      ? linkedProjectId
      : '';
  const needsCanonicalRoute = Boolean(selectedProjectId && selectedProjectId !== routeProjectId);
  const needsProjectQuery = linkedProjectId !== selectedProjectId;
  const needsCanonicalUrl = needsCanonicalRoute || needsProjectQuery;

  useEffect(() => {
    if (!selectedProjectId || !UUID_PATTERN.test(selectedProjectId)) return;

    if (projectId !== selectedProjectId) setProjectId(selectedProjectId);
    if (!needsCanonicalUrl) return;

    const query = new URLSearchParams(searchParams.toString());
    query.set('projectId', selectedProjectId);
    const routePrefix = `/admin/projects/${routeProjectId}`;
    const canonicalPath = `${`/admin/projects/${selectedProjectId}`}${pathname.slice(routePrefix.length)}`;
    router.replace(`${canonicalPath}?${query.toString()}`, { scroll: false });
  }, [needsCanonicalUrl, pathname, projectId, routeProjectId, router, searchParams, selectedProjectId, setProjectId]);

  return needsCanonicalRoute ? <PageLoader /> : children;
}
