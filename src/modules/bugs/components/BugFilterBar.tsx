'use client';
import { SearchIcon, ListIcon, LayoutGridIcon, PlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { BugColumn } from '@/modules/bugs/types/bug';
import type { Sprint } from '@/modules/sprint/types/sprint';

type ViewMode = 'list' | 'kanban';

const ALL = 'all' as const;

interface BugFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterSeverity: string;
  onSeverityChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  filterSprint: string | typeof ALL;
  onSprintChange: (v: string | typeof ALL) => void;
  columns: BugColumn[];
  sprints: (Sprint & { id: string })[];
  groupBy: string;
  onGroupByChange: (v: string) => void;
  filteredBugsCount?: number;
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  onCreate?: () => void;
}

export function BugFilterBar({
  search,
  onSearchChange,
  filterSeverity,
  onSeverityChange,
  filterStatus,
  onStatusChange,
  filterSprint,
  onSprintChange,
  columns,
  sprints,
  groupBy,
  onGroupByChange,
  filteredBugsCount,
  view,
  onViewChange,
  onCreate,
}: BugFilterBarProps) {
  const isFiltered = search || filterSeverity !== 'all' || filterStatus !== 'all' || filterSprint !== 'all';

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap rounded-sm overflow-hidden'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm bug...' className='pl-8 w-45' />
          </div>

          <Select value={filterSeverity} onValueChange={onSeverityChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả mức độ
              </SelectItem>
              <SelectItem value='Critical' className='text-[12px]'>
                Critical
              </SelectItem>
              <SelectItem value='High' className='text-[12px]'>
                High
              </SelectItem>
              <SelectItem value='Medium' className='text-[12px]'>
                Medium
              </SelectItem>
              <SelectItem value='Low' className='text-[12px]'>
                Low
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả trạng thái
              </SelectItem>
              {columns.map((c) => (
                <SelectItem key={c.id} value={c.id} className='text-[12px]'>
                  {c.title}
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
              <SelectItem value='severity' className='text-[12px]'>
                Mức độ
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
            <Button onClick={onCreate} variant='default' className='gap-2'>
              <PlusIcon size={15} /> Tạo mới
            </Button>
          )}
        </div>
      </div>

      {/* ── Filter result count ── */}
      {isFiltered && filteredBugsCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredBugsCount} bugs
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
