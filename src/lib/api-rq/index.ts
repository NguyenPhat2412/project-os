// src/lib/api-rq/index.ts
export { createCollection } from './core/createCollection';
export { createSubcollection } from './core/createSubcollection';
export { createConfig } from './core/createConfig';
export { batchWrite } from './core/batchWrite';
export { apiKeys } from './core/queryKeys';

// API-compatible field helpers.
/** JSON Merge Patch: null removes the field on the Spring/PostgreSQL API. */
export function deleteField(): null {
  return null;
}

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
