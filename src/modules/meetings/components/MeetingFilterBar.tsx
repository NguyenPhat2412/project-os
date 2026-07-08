'use client';
import { SearchIcon, ListIcon, LayoutGridIcon, CalendarIcon, PlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';

type ViewMode = 'list' | 'card' | 'calendar';
const ALL = 'all' as const;

interface MeetingFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterMonth: string;
  onMonthChange: (v: string) => void;
  filterAttendee: string;
  onAttendeeChange: (v: string) => void;
  filterImportant: boolean | null;
  onImportantChange: (v: boolean | null) => void;
  meetings: (Meeting & { id: string })[];
  teamMembers: TeamMember[];
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onCreate: () => void;
  filteredCount?: number;
}

export function MeetingFilterBar({
  search,
  onSearchChange,
  filterMonth,
  onMonthChange,
  filterAttendee,
  onAttendeeChange,
  filterImportant,
  onImportantChange,
  meetings,
  teamMembers,
  view,
  onViewChange,
  onCreate,
  filteredCount,
}: MeetingFilterBarProps) {
  // Derive unique months from meetings data
  const months = [...new Set(meetings.map((m) => `${m.month}/${m.year}`))].sort((a, b) => {
    const [ma, ya] = a.split('/');
    const [mb, yb] = b.split('/');
    return new Date(`${ya}-${ma}`).getTime() - new Date(`${yb}-${mb}`).getTime();
  });

  const isFiltered = search || filterMonth !== ALL || filterAttendee !== ALL || filterImportant !== null;

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        {/* ── Filters ── */}
        <div className='flex items-center gap-2 flex-wrap'>

          {/* Search */}
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Tìm cuộc họp...'
              className='pl-8 w-45'
            />
          </div>

          {/* Month filter */}
          <Select value={filterMonth} onValueChange={onMonthChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả tháng
              </SelectItem>
              {months.map((m) => {
                const [month, year] = m.split('/');
                return (
                  <SelectItem key={m} value={m} className='text-[12px]'>
                    {month}/{year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Attendee filter */}
          {teamMembers.length > 0 && (
            <Select value={filterAttendee} onValueChange={onAttendeeChange}>
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className='text-[12px]'>
                  Tất cả người tham dự
                </SelectItem>
                {teamMembers.map((tm) => (
                  <SelectItem key={tm.id} value={tm.id} className='text-[12px]'>
                    {tm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Important filter */}
          <Select
            value={filterImportant === null ? ALL : filterImportant ? 'true' : 'false'}
            onValueChange={(v) => onImportantChange(v === ALL ? null : v === 'true')}
          >
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả
              </SelectItem>
              <SelectItem value='true' className='text-[12px]'>
                Quan trọng
              </SelectItem>
              <SelectItem value='false' className='text-[12px]'>
                Bình thường
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
                { id: 'calendar' as ViewMode, icon: <CalendarIcon size={14} />, label: 'Lịch' },
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
          <Button
            onClick={onCreate}
            size='sm'
            className='gap-2'
          >
            <PlusIcon size={15} /> Thêm cuộc họp
          </Button>
        </div>
      </div>

      {/* ── Filter result count ── */}
      {isFiltered && filteredCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredCount} cuộc họp
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
