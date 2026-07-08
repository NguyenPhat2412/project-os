# Firestore BFF Migration Design

**Date:** 2026-05-31
**Status:** Approved
**Approach:** Big Bang — Full REST migration via Next.js API Routes

---

## 1. Motivation & Goals

**Why:**
- Firestore Security Rules không đủ linh hoạt cho business logic phức tạp
- Cần bảo vệ data ở tầng server, không trust client-side operations
- Muốn tất cả data flow qua một điểm (logging, throttle, validation, caching)
- Chuẩn bị cho potential backend expansion (PostgreSQL, multi-tenant)

**Goals:**
- Tất cả CRUD operations qua REST API routes (Next.js API Routes + Firebase Admin SDK)
- React Query quản lý tất cả data fetching (reads + writes)
- Permission checks ở tầng server qua custom permission service
- Giữ nguyên `lib/firestore-rq` interface phía client — chỉ đổi implementation
- Không cần real-time subscriptions — UI cập nhật qua cache invalidation sau mutations

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser)                                           │
│  React Components → React Query hooks (lib/firestore-rq)   │
│                           │                                 │
│                           │ fetch()                         │
│                           ▼                                 │
│  Next.js Server                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Route Handler (src/app/api/collections/[...path])   │   │
│  │        │                                            │   │
│  │        ▼                                            │   │
│  │  Middleware: NextAuth session validation            │   │
│  │        │                                            │   │
│  │        ▼                                            │   │
│  │  Permission Service (lib/api/permissions.ts)        │   │
│  │        │  Admin SDK reads projectRoles + roles      │   │
│  │        ▼                                            │   │
│  │  Firestore Admin SDK                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** Client-side `lib/firestore-rq` interface unchanged. Only internal implementation switches from Firestore SDK to REST fetch.

---

## 3. API Route Structure

### 3.1 Collection Endpoints

Pattern: `/api/collections/{projectId}/{collection}` (project-scoped)

```
GET    /api/collections/{projectId}/{collection}           → useList
GET    /api/collections/{projectId}/{collection}/{id}       → useDocument
POST   /api/collections/{projectId}/{collection}           → useCreate
PUT    /api/collections/{projectId}/{collection}/{id}      → useSet
PATCH  /api/collections/{projectId}/{collection}/{id}      → useUpdate
DELETE /api/collections/{projectId}/{collection}/{id}      → useDelete
```

**Query params for GET (useList):**
```
?where[field]=value&where[status]=open
&orderBy=createdAt&orderDir=desc
&limit=20
&startAfter=docId
```

**Top-level collections** (projects, members — no projectId prefix):
```
GET/POST   /api/collections/{collection}
GET/PUT/PATCH/DELETE /api/collections/{collection}/{id}
```

### 3.2 Config Endpoints

Pattern: `/api/config/{projectId}/{configName}`

```
GET    /api/config/{projectId}/{configName}
PUT    /api/config/{projectId}/{configName}
```

### 3.3 Batch Endpoint

```
POST   /api/batch
Body: { operations: [{ method: 'create'|'set'|'update'|'delete', id?, data?, path? }] }
```

### 3.4 Response Format

```ts
// Success
{ data: T, id: string }

// Error
{ error: { code: string; message: string } }

// HTTP Status:
// 200 - Success
// 201 - Created
// 400 - Validation error (Zod)
// 401 - Unauthorized (no valid session)
// 403 - Forbidden (permission denied)
// 404 - Not found
// 500 - Server error
```

Note: Firestore `not-found` returns `200` with `{ data: null }` — React Query handles null data.

---

## 4. Permission Service

### 4.1 Structure

File: `src/lib/api/permissions.ts`

```ts
interface PermissionContext {
  uid: string;
  projectId: string;
  resource: 'tasks' | 'sprints' | 'budget' | 'members' | 'risks' | 'meetings' | 'documents' | 'backlog' | 'timeline' | 'activity' | 'docs' | 'roles' | 'projects';
  action: 'read' | 'write' | 'delete' | 'admin';
}

async function checkPermission(ctx: PermissionContext): Promise<boolean>
async function requirePermission(ctx: PermissionContext): Promise<void> // throws 403
```

### 4.2 Check Flow

1. Validate NextAuth session token (get `uid`)
2. Get user's `project_roles` document from `projects/{projectId}/project_roles/{uid}`
3. If no project_roles doc → deny
4. For each `roleId` in `project_roles.roles[]`, fetch role definition from `projects/{projectId}/roles/{roleId}`
5. Merge all role permissions (last-write-wins for conflicting keys)
6. Evaluate: does merged permission allow `resource.action`?
7. Return `true`/`false`

### 4.3 Role Definition Schema

```ts
// projects/{projectId}/roles/{roleId}
{
  roleId: string;
  name: string;
  permissions: {
    [resource: string]: {
      read?: boolean;
      write?: boolean;
      delete?: boolean;
      admin?: boolean;
    }
  }
}
```

**Special cases:**
- `projects` resource → skip project membership check (top-level)
- `roles` resource → only `admin` role can modify role definitions

### 4.4 Top-Level Collections

`projects` and `members` collections — no project-scoped permission. Only NextAuth session validation required (any authenticated user can read list). Write permissions managed by a root-level admin role check.

---

## 5. lib/firestore-rq Refactor

### 5.1 Core Changes

**`createCollection`** — switch from Firestore SDK to REST:

```ts
// lib/firestore-rq/core/createCollection.ts (AFTER)
export function createCollection<T extends DocumentData>(config: CollectionConfig<T>) {
  return {
    useDocument(id, options) {
      return useQuery({
        queryKey: firestoreKeys.detail(path, id),
        queryFn: () => apiClient.get<T>(`${path}/${id}`),
        enabled: !!id,
        ...options,
      });
    },
    useList(options, queryOptions) {
      return useQuery({
        queryKey: firestoreKeys.list(path, options),
        queryFn: () => apiClient.get<ListResponse<T>>(path, options),
        staleTime: 60_000,
        ...queryOptions,
      });
    },
    useCreate() {
      return useMutation({
        mutationFn: (data) => apiClient.post<T>(path, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) }),
      });
    },
    useSet() {
      return useMutation({
        mutationFn: ({ id, data }) => apiClient.put<T>(`${path}/${id}`, data),
        onSuccess: (_, vars) => {
          queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
          queryClient.invalidateQueries({ queryKey: firestoreKeys.detail(path, vars.id) });
        },
      });
    },
    useUpdate() {
      return useMutation({
        mutationFn: ({ id, data }) => apiClient.patch<T>(`${path}/${id}`, data),
        onSuccess: (_, vars) => {
          queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
          queryClient.invalidateQueries({ queryKey: firestoreKeys.detail(path, vars.id) });
        },
      });
    },
    useDelete() {
      return useMutation({
        mutationFn: (id) => apiClient.delete(`${path}/${id}`),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(path) });
        },
      });
    },
    helpers: {
      fetch: (id) => apiClient.get<T>(`${path}/${id}`),
      fetchList: (options?) => apiClient.get<ListResponse<T>>(path, options),
      create: (data) => apiClient.post<T>(path, data),
      set: (id, data) => apiClient.put<T>(`${path}/${id}`, data),
      update: (id, data) => apiClient.patch<T>(`${path}/${id}`, data),
      delete: (id) => apiClient.delete(`${path}/${id}`),
    },
    path,
    keys: firestoreKeys,
  };
}
```

**`createSubcollection`** — no changes needed (already wraps `createCollection`)

**`createConfig`** — switch to `/api/config/{projectId}/{name}`:

```ts
// lib/firestore-rq/core/createConfig.ts (AFTER)
export function createConfig<T extends DocumentData>(config: ConfigDocumentConfig<T>) {
  const path = `${config.docPath}`;
  return {
    useDocument() {
      return useQuery({
        queryKey: ['config', path],
        queryFn: () => apiClient.get<T>(`/config/${config.projectId}/${config.name}`),
        staleTime: 60_000,
      });
    },
    useSet() {
      return useMutation({
        mutationFn: (data) => apiClient.put<T>(`/config/${config.projectId}/${config.name}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', path] }),
      });
    },
    helpers: {
      fetch: () => apiClient.get<T>(`/config/${config.projectId}/${config.name}`),
      set: (data) => apiClient.put<T>(`/config/${config.projectId}/${config.name}`, data),
      update: (data) => apiClient.patch<T>(`/config/${config.projectId}/${config.name}`, data),
    },
  };
}
```

### 5.2 API Client

File: `src/lib/api/client.ts`

```ts
class ApiClient {
  private baseUrl = '/api';

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      throw new ApiError(body.error?.code ?? 'UNKNOWN', body.error?.message ?? res.statusText, res.status);
    }
    return body.data;
  }

  get<T>(path: string, params?: Record<string, unknown>): Promise<T> { ... }
  post<T>(path: string, data: unknown): Promise<T & { id: string }> { ... }
  put<T>(path: string, data: unknown): Promise<T> { ... }
  patch<T>(path: string, data: unknown): Promise<T> { ... }
  delete(path: string): Promise<void> { ... }
}

export const apiClient = new ApiClient();
```

### 5.3 Pagination Changes

**Before:** Cursor = `QueryDocumentSnapshot` (Firestore object)
**After:** Cursor = document ID (string)

`usePaginatedCollection` và `useOptimistic` cần điều chỉnh pagination logic từ snapshot-based sang ID-based.

### 5.4 Batch Write

`lib/firestore-rq/core/batchWrite.ts` → refactor thành gọi `POST /api/batch` với list of operations.

---

## 6. Module Collection Files

**Không cần sửa.** Files trong `modules/*/collections/*.ts` chỉ define config objects (path, name, schema). Chúng call `createSubcollection(config)` mà không biết gì về SDK bên dưới.

Example — không đổi:
```ts
// modules/tasks/collections/tasks.ts
export const tasksCollection = createSubcollection<Task>({
  name: 'tasks',
  path: (projectId) => `projects/${projectId}/tasks`,
  schema: TaskSchema,
});
```

---

## 7. Migration Scope (28 Collections)

### Project-scoped (need permission check)
- `projects/{projectId}/tasks` → `useTasks()`
- `projects/{projectId}/task_columns` → `useTaskColumns()`
- `projects/{projectId}/sprints` → `useSprint()`
- `projects/{projectId}/bugs` → `useBugs()`
- `projects/{projectId}/epics` → `useBacklog()`
- `projects/{projectId}/documents` → `useDocs()`
- `projects/{projectId}/folders` → `useDocs()`
- `projects/{projectId}/meetings` → `useMeetings()`
- `projects/{projectId}/action_items` → `useMeetings()`
- `projects/{projectId}/milestones` → `useTimeline()`
- `projects/{projectId}/gantt_phases` → `useTimeline()`
- `projects/{projectId}/risks` → `useRisk()`
- `projects/{projectId}/budget_items` → `useBudget()`
- `projects/{projectId}/expenses` → `useBudget()`
- `projects/{projectId}/activity_feed` → `useActivity()`
- `projects/{projectId}/activity_comments` → `useActivity()`
- `projects/{projectId}/notifications` → `useActivity()`
- `projects/{projectId}/wiki_links` → `useDocs()`
- `projects/{projectId}/roles` → `useProjectRoles()`
- `projects/{projectId}/project_roles` → `useProjectRoles()`
- `projects/{projectId}/members` → `useTeam()`
- `projects/{projectId}/doc_activity` → `useDocs()`
- Dynamic: `projects/{projectId}/{tasks|bugs|meetings}/{id}/comments` → `useComments()`

### Top-level (no project permission check)
- `projects` → `useProjects()`
- `members` → `useMembers()`

### Config documents
- `projects/{projectId}/config/{name}` → various configs (dashboard, budget, profile, etc.)

---

## 8. Auth Flow

1. Client gọi API route
2. Route handler đọc session từ `auth()` (NextAuth) hoặc `getServerSession(authOptions)`
3. Lấy `uid` từ session → truyền vào Permission Service
4. Permission Service check project membership + role permissions
5. Nếu allowed → thực hiện Firestore operation qua Admin SDK
6. Trả về response

**AuthContext/AuthGuard** giữ nguyên — vẫn dùng NextAuth session ở client side.

---

## 9. Files to Create

```
src/app/api/
├── collections/
│   ├── route.ts                   # Top-level CRUD (projects, members)
│   └── [...path]/route.ts        # Project-scoped CRUD
├── config/
│   └── [projectId]/[name]/route.ts
└── batch/
    └── route.ts

src/lib/api/
├── client.ts                      # fetch() wrapper
├── permissions.ts               # Permission service
├── types.ts                     # API types (ApiError, ListResponse, etc.)
└── validators.ts               # Zod schemas per collection (optional)
```

---

## 10. Files to Modify

```
src/lib/firestore-rq/
├── core/createCollection.ts      # REST implementation
├── core/createSubcollection.ts  # REST implementation (minimal)
├── core/createConfig.ts         # REST implementation
├── core/batchWrite.ts           # → POST /api/batch
├── hooks/useOptimistic.ts       # Pagination cursor = doc ID
├── hooks/usePaginatedCollection.ts
├── hooks/useBatchFetch.ts
└── index.ts

src/lib/firebase/firestore.ts    # Có thể deprecate hoặc giữ lại cho dev tools
src/contexts/auth-context.tsx    # Kiểm tra import từ client SDK
src/lib/project-config.ts         # Cập nhật dùng apiClient
```

---

## 11. Testing Strategy

- API routes: Unit test với mocked Admin SDK + mocked session
- Permission service: Unit test với various role/permission combinations
- React Query hooks: Integration test (mock fetch)
- E2E: Playwright test trên real API routes

---

## 12. Rollback Plan

Vì là big-bang migration, rollback = revert commit. Cần:
- Atomic commit: tất cả changes trong một commit duy nhất
- Full backup branch trước khi merge vào main
- Staging environment test trước production

---

## 13. Implementation Order

1. **API Client** (`lib/api/client.ts`)
2. **Permission Service** (`lib/api/permissions.ts`)
3. **API Routes** (collections, config, batch)
4. **lib/firestore-rq core** (createCollection, createSubcollection, createConfig)
5. **Hooks adjustments** (paginated, optimistic, batchFetch)
6. **Auth context update** (check cross-SDK imports)
7. **Testing & QA**
8. **Deploy & monitor**
