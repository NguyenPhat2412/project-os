'use client';
import { SearchIcon, ListIcon, LayoutGridIcon, CalendarDaysIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, MinusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { Priority, TaskColumn } from '@/modules/tasks/types/task';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

type ViewMode = 'list' | 'kanban' | 'calendar';

const ALL = 'all' as const;

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterPriority: Priority | typeof ALL;
  onPriorityChange: (v: Priority | typeof ALL) => void;
  filterStatus: string | typeof ALL;
  onStatusChange: (v: string | typeof ALL) => void;
  filterSprint: string | typeof ALL;
  onSprintChange: (v: string | typeof ALL) => void;
  columns: TaskColumn[];
  sprints: (Sprint & { id: string })[];
  groupBy: string;
  onGroupByChange: (v: string) => void;
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  onCreate?: () => void;
  filteredTasksCount?: number;
}

export function TaskFilterBar({
  search,
  onSearchChange,
  filterPriority,
  onPriorityChange,
  filterStatus,
  onStatusChange,
  filterSprint,
  onSprintChange,
  columns,
  sprints,
  groupBy,
  onGroupByChange,
  view,
  onViewChange,
  onCreate,
  filteredTasksCount,
}: TaskFilterBarProps) {
  const activeFilterStatus = filterStatus !== ALL && columns.some((column) => column.id === filterStatus) ? filterStatus : ALL;
  const isFiltered = search || filterPriority !== ALL || activeFilterStatus !== ALL || filterSprint !== ALL;

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap rounded-sm overflow-hidden'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm task...' className='pl-8 w-45' />
          </div>

          <Select value={filterPriority} onValueChange={(val) => onPriorityChange(val as Priority | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL} className='text-[12px]'>
                  Tất cả ưu tiên
                </SelectItem>
                <SelectItem value='High'>
                  <ChevronUpIcon size={12} className={`mr-1 ${TASK_PRIORITY_META.High.textClass}`} />
                  <span className={TASK_PRIORITY_META.High.textClass}>High</span>
                </SelectItem>
                <SelectItem value='Normal'>
                  <MinusIcon size={12} className={`mr-1 ${TASK_PRIORITY_META.Normal.textClass}`} />
                  <span className={TASK_PRIORITY_META.Normal.textClass}>Normal</span>
                </SelectItem>
                <SelectItem value='Low'>
                  <ChevronDownIcon size={12} className={`mr-1 ${TASK_PRIORITY_META.Low.textClass}`} />
                  <span className={TASK_PRIORITY_META.Low.textClass}>Low</span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={activeFilterStatus} onValueChange={(val) => onStatusChange(val as string | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả trạng thái
              </SelectItem>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id} className='text-[12px]'>
                  {column.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sprints.length > 0 && (
            <Select value={filterSprint} onValueChange={onSprintChange}>
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className='text-[12px]'>
                  Tất cả sprint
                </SelectItem>
                <SelectItem value='none' className='text-[12px]'>
                  Chưa có sprint
                </SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={s.id} className='text-[12px]'>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={groupBy} onValueChange={onGroupByChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none' className='text-[12px]'>
                Không nhóm
              </SelectItem>
              <SelectItem value='status' className='text-[12px]'>
                Trạng thái
              </SelectItem>
              <SelectItem value='priority' className='text-[12px]'>
                Ưu tiên
              </SelectItem>
              <SelectItem value='assignee' className='text-[12px]'>
                Người xử lý
              </SelectItem>
              <SelectItem value='sprint' className='text-[12px]'>
                Sprint
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── View Mode & Create Button ── */}
        <div className='flex items-center gap-2'>
          {view && onViewChange && (
            <ButtonGroup>
              {(
                [
                  { id: 'list' as ViewMode, icon: <ListIcon size={14} />, label: 'Danh sách' },
                  { id: 'kanban' as ViewMode, icon: <LayoutGridIcon size={14} />, label: 'Kanban' },
                  { id: 'calendar' as ViewMode, icon: <CalendarDaysIcon size={14} />, label: 'Lịch' },
                ] as { id: ViewMode; icon: React.ReactNode; label: string }[]
              ).map((v) => (
                <Button key={v.id} variant={view === v.id ? 'default' : 'outline'} onClick={() => onViewChange(v.id)}>
                  {v.icon}
                  {v.label}
                </Button>
              ))}
            </ButtonGroup>
          )}
          {onCreate && (
            <Button onClick={onCreate} className='gap-2'>
              <PlusIcon size={15} /> Tạo mới
            </Button>
          )}
        </div>
      </div>

      {/* ── Filter result count ── */}
      {isFiltered && filteredTasksCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredTasksCount} tasks
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
