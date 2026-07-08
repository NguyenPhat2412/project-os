'use client';
import { useState } from 'react';
import { bugColumnsCollection } from '@/modules/bugs/collections/bugColumns';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { BUG_COLUMNS } from '@/modules/bugs/types/bug';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { PageLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import { Button } from '@/components/ui/button';
import { BugColumnDialog } from '@/modules/bugs/components/BugColumnDialog';
import type { BugColumn } from '@/modules/bugs/types/bug';
import type { Bug } from '@/modules/bugs/types/bug';
import { LayoutListIcon, PlusIcon } from 'lucide-react';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';

type BugWithId = Bug & { id: string };

export default function AdminBugsPage() {
  const { data, isLoading, refetch } = useBatchFetch([createCollectionListItem('bugColumns', bugColumnsCollection), createCollectionListItem('bugs', bugsCollection)]);

  const firestoreColumns = (data.bugColumns ?? []) as BugColumn[];
  const bugs = (data.bugs ?? []) as BugWithId[];

  // Fall back to BUG_COLUMNS if no Firestore data yet
  const columns = firestoreColumns.length > 0 ? firestoreColumns : BUG_COLUMNS;

  const [editingColumn, setEditingColumn] = useState<BugColumn | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  const deleteColumnMutation = bugColumnsCollection.useDelete();

  const confirmDelete = async () => {
    if (!deletingColumnId) return;
    await deleteColumnMutation.mutateAsync(deletingColumnId);
    setDeletingColumnId(null);
    refetch();
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <SimplePageHeader
        title='Cấu hình Bugs'
        summary='Quản lý các cột Kanban cho Bug tracker.'
        segments={BREADCRUMBS.adminBugs}
        actions={
          <Button
            onClick={() => {
              setEditingColumn(null);
              setColumnDialogOpen(true);
            }}
            className='text-[13px] font-semibold'
          >
            <PlusIcon />
            Thêm cột trạng thái
          </Button>
        }
      />

      {/* Info banner */}
      <div className='flex items-start gap-3 p-4 rounded-sm bg-card border border-border mb-4'>
        <LayoutListIcon size={16} className='text-muted-foreground shrink-0 mt-0.5' />
        <div className='text-[12px] text-muted-foreground'>
          Các cột Kanban cho Bug tracker dùng để phân nhóm bug theo trạng thái. Nếu chưa có cột nào, hệ thống sẽ dùng <span className='text-white'>default columns</span>.
        </div>
      </div>

      {/* Columns list */}
      <div className='bg-card border border-border panel overflow-hidden'>
        {columns.length === 0 ? (
          <div className='py-14 text-center text-[13px] text-muted-foreground'>Chưa có cột nào. Nhấn &ldquo;Thêm cột&rdquo; để tạo.</div>
        ) : (
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-4'>ID</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Cột</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Màu</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Bugs</th>
                <th className='text-right text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-4'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => {
                const bugCount = bugs.filter((b) => b.status === col.id).length;
                return (
                  <tr key={col.id} className='border-b border-border last:border-0 hover:bg-secondary transition-colors'>
                    <td className='py-3 px-4'>
                      <span className='font-mono-dm text-[12px] text-muted-foreground'>{col.id}</span>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full shrink-0' style={{ background: col.color }} />
                        <span className='text-[13px] font-medium text-foreground'>{col.title}</span>
                      </div>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex items-center gap-1.5'>
                        <div className='w-5 h-5 rounded-xs border border-border' style={{ background: col.color }} />
                        <span className='font-mono-dm text-[12px] text-muted-foreground'>{col.color}</span>
                      </div>
                    </td>
                    <td className='py-3 px-3'>
                      <span className='font-mono-dm text-[12px] text-muted-foreground'>{bugCount}</span>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center justify-end'>
                        <TableActionsMenu
                          actions={[
                            editAction(() => {
                              setEditingColumn(col as BugColumn);
                              setColumnDialogOpen(true);
                            }),
                            deleteAction(() => setDeletingColumnId(col.id)),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialogs */}
      {columnDialogOpen && (
        <BugColumnDialog
          open={columnDialogOpen}
          existingColumns={columns}
          column={editingColumn}
          onClose={() => {
            setColumnDialogOpen(false);
            setEditingColumn(null);
          }}
          onSuccess={() => {
            refetch();
            setColumnDialogOpen(false);
            setEditingColumn(null);
          }}
        />
      )}
      {deletingColumnId && (
        <ConfirmDialog
          title='Xoá cột Bug'
          message={`Xoá cột "${columns.find((c) => c.id === deletingColumnId)?.title ?? ''}"? Các bug trong cột này sẽ không thuộc cột nào.`}
          confirmLabel='Xoá cột'
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeletingColumnId(null)}
        />
      )}
    </div>
  );
}
