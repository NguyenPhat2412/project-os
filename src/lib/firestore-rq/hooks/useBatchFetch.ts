import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { CollectionConfig, WithId } from '../types';

interface BatchItem {
  key: string;
  fetcher: () => Promise<unknown>;
}

interface BatchResult {
  data: Record<string, unknown>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

/**
 * Batch fetch multiple collections/documents in parallel.
 * Much faster than multiple useList() calls.
 */
export function useBatchFetch(items: BatchItem[], queryKeyName?: string): BatchResult {
  const keys = items.map((i) => i.key);
  const queryName = queryKeyName || keys.join('-');
  const queryKey = ['batch', queryName];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const results = await Promise.allSettled(items.map((item) => item.fetcher()));
      const acc: Record<string, unknown> = {};
      for (let i = 0; i < items.length; i++) {
        const result = results[i];
        acc[items[i].key] = result.status === 'fulfilled' ? result.value : null;
      }
      return acc;
    },
    staleTime: 60_000,
  });

  return {
    data: (query.data ?? {}) as Record<string, unknown>,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

/**
 * Helper to create a batch item for a collection list.
 */
export function createCollectionListItem<T extends object>(key: string, config: CollectionConfig<T>) {
  return {
    key,
    fetcher: () => apiClient.get<WithId<T>[]>(config.path),
  };
}

/**
 * Helper to create a batch item for a single document.
 */
export function createDocumentItem<T extends object>(key: string, config: CollectionConfig<T>, id: string) {
  return {
    key,
    fetcher: () => apiClient.getOne<WithId<T>>(`${config.path}/${id}`),
  };
}
