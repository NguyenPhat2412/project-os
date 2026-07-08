// src/lib/firestore-rq/index.ts
export { createCollection } from './core/createCollection';
export { createSubcollection } from './core/createSubcollection';
export { createConfig } from './core/createConfig';
export { batchWrite } from './core/batchWrite';
export { firestoreKeys } from './core/queryKeys';

// ─── Firebase re-exports (wrapped so component code never imports directly from firebase/firestore) ──
export { deleteField } from 'firebase/firestore';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useOptimistic } from './hooks/useOptimistic';
export { usePaginatedCollection } from './hooks/usePaginatedCollection';
export { useBatchFetch } from './hooks/useBatchFetch';
export { createCollectionListItem, createDocumentItem } from './hooks/useBatchFetch';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  WithId,
  QueryOptions,
  WhereClause,
  OrderByClause,
  CreateInput,
  UpdateInput,
  CollectionConfig,
  UseDocumentResult,
  UseCollectionResult,
  ListResponse,
} from './types';
