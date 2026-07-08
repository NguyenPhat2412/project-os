'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface SprintMetric {
  sprint: string;
  planned: number;
  completed: number;
  bugs: number;
}

interface Props {
  metrics: SprintMetric[];
}

export function SprintMetricsTable({ metrics }: Props) {
  return (
    <div className='bg-card border border-border panel p-5'>
      <div className='font-sans text-[16px] font-bold mb-4'>Sprint Metrics</div>
      <Table>
        <TableHeader>
          <TableRow className='border-border hover:bg-transparent'>
            {['Sprint', 'Planned', 'Completed', 'Bugs'].map((h) => (
              <TableHead key={h} className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3'>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m, i) => (
            <TableRow key={i} className='border-border hover:bg-secondary'>
              <TableCell className='font-mono-dm text-[12px] font-bold text-primary py-2.5 px-3'>{m.sprint}</TableCell>
              <TableCell className='font-mono-dm text-[12px] py-2.5 px-3'>{m.planned}</TableCell>
              <TableCell className='font-mono-dm text-[12px] py-2.5 px-3'>{m.completed}</TableCell>
              <TableCell className='font-mono-dm text-[12px] text-red-500 py-2.5 px-3'>{m.bugs}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
