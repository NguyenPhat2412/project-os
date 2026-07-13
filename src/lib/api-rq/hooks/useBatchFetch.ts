import { useQuery } from '@tanstack/react-query';
import { apiClient, resolveApiPath } from '@/lib/api/client';
import type { CollectionConfig, WithId } from '../types';

interface BatchItem {
  key: string;
  scope?: string;
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
  const keys = items.map((item) => `${item.key}:${item.scope ?? ''}`);
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
    scope: resolveApiPath(config.path),
    fetcher: async () => {
      const items = await apiClient.get<WithId<T>>(config.path);
      return config.transform ? items.map(config.transform) : items;
    },
  };
}

/**
 * Helper to create a batch item for a single document.
 */
export function createDocumentItem<T extends object>(key: string, config: CollectionConfig<T>, id: string) {
  return {
    key,
    scope: `${resolveApiPath(config.path)}/${id}`,
    fetcher: async () => {
      const item = await apiClient.getOne<WithId<T>>(`${config.path}/${id}`);
      return item && config.transform ? config.transform(item) : item;
    },
  };
}
