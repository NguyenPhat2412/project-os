/**
 * seed.ts — Docs module
 * ───────────────────────
 * Seed data and functions for documents and wiki links.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { documents as mockDocuments, wikiLinks as mockWikiLinks, folders as mockFolders } from '@/modules/docs/mock';

const DOCUMENTS_COL = collection(db, `projects/${PROJECT_ID}/documents`);
const WIKI_LINKS_COL = collection(db, `projects/${PROJECT_ID}/wiki_links`);
const FOLDERS_COL = collection(db, `projects/${PROJECT_ID}/folders`);

/**
 * Backfill wiki summaries — adds empty summary field to wikis that don't have it
 */
export async function backfillWikiSummary(): Promise<{ updated: number; total: number }> {
  const snap = await getDocs(WIKI_LINKS_COL);
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if (data.summary === undefined || data.summary === null) {
      await updateDoc(d.ref, { summary: '' });
      updated += 1;
    }
  }
  console.log(`🧹 Wiki summary backfill done: ${updated}/${snap.size} docs updated.`);
  return { updated, total: snap.size };
}

/**
 * Seed folders — creates sample folders if not exist
 */
export async function seedFolders(): Promise<{ created: number }> {
  const snap = await getDocs(FOLDERS_COL);
  if (snap.size > 0) return { created: 0 };

  for (const folder of mockFolders) {
    await setDoc(doc(FOLDERS_COL, folder.id), folder);
  }
  console.log(`📁 Seeded ${mockFolders.length} folders`);
  return { created: mockFolders.length };
}

/**
 * Seed documents — creates sample documents if not exist
 */
export async function seedDocuments(): Promise<{ created: number }> {
  const snap = await getDocs(DOCUMENTS_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockDocuments.length; i++) {
    const doc_item = mockDocuments[i];
    const { id, ...data } = doc_item;
    await setDoc(doc(DOCUMENTS_COL, id), { ...data, order: i });
  }
  console.log(`📄 Seeded ${mockDocuments.length} documents`);
  return { created: mockDocuments.length };
}

/**
 * Seed wiki links — creates sample wikis if not exist
 */
export async function seedWikiLinks(): Promise<{ created: number }> {
  const snap = await getDocs(WIKI_LINKS_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockWikiLinks.length; i++) {
    const wiki = mockWikiLinks[i];
    const { id, ...data } = wiki;
    await setDoc(doc(WIKI_LINKS_COL, id), { ...data, order: i });
  }
  await backfillWikiSummary();
  console.log(`📚 Seeded ${mockWikiLinks.length} wiki links`);
  return { created: mockWikiLinks.length };
}
