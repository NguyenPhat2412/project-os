/**
 * migrate-docs-folders.ts
 * ─────────────────────────
 * One-time migration script to add folder support to docs module.
 *
 * Run with: npx tsx src/lib/migrate-docs-folders.ts
 * (or via Firebase emulators: firebase emulators:exec npx tsx src/lib/migrate-docs-folders.ts)
 *
 * This script:
 * 1. Seeds sample folders if none exist
 * 2. Backfills existing documents with folderId: undefined (root level)
 * 3. Logs migration results
 */

import { foldersCollection } from '@/modules/docs/collections/folders';
import { documentsCollection } from '@/modules/docs/collections/documents';
import { folders as mockFolders } from '@/modules/docs/mock';

async function migrate() {
  console.log('🚀 Starting docs folders migration...\n');

  // Step 1: Seed folders if none exist
  const existingFolders = await foldersCollection.helpers.fetchList();
  if (existingFolders.length === 0) {
    console.log(`📁 Creating ${mockFolders.length} sample folders...`);
    for (const folder of mockFolders) {
      await foldersCollection.helpers.set(folder.id, folder as never);
    }
    console.log('✅ Sample folders created.\n');
  } else {
    console.log(`📁 Found ${existingFolders.length} existing folders, skipping seed.\n`);
  }

  // Step 2: Backfill documents — ensure folderId field exists
  const docs = await documentsCollection.helpers.fetchList();
  console.log(`📄 Found ${docs.length} documents. Checking folderId field...`);

  let updated = 0;
  for (const doc of docs) {
    if (!('folderId' in doc) || (doc as unknown as Record<string, unknown>).folderId === undefined) {
      // field doesn't exist or is undefined — backfill with undefined (root level)
      await documentsCollection.helpers.update(doc.id, { folderId: undefined } as never);
      updated++;
    }
  }

  console.log(`✅ Backfilled folderId on ${updated} documents.\n`);
  console.log('🎉 Migration complete!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
