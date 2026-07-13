'use client';
import { DocumentTable } from '@/modules/docs/components/DocumentTable';
import { WikiTable } from '@/modules/docs/components/WikiTable';
import { DocActivityPanel } from '@/modules/docs/components/DocActivityPanel';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import type { DocEntry } from '@/modules/docs/collections/documents';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import type { WithId } from '@/lib/api-rq';

type DocWithId = WithId<DocEntry>;
type WikiEntry = WikiLink & { id: string };

interface DocsContentProps {
  documents: DocWithId[];
  wikiLinks: WikiEntry[];
  docActivityData: ActivityEntry[];
  onEditDoc: (doc: DocWithId) => void;
  onDeleteDoc: (doc: DocWithId) => void;
  onUpload: () => void;
  onViewDoc: (doc: DocWithId) => void;
  onViewWiki: (wiki: WikiEntry) => void;
  onEditWiki: (wiki: WikiEntry) => void;
  onDeleteWiki: (wiki: WikiEntry) => void;
}

export function DocsContent({
  documents,
  wikiLinks,
  docActivityData,
  onEditDoc,
  onDeleteDoc,
  onUpload,
  onViewDoc,
  onViewWiki,
  onEditWiki,
  onDeleteWiki,
}: DocsContentProps) {
  return (
    <div className='grid grid-cols-[2fr_1fr] max-lg:grid-cols-1 gap-4.5'>
      <DocumentTable
        documents={documents}
        onEdit={onEditDoc}
        onDelete={onDeleteDoc}
        onUpload={onUpload}
        onView={onViewDoc}
      />
      <div>
        <WikiTable
          wikiLinks={wikiLinks}
          onView={onViewWiki}
          onEdit={onEditWiki}
          onDelete={onDeleteWiki}
        />
        <DocActivityPanel docActivity={docActivityData} />
      </div>
    </div>
  );
}
