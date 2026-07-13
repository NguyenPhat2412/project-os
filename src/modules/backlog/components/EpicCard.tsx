'use client';
import { useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDateVi } from '@/lib/dayjs';
import type { EpicData, EpicItem, EpicStatus, UserStoryStatus } from '@/modules/backlog/types/backlog';
import type { TeamMember } from '@/modules/team/types/team';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

const epicStatusVariant: Record<EpicStatus, 'muted' | 'accent' | 'green' | 'yellow'> = {
  Planning: 'muted',
  'In Progress': 'accent',
  Done: 'green',
  'On Hold': 'yellow',
};
const storyStatusVariant: Record<UserStoryStatus, 'muted' | 'accent' | 'green' | 'red'> = {
  Todo: 'muted',
  'In Progress': 'accent',
  Done: 'green',
  Blocked: 'red',
};

interface Props {
  epic: EpicData;
  teamMembers: TeamMember[];
  onViewEpic?: (epic: EpicData) => void;
  onEditEpic: (epic: EpicData) => void;
  onAddStory: (epic: EpicData) => void;
  onViewStory?: (epic: EpicData, item: EpicItem) => void;
  onEditStory: (epic: EpicData, item: EpicItem) => void;
  onDeleteStory: (epic: EpicData, item: EpicItem) => void;
}

export function EpicCard({ epic, teamMembers, onViewEpic, onEditEpic, onAddStory, onViewStory, onEditStory, onDeleteStory }: Props) {
  const doneCount = epic.items.filter((i) => i.status === 'Done').length;
  const [delItem, setDelItem] = useState<EpicItem | null>(null);
  const deleteTarget = delItem ? epic.items.find((i) => i.id === delItem.id) : null;

  return (
    <>
      {delItem && deleteTarget && (
        <ConfirmDialog
          danger
          title='Xoá User Story'
          message={`Bạn có chắc muốn xoá "${deleteTarget.label}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá'
          onCancel={() => setDelItem(null)}
          onConfirm={() => {
            onDeleteStory(epic, deleteTarget);
            setDelItem(null);
          }}
        />
      )}

      <div className='bg-card border border-border panel mb-4 overflow-hidden'>
        {/* ── Epic header ─────────────────────────────────────────────────────── */}
        <div className='flex items-center gap-3 p-[16px_20px] hover:bg-secondary transition-colors group'>
          <button onClick={() => onViewEpic?.(epic)} className='flex-1 flex items-center gap-3 cursor-pointer bg-transparent border-none text-left min-w-0'>
            <span className='text-[18px] shrink-0'>{epic.icon}</span>
            <span className='font-sans text-[14px] font-bold text-foreground truncate'>{epic.name}</span>
            <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{epic.id}</span>
            <PageBadge variant={TASK_PRIORITY_META[epic.priority].badgeVariant}>{epic.priority}</PageBadge>
            <PageBadge variant={epicStatusVariant[epic.status]}>{epic.status}</PageBadge>
            {epic.dueDate && <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{formatDateVi(epic.dueDate, 'DD/MM/YYYY')}</span>}
            <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0 ml-auto'>
              {doneCount}/{epic.itemCount} · {epic.storyPoints} pts
            </span>
          </button>
          <div className='flex items-center gap-1 shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) => {
                e.stopPropagation();
                onAddStory(epic);
              }}
              className='h-7 px-2.5 text-[12px] gap-1 text-primary hover:bg-primary/10'
            >
              <PlusIcon size={12} /> Thêm Story
            </Button>
            <Button
              variant='ghost'
              size='icon-xs'
              onClick={(e) => {
                e.stopPropagation();
                onEditEpic(epic);
              }}
              title='Chỉnh sửa Epic'
              className='text-muted-foreground hover:text-foreground'
            >
              <PencilIcon size={12} />
            </Button>
          </div>
        </div>

        {/* ── User Stories table ───────────────────────────────────────────────── */}
        <div className='border-t border-border'>
          <Table>
            <TableHeader>
              <TableRow className='border-border hover:bg-transparent'>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>ID</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>User Story</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>Trạng thái</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>Ưu tiên</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>Người xử lý</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>Bắt đầu</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4'>Kết thúc</TableHead>
                <TableHead className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4 text-right'>Pts</TableHead>
                <TableHead className='py-2 px-4 w-px' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {epic.items.length === 0 ? (
                <TableRow className='border-border hover:bg-transparent'>
                  <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                    <div className='flex flex-col items-center gap-2'>
                      <span className='text-[13px]'>Chưa có user story nào.</span>
                      <Button variant='ghost' size='sm' onClick={() => onAddStory(epic)} className='text-primary hover:bg-primary/10 text-[12px] h-7 gap-1'>
                        <PlusIcon size={12} /> Thêm user story đầu tiên
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                epic.items.map((item) => {
                  const assignee = teamMembers.find((m) => m.id === item.assigneeId);
                  return (
                    <TableRow key={item.id} className='border-border hover:bg-secondary transition-colors group/row'>
                      <TableCell className='font-mono-dm text-[12px] text-primary py-3 px-4 whitespace-nowrap'>{item.id}</TableCell>
                      <TableCell className='py-3 px-4 max-w-72'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewStory?.(epic, item);
                          }}
                          className={`text-left text-[13px] line-clamp-2 w-full ${item.status === 'Done' ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary'} transition-colors`}
                        >
                          {item.label}
                        </button>
                      </TableCell>
                      <TableCell className='py-3 px-4 whitespace-nowrap'>
                        <PageBadge variant={storyStatusVariant[item.status]}>{item.status}</PageBadge>
                      </TableCell>
                      <TableCell className='py-3 px-4 whitespace-nowrap'>
                        <PageBadge variant={TASK_PRIORITY_META[item.priority].badgeVariant}>{item.priority}</PageBadge>
                      </TableCell>
                      <TableCell className='py-3 px-4 whitespace-nowrap'>
                        {assignee ? (
                          <div className='flex items-center gap-1.5'>
                            <Avatar initials={assignee.initials} gradient={assignee.gradient} size='sm' />
                            <span className='text-[12px]'>{assignee.name}</span>
                          </div>
                        ) : (
                          <span className='text-[12px] text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='font-mono-dm text-[12px] text-muted-foreground py-3 px-4 whitespace-nowrap'>{item.startDate ? formatDateVi(item.startDate, 'DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell className='font-mono-dm text-[12px] text-muted-foreground py-3 px-4 whitespace-nowrap'>{item.dueDate ? formatDateVi(item.dueDate, 'DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell className='font-mono-dm text-[12px] text-muted-foreground py-3 px-4 text-right whitespace-nowrap'>{item.points ?? 0} pt</TableCell>
                      <TableCell className='py-3 px-4 w-px'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStory(epic, item);
                            }}
                            title='Chỉnh sửa'
                            className='text-muted-foreground hover:text-foreground'
                          >
                            <PencilIcon size={12} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            onClick={(e) => {
                              e.stopPropagation();
                              setDelItem(item);
                            }}
                            title='Xoá'
                            className='text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                          >
                            <Trash2Icon size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
