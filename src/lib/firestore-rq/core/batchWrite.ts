import { apiClient } from '@/lib/api/client';
import type { BatchRequest, BatchResponse, BatchOperation } from '@/lib/api/types';

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
      const body: BatchRequest = { operations };
      const result = await apiClient.post<BatchResponse>('/batch', body) as unknown as BatchResponse;
      const failed = result.results.filter((r: { id: string; success: boolean; error?: string }) => !r.success);
      if (failed.length > 0) {
        throw new Error(`Batch failed: ${failed.map((f: { id: string; error?: string }) => `${f.id}: ${f.error}`).join(', ')}`);
      }
    },
    rollback() {
      operations.length = 0;
    },
  };

  return self;
}
