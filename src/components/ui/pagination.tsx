'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className='flex items-center justify-between gap-4 px-1 py-3'>
      <span className='text-[12px] text-muted-foreground'>
        Hiển thị <span className='text-foreground font-medium'>{start}–{end}</span> trong{' '}
        <span className='text-foreground font-medium'>{total}</span>
      </span>

      {totalPages > 1 && (
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-xs'
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className='text-muted-foreground hover:text-foreground disabled:opacity-30'
          >
            <ChevronLeftIcon size={14} />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size='icon-xs'
              onClick={() => onPageChange(p)}
              className={p === page ? '' : 'text-muted-foreground hover:text-foreground'}
            >
              {p}
            </Button>
          ))}

          <Button
            variant='ghost'
            size='icon-xs'
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className='text-muted-foreground hover:text-foreground disabled:opacity-30'
          >
            <ChevronRightIcon size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
