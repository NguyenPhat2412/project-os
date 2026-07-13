'use client';

import { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProject } from '@/store/project-store';

export function ReportExportButton({ resource }: { resource: 'tasks' | 'bugs' | 'risks' }) {
  const { projectId } = useProject();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/read-model/reports/${resource}/export.csv`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Không thể xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  return <div className='flex flex-col items-end gap-1'>
    <Button size='sm' variant='outline' onClick={download} disabled={downloading || !projectId}>
      <DownloadIcon size={14} /> {downloading ? 'Đang xuất...' : 'Xuất CSV'}
    </Button>
    {error && <span className='text-xs text-destructive'>{error}</span>}
  </div>;
}
