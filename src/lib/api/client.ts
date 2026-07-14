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

const PROJECT_RESOURCE_ALIASES: Record<string, string> = {
  task_columns: 'task-columns',
  bug_columns: 'bug-columns',
  budget_items: 'budget-items',
  gantt_phases: 'timeline-phases',
  action_items: 'action-items',
  activity_feed: 'activities',
  activity_comments: 'comments',
  doc_activity: 'doc-activities',
  wiki_links: 'wiki-links',
  project_roles: 'role-assignments',
};

function activeProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const state = JSON.parse(localStorage.getItem('activeProjectId') ?? '{}') as { state?: { projectId?: string } };
    return state.state?.projectId ?? null;
  } catch {
    return null;
  }
}

function isUuid(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function resolveApiPath(path: string): string {
  const [rawPath, rawQuery = ''] = path.split('?');
  const pathname = rawPath.replace(/^\/+/, '');
  const query = new URLSearchParams(rawQuery);
  const segments = pathname.split('/').filter(Boolean);
  const withQuery = (value: string) => {
    const search = query.toString();
    return search ? `${value}?${search}` : value;
  };

  if (segments[0] === 'projects') {
    if (segments.length >= 2 && !isUuid(segments[1])) {
      const active = activeProjectId();
      if (isUuid(active ?? undefined)) segments[1] = active!;
    }
    if (segments.length >= 3) {
      const resource = PROJECT_RESOURCE_ALIASES[segments[2]] ?? segments[2];
      return withQuery(['v1', 'projects', segments[1], resource, ...segments.slice(3)].join('/'));
    }
    const rootProjectPath = segments.slice(1).join('/');
    return withQuery(rootProjectPath ? `v1/projects/${rootProjectPath}` : 'v1/projects');
  }

  if (segments[0] === 'members') {
    const rootMemberPath = segments.slice(1).join('/');
    return withQuery(rootMemberPath ? `v1/admin/users/${rootMemberPath}` : 'v1/admin/users');
  }

  if (segments[0] === 'organizations') {
    return withQuery(['v1', ...segments].join('/'));
  }

  if (segments[0] === 'v1' && segments[1] === 'users' && segments[2] === 'directory'
      && !query.has('projectId')) {
    const active = activeProjectId();
    if (isUuid(active ?? undefined)) query.set('projectId', active!);
  }

  return withQuery(pathname);
}

function csrfToken() {
  if (typeof document === 'undefined') return null;
  const item = document.cookie.split('; ').find((value) => value.startsWith('XSRF-TOKEN='));
  return item ? decodeURIComponent(item.slice('XSRF-TOKEN='.length)) : null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = resolveApiPath(path);
    return `${base}/${normalizedPath}`;
  }

  private async request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
    const url = this.buildUrl(path);
    const headers = new Headers(options?.headers);
    headers.set('Content-Type', 'application/json');
    const method = (options?.method ?? 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrf = csrfToken();
      if (csrf) headers.set('X-XSRF-TOKEN', csrf);
    }
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && retry && !url.endsWith('/api/v1/auth/refresh')) {
      const refreshHeaders = new Headers();
      const csrf = csrfToken();
      if (csrf) refreshHeaders.set('X-XSRF-TOKEN', csrf);
      const refresh = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: refreshHeaders,
        credentials: 'include',
      });
      if (refresh.ok) return this.request<T>(path, options, false);
    }

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
    const queryEntries = entries.flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, String(item)] as [string, string])
        : [[key, String(value)] as [string, string]],
    );
    const searchParams = entries.length > 0
      ? `?${new URLSearchParams(queryEntries).toString()}`
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
    const response = await this.request<T | { data: T }>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    const response = await this.request<T | { data: T }>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  }

  async delete(path: string): Promise<void> {
    await this.request<void>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
