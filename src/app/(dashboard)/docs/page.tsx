'use client';

import { useEffect, useMemo, useState } from 'react';
import { createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { useBatchFetch } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { deleteField } from '@/lib/firestore-rq';
import { deleteAttachment } from '@/lib/api/attachments';
import { documentsCollection } from '@/modules/docs/collections/documents';
import { foldersCollection } from '@/modules/docs/collections/folders';
import { DocsStatsPanel } from '@/modules/docs/components/DocsStatsPanel';
import { DocumentTable } from '@/modules/docs/components/DocumentTable';
import { UploadDocDialog } from '@/modules/docs/components/UploadDocDialog';
import { EditDocDialog } from '@/modules/docs/components/EditDocDialog';
import { DocumentViewSheet } from '@/modules/docs/components/DocumentViewSheet';
import { DocsPageHeader } from '@/modules/docs/components/DocsPageHeader';
import { DocumentFilterBar } from '@/modules/docs/components/DocumentFilterBar';
import { PageLoader } from '@/components/ui/page-loader';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { FolderTree } from '@/modules/docs/components/FolderTree';
import { FolderBreadcrumb } from '@/modules/docs/components/FolderBreadcrumb';
import { CreateFolderDialog } from '@/modules/docs/components/CreateFolderDialog';
import type { DocEntry } from '@/modules/docs/collections/documents';
import type { FolderEntry } from '@/modules/docs/collections/folders';
import type { WithId } from '@/lib/firestore-rq';

type DocWithId = WithId<DocEntry>;
type FolderWithId = WithId<FolderEntry>;

const ALL = 'all' as const;

export default function DocsPage() {
  const { data, isLoading, refetch } = useBatchFetch([
    createCollectionListItem('folders', foldersCollection),
    createCollectionListItem('documents', documentsCollection),
  ]);

  const folders = ((data.folders ?? []) as FolderWithId[]).sort((a, b) => a.order - b.order);
  const documents = (data.documents ?? []) as DocWithId[];
  const deleteDocument = documentsCollection.useDelete();
  const deleteFolder = foldersCollection.useDelete();
  const createFolder = foldersCollection.useSet();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocWithId | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocWithId | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);

  const allDocTypes = useMemo(() => {
    const typeSet = new Set<string>();
    documents.forEach((d) => typeSet.add(d.type));
    return Array.from(typeSet).sort();
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (activeFolderId !== null && d.folderId !== activeFolderId) return false;
      if (filterType !== ALL && d.type !== filterType) return false;
      if (filterStatus !== ALL) {
        const statusMatch = filterStatus === 'active' ? d.badge.variant !== 'muted' : d.badge.variant === 'muted';
        if (!statusMatch) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [documents, activeFolderId, filterType, filterStatus, search]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { setPage(1); }, [activeFolderId, filterType, filterStatus, search]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDocs.slice(start, start + PAGE_SIZE);
  }, [filteredDocs, page]);

  const totalPages = Math.ceil(filteredDocs.length / PAGE_SIZE);

  const handleDeleteDoc = async () => {
    const doc = documents.find((d) => d.id === confirmDeleteId);
    if (!doc) return;
    try {
      const storagePaths = new Set([
        ...(doc.storagePath ? [doc.storagePath] : []),
        ...(doc.attachments ?? []).map((attachment) => attachment.storagePath),
      ]);
      await Promise.allSettled(Array.from(storagePaths, (storagePath) => deleteAttachment(storagePath)));
      await deleteDocument.mutateAsync(doc.id);
    } catch (err) {
      console.error('Delete doc failed:', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleCreateFolder = async (name: string, icon: string, parentId: string | undefined) => {
    const id = `FOLDER-${Date.now()}`;
    await createFolder.mutateAsync({
      id,
      data: {
        name,
        icon,
        parentId,
        order: folders.length + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    refetch();
    setCreateFolderOpen(false);
  };

  const handleDeleteFolder = async () => {
    if (!confirmDeleteFolderId) return;
    const folder = folders.find((f) => f.id === confirmDeleteFolderId);
    if (!folder) return;
    try {
      // Move all docs in this folder to root (unset folderId)
      const docsInFolder = documents.filter((d) => d.folderId === confirmDeleteFolderId);
      await Promise.all(
        docsInFolder.map((doc) =>
          documentsCollection.helpers.update(doc.id, { folderId: deleteField() } as never)
        )
      );
      // Delete sub-folders' docs too (cascade to children)
      const childFolders = folders.filter((f) => f.parentId === confirmDeleteFolderId);
      for (const child of childFolders) {
        const childDocs = documents.filter((d) => d.folderId === child.id);
        await Promise.all(
          childDocs.map((doc) =>
            documentsCollection.helpers.update(doc.id, { folderId: deleteField() } as never)
          )
        );
      }
      await deleteFolder.mutateAsync(confirmDeleteFolderId);
      refetch();
      if (activeFolderId === confirmDeleteFolderId) {
        setActiveFolderId(null);
      }
    } catch (err) {
      console.error('Delete folder failed:', err);
    } finally {
      setConfirmDeleteFolderId(null);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className='space-y-4'>
      <DocsPageHeader />

      {/* 3-col grid: Folder tree | Filter + Table | Stats */}
      <div className='grid grid-cols-5 gap-4'>
        {/* Left: Folder tree */}
        <div className='col-span-1'>
          <FolderTree
            folders={folders}
            documents={documents}
            activeFolderId={activeFolderId}
            onFolderSelect={setActiveFolderId}
            onCreateFolder={() => setCreateFolderOpen(true)}
            onDeleteFolder={setConfirmDeleteFolderId}
          />
        </div>

        {/* Middle: Filter bar + Table */}
        <div className='col-span-3 space-y-4'>
          <DocumentFilterBar
            search={search}
            onSearchChange={setSearch}
            filterType={filterType}
            onTypeChange={setFilterType}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            filteredCount={filteredDocs.length}
            view={view}
            onViewChange={setView}
            onCreate={() => setUploadOpen(true)}
          />

          <div className='bg-card border border-border panel p-5'>
            {activeFolderId && (
              <div className='mb-3'>
                <FolderBreadcrumb activeFolderId={activeFolderId} folders={folders} onNavigate={setActiveFolderId} />
              </div>
            )}
            <DocumentTable
              documents={paginatedDocs}
              onEdit={(doc) => setEditingDoc(doc)}
              onDelete={(doc) => setConfirmDeleteId(doc.id)}
              onUpload={() => setUploadOpen(true)}
              onView={(doc) => setViewingDoc(doc)}
            />
            <Pagination page={page} totalPages={totalPages} total={filteredDocs.length} limit={PAGE_SIZE} onPageChange={(p) => setPage(p)} />
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className='col-span-1'>
          <DocsStatsPanel documents={activeFolderId === null ? documents : documents.filter((d) => d.folderId === activeFolderId)} />
        </div>
      </div>

      {/* Dialogs & Sheets */}
      <CreateFolderDialog
        open={createFolderOpen}
        folders={folders}
        onClose={() => setCreateFolderOpen(false)}
        onSuccess={handleCreateFolder}
      />
      <UploadDocDialog
        open={uploadOpen}
        folders={folders}
        nextDocIndex={documents.length + 1}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { setUploadOpen(false); refetch(); }}
      />
      {editingDoc && (
        <EditDocDialog
          open={!!editingDoc}
          doc={editingDoc}
          folders={folders}
          onClose={() => setEditingDoc(null)}
          onSuccess={() => { setEditingDoc(null); refetch(); }}
          onRefetch={refetch}
        />
      )}
      <DocumentViewSheet
        open={!!viewingDoc}
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onEdit={() => {
          setViewingDoc(null);
          setTimeout(() => setEditingDoc(viewingDoc), 150);
        }}
      />
      {confirmDeleteId && (
        <ConfirmDialog
          danger
          title='Xoá tài liệu'
          message={`Bạn có chắc muốn xoá "${documents.find((d) => d.id === confirmDeleteId)?.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá tài liệu'
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDeleteDoc}
        />
      )}
      {confirmDeleteFolderId && (
        <ConfirmDialog
          danger
          title='Xoá thư mục'
          message={`Bạn có chắc muốn xoá thư mục "${folders.find((f) => f.id === confirmDeleteFolderId)?.name}"? Các tài liệu bên trong sẽ được chuyển lên cấp gốc.`}
          confirmLabel='Xoá thư mục'
          onCancel={() => setConfirmDeleteFolderId(null)}
          onConfirm={handleDeleteFolder}
        />
      )}
    </div>
  );
}
