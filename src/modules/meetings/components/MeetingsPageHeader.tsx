'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

interface Props {
  meetingCount: number;
  noteCount: number;
}

export function MeetingsPageHeader({ meetingCount, noteCount }: Props) {
  return (
    <PageHeader
      title='Cuộc họp'
      summary={`${meetingCount} cuộc họp · ${noteCount} biên bản`}
      breadcrumb={buildBreadcrumb(BREADCRUMBS.meetings)}
    />
  );
}
