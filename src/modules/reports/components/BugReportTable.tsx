'use client';
import { PageBadge } from '@/components/ui/page-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BUG_SEVERITY_META } from '@/lib/constants/work-item-colors';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const sevVariant: Record<string, BadgeVariant> = { Critical: BUG_SEVERITY_META.Critical.badgeVariant, High: BUG_SEVERITY_META.High.badgeVariant, Medium: BUG_SEVERITY_META.Medium.badgeVariant, Low: BUG_SEVERITY_META.Low.badgeVariant };
const bugStatusVariant: Record<string, BadgeVariant> = { 'In Progress': 'accent', Open: 'yellow', Resolved: 'green' };

export interface Bug {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: string;
  sprint: string;
}

interface Props {
  bugs: Bug[];
}

export function BugReportTable({ bugs }: Props) {
  return (
    <div className='bg-card border border-border panel p-5'>
      <div className='font-sans text-[16px] font-bold mb-4'>Bug Report</div>
      <Table>
        <TableHeader>
          <TableRow className='border-border hover:bg-transparent'>
            {['ID', 'Mô tả', 'Severity', 'Trạng thái', 'Người xử lý', 'Sprint'].map((h) => (
              <TableHead key={h} className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3'>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bugs.map((b) => (
            <TableRow key={b.id} className='border-border hover:bg-secondary'>
              <TableCell className='font-mono-dm text-[12px] text-primary py-2.5 px-3 whitespace-nowrap'>{b.id}</TableCell>
              <TableCell className='text-[12.5px] py-2.5 px-3'>{b.title}</TableCell>
              <TableCell className='py-2.5 px-3'>
                <PageBadge variant={sevVariant[b.severity] ?? 'muted'}>{b.severity}</PageBadge>
              </TableCell>
              <TableCell className='py-2.5 px-3'>
                <PageBadge variant={bugStatusVariant[b.status] ?? 'muted'}>{b.status}</PageBadge>
              </TableCell>
              <TableCell className='text-[12px] py-2.5 px-3'>{b.assignee}</TableCell>
              <TableCell className='font-mono-dm text-[12px] text-muted-foreground py-2.5 px-3'>{b.sprint}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
