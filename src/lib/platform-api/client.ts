import { ApiError } from '@/lib/api/client';

const API_PREFIX = '/api/v1';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface IdentityUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

interface DataEnvelope<T> {
  data: T;
}

export interface PageEnvelope<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages?: number;
  };
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split('; ').find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function isRefreshable(path: string) {
  return !['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCookie('XSRF-TOKEN');
    if (csrf) headers.set('X-XSRF-TOKEN', csrf);
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retry && isRefreshable(path)) {
    try {
      await request<DataEnvelope<unknown>>('/auth/refresh', { method: 'POST' }, false);
      return request<T>(path, init, false);
    } catch {
      // Preserve the original 401 below so callers can clear local auth state.
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorEnvelope;
    throw new ApiError(body.error?.code ?? `HTTP_${response.status}`, body.error?.message ?? response.statusText, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const platformApi = {
  async getData<T>(path: string): Promise<T> {
    return (await request<DataEnvelope<T>>(path)).data;
  },
  getPage<T>(path: string): Promise<PageEnvelope<T>> {
    return request<PageEnvelope<T>>(path);
  },
  async postData<T>(path: string, data?: unknown): Promise<T> {
    return (await request<DataEnvelope<T>>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    })).data;
  },
  postVoid(path: string): Promise<void> {
    return request<void>(path, { method: 'POST' });
  },
  async patchData<T>(path: string, data: unknown): Promise<T> {
    return (await request<DataEnvelope<T>>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })).data;
  },
  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' });
  },
};

export const platformAuth = {
  me: () => platformApi.getData<IdentityUser>('/auth/me'),
  login: (email: string, password: string) =>
    platformApi.postData<{ user: IdentityUser; expiresIn: number }>('/auth/login', { email, password }),
  register: (email: string, password: string, displayName: string) =>
    platformApi.postData<{ user: IdentityUser; expiresIn: number }>('/auth/register', {
      email,
      password,
      displayName,
    }),
  logout: () => platformApi.postVoid('/auth/logout'),
};
