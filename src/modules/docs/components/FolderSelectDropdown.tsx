'use client';

import { useMemo } from 'react';
import { FolderIcon, FolderOpenIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { FolderWithId } from '@/modules/docs/collections/folders';

interface FolderSelectDropdownProps {
  value: string | undefined;
  folders: FolderWithId[];
  onChange: (folderId: string | undefined) => void;
  disabled?: boolean;
  /** Folder ID to exclude from selection + its descendants (use when editing a folder) */
  excludeId?: string;
}

// ── helpers ────────────────────────────────────────────────────────────────────
function childrenOf(folders: FolderWithId[], parentId: string): FolderWithId[] {
  return folders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order);
}

// ── 10-level unrolled iterative renderer ─────────────────────────────────────
// Each render function renders items at that depth and recurses to the next depth (max depth 9).
// Depth 0 is the root level, rendered inline. Depth 1–9 are inside DropdownMenuSub.

function renderDepth1(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '22px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '22px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth2(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth2(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '36px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '36px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth3(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth3(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '50px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '50px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth4(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth4(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '64px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '64px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth5(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth5(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '78px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '78px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth6(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth6(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '92px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '92px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth7(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth7(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '106px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '106px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth8(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

function renderDepth8(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => {
    const grandkids = childrenOf(folders, kid.id);
    if (grandkids.length === 0) {
      return (
        <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '120px' }} onSelect={() => onChange(kid.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={kid.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '120px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{kid.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth9(folders, kid.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

// Depth 9 — final level (10 total: 0–9). Renders leaf items only, no further nesting.
function renderDepth9(folders: FolderWithId[], parentId: string, onChange: (id: string) => void) {
  const kids = childrenOf(folders, parentId);
  return kids.map((kid) => (
    <DropdownMenuItem key={kid.id} className='cursor-pointer' style={{ paddingLeft: '134px' }} onSelect={() => onChange(kid.id)}>
      <FolderIcon size={13} className='shrink-0 text-amber-600' />
      <span className='flex-1 truncate'>{kid.name}</span>
    </DropdownMenuItem>
  ));
}

// ── depth-0 inline renderer (root level items) ────────────────────────────────
function renderDepth0(folders: FolderWithId[], onChange: (id: string) => void): React.ReactNode {
  const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order);

  return rootFolders.map((folder) => {
    const kids = childrenOf(folders, folder.id);
    if (kids.length === 0) {
      return (
        <DropdownMenuItem key={folder.id} className='cursor-pointer' style={{ paddingLeft: '8px' }} onSelect={() => onChange(folder.id)}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{folder.name}</span>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuSub key={folder.id}>
        <DropdownMenuSubTrigger className='cursor-pointer' style={{ paddingLeft: '8px' }} onClick={(e) => e.preventDefault()}>
          <FolderIcon size={13} className='shrink-0 text-amber-600' />
          <span className='flex-1 truncate'>{folder.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4}>
          {renderDepth1(folders, folder.id, onChange)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  });
}

// ── component ──────────────────────────────────────────────────────────────────
export function FolderSelectDropdown({ value, folders, onChange, disabled, excludeId }: FolderSelectDropdownProps) {
  const selected = useMemo(() => folders.find((f) => f.id === value), [folders, value]);

  // Exclude folder + its entire subtree from selectable options
  const excludedIds = useMemo(() => {
    if (!excludeId) return new Set<string>();
    const excluded = new Set<string>([excludeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of folders) {
        if (f.parentId && excluded.has(f.parentId) && !excluded.has(f.id)) {
          excluded.add(f.id);
          changed = true;
        }
      }
    }
    return excluded;
  }, [folders, excludeId]);

  const selectableFolders = useMemo(
    () => folders.filter((f) => !excludedIds.has(f.id)),
    [folders, excludedIds],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant='outline' size='sm' className='h-9 justify-start text-[13px] gap-2 w-full'>
          {selected ? (
            <>
              <FolderOpenIcon size={13} className='text-amber-600 shrink-0' />
              <span className='flex-1 truncate text-left'>{selected.name}</span>
            </>
          ) : (
            <>
              <span className='flex-1 truncate text-left text-muted-foreground'>— Thư mục gốc —</span>
            </>
          )}
          <ChevronRightIcon size={13} className='shrink-0 text-muted-foreground rotate-90' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4} align='start' className='w-64 max-h-80 overflow-y-auto'>
        {/* Root-level option */}
        <DropdownMenuItem className='cursor-pointer' style={{ paddingLeft: '8px' }} onSelect={() => onChange(undefined)}>
          <FolderIcon size={13} className='shrink-0 text-muted-foreground' />
          <span className='flex-1 truncate text-muted-foreground'>— Thư mục gốc —</span>
        </DropdownMenuItem>

        {/* Folder tree — depth 0–9 via unrolled iterative chain */}
        {renderDepth0(selectableFolders, onChange)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
