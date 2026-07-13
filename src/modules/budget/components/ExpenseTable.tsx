'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, PlusIcon } from 'lucide-react';
import { expensesCollection } from '@/modules/budget/collections/expenses';
import type { BudgetItem, ExpenseEntry } from '@/modules/budget/types/budget';
import type { TeamMember } from '@/modules/team/types/team';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageBadge } from '@/components/ui/page-badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import { ExpenseModal } from './ExpenseModal';
import { formatCurrencyVND } from '@/lib/numberjs';

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-2';
const columnHelper = createColumnHelper<ExpenseEntry>();

interface ExpenseTableProps {
  expenses: ExpenseEntry[];
  budgetItems: BudgetItem[];
  teamMembers: TeamMember[];
  onSuccess: () => void;
}

export function ExpenseTable({ expenses, teamMembers, onSuccess }: ExpenseTableProps) {
  'use no memo';
  const createExpense = expensesCollection.useCreate();
  const updateExpense = expensesCollection.useUpdate();
  const deleteExpense = expensesCollection.useDelete();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseEntry | null>(null);
  const [delItem, setDelItem] = useState<ExpenseEntry | null>(null);

  const handleAdd = async (data: Omit<ExpenseEntry, 'id'>) => {
    await createExpense.mutateAsync({ ...data, order: Date.now() } as never);
    onSuccess();
  };

  const handleEdit = async (data: Omit<ExpenseEntry, 'id'>) => {
    if (!editItem) return;
    await updateExpense.mutateAsync({ id: editItem.id, data: data as never });
    onSuccess();
  };

  const handleDelete = async () => {
    if (!delItem) return;
    await deleteExpense.mutateAsync(delItem.id);
    onSuccess();
  };

  const data = useMemo(() => expenses, [expenses]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: 'Ngày',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('description', {
        header: 'Mô tả',
        enableSorting: false,
        cell: (info) => <span className='text-[12px] max-w-45 block truncate'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('amount', {
        header: 'Số tiền',
        cell: (info) => <span className='font-mono-dm text-[12px] font-bold whitespace-nowrap'>{formatCurrencyVND(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'approver',
        header: 'Người duyệt',
        enableSorting: false,
        cell: (info) => {
          const approver = teamMembers.find((m) => m.id === info.row.original.approverId);
          return approver ? <Avatar initials={approver.initials} gradient={approver.gradient} size='sm' /> : <span className='text-[12px] text-muted-foreground'>—</span>;
        },
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => <PageBadge variant={info.getValue() === 'Paid' ? 'green' : 'yellow'}>{info.getValue()}</PageBadge>,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => (
          <div className='flex items-center justify-end'>
            <TableActionsMenu actions={[editAction(() => setEditItem(info.row.original)), deleteAction(() => setDelItem(info.row.original))]} />
          </div>
        ),
      }),
    ],
    [teamMembers],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <>
      {showAdd && <ExpenseModal mode='add' teamMembers={teamMembers} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editItem && <ExpenseModal mode='edit' expense={editItem} teamMembers={teamMembers} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {delItem && <ConfirmDialog danger title='Xóa chi tiêu' message={`Bạn có chắc muốn xóa chi tiêu "${delItem.description}"? Hành động này không thể hoàn tác.`} confirmLabel='Xóa chi tiêu' onCancel={() => setDelItem(null)} onConfirm={handleDelete} />}

      <div className='bg-card border border-border panel p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className='font-sans text-[16px] font-bold'>Chi tiêu gần đây</div>
          <Button onClick={() => setShowAdd(true)} className='gap-1.5 text-[12px] px-3'>
            <PlusIcon size={13} /> Thêm chi tiêu
          </Button>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='border-border hover:bg-transparent'>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className={TH_CLASS} onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
                      {h.column.getCanSort() ? (
                        <div className='flex items-center gap-1 select-none'>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === 'asc' ? <ChevronUp size={11} /> : sorted === 'desc' ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className='opacity-40' />}
                        </div>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow className='border-border hover:bg-transparent'>
                <TableCell colSpan={6} className='py-10 text-center text-[13px] text-muted-foreground'>
                  Chưa có chi tiêu nào. Nhấn &quot;Thêm chi tiêu&quot; để bắt đầu.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors'>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='py-2.5 px-2'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
