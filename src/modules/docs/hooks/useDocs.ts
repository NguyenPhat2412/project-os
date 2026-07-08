/**
 * useDocs
 * ───────
 * Hook for Docs module using firestore-rq collection pattern.
 */

import { documentsCollection } from '@/modules/docs/collections/documents';
import { wikiLinksCollection } from '@/modules/docs/collections/wikiLinks';
import type { DocEntry } from '@/modules/docs/collections/documents';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import type { WithId } from '@/lib/firestore-rq';

export function useDocs() {
  // ── Firestore queries ─────────────────────────────────────────
  const { data: documents = [], isLoading } = documentsCollection.useList();
  const { data: wikiLinks = [] } = wikiLinksCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedDocuments = documents as WithId<DocEntry>[];
  const typedWikiLinks = wikiLinks as WithId<WikiLink>[];

  // ── CRUD mutations ────────────────────────────────────────────
  const createDocument = documentsCollection.useCreate();
  const updateDocument = documentsCollection.useUpdate();
  const deleteDocument = documentsCollection.useDelete();

  const createWikiLink = wikiLinksCollection.useCreate();
  const updateWikiLink = wikiLinksCollection.useUpdate();
  const deleteWikiLink = wikiLinksCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    documents: typedDocuments,
    wikiLinks: typedWikiLinks,
    docActivity: [], // Computed if needed
    loading: isLoading,
    refresh,
    // CRUD
    createDocument,
    updateDocument,
    deleteDocument,
    createWikiLink,
    updateWikiLink,
    deleteWikiLink,
  };
}
