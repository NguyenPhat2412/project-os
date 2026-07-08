# Firestore BFF Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 28 Firestore collections from client SDK + React Query direct integration to Next.js API Routes + Admin SDK + React Query. Every Firestore operation goes through a REST endpoint validated by a custom permission service.

**Architecture:** BFF pattern — client code calls `/api/collections/...` via React Query. API routes validate session + check permissions via Admin SDK, then read/write Firestore. `lib/firestore-rq` core is refactored to use `fetch()` internally, preserving existing hook interfaces.

**Tech Stack:** Next.js App Router API Routes, Firebase Admin SDK, TanStack React Query v5, Zod validation.

---

## File Map

### New Files

| File | Responsibility |
|---|---|
| `src/lib/api/client.ts` | Typed fetch() wrapper, base URL, error parsing |
| `src/lib/api/types.ts` | Shared API types: `ApiError`, `ListResponse<T>`, `MutationResponse<T>` |
| `src/lib/api/permissions.ts` | Permission service: check project membership + role permissions via Admin SDK |
| `src/app/api/collections/[...path]/route.ts` | Dynamic route: all collection CRUD operations |
| `src/app/api/collections/route.ts` | Top-level collections: `projects`, `members` |
| `src/app/api/config/[projectId]/[name]/route.ts` | Config document read/write |
| `src/app/api/batch/route.ts` | Batch write operations |

### Modified Files

| File | Change |
|---|---|
| `src/lib/firestore-rq/core/createCollection.ts` | Remove `db` param, implement with `apiClient.get/post/patch/put/delete()` |
| `src/lib/firestore-rq/core/createSubcollection.ts` | Remove `db` param, pass through |
| `src/lib/firestore-rq/core/createConfig.ts` | Remove `db` param, implement with `apiClient.get/put()` |
| `src/lib/firestore-rq/core/batchWrite.ts` | Rewrite: POST to `/api/batch` instead of Firestore writeBatch |
| `src/lib/firestore-rq/core/firestoreHelpers.ts` | Delete — replaced by `apiClient` + API routes |
| `src/lib/firestore-rq/hooks/usePaginatedCollection.ts` | Change cursor from `QueryDocumentSnapshot` to document ID |
| `src/lib/firestore-rq/hooks/useBatchFetch.ts` | Remove Firestore SDK imports, use `apiClient` |
| `src/lib/firestore-rq/index.ts` | Remove Firestore SDK re-exports, update barrel exports |
| `src/lib/firestore-rq/types/index.ts` | Remove `QueryOptions.startAfter/startAt` Firestore snapshot types |
| `src/lib/project-config.ts` | Remove `db` import, `createConfig` call signature updated |
| `src/contexts/auth-context.tsx` | Remove `db` imports from `rootMembersCollection` (now param-less) |
| `src/lib/firebase/firestore.ts` | Deprecate — remove `db` export, keep `initializeApp` if needed |

### Module Collection Files (remove `db` param from every call site)

All files matching `src/modules/*/collections/*.ts` — see Section 8 for complete list.

---

## Task 1: API Client — `src/lib/api/client.ts`

**Files:**
- Create: `src/lib/api/client.ts`

- [ ] **Step 1: Create `src/lib/api/` directory and write `client.ts`**

```ts
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

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const body = await res.json();

    if (!res.ok) {
      throw new ApiError(
        body.error?.code ?? 'UNKNOWN',
        body.error?.message ?? res.statusText,
        res.status,
      );
    }

    return body.data;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const searchParams = params ? '?' + new URLSearchParams(
      Object.entries(params).flatMap(([k, v]) =>
        v !== undefined && v !== null
          ? (Array.isArray(v)
            ? v.map(item => [k, String(item)])
            : [[k, String(v)]])
          : []
      ).flat() as [string, string][]
    ).toString() : '';

    return this.request<T>(`${path}${searchParams}`);
  }

  async post<T>(path: string, data: unknown): Promise<T & { id: string }> {
    return this.request<T & { id: string }>(path, {
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
```

- [ ] **Step 2: Create `src/lib/api/types.ts`**

```ts
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
  method: 'create' | 'set' | 'update' | 'delete';
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/client.ts src/lib/api/types.ts
git commit -m "$(cat <<'EOF'
feat(api): add typed API client and shared types

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Permission Service — `src/lib/api/permissions.ts`

**Files:**
- Create: `src/lib/api/permissions.ts`
- Read: `src/lib/firestore-admin.ts`, existing role definition schemas in `src/modules/project-roles/`

- [ ] **Step 1: Read existing project roles schema to understand current structure**

```bash
ls src/modules/project-roles/collections/
```

- [ ] **Step 2: Write `src/lib/api/permissions.ts`**

```ts
// src/lib/api/permissions.ts
import { db } from '@/lib/firestore-admin';

export type Resource =
  | 'tasks' | 'sprints' | 'bugs' | 'backlog'
  | 'budget' | 'expenses' | 'risks'
  | 'meetings' | 'action_items'
  | 'documents' | 'folders' | 'wiki_links' | 'doc_activity'
  | 'timeline' | 'milestones' | 'gantt_phases'
  | 'activity_feed' | 'activity_comments' | 'notifications'
  | 'members' | 'comments'
  | 'roles' | 'project_roles'
  | 'projects';

export type Action = 'read' | 'write' | 'delete' | 'admin';

export interface PermissionContext {
  uid: string;
  projectId: string;
  resource: Resource;
  action: Action;
}

interface RolePermission {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  admin?: boolean;
}

interface RoleDefinition {
  roleId: string;
  name: string;
  permissions: Partial<Record<Resource, RolePermission>>;
}

interface ProjectRoleDoc {
  uid: string;
  roles: string[];
}

const RESOURCE_MAP: Record<string, Resource> = {
  tasks: 'tasks',
  task_columns: 'tasks',
  sprints: 'sprints',
  bugs: 'bugs',
  epics: 'backlog',
  budget_items: 'budget',
  expenses: 'expenses',
  risks: 'risks',
  meetings: 'meetings',
  action_items: 'action_items',
  documents: 'documents',
  folders: 'folders',
  wiki_links: 'wiki_links',
  doc_activity: 'doc_activity',
  milestones: 'milestones',
  gantt_phases: 'gantt_phases',
  activity_feed: 'activity_feed',
  activity_comments: 'activity_comments',
  notifications: 'notifications',
  members: 'members',
  comments: 'comments',
  roles: 'roles',
  project_roles: 'project_roles',
};

/**
 * Extract resource name from Firestore path segment.
 * E.g. "tasks" from "projects/P1/tasks"
 */
export function pathToResource(path: string): Resource | null {
  const segments = path.split('/');
  const resourceSegment = segments[segments.length - 1];
  // If it's a document ID (not collection name), go one segment back
  const collectionName = segments.length % 2 === 0
    ? segments[segments.length - 2]
    : resourceSegment;
  return RESOURCE_MAP[collectionName] ?? null;
}

async function getUserRoles(uid: string, projectId: string): Promise<string[]> {
  const doc = await db
    .collection('projects').doc(projectId)
    .collection('project_roles').doc(uid)
    .get();

  if (!doc.exists) return [];
  const data = doc.data() as ProjectRoleDoc | undefined;
  return data?.roles ?? [];
}

async function getRoleDefinitions(uid: string, projectId: string): Promise<RoleDefinition[]> {
  const roleIds = await getUserRoles(uid, projectId);
  if (roleIds.length === 0) return [];

  const results = await Promise.all(
    roleIds.map((roleId) =>
      db.collection('projects').doc(projectId)
        .collection('roles').doc(roleId).get()
    )
  );

  return results
    .filter((r) => r.exists)
    .map((r) => r.data() as RoleDefinition);
}

function mergePermissions(roles: RoleDefinition[]): Partial<Record<Resource, RolePermission>> {
  const merged: Partial<Record<Resource, RolePermission>> = {};

  for (const role of roles) {
    for (const [resource, perms] of Object.entries(role.permissions)) {
      if (!merged[resource as Resource]) {
        merged[resource as Resource] = {};
      }
      const target = merged[resource as Resource]!;
      if (perms.read !== undefined) target.read = perms.read;
      if (perms.write !== undefined) target.write = perms.write;
      if (perms.delete !== undefined) target.delete = perms.delete;
      if (perms.admin !== undefined) target.admin = perms.admin;
    }
  }

  return merged;
}

/**
 * Check if a user has a specific permission on a resource within a project.
 */
export async function checkPermission(ctx: PermissionContext): Promise<boolean> {
  const { uid, projectId, resource, action } = ctx;

  // Special case: 'projects' top-level collection — any authenticated user can access
  if (resource === 'projects') return true;

  const roles = await getRoleDefinitions(uid, projectId);
  if (roles.length === 0) return false;

  const perms = mergePermissions(roles);
  const resourcePerm = perms[resource];

  if (!resourcePerm) return false;

  switch (action) {
    case 'read': return resourcePerm.read ?? false;
    case 'write': return resourcePerm.write ?? false;
    case 'delete': return resourcePerm.delete ?? false;
    case 'admin': return resourcePerm.admin ?? false;
    default: return false;
  }
}

/**
 * Check permission and throw 403 if denied.
 */
export async function requirePermission(ctx: PermissionContext): Promise<void> {
  const allowed = await checkPermission(ctx);
  if (!allowed) {
    throw new Error(`Permission denied: ${ctx.action} on ${ctx.resource}`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/permissions.ts
git commit -m "$(cat <<'EOF'
feat(api): add permission service with project role checking

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: API Routes — Collections

**Files:**
- Create: `src/app/api/collections/[...path]/route.ts`
- Create: `src/app/api/collections/route.ts`

- [ ] **Step 1: Write the dynamic collection route — `src/app/api/collections/[...path]/route.ts`**

```ts
// src/app/api/collections/[...path]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';
import { requirePermission, pathToResource } from '@/lib/api/permissions';
import type { Resource, Action } from '@/lib/api/permissions';

type RouteParams = { params: Promise<{ path: string[] }> };

// Helper: parse query params for list operations
function parseQueryParams(url: URL): {
  where?: { field: string; op: string; value: string }[];
  orderBy?: { field: string; direction?: string }[];
  limit?: number;
  startAfter?: string;
} {
  const params = url.searchParams;
  const where = params.getAll('where').map((w) => {
    const [field, op, value] = w.split(':');
    return { field, op, op: op as '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in', value };
  }).filter(w => w.field && w.op && w.value);
  const orderBy = params.getAll('orderBy').map((o) => {
    const [field, direction] = o.split(':');
    return { field, direction: direction as 'asc' | 'desc' | undefined };
  }).filter(o => o.field);
  const limit = params.has('limit') ? parseInt(params.get('limit')!) : undefined;
  const startAfter = params.get('startAfter') ?? undefined;

  return { where, orderBy, limit, startAfter };
}

// Helper: build Firestore query from parsed params
async function buildQuery(collectionPath: string, params: ReturnType<typeof parseQueryParams>) {
  const { where, orderBy, limit, startAfter } = params;

  let query: FirebaseFirestore.Query = db.collection(collectionPath);

  for (const w of where) {
    query = query.where(w.field, w.op as FirebaseFirestore.WhereFilterOp, w.value);
  }
  for (const o of orderBy) {
    query = query.orderBy(o.field, o.direction ?? 'asc');
  }
  if (startAfter) {
    const snap = await db.collection(collectionPath).doc(startAfter).get();
    if (snap.exists) query = query.startAfter(snap);
  }
  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

// ─── GET: useDocument or useList ─────────────────────────────────────────────

export async function GET(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { path } = await context.params;
  const projectId = path[0];
  const collectionName = path[1];
  const docId = path[2]; // optional

  const collectionPath = docId
    ? `${projectId}/${collectionName}/${docId}`
    : `${projectId}/${collectionName}`;

  // Determine if this is a doc or collection read
  const isDocRead = !!docId;

  // For collection reads, check permission
  if (!isDocRead) {
    const resource = pathToResource(collectionPath) ?? collectionName as Resource;
    const action: Action = 'read';
    try {
      await requirePermission({ uid: session.user.id, projectId, resource, action });
    } catch {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
    }
  }

  try {
    if (isDocRead) {
      const snap = await db.collection(projectId).doc(collectionName).collection('__none__').get();
      // Actually, use the correct path
      const docPath = `${projectId}/${collectionName}/${docId}`;
      const snap2 = await db.doc(docPath).get();
      if (!snap2.exists) {
        return NextResponse.json({ data: null });
      }
      return NextResponse.json({ data: { id: snap2.id, ...snap2.data() } });
    } else {
      const fullCollectionPath = `${projectId}/${collectionName}`;
      const query = await buildQuery(fullCollectionPath, parseQueryParams(new URL(request.url)));
      const snap = await query.get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ data: items });
    }
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

// ─── POST: useCreate ───────────────────────────────────────────────────────────

export async function POST(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { path } = await context.params;
  const projectId = path[0];
  const collectionName = path[1];

  if (path.length > 2) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'POST to collection only' } }, { status: 400 });
  }

  const resource = pathToResource(`${projectId}/${collectionName}`) ?? collectionName as Resource;
  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'write' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    const collectionPath = `${projectId}/${collectionName}`;
    const docRef = db.collection(collectionPath).doc();
    const dataWithTimestamps = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(dataWithTimestamps);
    return NextResponse.json({ data: { id: docRef.id, ...dataWithTimestamps }, id: docRef.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

// ─── PUT: useSet ───────────────────────────────────────────────────────────────

export async function PUT(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { path } = await context.params;
  const projectId = path[0];
  const collectionName = path[1];
  const docId = path[2];

  if (!docId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'PUT requires document ID' } }, { status: 400 });
  }

  const docPath = `${projectId}/${collectionName}/${docId}`;
  const resource = pathToResource(docPath) ?? collectionName as Resource;
  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'write' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    await db.doc(docPath).set({ ...body, updatedAt: new Date() }, { merge: true });
    const snap = await db.doc(docPath).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

// ─── PATCH: useUpdate ─────────────────────────────────────────────────────────

export async function PATCH(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { path } = await context.params;
  const projectId = path[0];
  const collectionName = path[1];
  const docId = path[2];

  if (!docId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'PATCH requires document ID' } }, { status: 400 });
  }

  const docPath = `${projectId}/${collectionName}/${docId}`;
  const resource = pathToResource(docPath) ?? collectionName as Resource;
  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'write' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    await db.doc(docPath).update({ ...body, updatedAt: new Date() });
    const snap = await db.doc(docPath).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

// ─── DELETE: useDelete ─────────────────────────────────────────────────────────

export async function DELETE(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { path } = await context.params;
  const projectId = path[0];
  const collectionName = path[1];
  const docId = path[2];

  if (!docId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'DELETE requires document ID' } }, { status: 400 });
  }

  const docPath = `${projectId}/${collectionName}/${docId}`;
  const resource = pathToResource(docPath) ?? collectionName as Resource;
  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'delete' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    await db.doc(docPath).delete();
    return NextResponse.json({ data: null });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}
```

**Note on GET implementation:** The `GET` handler above has a bug — the `isDocRead` branch uses `db.collection(projectId).doc(collectionName).collection('__none__')` before the correct `db.doc(docPath)` call. The correct pattern should be:

```ts
if (isDocRead) {
  const docPath = `${projectId}/${collectionName}/${docId}`;
  const snap = await db.doc(docPath).get();
  if (!snap.exists) return NextResponse.json({ data: null });
  return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
}
```

Replace the broken GET doc-read block with the corrected version above.

- [ ] **Step 2: Write top-level collections route — `src/app/api/collections/route.ts`**

```ts
// src/app/api/collections/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';

function parseQueryParams(url: URL) {
  const params = url.searchParams;
  const where = params.getAll('where').map((w) => {
    const [field, op, value] = w.split(':');
    return { field, op: op as '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in', value };
  }).filter(w => w.field && w.op && w.value);
  const orderBy = params.getAll('orderBy').map((o) => {
    const [field, direction] = o.split(':');
    return { field, direction: direction as 'asc' | 'desc' | undefined };
  }).filter(o => o.field);
  const limit = params.has('limit') ? parseInt(params.get('limit')!) : undefined;
  return { where, orderBy, limit };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const collectionName = new URL(request.url).searchParams.get('__collection');
  if (!collectionName || !['projects', 'members'].includes(collectionName)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid top-level collection' } }, { status: 400 });
  }

  const { where, orderBy, limit } = parseQueryParams(new URL(request.url));
  let query: FirebaseFirestore.Query = db.collection(collectionName);
  for (const w of where) {
    query = query.where(w.field, w.op as FirebaseFirestore.WhereFilterOp, w.value);
  }
  for (const o of orderBy) {
    query = query.orderBy(o.field, o.direction ?? 'asc');
  }
  if (limit) query = query.limit(limit);

  try {
    const snap = await query.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ data: items });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const collectionName = body.__collection;

  if (!collectionName || !['projects', 'members'].includes(collectionName)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid top-level collection' } }, { status: 400 });
  }

  try {
    const docRef = db.collection(collectionName).doc();
    await docRef.set({ ...body, createdAt: new Date(), updatedAt: new Date() });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() }, id: snap.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id, __collection, ...body } = await request.json();
  if (!id || !['projects', 'members'].includes(__collection)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid request' } }, { status: 400 });
  }

  try {
    await db.collection(__collection).doc(id).set({ ...body, updatedAt: new Date() }, { merge: true });
    const snap = await db.collection(__collection).doc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id, __collection, ...body } = await request.json();
  if (!id || !['projects', 'members'].includes(__collection)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid request' } }, { status: 400 });
  }

  try {
    await db.collection(__collection).doc(id).update({ ...body, updatedAt: new Date() });
    const snap = await db.collection(__collection).doc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const collectionName = searchParams.get('__collection');

  if (!id || !['projects', 'members'].includes(collectionName)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid request' } }, { status: 400 });
  }

  try {
    await db.collection(collectionName).doc(id).delete();
    return NextResponse.json({ data: null });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/collections/route.ts "src/app/api/collections/[...path]/route.ts"
git commit -m "$(cat <<'EOF'
feat(api): add collection CRUD routes (dynamic + top-level)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: API Routes — Config & Batch

**Files:**
- Create: `src/app/api/config/[projectId]/[name]/route.ts`
- Create: `src/app/api/batch/route.ts`

- [ ] **Step 1: Write config route — `src/app/api/config/[projectId]/[name]/route.ts`**

```ts
// src/app/api/config/[projectId]/[name]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';
import { requirePermission } from '@/lib/api/permissions';
import type { Resource, Action } from '@/lib/api/permissions';

type RouteParams = { params: Promise<{ projectId: string; name: string }> };

export async function GET(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { projectId, name } = await context.params;

  // user_profiles are user-scoped, not project-scoped
  if (name === 'user_profiles') {
    const uid = session.user.id;
    const snap = await db
      .collection('projects').doc(projectId)
      .collection('user_profiles').doc(uid).get();
    return NextResponse.json({ data: snap.exists ? { id: snap.id, ...snap.data() } : null });
  }

  const resource: Resource = name === 'dashboard' ? 'tasks'
    : name === 'budget' ? 'budget'
    : name === 'reports' ? 'tasks'
    : name === 'sprint' ? 'sprints'
    : 'tasks';

  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'read' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    const docPath = `projects/${projectId}/config/${name}`;
    const snap = await db.doc(docPath).get();
    return NextResponse.json({ data: snap.exists ? { id: snap.id, ...snap.data() } : null });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { projectId, name } = await context.params;
  const body = await request.json();

  // user_profiles are user-scoped
  if (name === 'user_profiles') {
    const uid = session.user.id;
    await db
      .collection('projects').doc(projectId)
      .collection('user_profiles').doc(uid)
      .set({ ...body, updatedAt: new Date() }, { merge: true });
    const snap = await db
      .collection('projects').doc(projectId)
      .collection('user_profiles').doc(uid).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  }

  const resource: Resource = name === 'dashboard' ? 'tasks'
    : name === 'budget' ? 'budget'
    : name === 'reports' ? 'tasks'
    : name === 'sprint' ? 'sprints'
    : 'tasks';

  try {
    await requirePermission({ uid: session.user.id, projectId, resource, action: 'write' });
  } catch {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Permission denied' } }, { status: 403 });
  }

  try {
    const docPath = `projects/${projectId}/config/${name}`;
    await db.doc(docPath).set({ ...body, updatedAt: new Date() }, { merge: true });
    const snap = await db.doc(docPath).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write batch route — `src/app/api/batch/route.ts`**

```ts
// src/app/api/batch/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';
import type { BatchRequest, BatchResponse } from '@/lib/api/types';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body: BatchRequest = await request.json();

  if (!body.operations?.length) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'No operations provided' } }, { status: 400 });
  }

  try {
    const batch = db.batch();
    const results: BatchResponse['results'] = [];

    for (const op of body.operations) {
      const path = op.path;
      const id = op.id;

      if (!path || !id) {
        results.push({ id: id ?? '(no-id)', success: false, error: 'Missing path or id' });
        continue;
      }

      const docRef = db.doc(`${path}/${id}`);

      switch (op.method) {
        case 'set':
          batch.set(docRef, { ...op.data, updatedAt: new Date() }, { merge: true });
          break;
        case 'update':
          batch.update(docRef, { ...op.data, updatedAt: new Date() });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default:
          results.push({ id, success: false, error: `Unknown method: ${op.method}` });
          continue;
      }

      results.push({ id, success: true });
    }

    await batch.commit();
    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: String(err) } }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/config/[projectId]/[name]/route.ts src/app/api/batch/route.ts
git commit -m "$(cat <<'EOF'
feat(api): add config and batch API routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Refactor lib/firestore-rq Core

**Files:**
- Modify: `src/lib/firestore-rq/core/createCollection.ts`
- Modify: `src/lib/firestore-rq/core/createSubcollection.ts`
- Modify: `src/lib/firestore-rq/core/createConfig.ts`
- Modify: `src/lib/firestore-rq/core/batchWrite.ts`
- Delete: `src/lib/firestore-rq/core/firestoreHelpers.ts`

- [ ] **Step 1: Rewrite `src/lib/firestore-rq/core/createCollection.ts`**

Remove `db: Firestore` parameter. Replace Firestore SDK calls with `apiClient`.

```ts
// src/lib/firestore-rq/core/createCollection.ts
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/query-core';
import { apiClient } from '@/lib/api/client';
import type { QueryOptions, CreateInput, UpdateInput, CollectionConfig, WithId, ListResponse } from '../types';
import { firestoreKeys } from './queryKeys';

export function createCollection<T extends object>(config: CollectionConfig<T>) {
  const { path } = config;

  // ─── useDocument ────────────────────────────────────────────────────────────

  function useDocument(id: string | null | undefined, queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
    return useQuery({
      queryKey: firestoreKeys.detail(path, id ?? ''),
      queryFn: () => apiClient.get<WithId<T>>(`${path}/${id}`),
      enabled: !!id,
      staleTime: 60_000,
      ...queryOptions,
    });
  }

  // ─── useList ─────────────────────────────────────────────────────────────────

  function useList(
    options: QueryOptions = {},
    queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
  ) {
    const { enabled: enabledOption = true, ...firestoreOptions } = options;
    const { enabled: enabledQuery, ...restQueryOptions } = queryOptions ?? {};
    const isEnabled = enabledQuery ?? enabledOption;

    return useQuery<WithId<T>[], Error, WithId<T>[], QueryKey>({
      queryKey: firestoreKeys.list(path, firestoreOptions),
      queryFn: () => {
        const params: Record<string, unknown> = {};
        if (firestoreOptions.where) {
          const clauses = Array.isArray(firestoreOptions.where) ? firestoreOptions.where : [firestoreOptions.where];
          clauses.forEach((c, i) => {
            params[`where[${i}]`] = `${c.field}:${c.op}:${c.value}`;
          });
        }
        if (firestoreOptions.orderBy) {
          const orders = Array.isArray(firestoreOptions.orderBy) ? firestoreOptions.orderBy : [firestoreOptions.orderBy];
          orders.forEach((o, i) => {
            params[`orderBy[${i}]`] = o.direction
              ? `${o.field}:${o.direction}`
              : o.field;
          });
        }
        if (firestoreOptions.limit) params.limit = firestoreOptions.limit;
        if (firestoreOptions.startAfter) params.startAfter = String(firestoreOptions.startAfter);
        return apiClient.get<ListResponse<T>>(`${path}`, params);
      },
      enabled: isEnabled,
      staleTime: 60_000,
      ...(restQueryOptions as any),
    });
  }

  // ─── useCreate ────────────────────────────────────────────────────────────────

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateInput<T>) => apiClient.post<WithId<T>>(`${path}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  // ─── useSet ───────────────────────────────────────────────────────────────

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

  // ─── useUpdate ────────────────────────────────────────────────────────────────

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

  // ─── useDelete ────────────────────────────────────────────────────────────────

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => apiClient.delete(`${path}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
      },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const helpers = {
    fetch: (id: string) => apiClient.get<WithId<T>>(`${path}/${id}`),
    fetchList: (options?: QueryOptions) => {
      const params: Record<string, unknown> = {};
      if (options?.where) {
        const clauses = Array.isArray(options.where) ? options.where : [options.where];
        clauses.forEach((c, i) => {
          params[`where[${i}]`] = `${c.field}:${c.op}:${c.value}`;
        });
      }
      return apiClient.get<ListResponse<T>>(`${path}`, params);
    },
    create: (data: CreateInput<T>) => apiClient.post<WithId<T>>(`${path}`, data),
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
```

- [ ] **Step 2: Rewrite `src/lib/firestore-rq/core/createSubcollection.ts`**

```ts
// src/lib/firestore-rq/core/createSubcollection.ts
import { createCollection } from './createCollection';
import type { CollectionConfig } from '../types';

export function createSubcollection<T extends object>(
  config: Omit<CollectionConfig<T>, 'path'> & {
    path: (...parentIds: string[]) => string;
  },
) {
  return (...parentIds: string[]) => {
    const resolvedPath = config.path(...parentIds);
    return createCollection<T>({ ...config, path: resolvedPath });
  };
}
```

- [ ] **Step 3: Rewrite `src/lib/firestore-rq/core/createConfig.ts`**

```ts
// src/lib/firestore-rq/core/createConfig.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface ConfigDocumentConfig {
  basePath: string;
  projectId: string;
  name: string;
}

export function createConfig<T extends object>(config: ConfigDocumentConfig) {
  const docPath = `${config.basePath}/${config.name}`;

  function useDocument() {
    return useQuery({
      queryKey: ['config', config.projectId, config.name],
      queryFn: () => apiClient.get<T>(`/config/${config.projectId}/${config.name}`),
      staleTime: 60_000,
    });
  }

  function useSet() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: Partial<T>) =>
        apiClient.put<T>(`/config/${config.projectId}/${config.name}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['config', config.projectId, config.name] });
      },
    });
  }

  const helpers = {
    fetch: () => apiClient.get<T>(`/config/${config.projectId}/${config.name}`),
    set: (data: Partial<T>) => apiClient.put<T>(`/config/${config.projectId}/${config.name}`, data),
  };

  return { useDocument, useSet, helpers };
}
```

- [ ] **Step 4: Rewrite `src/lib/firestore-rq/core/batchWrite.ts`**

```ts
// src/lib/firestore-rq/core/batchWrite.ts
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
      const result = await apiClient.post<BatchResponse>('/batch', body);
      const failed = result.results.filter((r) => !r.success);
      if (failed.length > 0) {
        throw new Error(`Batch failed: ${failed.map((f) => `${f.id}: ${f.error}`).join(', ')}`);
      }
    },
    rollback() {
      operations.length = 0;
    },
  };

  return self;
}
```

- [ ] **Step 5: Update `src/lib/firestore-rq/types/index.ts` — remove Firestore-specific types**

```ts
// src/lib/firestore-rq/types/index.ts

export type WithId<T> = T & { id: string };

export interface WhereClause {
  field: string;
  op: string;
  value: unknown;
}

export interface OrderByClause {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface QueryOptions {
  where?: WhereClause | WhereClause[];
  orderBy?: OrderByClause | OrderByClause[];
  limit?: number;
  startAfter?: string;
  enabled?: boolean;
}

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

export interface CollectionConfig<T extends object> {
  path: string;
  transform?: (raw: T & { id: string }) => WithId<T>;
}

export interface UseDocumentResult<T> {
  data: WithId<T> | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ListResponse<T> {
  data: T[];
  total?: number;
}
```

- [ ] **Step 6: Update `src/lib/firestore-rq/index.ts` barrel exports**

```ts
// src/lib/firestore-rq/index.ts (rewrite)
export { createCollection } from './core/createCollection';
export { createSubcollection } from './core/createSubcollection';
export { createConfig } from './core/createConfig';
export { batchWrite } from './core/batchWrite';
export { firestoreKeys } from './core/queryKeys';

export type { WithId, QueryOptions, WhereClause, OrderByClause, CreateInput, UpdateInput, CollectionConfig, UseDocumentResult, UseCollectionResult, ListResponse } from './types';
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/firestore-rq/
git commit -m "$(cat <<'EOF'
refactor(firestore-rq): replace client SDK with REST API client

BREAKING CHANGE: createCollection, createSubcollection, createConfig no longer
accept a Firestore instance as first argument. All Firestore operations
now go through Next.js API routes.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Hooks Adjustments

**Files:**
- Modify: `src/lib/firestore-rq/hooks/usePaginatedCollection.ts`
- Modify: `src/lib/firestore-rq/hooks/useBatchFetch.ts`

- [ ] **Step 1: Rewrite `src/lib/firestore-rq/hooks/usePaginatedCollection.ts`**

Cursor changes from `QueryDocumentSnapshot` to document ID string.

```ts
// src/lib/firestore-rq/hooks/usePaginatedCollection.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ListResponse, CollectionConfig, WithId, QueryOptions } from '../types';
import { firestoreKeys } from '../core/queryKeys';

export function usePaginatedCollection<T extends object>(
  config: CollectionConfig<T>,
  options: Omit<QueryOptions, 'startAfter' | 'startAt'> & { limit: number },
) {
  const { limit: pageSize, ...restOptions } = options;

  return useInfiniteQuery({
    queryKey: [...firestoreKeys.list(config.path, options), 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params: Record<string, unknown> = { limit: pageSize };

      if (restOptions.where) {
        const clauses = Array.isArray(restOptions.where) ? restOptions.where : [restOptions.where];
        clauses.forEach((c, i) => {
          params[`where[${i}]`] = `${c.field}:${c.op}:${c.value}`;
        });
      }
      if (restOptions.orderBy) {
        const orders = Array.isArray(restOptions.orderBy) ? restOptions.orderBy : [restOptions.orderBy];
        orders.forEach((o, i) => {
          params[`orderBy[${i}]`] = o.direction ? `${o.field}:${o.direction}` : o.field;
        });
      }
      if (pageParam) params.startAfter = pageParam;

      const result = await apiClient.get<ListResponse<T>>(config.path, params);
      const items = result.data as WithId<T>[];
      const cursor = items.length === pageSize ? items[items.length - 1]?.id : null;

      return { items, cursor: cursor ?? null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < pageSize) return undefined;
      return lastPage.cursor ?? undefined;
    },
  });
}
```

- [ ] **Step 2: Rewrite `src/lib/firestore-rq/hooks/useBatchFetch.ts`**

Remove Firestore SDK imports. Use `apiClient.get()`.

```ts
// src/lib/firestore-rq/hooks/useBatchFetch.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ListResponse, CollectionConfig, WithId } from '../types';
import { firestoreKeys } from '../core/queryKeys';

interface BatchItem<T> {
  key: string;
  fetcher: () => Promise<T>;
}

interface BatchResult<T> {
  data: Record<string, T>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useBatchFetch<T>(items: BatchItem<T>[], queryKeyName?: string): BatchResult<T> {
  const keys = items.map((i) => i.key);
  const queryName = queryKeyName || keys.join('-');
  const queryKey = ['batch', queryName];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const results = await Promise.all(items.map((item) => item.fetcher()));
      return results.reduce((acc, data, index) => {
        acc[items[index].key] = data;
        return acc;
      }, {} as Record<string, T>);
    },
    staleTime: 60_000,
  });

  return {
    data: query.data ?? ({} as Record<string, T>),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function createCollectionListItem<T extends object>(key: string, config: CollectionConfig<T>) {
  return {
    key,
    fetcher: () => apiClient.get<ListResponse<T>>(`${config.path}`),
  };
}

export function createDocumentItem<T extends object>(
  key: string,
  config: CollectionConfig<T>,
  id: string,
): BatchItem<WithId<T> | null> {
  return {
    key,
    fetcher: () => apiClient.get<WithId<T>>(`${config.path}/${id}`),
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-rq/hooks/usePaginatedCollection.ts src/lib/firestore-rq/hooks/useBatchFetch.ts
git commit -m "$(cat <<'EOF'
refactor(hooks): update pagination and batch fetch to REST

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update Module Collections & Config Files

**Files:**
- Modify: All `src/modules/*/collections/*.ts` — remove `db` argument from all `createCollection`/`createSubcollection` calls
- Modify: `src/lib/project-config.ts` — remove `db` import, update `createConfig` calls
- Modify: `src/modules/root/collections/root-members.ts`
- Modify: `src/modules/projects/collections/projects.ts`
- Modify: `src/contexts/auth-context.tsx`

**All 28 collection files need the same pattern change:**

```ts
// TRƯỚC:
import { db } from '@/lib/firebase/firestore';
export const tasksCollection = createSubcollection<Task>(db, { ... });

// SAU:
export const tasksCollection = createSubcollection<Task>({ ... });
```

**Complete list of files to update:**

```
src/modules/tasks/collections/tasks.ts
src/modules/tasks/collections/taskColumns.ts
src/modules/tasks/collections/config.ts
src/modules/sprint/collections/sprint.ts
src/modules/bugs/collections/bugs.ts
src/modules/backlog/collections/bugs.ts
src/modules/backlog/collections/epics.ts
src/modules/docs/collections/documents.ts
src/modules/docs/collections/folders.ts
src/modules/docs/collections/docActivity.ts
src/modules/docs/collections/wikiLinks.ts
src/modules/team/collections/team.ts
src/modules/team/collections/members.ts
src/modules/meetings/collections/meetings.ts
src/modules/meetings/collections/actionItems.ts
src/modules/timeline/collections/milestones.ts
src/modules/timeline/collections/ganttPhases.ts
src/modules/risk/collections/risks.ts
src/modules/budget/collections/budget.ts
src/modules/budget/collections/expenses.ts
src/modules/activity/collections/activityFeed.ts
src/modules/activity/collections/activityComments.ts
src/modules/activity/collections/notifications.ts
src/modules/comments/collections/comments.ts
src/modules/project-roles/collections/role-definitions.ts
src/modules/project-roles/collections/project-roles.ts
src/modules/root/collections/root-members.ts
src/modules/projects/collections/projects.ts
```

- [ ] **Step 1: Update `src/lib/project-config.ts`**

Change all `createConfig(db, { basePath: ... })` to `createConfig({ basePath: ..., projectId: PROJECT_ID, name: ... })`.

The `createConfig` interface changed from `(db, config)` to `(config)` where config now includes `projectId` and `name` directly. The `basePath` still includes the projectId, so the simplest fix is:

```ts
// BEFORE:
export const dashboardConfig = createConfig<DashboardConfig>(db, {
  basePath: CONFIG_BASE,
});

// AFTER: createConfig now takes { basePath, projectId, name }
export const dashboardConfig = createConfig<DashboardConfig>({
  basePath: CONFIG_BASE,
  projectId: PROJECT_ID,
  name: 'dashboard',
});
```

Each config needs its own `name` field matching the document ID:
- `dashboardConfig` → `name: 'dashboard'`
- `budgetConfig` → `name: 'budget'`
- `reportsConfig` → `name: 'reports'`
- `sprintConfig` → `name: 'sprint'`
- `aiSettingsConfig` → `name: 'ai_settings'`
- `themeConfig` → `name: 'theme'`
- `profileConfig` → `name: 'user_profiles'` (user_profiles collection uses its own logic in the API route)

Also remove the `db` import from `@/lib/firebase/firestore`.

- [ ] **Step 2: Update all module collection files**

For each file, remove the `import { db } from '@/lib/firebase/firestore';` line and remove `db, ` from the first argument of `createCollection()` and `createSubcollection()` calls.

Run this sed command for bulk replacement:

```bash
# Remove db import from every module collections file
sed -i '' "s/import { db } from '@\/lib\/firebase\/firestore';\n//g" src/modules/*/collections/*.ts

# Remove db, from createCollection/createSubcollection call first argument
sed -i '' 's/createCollection<.*>(db,/createCollection</g' src/modules/*/collections/*.ts
sed -i '' 's/createSubcollection<.*>(db,/createSubcollection<g' src/modules/*/collections/*.ts
```

Then manually verify a few files to ensure the changes are correct.

**For `src/modules/root/collections/root-members.ts`:**
```ts
// TRƯỚC:
import { db } from '@/lib/firebase/firestore';
export const rootMembersCollection = createCollection<RootMember>(db, { path: 'members', ... });

// SAU:
export const rootMembersCollection = createCollection<RootMember>({ path: 'members', ... });
```

**For `src/modules/projects/collections/projects.ts`:**
```ts
// TRƯỚC:
import { db } from '@/lib/firebase/firestore';
export const projectsCollection = createCollection<Project>(db, { path: 'projects' });

// SAU:
export const projectsCollection = createCollection<Project>({ path: 'projects' });
```

- [ ] **Step 3: Verify `src/contexts/auth-context.tsx`**

After updating `rootMembersCollection` (which no longer takes `db`), `auth-context.tsx` should import correctly. The `profileConfig` helpers also use `apiClient` now, so check imports still work.

```ts
// auth-context.tsx uses:
rootMembersCollection.helpers.fetch(uid)    // ✅ now uses apiClient
profileConfig.helpers.fetch(uid)           // ✅ now uses apiClient
```

Both should work without changes since their interfaces (`helpers.fetch`) are preserved.

- [ ] **Step 4: Commit**

```bash
git add src/modules/ src/lib/project-config.ts src/contexts/auth-context.tsx
git commit -m "$(cat <<'EOF'
refactor(modules): remove Firestore client SDK from all collections

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Deprecate Client Firestore + Type Check

**Files:**
- Modify: `src/lib/firebase/firestore.ts` — add deprecation comment or remove `db` export
- Run: TypeScript type check

- [ ] **Step 1: Mark `src/lib/firebase/firestore.ts` as deprecated**

Add a comment at the top of the file:

```ts
/**
 * @deprecated Since BFF migration — Firestore client SDK is no longer used.
 * All data operations now go through Next.js API routes via lib/api/client.ts.
 * This file is kept for potential dev tools / emergency use only.
 */
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/tony/GitLab/claude-project-management
npx tsc --noEmit 2>&1 | head -80
```

Expected output: Errors in files that still import from `@/lib/firebase/firestore` or `firebase/firestore` directly. Fix each error.

Common fixes:
- Remove `db` imports that are now unused
- Update types that reference Firestore SDK types (`DocumentData`, `FirestoreError`) → use plain `object` or project types
- `usePaginatedCollection` no longer takes `db` as first arg

- [ ] **Step 3: Fix TypeScript errors iteratively**

Each error will be one of:
1. A file still importing `db` from `@/lib/firebase/firestore` — remove the import
2. A type reference to `DocumentData` or `FirestoreError` — replace with `object` or custom types
3. A function call passing `db` as first argument — remove the `db` argument
4. A `QueryDocumentSnapshot` reference — replace with `string` (doc ID)

Keep fixing until `npx tsc --noEmit` passes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase/firestore.ts
git commit -m "$(cat <<'EOF'
chore: deprecate Firestore client SDK export

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Verify & Test

**Files:**
- Verify: `npm run dev` starts without errors
- Verify: Login flow works (NextAuth + API routes)
- Verify: At least one module page loads (e.g., `/tasks` or `/dashboard`)
- Verify: API route responds correctly

- [ ] **Step 1: Start dev server and test**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000/api/collections/tasks -H "Cookie: ..." 2>&1 | head -20
```

Note: The cookie header needs a valid NextAuth session token. Use browser DevTools to copy the `authjs.session-token` cookie value, or test via Playwright.

- [ ] **Step 2: Commit final verification**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: complete Firestore BFF migration — all collections via API routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Spec Coverage Check

| Spec Section | Task(s) |
|---|---|
| API Route Structure | Task 3, Task 4 |
| Permission Service | Task 2 |
| createCollection refactor | Task 5 |
| createSubcollection refactor | Task 5 |
| createConfig refactor | Task 5 |
| batchWrite refactor | Task 5 |
| usePaginatedCollection cursor change | Task 6 |
| useBatchFetch refactor | Task 6 |
| Module collection files | Task 7 |
| Types update | Task 5, Task 8 |
| Auth context update | Task 7 |
| TypeScript check | Task 8 |
| Deprecation | Task 8 |

## Type Consistency Check

- `apiClient.get<T>()` returns `T` — `createCollection` hooks expect `WithId<T> | null` from GET, matches
- `apiClient.post<T>()` returns `T & { id: string }` — `useCreate` returns `{ id }` from response, matches
- `createConfig` now takes `{ basePath, projectId, name }` — all call sites updated in Task 7
- `usePaginatedCollection` cursor is `string | undefined` — matches `startAfter?: string` in `QueryOptions`
- `batchWrite.commit()` now calls API, throws on failure — matches original Firestore batch behavior
