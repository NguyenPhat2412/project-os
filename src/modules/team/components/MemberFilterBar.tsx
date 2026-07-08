'use client';
import { SearchIcon, ListIcon, LayoutGridIcon, PlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { TeamMember, WorkloadStatus } from '@/modules/team/types/team';

type ViewMode = 'list' | 'card';

const ALL = 'all' as const;

interface MemberFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterRole: string;
  onRoleChange: (v: string) => void;
  filterStatus: WorkloadStatus | typeof ALL;
  onStatusChange: (v: WorkloadStatus | typeof ALL) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onCreate: () => void;
  members: TeamMember[];
  disabled?: boolean;
}

export function MemberFilterBar({ search, onSearchChange, filterRole, onRoleChange, filterStatus, onStatusChange, view, onViewChange, onCreate, members, disabled }: MemberFilterBarProps) {
  // Derive unique roles from data
  const roles = [...new Set(members.flatMap((m) => m.roles))].filter(Boolean).sort();

  const isFiltered = search || filterRole !== ALL || filterStatus !== ALL;

  return (
    <div>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        {/* ── Filters ── */}
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Search */}
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm thành viên...' className='pl-8 w-45' />
          </div>

          {/* Role filter */}
          {roles.length > 0 && (
            <Select value={filterRole} onValueChange={onRoleChange}>
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className='text-[12px]'>
                  Tất cả vai trò
                </SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role} className='text-[12px]'>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={(val) => onStatusChange(val as WorkloadStatus | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value='Active' className='text-[12px]'>
                Active
              </SelectItem>
              <SelectItem value='Busy' className='text-[12px]'>
                Busy
              </SelectItem>
              <SelectItem value='Overloaded' className='text-[12px]'>
                Overloaded
              </SelectItem>
              <SelectItem value='Vacant' className='text-[12px]'>
                Vacant
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── View Mode & Create Button ── */}
        <div className='flex items-center gap-2'>
          <ButtonGroup>
            {(
              [
                { id: 'list' as ViewMode, icon: <ListIcon size={14} />, label: 'Danh sách' },
                { id: 'card' as ViewMode, icon: <LayoutGridIcon size={14} />, label: 'Thẻ' },
              ] as { id: ViewMode; icon: React.ReactNode; label: string }[]
            ).map((v) => (
              <Button
                key={v.id}
                variant={view === v.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => onViewChange(v.id)}
              >
                {v.icon}
                {v.label}
              </Button>
            ))}
          </ButtonGroup>

          {/* Create button */}
          <Button onClick={onCreate} disabled={disabled} size='sm' className='gap-2'>
            <PlusIcon size={15} /> Thêm nhân sự
          </Button>
        </div>
      </div>

      {/* Filter result count */}
      {isFiltered && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {members.length} thành viên
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </div>
  );
}
