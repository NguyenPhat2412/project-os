'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspace } from '@/lib/api/workspace';
import { useProject } from '@/store/project-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/page-loader';

interface DailyReport {
  id: string;
  userId: string;
  date: string;
  summary: string;
  blockers?: string;
  nextPlan?: string;
  recipientName?: string;
  recipientTitle?: string;
}

interface ReportRecipient { userId: string; fullName: string; title?: string | null; }

export default function DailyReportsPage() {
  const { projectId } = useProject();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const managerView = workspace?.systemRole === 'DEPARTMENT_MANAGER';

  const recipient = useQuery({
    queryKey: ['daily-report-recipient', workspace?.organization.id],
    enabled: !managerView && !!workspace?.organization.id,
    queryFn: () => apiClient.getOne<ReportRecipient>(`v1/me/daily-reports/recipient?organizationId=${encodeURIComponent(workspace!.organization.id)}`),
  });

  const reports = useQuery({
    queryKey: ['daily-reports', managerView ? 'team' : 'self', projectId, workspace?.organization.id, managerView ? date : 'all'],
    enabled: !!projectId && !!workspace,
    queryFn: () => managerView
      ? apiClient.get<DailyReport>('v1/manager/daily-reports', {
          organizationId: workspace!.organization.id,
          projectId,
          date,
        })
      : apiClient.get<DailyReport>('v1/me/daily-reports', { projectId }),
  });

  const submit = useMutation({
    mutationFn: () => apiClient.post<DailyReport>('v1/me/daily-reports', {
      projectId,
      organizationId: workspace?.organization.id,
      date,
      summary,
      blockers: blockers || undefined,
      nextPlan: nextPlan || undefined,
    }),
    onSuccess: async () => {
      setSummary('');
      setBlockers('');
      setNextPlan('');
      await queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
    },
  });

  if (workspaceLoading || reports.isLoading) return <PageLoader />;

  return (
    <div className='space-y-5'>
      <div>
        <h1 className='text-2xl font-bold'>Báo cáo công việc hằng ngày</h1>
        <p className='text-sm text-muted-foreground'>Nhân viên gửi báo cáo của mình; quản lý xem báo cáo của cấp dưới trực tiếp.</p>
      </div>

      {!managerView && (
        <section className='rounded-lg border bg-card p-5 space-y-3'>
          <h2 className='font-semibold'>Gửi báo cáo hôm nay</h2>
          <Input type='date' value={date} onChange={(event) => setDate(event.target.value)} />
          <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm'>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Gửi cho</p>
            {recipient.isLoading ? <p className='mt-1 text-muted-foreground'>Đang xác định quản lý trực tiếp…</p>
              : recipient.data ? <p className='mt-1 font-medium'>Đề xuất: {recipient.data.fullName}{recipient.data.title ? <span className='font-normal text-muted-foreground'> · {recipient.data.title}</span> : null}</p>
                : <p className='mt-1 text-muted-foreground'>Chưa có quản lý trực tiếp. Quản trị cần gán người quản lý trong hồ sơ nhân sự trước khi gửi.</p>}
            {recipient.error && <p className='mt-1 text-destructive'>Không thể xác định người nhận báo cáo.</p>}
          </div>
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder='Kết quả đã hoàn thành' rows={4} />
          <Textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder='Vướng mắc (nếu có)' rows={2} />
          <Textarea value={nextPlan} onChange={(event) => setNextPlan(event.target.value)} placeholder='Kế hoạch tiếp theo' rows={2} />
          {submit.error && <p className='text-sm text-destructive'>{submit.error.message}</p>}
          <Button disabled={!projectId || !summary.trim() || !recipient.data || recipient.isLoading || !!recipient.error || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}
          </Button>
        </section>
      )}

      <section className='rounded-lg border bg-card p-5 space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='font-semibold'>{managerView ? 'Báo cáo của đội' : 'Báo cáo của tôi'}</h2>
          {managerView && <Input className='w-44' type='date' value={date} onChange={(event) => setDate(event.target.value)} />}
        </div>
        {reports.error && <p className='text-sm text-destructive'>{reports.error.message}</p>}
        {!reports.data?.length ? (
          <p className='text-sm text-muted-foreground'>Chưa có báo cáo.</p>
        ) : reports.data.map((report) => (
          <article key={report.id} className='rounded-md border p-4 space-y-1'>
            <div className='flex justify-between gap-3 text-sm'>
              <span className='font-medium'>{report.date}</span>
              {managerView && <span className='text-muted-foreground'>{report.userId}</span>}
            </div>
            <p className='text-sm whitespace-pre-wrap'>{report.summary}</p>
            {report.blockers && <p className='text-sm text-amber-700 dark:text-amber-400'>Vướng mắc: {report.blockers}</p>}
            {report.nextPlan && <p className='text-sm text-muted-foreground'>Tiếp theo: {report.nextPlan}</p>}
            {report.recipientName && <p className='text-sm text-muted-foreground'>Đã gửi cho: {report.recipientName}{report.recipientTitle ? ` · ${report.recipientTitle}` : ''}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}
