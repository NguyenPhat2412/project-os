'use client';

import { useState, useMemo } from 'react';
import { ChevronRightIcon, FolderIcon, FolderOpenIcon, FileTextIcon, PlusIcon, Trash2Icon, MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import type { FolderWithId } from '@/modules/docs/collections/folders';
import type { DocWithId } from '@/modules/docs/collections/documents';

interface FolderTreeProps {
  folders: FolderWithId[];
  documents: DocWithId[];
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderTree({
  folders,
  documents,
  activeFolderId,
  onFolderSelect,
  onCreateFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const docCount = (folderId: string) => documents.filter((d) => d.folderId === folderId).length;
  const rootFolders = useMemo(() => folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order), [folders]);
  const childrenOf = (parentId: string) => folders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order);

  const renderFolder = (folder: FolderWithId, depth = 0): React.ReactNode => {
    const kids = childrenOf(folder.id);
    const hasChildren = kids.length > 0;
    const isExpanded = expanded.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const count = docCount(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={[
            'group flex items-center gap-1.5 py-1.5 pr-1 rounded-sm cursor-pointer transition-colors text-[13px]',
            isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground',
          ].join(' ')}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {/* Expand/collapse */}
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); toggle(folder.id); }}
            className='shrink-0 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-primary/20 transition-colors'
          >
            {hasChildren && (
              <ChevronRightIcon size={11} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            )}
          </button>

          {/* Icon */}
          {isExpanded && hasChildren ? (
            <FolderOpenIcon size={13} className='shrink-0 text-amber-600' />
          ) : (
            <FolderIcon size={13} className='shrink-0 text-amber-600' />
          )}

          {/* Name */}
          <span className='flex-1 truncate'>{folder.name}</span>

          {/* Count badge */}
          {count > 0 && (
            <span className='shrink-0 font-mono-dm text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm'>
              {count}
            </span>
          )}

          {/* Delete */}
          <button
            type='button'
            title='Xoá thư mục'
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(folder.id); }}
            className='shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all'
          >
            <Trash2Icon size={11} />
          </button>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {kids.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='bg-card border border-border panel'>
      <div className='px-3 pt-3 pb-1'>
        <div className='flex items-center justify-between'>
          <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>Thư mục</p>
          <button
            onClick={onCreateFolder}
            className='w-5 h-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'
            title='Tạo thư mục'
          >
            <PlusIcon size={13} />
          </button>
        </div>
      </div>

      <div className='px-1 pb-2'>
        {/* All Documents */}
        <div
          className={[
            'group flex items-center gap-1.5 py-1.5 pr-1 rounded-sm cursor-pointer transition-colors text-[13px]',
            activeFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground',
          ].join(' ')}
          style={{ paddingLeft: '8px' }}
          onClick={() => onFolderSelect(null)}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFolderSelect(null); }}
        >
          <span className='shrink-0 w-4' />
          <FileTextIcon size={13} className='shrink-0 text-muted-foreground' />
          <span className='flex-1'>Tất cả tài liệu</span>
          <span className='shrink-0 font-mono-dm text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm'>
            {documents.length}
          </span>
        </div>

        {/* Root-level folders */}
        {rootFolders.map((folder) => renderFolder(folder))}

        {folders.length === 0 && (
          <div className='py-4 text-center'>
            <p className='text-[12px] text-muted-foreground'>Chưa có thư mục nào.</p>
            <Button size='xs' variant='outline' className='mt-2' onClick={onCreateFolder}>
              <PlusIcon size={12} /> Tạo thư mục
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        danger
        title='Xoá thư mục'
        message={`Bạn có chắc muốn xoá thư mục này? Các tài liệu bên trong sẽ được chuyển lên cấp gốc.`}
        confirmLabel='Xoá thư mục'
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            onDeleteFolder(confirmDelete);
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}
