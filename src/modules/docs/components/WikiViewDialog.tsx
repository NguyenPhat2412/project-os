'use client';
/**
 * WikiViewDialog
 * ──────────────
 * Read-only viewer for a wiki entry: markdown content + attachments table.
 * Opens as a full 90vw × 90vh dialog.
 */

import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, FileArchiveIcon, FileTextIcon, FileVideoIcon, ImageIcon, PaperclipIcon, PencilIcon } from 'lucide-react';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { ModalShell, CancelButton } from '@/components/ui/shared/modal-shell';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatFileSize } from '@/lib/numberjs';
import { useAttachmentViewer } from '@/components/ui/shared/use-attachment-viewer';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import type { Attachment } from '@/lib/types/attachment';

// ── helpers ───────────────────────────────────────────────────────────────────

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return <ImageIcon size={13} className='text-muted-foreground shrink-0' />;
  if (contentType.startsWith('video/')) return <FileVideoIcon size={13} className='text-muted-foreground shrink-0' />;
  if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('rar')) return <FileArchiveIcon size={13} className='text-muted-foreground shrink-0' />;
  return <FileTextIcon size={13} className='text-muted-foreground shrink-0' />;
}

// ── Attachments table ─────────────────────────────────────────────────────────

const TH = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-3 select-none';
const columnHelper = createColumnHelper<Attachment>();

function buildColumns(openAttachment: (att: Attachment) => void) {
  return [
    columnHelper.accessor('name', {
      header: 'Tên file',
      cell: (info) => (
        <button type='button' onClick={() => openAttachment(info.row.original)} className='flex items-center gap-2 group/link text-left w-full'>
          {fileIcon(info.row.original.contentType)}
          <span className='text-[12.5px] font-medium truncate group-hover/link:text-primary transition-colors'>{info.getValue()}</span>
        </button>
      ),
    }),
    columnHelper.accessor('size', {
      header: 'Kích thước',
      cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{formatFileSize(info.getValue())}</span>,
    }),
    columnHelper.accessor('uploadedAt', {
      header: 'Ngày tải',
      cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{info.getValue() ?? '—'}</span>,
    }),
  ];
}

function AttachmentsTable({ attachments, openAttachment }: { attachments: Attachment[]; openAttachment: (att: Attachment) => void }) {
  'use no memo';
  const data = useMemo(() => attachments, [attachments]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo(() => buildColumns(openAttachment), [openAttachment]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className='border-border hover:bg-transparent'>
            {hg.headers.map((h) => {
              const sorted = h.column.getIsSorted();
              return (
                <TableHead key={h.id} className={TH} onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
                  {h.column.getCanSort() ? (
                    <div className='flex items-center gap-1'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {sorted === 'asc' ? <ChevronUp size={11} /> : sorted === 'desc' ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className='opacity-40' />}
                    </div>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors'>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className='py-2.5 px-3'>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  wiki: WikiLink | null;
  onClose: () => void;
  onEdit: () => void;
}

export function WikiViewDialog({ open, wiki, onClose, onEdit }: Props) {
  const { openAttachment, viewerNode } = useAttachmentViewer();

  if (!wiki) return null;

  const hasContent = !!wiki.content?.trim();
  const hasAttachments = !!wiki.attachments?.length;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth='max-w-[96vw]'
      className='h-[96vh] flex flex-col'
      title={wiki.title}
      icon={<span className='text-[22px] shrink-0'>{wiki.icon}</span>}
      headerClassName='shrink-0'
      footerClassName='shrink-0'
      footer={
        <div className='flex w-full items-center justify-end gap-2'>
          <CancelButton onClick={onClose}>Đóng</CancelButton>
          <Button onClick={onEdit} className='gap-1.5'>
            <PencilIcon size={13} />
            Chỉnh sửa
          </Button>
        </div>
      }
    >
      <div className='flex-1 overflow-y-auto px-6 py-5 space-y-6'>
        {/* Summary */}
        {wiki.summary && <p className='text-[13px] text-muted-foreground leading-relaxed border-l-2 border-foreground/20 pl-3'>{wiki.summary}</p>}

        {/* Markdown content */}
        {hasContent ? (
          <MarkdownViewer content={wiki.content!} className='text-[13.5px]' />
        ) : (
          <div className='flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground'>
            <FileTextIcon size={32} className='opacity-40' />
            <p className='text-[13px]'>Wiki này chưa có nội dung.</p>
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className='space-y-2 pt-2 border-t border-border'>
            <h3 className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
              <PaperclipIcon size={10} />
              Files đính kèm
              <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-[9px] font-mono-dm text-primary'>{wiki.attachments!.length}</span>
            </h3>
            <AttachmentsTable attachments={wiki.attachments!} openAttachment={openAttachment} />
          </div>
        )}
      </div>
      {viewerNode}
    </ModalShell>
  );
}
