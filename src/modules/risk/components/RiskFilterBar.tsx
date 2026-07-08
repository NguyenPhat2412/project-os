'use client';
import { SearchIcon, ListIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Avatar } from '@/components/ui/avatar';
import type { RiskLevel } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

const ALL = 'all' as const;

const LEVEL_META: Record<RiskLevel, { textClass: string }> = {
  Critical: { textClass: 'text-[oklch(0.577_0.245_27.325)]' },
  High: { textClass: 'text-[#f59e0b]' },
  Medium: { textClass: 'text-primary' },
  Low: { textClass: 'text-[oklch(0.646_0.222_142.116)]' },
};

const RISK_STATUSES = ['Đang xử lý', 'Đang theo dõi', 'Đã giảm thiểu'] as const;

type ViewMode = 'list' | 'kanban';

interface RiskFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterLevel: RiskLevel | typeof ALL;
  onLevelChange: (v: RiskLevel | typeof ALL) => void;
  filterStatus: string | typeof ALL;
  onStatusChange: (v: string | typeof ALL) => void;
  filterOwner: string | typeof ALL;
  onOwnerChange: (v: string | typeof ALL) => void;
  groupBy: string;
  onGroupByChange: (v: string) => void;
  teamMembers: TeamMember[];
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  onCreate?: () => void;
  filteredRisksCount?: number;
}

export function RiskFilterBar({
  search,
  onSearchChange,
  filterLevel,
  onLevelChange,
  filterStatus,
  onStatusChange,
  filterOwner,
  onOwnerChange,
  groupBy,
  onGroupByChange,
  teamMembers,
  view,
  onViewChange,
  onCreate,
  filteredRisksCount,
}: RiskFilterBarProps) {
  const isFiltered = search || filterLevel !== ALL || filterStatus !== ALL || filterOwner !== ALL;

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap rounded-sm overflow-hidden'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm rủi ro...' className='pl-8 w-45' />
          </div>

          <Select value={filterLevel} onValueChange={(val) => onLevelChange(val as RiskLevel | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL} className='text-[12px]'>
                  Tất cả mức độ
                </SelectItem>
                <SelectItem value='Critical'>
                  <ChevronUpIcon size={12} className={`mr-1 ${LEVEL_META.Critical.textClass}`} />
                  <span className={LEVEL_META.Critical.textClass}>Critical</span>
                </SelectItem>
                <SelectItem value='High'>
                  <ChevronUpIcon size={12} className={`mr-1 ${LEVEL_META.High.textClass}`} />
                  <span className={LEVEL_META.High.textClass}>High</span>
                </SelectItem>
                <SelectItem value='Medium'>
                  <ChevronDownIcon size={12} className={`mr-1 ${LEVEL_META.Medium.textClass}`} />
                  <span className={LEVEL_META.Medium.textClass}>Medium</span>
                </SelectItem>
                <SelectItem value='Low'>
                  <ChevronDownIcon size={12} className={`mr-1 ${LEVEL_META.Low.textClass}`} />
                  <span className={LEVEL_META.Low.textClass}>Low</span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(val) => onStatusChange(val as string | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả trạng thái
              </SelectItem>
              {RISK_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className='text-[12px]'>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOwner} onValueChange={(val) => onOwnerChange(val as string | typeof ALL)}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả owner
              </SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id} className='text-[12px]'>
                  <div className='flex items-center gap-1.5'>
                    <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                    <span>{m.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={onGroupByChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none' className='text-[12px]'>
                Không nhóm
              </SelectItem>
              <SelectItem value='level' className='text-[12px]'>
                Mức độ
              </SelectItem>
              <SelectItem value='status' className='text-[12px]'>
                Trạng thái
              </SelectItem>
              <SelectItem value='owner' className='text-[12px]'>
                Owner
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
      {isFiltered && filteredRisksCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredRisksCount} rủi ro
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
