import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { firestoreKeys } from '../core/queryKeys';
import type { WithId, QueryOptions, CollectionConfig } from '../types';

/**
 * Cursor-based pagination hook for collections.
 * Uses a page cursor string instead of Firestore DocumentSnapshot.
 */
export function usePaginatedCollection<T extends object>(
  config: CollectionConfig<T>,
  options: Omit<QueryOptions, 'startAfter' | 'startAt'> & { limit: number },
) {
  const { limit: pageSize, ...restOptions } = options;

  return useInfiniteQuery({
    queryKey: [...firestoreKeys.list(config.path, options), 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params: Record<string, unknown> = {};

      if (restOptions.where) {
        const clauses = Array.isArray(restOptions.where) ? restOptions.where : [restOptions.where];
        clauses.forEach((c, i) => {
          params[`where[${i}]`] = `${c.field}:${c.op}:${String(c.value)}`;
        });
      }
      if (restOptions.orderBy) {
        const orders = Array.isArray(restOptions.orderBy) ? restOptions.orderBy : [restOptions.orderBy];
        orders.forEach((o, i) => {
          params[`orderBy[${i}]`] = o.direction ? `${o.field}:${o.direction}` : o.field;
        });
      }
      params.limit = pageSize;
      if (pageParam) params.startAfter = pageParam;

      const items = await apiClient.get<WithId<T>>(config.path, params);
      const lastItem = items[items.length - 1];
      return { items, cursor: lastItem?.id ?? null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < pageSize) return undefined;
      return lastPage.cursor ?? undefined;
    },
  });
}
