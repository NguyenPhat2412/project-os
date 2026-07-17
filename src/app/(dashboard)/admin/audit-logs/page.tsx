'use client';

import { History } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { useOrganizationAudit } from '@/lib/api/organizations';
import { useWorkspace } from '@/lib/api/workspace';

export default function AdminAuditLogsPage() {
  const workspace = useWorkspace();
  const audit = useOrganizationAudit(workspace.data?.organization.id ?? null);

  if (workspace.isLoading || audit.isLoading) return <PageLoader />;

  return <div className='space-y-6 p-6'>
    <div><h1 className='text-2xl font-bold'>Nhật ký quản trị</h1><p className='text-sm text-muted-foreground'>Thay đổi quyền, thành viên và cơ cấu của {workspace.data?.organization.name ?? 'tổ chức'}.</p></div>
    <section className='divide-y rounded-lg border bg-card'>
      {audit.data?.map(item => <div key={item.id} className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm'><span className='flex items-center gap-2'><History size={15} className='text-muted-foreground' /><b>{item.eventType.replaceAll('_', ' ')}</b><span className='text-muted-foreground'>· {item.entityType}</span></span><time className='text-xs text-muted-foreground'>{new Date(item.createdAt).toLocaleString('vi-VN')}</time></div>)}
      {!audit.data?.length && <p className='p-5 text-center text-sm text-muted-foreground'>Chưa có thay đổi nào được ghi nhận.</p>}
    </section>
  </div>;
}
