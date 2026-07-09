'use client';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

type ColorFilter = RoleDefinition['color'] | 'all';
const ALL = 'all' as const;

interface RoleFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterColor: ColorFilter;
  onColorChange: (v: ColorFilter) => void;
  rolesCount?: number;
  filteredRolesCount?: number;
  onCreate?: () => void;
  onCreateDefaults?: () => void;
}

export function RoleFilterBar({ search, onSearchChange, filterColor, onColorChange, rolesCount, filteredRolesCount, onCreate, onCreateDefaults }: RoleFilterBarProps) {
  const isFiltered = search || filterColor !== ALL;

  return (
    <div className='flex items-center justify-between gap-3 flex-wrap'>
      {/* Left: search + color filter + result count */}
      <div className='flex items-center gap-2 flex-wrap'>
        <div className='relative'>
          <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Tìm vai trò...' className='pl-8 w-45' />
        </div>

        <Select value={filterColor} onValueChange={(v) => onColorChange(v as ColorFilter)}>
          <SelectTrigger className='h-9' style={{ minWidth: 120 }}>
            <SelectValue placeholder='Tất cả màu' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả màu</SelectItem>
            <SelectItem value='default'>Xanh</SelectItem>
            <SelectItem value='secondary'>Phụ</SelectItem>
            <SelectItem value='destructive'>Đỏ</SelectItem>
            <SelectItem value='success'>Lục</SelectItem>
            <SelectItem value='warning'>Vàng</SelectItem>
            <SelectItem value='info'>Lam</SelectItem>
            <SelectItem value='purple'>Tím</SelectItem>
            <SelectItem value='orange'>Cam</SelectItem>
            <SelectItem value='rose'>Hồng</SelectItem>
            <SelectItem value='cyan'>Cyan</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && filteredRolesCount !== undefined && (
          <span className='text-[12px] text-muted-foreground'>{filteredRolesCount} vai trò</span>
        )}
        {!isFiltered && rolesCount !== undefined && (
          <span className='text-[12px] text-muted-foreground'>{rolesCount} vai trò</span>
        )}
      </div>

      {/* Right: default + add buttons */}
      <div className='flex items-center gap-2'>
        {onCreateDefaults && rolesCount === 0 && (
          <Button size='sm' variant='outline' onClick={onCreateDefaults} className='gap-1.5'>
            <PlusIcon size={11} /> Tạo mặc định
          </Button>
        )}
        {onCreate && (
          <Button size='sm' onClick={onCreate} className='gap-1.5'>
            <PlusIcon size={11} /> Thêm Role
          </Button>
        )}
      </div>
    </div>
  );
}
