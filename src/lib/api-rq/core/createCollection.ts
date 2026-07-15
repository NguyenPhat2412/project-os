import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/query-core';
import { apiClient, resolveApiPath } from '@/lib/api/client';
import type { QueryOptions, CreateInput, CollectionConfig, WithId } from '../types';
import { apiKeys } from './queryKeys';

export function createCollection<T extends object>(config: CollectionConfig<T>) {
  const { path } = config;
  const queryPath = () => resolveApiPath(path);
  const transform = (value: WithId<T>) => config.transform ? config.transform(value) : value;

  function useDocument(id: string | null | undefined, queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
    return useQuery({
      queryKey: apiKeys.detail(queryPath(), id ?? ''),
    queryFn: async () => {
      const value = await apiClient.getOne<WithId<T>>(`${path}/${id}`);
      return value ? transform(value) : null;
    },
      enabled: !!id,
      ...queryOptions,
    });
  }

  function useList(
    options: QueryOptions = {},
    queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
  ) {
    const { enabled: enabledOption = true, ...restOptions } = options;
    const { enabled: enabledQuery, ...restQueryOptions } = queryOptions ?? {};
    const isEnabled = enabledQuery ?? enabledOption;

    return useQuery<WithId<T>[], Error, WithId<T>[], QueryKey>({
      queryKey: apiKeys.list(queryPath(), restOptions),
      queryFn: () => {
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
        if (restOptions.limit) params.limit = restOptions.limit;
        if (restOptions.startAfter) params.startAfter = String(restOptions.startAfter);
        return apiClient.get<WithId<T>>(`${path}`, params).then((items) => items.map(transform));
      },
      enabled: isEnabled,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(restQueryOptions as any),
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: CreateInput<T>) => {
        const res = await apiClient.post<WithId<T>>(`${path}`, data);
        return transform(res.data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: apiKeys.lists(queryPath()) });
      },
    });
  }

  function useSet() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        apiClient.put<WithId<T>>(`${path}/${id}`, data).then(transform),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: apiKeys.detail(queryPath(), id) });
        queryClient.invalidateQueries({ queryKey: apiKeys.lists(queryPath()) });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        apiClient.patch<WithId<T>>(`${path}/${id}`, data).then(transform),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: apiKeys.detail(queryPath(), id) });
        queryClient.invalidateQueries({ queryKey: apiKeys.lists(queryPath()) });
      },
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => apiClient.delete(`${path}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: apiKeys.lists(queryPath()) });
      },
    });
  }

  const helpers = {
    fetch: async (id: string) => {
      const value = await apiClient.getOne<WithId<T>>(`${path}/${id}`);
      return value ? transform(value) : null;
    },
    fetchList: (options?: QueryOptions) => {
      const params: Record<string, unknown> = {};
      if (options?.where) {
        const clauses = Array.isArray(options.where) ? options.where : [options.where];
        clauses.forEach((c, i) => {
          params[`where[${i}]`] = `${c.field}:${c.op}:${String(c.value)}`;
        });
      }
      return apiClient.get<WithId<T>>(`${path}`, params).then((items) => items.map(transform));
    },
    create: async (data: CreateInput<T>) => {
      const res = await apiClient.post<WithId<T>>(`${path}`, data);
      return transform(res.data);
    },
    set: (id: string, data: Partial<T>) => apiClient.put<WithId<T>>(`${path}/${id}`, data).then(transform),
    update: (id: string, data: Partial<T>) => apiClient.patch<WithId<T>>(`${path}/${id}`, data).then(transform),
    delete: (id: string) => apiClient.delete(`${path}/${id}`),
  };

  return {
    useDocument,
    useList,
    useCreate,
    useSet,
    useUpdate,
    useDelete,
    helpers,
    path,
    transform: config.transform,
    keys: {
      all: () => apiKeys.all(queryPath()),
      lists: () => apiKeys.lists(queryPath()),
      list: (options?: QueryOptions) => apiKeys.list(queryPath(), options),
      details: () => apiKeys.details(queryPath()),
      detail: (id: string) => apiKeys.detail(queryPath(), id),
    },
  };
}
