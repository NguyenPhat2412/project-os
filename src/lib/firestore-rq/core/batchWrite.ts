import { apiClient } from '@/lib/api/client';
import type { BatchOperation } from '@/lib/api/types';

export interface BatchWrite {
  set(path: string, id: string, data: Record<string, unknown>): BatchWrite;
  update(path: string, id: string, data: Record<string, unknown>): BatchWrite;
  delete(path: string, id: string): BatchWrite;
  commit(): Promise<void>;
  rollback(): void;
}

export function batchWrite(): BatchWrite {
  const operations: BatchOperation[] = [];

  const self: BatchWrite = {
    set(path, id, data) {
      operations.push({ method: 'set', path, id, data });
      return self;
    },
    update(path, id, data) {
      operations.push({ method: 'update', path, id, data });
      return self;
    },
    delete(path, id) {
      operations.push({ method: 'delete', path, id });
      return self;
    },
    async commit() {
      await Promise.all(
        operations.map((operation) => {
          if (operation.method === 'set') return apiClient.put(`${operation.path}/${operation.id}`, operation.data);
          if (operation.method === 'update') return apiClient.patch(`${operation.path}/${operation.id}`, operation.data);
          return apiClient.delete(`${operation.path}/${operation.id}`);
        }),
      );
    },
    rollback() {
      operations.length = 0;
    },
  };

  return self;
}
