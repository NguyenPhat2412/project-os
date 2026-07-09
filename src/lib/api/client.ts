// src/lib/api/client.ts

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ListResponse<T> {
  data: T[];
  total?: number;
}

export interface MutationResponse<T> {
  data: T;
  id: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = this.normalizePath(path);
    return `${base}/${normalizedPath}`;
  }

  private normalizePath(path: string): string {
    const [rawPath, rawQuery = ''] = path.split('?');
    const pathname = rawPath.replace(/^\/+/, '');
    const query = new URLSearchParams(rawQuery);
    const segments = pathname.split('/').filter(Boolean);

    if (segments[0] === 'projects') {
      if (segments.length >= 3) {
        // project-scoped: /projects/{projectId}/{collection} → /api/collections/projects/{projectId}/{collection}
        return this.withQuery(`collections/${pathname}`, query);
      }
      // root-level: /projects, /projects/{id} → /api/projects, /api/projects/{id}
      const rootProjectPath = segments.slice(1).join('/');
      return this.withQuery(rootProjectPath ? `projects/${rootProjectPath}` : 'projects', query);
    }

    if (segments[0] === 'members') {
      // root-level: /members, /members/{id} → /api/members, /api/members/{id}
      const rootMemberPath = segments.slice(1).join('/');
      return this.withQuery(rootMemberPath ? `members/${rootMemberPath}` : 'members', query);
    }

    return this.withQuery(pathname, query);
  }

  private withQuery(pathname: string, query: URLSearchParams): string {
    const search = query.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = this.buildUrl(path);
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        body.error?.code ?? 'UNKNOWN',
        body.error?.message ?? res.statusText,
        res.status,
      );
    }

    // Handle empty responses (204)
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return res.json();
  }

  /**
   * List GET — for collection endpoints.
   * API: { data: T[] } → returns T[]
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
    const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null);
    const searchParams = entries.length > 0
      ? '?' + new URLSearchParams(
          entries.flatMap(([k, v]) =>
            Array.isArray(v)
              ? v.map(item => [k, String(item)])
              : [[k, String(v)]])
          .flat() as unknown as [string, string][]
        ).toString()
      : '';

    const res = await this.request<{ data: T[] }>(`${path}${searchParams}`);
    return res.data ?? [];
  }

  /**
   * Single GET — for document/config endpoints.
   * API: { data: T } → returns T | null
   */
  async getOne<T>(path: string): Promise<T | null> {
    const res = await this.request<{ data: T | null }>(path);
    return res.data ?? null;
  }

  async post<T>(path: string, data: unknown): Promise<MutationResponse<T>> {
    return this.request<MutationResponse<T>>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(path: string): Promise<void> {
    await this.request<void>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
