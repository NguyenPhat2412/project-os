'use client';
import { SearchIcon, PlusIcon, ListIcon, LayoutGridIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

type ViewMode = 'list' | 'grid';

const ALL = 'all' as const;

interface DocumentFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterType: string;
  onTypeChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  docTypes?: string[];
  filteredCount?: number;
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  onCreate?: () => void;
}

export function DocumentFilterBar({ search, onSearchChange, filterType, onTypeChange, filterStatus, onStatusChange, docTypes = [], filteredCount, view, onViewChange, onCreate }: DocumentFilterBarProps) {
  const isFiltered = search || filterType !== ALL || filterStatus !== ALL;

  const defaultTypes = ['PDF', 'Doc', 'Sheet', 'Slide', 'Image', 'Video', 'Archive', 'Other'];

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap rounded-sm overflow-hidden'>
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Search */}
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm tài liệu...' className='pl-8 w-45' />
          </div>

          {/* Type filter */}
          <Select value={filterType} onValueChange={onTypeChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả loại
              </SelectItem>
              {(docTypes.length > 0 ? docTypes : defaultTypes).map((type) => (
                <SelectItem key={type} value={type} className='text-[12px]'>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className='text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className='text-[12px]'>
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value='active' className='text-[12px]'>
                Đang dùng
              </SelectItem>
              <SelectItem value='archived' className='text-[12px]'>
                Đã lưu trữ
              </SelectItem>
            </SelectContent>
          </Select>

        </div>

        {/* View mode & Create button */}
        <div className='flex items-center gap-2'>
          {view && onViewChange && (
            <ButtonGroup>
              {(
                [
                  { id: 'list' as ViewMode, icon: <ListIcon size={14} />, label: 'Danh sách' },
                  { id: 'grid' as ViewMode, icon: <LayoutGridIcon size={14} />, label: 'Lưới' },
                ] as { id: ViewMode; icon: React.ReactNode; label: string }[]
              ).map((v) => (
                <Button key={v.id} variant={view === v.id ? 'default' : 'outline'} size='sm' onClick={() => onViewChange(v.id)}>
                  {v.icon} {v.label}
                </Button>
              ))}
            </ButtonGroup>
          )}
          {onCreate && (
            <Button onClick={onCreate} size='sm' className='gap-2'>
              <PlusIcon size={15} /> Thêm mới
            </Button>
          )}
        </div>
      </div>

      {/* Filter result count */}
      {isFiltered && filteredCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredCount} tài liệu
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
