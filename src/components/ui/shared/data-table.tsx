import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <Table className='min-w-130'>
      <TableHeader>
        <TableRow className='border-b border-border hover:bg-transparent'>
          {headers.map((h) => (
            <TableHead key={h} className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 h-9 border-b border-border'>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}
