'use client';

import { ChevronRightIcon, FolderIcon } from 'lucide-react';
import type { FolderWithId } from '@/modules/docs/collections/folders';

interface FolderBreadcrumbProps {
  activeFolderId: string | null;
  folders: FolderWithId[];
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumb({ activeFolderId, folders, onNavigate }: FolderBreadcrumbProps) {
  if (!activeFolderId) return null;

  // Build breadcrumb path from active folder up to root
  const path: FolderWithId[] = [];
  let current: FolderWithId | undefined = folders.find((f) => f.id === activeFolderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined;
  }

  return (
    <div className='flex items-center gap-1 text-[12px] text-muted-foreground'>
      <button
        onClick={() => onNavigate(null)}
        className='hover:text-primary transition-colors'
      >
        Tất cả
      </button>
      {path.map((folder, i) => (
        <span key={folder.id} className='flex items-center gap-1'>
          <ChevronRightIcon size={11} className='opacity-50' />
          <button
            onClick={() => onNavigate(folder.id)}
            className={['flex items-center gap-1 hover:text-primary transition-colors', i === path.length - 1 ? 'font-medium text-foreground' : ''].join(' ')}
          >
            <FolderIcon size={11} className='text-amber-600' />
            {folder.name}
          </button>
        </span>
      ))}
    </div>
  );
}
