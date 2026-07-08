'use client';
import { SearchIcon, PlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface WikiFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterTag: string;
  onTagChange: (v: string) => void;
  tags: string[];
  filteredCount?: number;
  onCreate?: () => void;
}

export function WikiFilterBar({ search, onSearchChange, filterTag, onTagChange, tags, filteredCount, onCreate }: WikiFilterBarProps) {
  const isFiltered = search || filterTag !== 'all';

  return (
    <>
      <div className='flex items-center justify-between gap-4 flex-wrap rounded-sm overflow-hidden'>
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Search */}
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Tìm wiki...'
              className='pl-8 w-45'
            />
          </div>

          {/* Tag filter */}
          {tags.length > 0 && (
            <Select value={filterTag} onValueChange={onTagChange}>
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all' className='text-[12px]'>
                  Tất cả tags
                </SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag} className='text-[12px]'>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Create button */}
        {onCreate && (
          <Button onClick={onCreate} size='sm' className='gap-2'>
            <PlusIcon size={15} /> Tạo Wiki
          </Button>
        )}
      </div>

      {/* Filter result count */}
      {isFiltered && filteredCount !== undefined && (
        <p className='text-[12px] text-muted-foreground mt-2'>
          {filteredCount} wiki
          {search && ` · Tìm kiếm "${search}"`}
        </p>
      )}
    </>
  );
}
