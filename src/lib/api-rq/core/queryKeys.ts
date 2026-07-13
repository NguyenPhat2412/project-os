import type { QueryOptions } from '../types';

/**
 * Factory tạo query keys chuẩn cho React Query.
 * Giúp cache tự động invalidate đúng scope.
 *
 * Cấu trúc: ['api', collectionPath, scope, ...params]
 */
export const apiKeys = {
  /** Tất cả keys liên quan đến một collection */
  all: (path: string) => ['api', path] as const,

  /** Tất cả documents của collection (có thể kèm filter) */
  lists: (path: string) => [...apiKeys.all(path), 'list'] as const,

  /** Một list cụ thể với QueryOptions */
  list: (path: string, options?: QueryOptions) => {
    // Stable key - serialize options to avoid object reference issues
    const optionsKey = options && Object.keys(options).length > 0
      ? JSON.stringify(options)
      : 'default';
    return [...apiKeys.lists(path), optionsKey] as const;
  },

  /** Tất cả document đơn lẻ của collection */
  details: (path: string) => [...apiKeys.all(path), 'detail'] as const,

  /** Một document đơn lẻ */
  detail: (path: string, id: string) => [...apiKeys.details(path), id] as const,
};
