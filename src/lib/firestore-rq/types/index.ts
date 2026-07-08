// src/lib/firestore-rq/types/index.ts

export type WithId<T> = T & { id: string };

export interface WhereClause {
  field: string;
  op: string;
  value: unknown;
}

export interface OrderByClause {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface QueryOptions {
  where?: WhereClause | WhereClause[];
  orderBy?: OrderByClause | OrderByClause[];
  limit?: number;
  startAfter?: string;
  enabled?: boolean;
}

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

export interface CollectionConfig<T extends object> {
  path: string;
  transform?: (raw: T & { id: string }) => WithId<T>;
}

export interface UseDocumentResult<T> {
  data: WithId<T> | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ListResponse<T> {
  data: T[];
  total?: number;
}
