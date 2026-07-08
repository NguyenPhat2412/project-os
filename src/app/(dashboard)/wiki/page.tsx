'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { wikiLinksCollection } from '@/modules/docs/collections/wikiLinks';
import { WikiStatsPanel } from '@/modules/docs/components/WikiStatsPanel';
import { WikiTable } from '@/modules/docs/components/WikiTable';
import { WikiEditorDialog } from '@/modules/docs/components/WikiEditorDialog';
import { WikiViewDialog } from '@/modules/docs/components/WikiViewDialog';
import { WikiPageHeader } from '@/modules/docs/components/WikiPageHeader';
import { WikiFilterBar } from '@/modules/docs/components/WikiFilterBar';
import { PageLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';

export default function WikiPage() {
  const { data: rawWikiLinks = [], isLoading } = wikiLinksCollection.useList();
  const wikiLinks = rawWikiLinks as (WikiLink & { id: string })[];
  const deleteWikiLink = wikiLinksCollection.useDelete();

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [wikiEditing, setWikiEditing] = useState<(WikiLink & { id: string }) | null | 'new'>(null);
  const [wikiViewing, setWikiViewing] = useState<(WikiLink & { id: string }) | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editingWikiId = wikiEditing && wikiEditing !== 'new' ? wikiEditing.id : null;
  const { data: freshWikiData } = wikiLinksCollection.useDocument(wikiViewing?.id ?? null, { staleTime: 0 });
  const { data: freshEditingWikiData } = wikiLinksCollection.useDocument(editingWikiId ?? null, { staleTime: 0 });

  // All unique tags from wiki links
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    wikiLinks.forEach((w) => w.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [wikiLinks]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterTag]);

  // Filter wiki links
  const filteredWiki = useMemo(() => {
    return wikiLinks.filter((w) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!w.title.toLowerCase().includes(q) && !(w.summary ?? '').toLowerCase().includes(q)) return false;
      }
      if (filterTag !== 'all') {
        if (!w.tags?.includes(filterTag)) return false;
      }
      return true;
    });
  }, [wikiLinks, search, filterTag]);

  const paginatedWiki = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWiki.slice(start, start + PAGE_SIZE);
  }, [filteredWiki, page]);

  const totalPages = Math.ceil(filteredWiki.length / PAGE_SIZE);

  const handleDeleteWiki = async () => {
    const wiki = wikiLinks.find((w) => w.id === confirmDeleteId);
    if (!wiki) return;
    try {
      await deleteWikiLink.mutateAsync(wiki.id);
      if (wikiViewing?.id === wiki.id) setWikiViewing(null);
    } catch (err) {
      console.error('Delete wiki failed:', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className='space-y-4'>
      {/* ── Page Header ── */}
      <WikiPageHeader totalWikis={wikiLinks.length} />

      {/* ── Stats Panel ── */}
      <WikiStatsPanel wikiLinks={wikiLinks} />

      {/* ── Filter bar ── */}
      <WikiFilterBar search={search} onSearchChange={setSearch} filterTag={filterTag} onTagChange={setFilterTag} tags={allTags} filteredCount={filteredWiki.length} onCreate={() => setWikiEditing('new')} />

      {/* ── Content ── */}
      <div className='bg-card border border-border panel p-5'>
        <WikiTable wikiLinks={paginatedWiki} onView={(wiki) => setWikiViewing(wiki)} onEdit={(wiki) => setWikiEditing(wiki)} onDelete={(wiki) => setConfirmDeleteId(wiki.id)} />
        <Pagination page={page} totalPages={totalPages} total={filteredWiki.length} limit={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* ── Dialogs & Sheets ── */}
      <WikiEditorDialog
        open={wikiEditing !== null}
        wiki={wikiEditing === 'new' ? null : ((freshEditingWikiData as (WikiLink & { id: string }) | null) ?? wikiEditing)}
        nextWikiIndex={wikiLinks.length + 1}
        onClose={() => setWikiEditing(null)}
        onSuccess={() => setWikiEditing(null)}
      />
      <WikiViewDialog
        open={!!wikiViewing}
        wiki={(freshWikiData as (WikiLink & { id: string }) | null) ?? wikiViewing}
        onClose={() => setWikiViewing(null)}
        onEdit={() => {
          if (wikiViewing) {
            setWikiEditing(wikiViewing);
            setWikiViewing(null);
          }
        }}
      />
      {confirmDeleteId && (
        <ConfirmDialog
          danger
          title='Xoá Wiki'
          message={`Bạn có chắc muốn xoá "${wikiLinks.find((w) => w.id === confirmDeleteId)?.title}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá Wiki'
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDeleteWiki}
        />
      )}
    </div>
  );
}
