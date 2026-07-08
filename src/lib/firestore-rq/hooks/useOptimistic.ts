import { useQueryClient } from '@tanstack/react-query';

import { firestoreKeys } from '../core/queryKeys';

import type { WithId, QueryOptions } from '../types';
/**
 * Hook cung cấp các thao tác optimistic update thủ công.
 * Dùng khi muốn UI phản hồi ngay trước khi server confirm.
 *
 * @example
 * ```ts
 * const optimistic = useOptimistic("todos");
 *
 * const create = todosCollection.useCreate({
 *   onMutate: async (data) => {
 *     const rollback = await optimistic.addToList(tempDoc);
 *     return { rollback };
 *   },
 *   onError: (_, __, ctx) => ctx?.rollback?.(),
 * });
 * ```
 */
export function useOptimistic<T>(collectionPath: string) {
  const queryClient = useQueryClient();

  /** Thêm item giả vào cache list */
  async function addToList(item: WithId<T>, options?: QueryOptions): Promise<() => void> {
    const key = firestoreKeys.list(collectionPath, options);
    await queryClient.cancelQueries({ queryKey: key });
    const prev = queryClient.getQueryData<WithId<T>[]>(key);

    queryClient.setQueryData<WithId<T>[]>(key, (old = []) => [...old, item]);

    return () => queryClient.setQueryData(key, prev);
  }

  /** Cập nhật item trong cache */
  async function updateInList(id: string, patch: Partial<T>, options?: QueryOptions): Promise<() => void> {
    const key = firestoreKeys.list(collectionPath, options);
    await queryClient.cancelQueries({ queryKey: key });
    const prev = queryClient.getQueryData<WithId<T>[]>(key);

    queryClient.setQueryData<WithId<T>[]>(key, (old = []) => old.map((item) => (item.id === id ? { ...item, ...patch } : item)));

    return () => queryClient.setQueryData(key, prev);
  }

  /** Xoá item khỏi cache */
  async function removeFromList(id: string, options?: QueryOptions): Promise<() => void> {
    const key = firestoreKeys.list(collectionPath, options);
    await queryClient.cancelQueries({ queryKey: key });
    const prev = queryClient.getQueryData<WithId<T>[]>(key);

    queryClient.setQueryData<WithId<T>[]>(key, (old = []) => old.filter((item) => item.id !== id));

    return () => queryClient.setQueryData(key, prev);
  }

  return { addToList, updateInList, removeFromList };
}
