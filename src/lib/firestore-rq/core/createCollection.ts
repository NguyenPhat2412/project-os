import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/query-core';
import { apiClient } from '@/lib/api/client';
import type { QueryOptions, CreateInput, CollectionConfig, WithId } from '../types';
import { firestoreKeys } from './queryKeys';

export function createCollection<T extends object>(config: CollectionConfig<T>) {
  const { path } = config;

  function useDocument(id: string | null | undefined, queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
    return useQuery({
      queryKey: firestoreKeys.detail(path, id ?? ''),
      queryFn: () => apiClient.getOne<WithId<T>>(`${path}/${id}`),
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
      queryKey: firestoreKeys.list(path, restOptions),
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
        return apiClient.get<WithId<T>>(`${path}`, params);
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
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  function useSet() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        apiClient.put<WithId<T>>(`${path}/${id}`, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.detail(path, id) });
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        apiClient.patch<WithId<T>>(`${path}/${id}`, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.detail(path, id) });
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => apiClient.delete(`${path}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  const helpers = {
    fetch: (id: string) => apiClient.getOne<WithId<T>>(`${path}/${id}`),
    fetchList: (options?: QueryOptions) => {
      const params: Record<string, unknown> = {};
      if (options?.where) {
        const clauses = Array.isArray(options.where) ? options.where : [options.where];
        clauses.forEach((c, i) => {
          params[`where[${i}]`] = `${c.field}:${c.op}:${String(c.value)}`;
        });
      }
      return apiClient.get<WithId<T>>(`${path}`, params);
    },
    create: async (data: CreateInput<T>) => {
      const res = await apiClient.post<WithId<T>>(`${path}`, data);
      return res.data;
    },
    set: (id: string, data: Partial<T>) => apiClient.put<WithId<T>>(`${path}/${id}`, data),
    update: (id: string, data: Partial<T>) => apiClient.patch<WithId<T>>(`${path}/${id}`, data),
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
    keys: {
      all: () => firestoreKeys.all(path),
      lists: () => firestoreKeys.lists(path),
      list: (options?: QueryOptions) => firestoreKeys.list(path, options),
      details: () => firestoreKeys.details(path),
      detail: (id: string) => firestoreKeys.detail(path, id),
    },
  };
}
