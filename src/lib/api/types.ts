// src/lib/api/types.ts

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface ListResponse<T> {
  data: T[];
  total?: number;
}

export interface MutationResponse<T> {
  data: T;
  id: string;
}

export interface BatchOperation {
  method: 'set' | 'update' | 'delete';
  id?: string;
  data?: Record<string, unknown>;
  path?: string;
}

export interface BatchRequest {
  operations: BatchOperation[];
}

export interface BatchResponse {
  results: { id: string; success: boolean; error?: string }[];
}
