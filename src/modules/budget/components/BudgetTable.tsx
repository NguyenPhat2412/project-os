'use client';
import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { budgetItemsCollection } from '@/modules/budget/collections/budget';
import type { BudgetItem } from '@/modules/budget/types/budget';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import { BudgetItemModal } from './BudgetItemModal';
import { formatCurrencyVND } from '@/lib/numberjs';

interface BudgetTableProps {
  budgetItems: BudgetItem[];
  onSuccess: () => void;
}

export function BudgetTable({ budgetItems, onSuccess }: BudgetTableProps) {
  const createBudgetItem = budgetItemsCollection.useCreate();
  const updateBudgetItem = budgetItemsCollection.useUpdate();
  const deleteBudgetItem = budgetItemsCollection.useDelete();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [delItem, setDelItem] = useState<BudgetItem | null>(null);

  const handleAdd = async (data: Omit<BudgetItem, 'id'>) => {
    await createBudgetItem.mutateAsync({ ...data, order: Date.now() } as never);
    onSuccess();
  };

  const handleEdit = async (data: Omit<BudgetItem, 'id'>) => {
    if (!editItem) return;
    await updateBudgetItem.mutateAsync({ id: editItem.id, data: data as never });
    onSuccess();
  };

  const handleDelete = async () => {
    if (!delItem) return;
    await deleteBudgetItem.mutateAsync(delItem.id);
    onSuccess();
  };

  return (
    <>
      {showAdd && <BudgetItemModal mode='add' onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editItem && <BudgetItemModal mode='edit' item={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {delItem && <ConfirmDialog danger title='Xóa hạng mục' message={`Bạn có chắc muốn xóa hạng mục "${delItem.category}"? Hành động này không thể hoàn tác.`} confirmLabel='Xóa hạng mục' onCancel={() => setDelItem(null)} onConfirm={handleDelete} />}

      <div className='bg-card border border-border panel p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className='font-sans text-[16px] font-bold'>Phân bổ ngân sách</div>
          <Button onClick={() => setShowAdd(true)} className='gap-1.5 text-[12px] px-3'>
            <PlusIcon size={13} /> Thêm hạng mục
          </Button>
        </div>

        {budgetItems.length === 0 && <div className='py-10 text-center text-[13px] text-muted-foreground'>Chưa có hạng mục nào. Nhấn &quot;Thêm hạng mục&quot; để bắt đầu.</div>}

        {budgetItems.map((item) => (
          <div key={item.id} className='mb-4 group'>
            <div className='flex items-center gap-2 mb-1'>
              <span>{item.icon}</span>
              <span className='flex-1 text-[13px]'>{item.category}</span>
              <TableActionsMenu actions={[editAction(() => setEditItem(item)), deleteAction(() => setDelItem(item))]} />
              <span className='font-mono-dm text-[12px] text-muted-foreground'>
                {formatCurrencyVND(item.spent)} / {formatCurrencyVND(item.budget)}
              </span>
            </div>
            <ProgressBar label='' value={Math.round((item.spent / item.budget) * 100)} noMargin color={item.spent / item.budget > 0.85 ? 'oklch(0.577 0.245 27.325)' : 'var(--primary)'} />
          </div>
        ))}
      </div>
    </>
  );
}
