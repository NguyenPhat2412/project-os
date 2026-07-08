'use client';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface GroupSectionHeaderProps {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  colSpan: number; // full table column span for the header row
}

export function GroupSectionHeader({ label, count, collapsed, onToggle, colSpan }: GroupSectionHeaderProps) {
  return (
    <tr onClick={onToggle} className='bg-secondary hover:bg-secondary/80 cursor-pointer select-none border-b border-border transition-colors'>
      <td colSpan={colSpan} className='py-2 px-3'>
        <div className='flex items-center gap-2'>
          {collapsed ? <ChevronRight size={14} className='text-muted-foreground' /> : <ChevronDown size={14} className='text-muted-foreground' />}
          <span className='text-[12px] font-semibold text-foreground'>{label}</span>
          <span className='text-[12px] text-muted-foreground font-mono-dm'>({count})</span>
        </div>
      </td>
    </tr>
  );
}
