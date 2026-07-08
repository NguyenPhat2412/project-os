'use client';
import { useState } from 'react';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { PageLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import { Button } from '@/components/ui/button';
import { TaskColumnDialog } from '@/modules/tasks/components/TaskColumnDialog';
import type { TaskColumn } from '@/modules/tasks/types/task';
import type { Task } from '@/modules/tasks/types/task';
import { LayoutListIcon, PlusIcon } from 'lucide-react';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';

export default function AdminTasksPage() {
  const { data, isLoading, refetch } = useBatchFetch([createCollectionListItem('taskColumns', taskColumnsCollection), createCollectionListItem('tasks', tasksCollection)]);

  const columns = (data.taskColumns ?? []) as TaskColumn[];
  const tasks = (data.tasks ?? []) as Task[];
  const [editingColumn, setEditingColumn] = useState<TaskColumn | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  const deleteColumnMutation = taskColumnsCollection.useDelete();

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

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
        title='Cấu hình Tasks'
        summary='Quản lý các cột Kanban cho Task tracker.'
        segments={BREADCRUMBS.adminTasks}
        actions={
          <Button
            onClick={() => {
              setEditingColumn(null);
              setColumnDialogOpen(true);
            }}
            className='text-[13px] font-semibold'
          >
            <PlusIcon />
            Thêm cột
          </Button>
        }
      />

      {/* Info banner */}
      <div className='flex items-start gap-3 p-4 rounded-sm bg-card border border-border mb-4'>
        <LayoutListIcon size={16} className='text-muted-foreground shrink-0 mt-0.5' />
        <div className='text-[12px] text-muted-foreground'>
          Các cột Kanban dùng để phân nhóm task theo trạng thái. Cột được đánh dấu <span className='text-white'>Hoàn thành</span> sẽ tự động tính task bên trong là done. Nếu chưa có cột nào, hệ thống sẽ dùng{' '}
          <span className='text-white'>default columns</span>.
        </div>
      </div>

      {/* Columns list */}
      <div className='bg-card border border-border panel overflow-hidden'>
        {sortedColumns.length === 0 ? (
          <div className='py-14 text-center text-[13px] text-muted-foreground'>Chưa có cột nào. Nhấn &ldquo;Thêm cột&rdquo; để tạo.</div>
        ) : (
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-4'>Thứ tự</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Cột</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Màu</th>
                <th className='text-left text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3'>Tasks</th>
                <th className='text-right text-[12px] font-mono-dm text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-4'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedColumns.map((col) => {
                const taskCount = tasks.filter((t) => t.status === col.id).length;
                return (
                  <tr key={col.id} className='border-b border-border last:border-0 hover:bg-secondary transition-colors'>
                    <td className='py-3 px-4'>
                      <span className='font-mono-dm text-[12px] text-muted-foreground'>{col.order}</span>
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
                      <span className='font-mono-dm text-[12px] text-muted-foreground'>{taskCount}</span>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center justify-end'>
                        <TableActionsMenu
                          actions={[
                            editAction(() => {
                              setEditingColumn(col);
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
        <TaskColumnDialog
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
          title='Xoá cột Kanban'
          message={`Xoá cột "${sortedColumns.find((c) => c.id === deletingColumnId)?.title ?? ''}"? Các task trong cột này sẽ được chuyển sang cột đầu tiên.`}
          confirmLabel='Xoá cột'
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeletingColumnId(null)}
        />
      )}
    </div>
  );
}
