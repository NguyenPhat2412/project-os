'use client';

import * as React from 'react';
import type { DocEntry } from '@/modules/docs/collections/documents';
import { DOC_TYPE_META } from '@/modules/docs/doc-type-colors';

type DocWithId = DocEntry & { id: string };

interface DocsStatsPanelProps {
  documents: DocWithId[];
}

const TH_CLASS = 'text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide py-2 px-3';

export function DocsStatsPanel({ documents }: DocsStatsPanelProps) {
  const stats = React.useMemo(() => {
    const byType: Record<string, number> = {};
    documents.forEach((d) => {
      byType[d.type] = (byType[d.type] ?? 0) + 1;
    });
    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const totalSize = documents.reduce((acc, d) => {
      const match = d.size.match(/^([0-9.]+)\s*([A-Z]+)$/i);
      if (!match) return acc;
      const val = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'KB') return acc + val * 1024;
      if (unit === 'MB') return acc + val * 1024 * 1024;
      if (unit === 'GB') return acc + val * 1024 * 1024 * 1024;
      return acc + val;
    }, 0);
    const formatSize = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${bytes} B`;
    };
    return { byType: sorted, totalSize, formatSize };
  }, [documents]);

  if (documents.length === 0) return null;

  return (
    <div className='bg-card border border-border panel'>
      <div className='px-3 pt-3 pb-1'>
        <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>Thống kê tài liệu</p>
      </div>
      <table className='w-full'>
        <thead>
          <tr className='border-border'>
            <th className={TH_CLASS}>Loại</th>
            <th className={`${TH_CLASS} text-right`}>Số lượng</th>
            <th className={`${TH_CLASS} text-right`}>Tỷ lệ</th>
          </tr>
        </thead>
        <tbody>
          {stats.byType.map(([type, count]) => {
            const pct = documents.length > 0 ? Math.round((count / documents.length) * 100) : 0;
            const meta = DOC_TYPE_META[type] ?? DOC_TYPE_META['Other'];
            const Icon = meta.icon;
            return (
              <tr key={type} className='border-border hover:bg-secondary/50 transition-colors'>
                <td className='py-2 px-3'>
                  <div className='flex items-center gap-2'>
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${meta.softClass}`}>
                      <Icon size={13} />
                    </div>
                    <span className='font-mono-dm text-[12px]' style={{ color: meta.chartColor }}>{type}</span>
                  </div>
                </td>
                <td className='py-2 px-3 text-right'>
                  <span className='font-mono-dm text-[13px] font-medium'>{count}</span>
                </td>
                <td className='py-2 px-3 text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <div className='w-16 h-1.5 bg-secondary rounded-full overflow-hidden'>
                      <div className='h-full rounded-full min-w-0.5' style={{ width: `${pct}%`, backgroundColor: meta.chartColor }} />
                    </div>
                    <span className='font-mono-dm text-[12px] text-muted-foreground w-8 text-right'>{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className='border-border font-medium'>
            <td className='py-2 px-3'>
              <span className='text-[12px]'>Tổng cộng</span>
            </td>
            <td className='py-2 px-3 text-right'>
              <span className='font-mono-dm text-[13px]'>{documents.length}</span>
            </td>
            <td className='py-2 px-3 text-right'>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>—</span>
            </td>
          </tr>
        </tfoot>
      </table>
      <div className='px-3 pb-3 pt-1'>
        <p className='text-[11px] text-muted-foreground'>
          Tổng kích thước: <span className='font-mono-dm font-medium'>{stats.formatSize(stats.totalSize)}</span>
        </p>
      </div>
    </div>
  );
}
