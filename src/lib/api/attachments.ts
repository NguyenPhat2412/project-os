import type { Attachment } from '@/lib/types/attachment';

function csrfToken() {
  const item = document.cookie.split('; ').find((value) => value.startsWith('XSRF-TOKEN='));
  return item ? decodeURIComponent(item.slice('XSRF-TOKEN='.length)) : null;
}

export async function uploadAttachment(file: File, storagePath: string): Promise<Attachment> {
  const projectId = projectIdFrom(storagePath);
  const form = new FormData();
  form.set('file', file);
  form.set('storagePath', storagePath);
  const headers = new Headers();
  const csrf = csrfToken();
  if (csrf) headers.set('X-XSRF-TOKEN', csrf);
  const response = await fetch(`/api/v1/projects/${projectId}/attachments/content`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? 'Upload failed');
  return body.data as Attachment;
}

export async function deleteAttachment(storagePath: string): Promise<void> {
  const projectId = projectIdFrom(storagePath);
  const headers = new Headers();
  const csrf = csrfToken();
  if (csrf) headers.set('X-XSRF-TOKEN', csrf);
  const response = await fetch(
    `/api/v1/projects/${projectId}/attachments/content?storagePath=${encodeURIComponent(storagePath)}`,
    { method: 'DELETE', headers, credentials: 'include' },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message ?? 'Delete failed');
  }
}

function projectIdFrom(storagePath: string) {
  const projectId = storagePath.split('/')[1];
  if (!projectId) throw new Error('Storage path must include a project ID');
  return encodeURIComponent(projectId);
}
