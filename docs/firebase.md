# Firebase — Schema, Rules & Best Practices

## Mục lục

1. [Cấu hình](#cấu-hình)
2. [Firestore Schema Thực tế](#firestore-schema-thực-tế)
3. [firestore-rq — Data Layer Abstraction](#firestore-rq--data-layer-abstraction)
   - [3.1. Kiến trúc tổng quan](#31-kiến-trúc-tổng-quan)
   - [3.2. Ba Factory Patterns](#32-ba-factory-patterns)
   - [3.3. createCollection — Top-level Collection](#33-createcollection--top-level-collection)
   - [3.4. createSubcollection — Nested Collection](#34-createsubcollection--nested-collection)
   - [3.5. createConfig — Singleton Document](#35-createconfig--singleton-document)
   - [3.6. QueryOptions — Query DSL](#36-queryoptions--query-dsl)
   - [3.7. TypeScript Types](#37-typescript-types)
   - [3.8. Transform — Timestamp → Date](#38-transform--timestamp--date)
   - [3.9. React Query Hooks — Return Types](#39-react-query-hooks--return-types)
   - [3.10. Mutation Hooks — Usage Patterns](#310-mutation-hooks--usage-patterns)
   - [3.11. useOptimistic — Optimistic Updates](#311-useoptimistic--optimistic-updates)
   - [3.12. usePaginatedCollection — Infinite Query](#312-usepaginatedcollection--infinite-query)
   - [3.13. useBatchFetch — Parallel Multi-collection](#313-usebatchfetch--parallel-multi-collection)
   - [3.14. batchWrite — Atomic Batch Operations](#314-batchwrite--atomic-batch-operations)
   - [3.15. Invalidation Strategy](#315-invalidation-strategy)
   - [3.16. Firebase Import Isolation](#316-firebase-import-isolation)
   - [3.17. ReactQueryProvider](#317-reactqueryprovider)
4. [Collection Files](#collection-files)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Composite Indexes](#composite-indexes)
7. [Best Practices Checklist](#best-practices-checklist)

---

## Cấu hình

```typescript
// src/lib/firebase/config.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

```typescript
// src/lib/project.ts — đọc từ localStorage (SSR-safe), fallback env var
export const PROJECT_ID = resolveProjectId(); // 'default' | 'hrm-system' | 'mobile-banking'
```

---

## Firestore Schema Thực tế

### Cấu trúc tổng quan

```text
members/                                ← Root: global member registry (cross-project)
└── {memberId}  { name, email, initials, gradient, role, taskCount, workload, status }

projects/                              ← Top-level collection (danh sách projects)
└── {projectId}/                       ← Project document (default, hrm-system, mobile-banking...)
    │
    ├── config/                        ← Config documents (single doc per key)
    │   ├── dashboard                  ← Dashboard stats, sprint progress, priority tasks
    │   ├── sprint                     ← Sprint kanban column metadata
    │   ├── team                       ← Team stats
    │   ├── risk                       ← Risk stats
    │   ├── budget                     ← Budget summary numbers
    │   ├── timeline                   ← Timeline stats
    │   └── reports                    ← Sprint metrics, burndown data
    │
    ├── tasks/                         ← Task collection
    │   └── {taskId}
    │
    ├── task_columns/                  ← Kanban column definitions
    │   └── {columnId}
    │
    ├── sprints/                       ← Sprint collection
    │   └── {sprintId}
    │
    ├── epics/                         ← Backlog epics
    │   └── {epicId}
    │
    ├── team_members/                  ← Project team membership (ref only)
    │   └── {memberId}  { memberId, role }
    │
    ├── bugs/                          ← Bug tracker
    │   └── {bugId}
    │
    ├── risks/                         ← Risk register
    │   └── {riskId}
    │
    ├── budget_items/                  ← Budget line items
    │   └── {itemId}
    │
    ├── expenses/                      ← Expense entries
    │   └── {expenseId}
    │
    ├── documents/                     ← File documents
    │   └── {docId}
    │
    ├── wiki_links/                    ← Wiki pages
    │   └── {wikiId}
    │
    ├── doc_activity/                  ← Document activity log
    │   └── {activityId}
    │
    ├── meetings/                      ← Meeting collection
    │   └── {meetingId}
    │
    ├── action_items/                  ← Action items từ meetings
    │   └── {itemId}
    │
    ├── activity_feed/                 ← Global activity feed
    │   └── {activityId}
    │
    ├── activity_comments/             ← Comments trên activity items
    │   └── {commentId}
    │
    ├── notifications/                 ← User notifications
    │   └── {notificationId}
    │
    ├── milestones/                    ← Project milestones
    │   └── {milestoneId}
    │
    └── gantt_phases/                  ← Gantt timeline phases
        └── {phaseId}
```

> `comments` (task/bug comments) được lưu ở `activity_comments` — không có subcollection riêng theo task.

---

## firestore-rq — Data Layer Abstraction

### 3.1. Kiến trúc tổng quan

```markdown
src/lib/firestore-rq/
├── index.ts ← Barrel export — chỉ import từ đây
├── ReactQueryProvider.tsx ← QueryClient provider (layout.tsx)
├── core/
│ ├── createCollection.ts ← Factory: top-level collection
│ ├── createSubcollection.ts ← Factory: nested collection (curried)
│ ├── createConfig.ts ← Factory: singleton document
│ ├── batchWrite.ts ← Firestore writeBatch wrapper
│ ├── firestoreHelpers.ts ← Low-level CRUD (không dùng trực tiếp)
│ └── queryKeys.ts ← React Query key factory
├── hooks/
│ ├── useOptimistic.ts ← Manual optimistic-update helpers
│ ├── usePaginatedCollection.ts ← Cursor-based infinite query
│ └── useBatchFetch.ts ← Parallel multi-collection fetch
├── types/
│ └── index.ts ← WithId, QueryOptions, CollectionConfig...
└── utils/
└── timestamp.ts ← Date/Timestamp coercion (internal)
```

**Nguyên tắc vàng:**

- Component code **không bao giờ** import trực tiếp từ `firebase/firestore`
- Toàn bộ CRUD đi qua các factory hooks
- `cleanData()` tự động strip `undefined`/`null` trước khi ghi
- `serverTimestamp()` tự động set `createdAt`/`updatedAt` trên mutations

---

### 3.2. Ba Factory Patterns

| Factory                           | Path                         | Returns            | Use case                                   |
| --------------------------------- | ---------------------------- | ------------------ | ------------------------------------------ |
| `createCollection(db, config)`    | Static string                | Hooks object       | Top-level: `members`, `projects`           |
| `createSubcollection(db, config)` | Curried `(...ids) => string` | Curried fn → Hooks | Nested: `projects/{p}/tasks`               |
| `createConfig(db, config)`        | `basePath` + `pathVariables` | Hooks object       | Singleton: `projects/{p}/config/dashboard` |

---

### 3.3. `createCollection` — Top-level Collection

Dùng cho collection ở root hoặc path cố định (không chứa biến động).

```typescript
// src/modules/team/collections/members.ts
import { createCollection } from '@/lib/firestore-rq';
import { db } from '@/lib/firebase/firestore';
import type { TeamMember } from '../types/team';

export const membersCollection = createCollection<TeamMember>(db, {
  path: 'members', // ← static string
  transform: (raw) => ({
    ...raw,
    joinedAt: raw.joinedAt?.toDate() ?? null, // ← Timestamp → Date
  }),
});

// ─── Available members ────────────────────────────────────────────────────────
// useDocument(id), useList(options?), useCreate(), useSet(), useUpdate(), useDelete()
// helpers.fetch(), helpers.fetchList(), helpers.create(), helpers.set(), helpers.update(), helpers.delete()
```

**File layout chuẩn:**

```markdown
src/modules/{module}/
├── collections/
│ └── {entity}.ts ← createCollection / createSubcollection
├── types/
│ └── {entity}.ts ← TypeScript types (WithId<T>, CreateInput<T>...)
├── hooks/
│ └── use{Module}.ts ← Business logic hook dùng collection
└── README.md ← module notes (optional)
```

---

### 3.4. `createSubcollection` — Nested Collection

Dùng cho collection nằm trong document — path chứa biến động (parent ID).

```typescript
// src/modules/tasks/collections/tasks.ts
import { createSubcollection } from '@/lib/firestore-rq';
import { db } from '@/lib/firebase/firestore';
import type { Task } from '../types/task';

export const tasksCollection = createSubcollection<Task>(db, {
  path: (projectId: string) => `projects/${projectId}/tasks`, // ← curried path
  transform: (raw) => ({
    ...raw,
    dueDate: raw.dueDate?.toDate() ?? null,
    createdAt: raw.createdAt?.toDate() ?? null,
    updatedAt: raw.updatedAt?.toDate() ?? null,
  }),
});

// ─── Curried call — pass parent IDs to get hooks ──────────────────────────────
// Curried function: call with parentId(s) → returns hooks object
const { useList, useCreate, useUpdate } = tasksCollection(PROJECT_ID);
```

> **Quy tắc:** Luôn call curried function với `PROJECT_ID` (lấy từ `src/lib/project.ts`) trong module hooks — KHÔNG call trong collection definition.

**Trong module hook `useTasks.ts`:**

```typescript
import { tasksCollection } from '../collections/tasks';
import { PROJECT_ID } from '@/lib/project';

export function useTasks(options?: QueryOptions) {
  const { useList } = tasksCollection(PROJECT_ID); // ← curried call với parent ID
  return useList(options);
}
```

**`createSubcollection` vs `createCollection` — So sánh:**

| Aspect           | `createCollection`            | `createSubcollection`                                                 |
| ---------------- | ----------------------------- | --------------------------------------------------------------------- |
| Path             | Static: `"members"`           | Dynamic: `(projectId) => \`projects/${projectId}/tasks\``             |
| Return           | Hooks object trực tiếp        | Curried function — phải gọi thêm `collection(PROJECT_ID)`             |
| Multiple parents | Không                         | Có — gọi `tasksCollection('proj-1')` hoặc `tasksCollection('proj-2')` |
| Dùng cho         | Root collections, config docs | Mọi subcollection trong project                                       |

---

### 3.5. `createConfig` — Singleton Document

Dùng cho **document đơn lẻ** (không phải collection) — phù hợp cho config/settings.

```typescript
// src/lib/project-config.ts
import { createConfig } from '@/lib/firestore-rq';
import { db } from '@/lib/firebase/firestore';

export const dashboardConfig = createConfig<DashboardConfig>(db, {
  basePath: `projects/${PROJECT_ID}/config`, // ← không có document ID
  // pathVariables: { projectId: PROJECT_ID }, // ← dùng khi basePath chứa {projectId}
});

// ─── Available members ────────────────────────────────────────────────────────
// useDocument(id), useSet()
// helpers.fetch(id), helpers.set(id, data), helpers.update(id, data)
// KHÔNG có: useList, useCreate, useUpdate, useDelete (upsert = create + update)
```

**Usage — đọc config document:**

```typescript
const { data, isLoading } = dashboardConfig.useDocument('dashboard');
```

**Usage — upsert config document:**

```typescript
const set = dashboardConfig.useSet();
await set.mutateAsync({ id: 'dashboard', data: { sprintPoints: 42 } });
// → setDoc với { merge: true } — tạo mới nếu chưa có, update nếu đã có
```

> **Phân biệt:** `useSet` trong `createConfig` = upsert (merge); `useSet` trong `createCollection` = overwrite (thay thế toàn bộ).

**`createConfig` query key namespace riêng:**

```typescript
// createConfig dùng ['config', docPath] thay vì ['firestore', path]
// → Không conflict với collection query keys
```

---

### 3.6. `QueryOptions` — Query DSL

Tất cả options đều **optional** và **combinable**:

```typescript
interface QueryOptions {
  where?: WhereClause | WhereClause[]; // AND filter(s)
  orderBy?: OrderByClause | OrderByClause[]; // Sort(s)
  limit?: number; // Max docs per query
  startAfter?: QueryDocumentSnapshot; // Cursor pagination (raw snapshot)
  startAt?: QueryDocumentSnapshot; // Cursor start point
  enabled?: boolean; // Gate query behind runtime condition
}

interface WhereClause {
  field: string;
  op: WhereFilterOp; // '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in'
  value: unknown;
}

interface OrderByClause {
  field: string;
  direction?: 'asc' | 'desc'; // default: 'asc'
}
```

**Ví dụ query thực tế:**

```typescript
// AND filter (array of WhereClause)
const { data: tasks } = tasksCollection(PROJECT_ID).useList({
  where: [
    { field: 'status', op: '==', value: 'in-progress' },
    { field: 'priority', op: 'in', value: ['high', 'critical'] },
  ],
  orderBy: [
    { field: 'priority', direction: 'desc' },
    { field: 'createdAt', direction: 'desc' },
  ],
  limit: 50,
  enabled: !!PROJECT_ID, // ← runtime gate
});
```

> **Lưu ý:** Khi dùng `where` + `orderBy` trên 2 fields khác nhau, cần tạo **composite index** trong `firestore.indexes.json`. Console sẽ báo lỗi khi thiếu.

---

### 3.7. TypeScript Types

```typescript
// ─── Wrapped document type ────────────────────────────────────────────────────
/** Appends Firestore document id to any data type */
type WithId<T> = T & { id: string };

// ─── Mutation input types ─────────────────────────────────────────────────────
/** Input cho useCreate — strips id/createdAt/updatedAt, allows optional Date */
type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/** Input cho useUpdate — partial fields + optional updatedAt */
type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt?: Date;
};

// ─── Collection config ────────────────────────────────────────────────────────
interface CollectionConfig<T, TRaw = DocumentData> {
  path: string;
  /** Transform raw Firestore doc → typed shape. Chạy sau mỗi fetch. */
  transform?: (raw: TRaw & { id: string }) => WithId<T>;
}
```

> **Quy tắc:** Types định nghĩa trong `src/modules/{module}/types/` — KHÔNG đặt trong `src/lib/types/`.

---

### 3.8. `transform` — Timestamp → Date

Firestore trả về `Timestamp` object — `transform` chuyển thành `Date` để dùng với `dayjs`/`date-fns`:

```typescript
export const tasksCollection = createSubcollection<Task>(db, {
  path: (projectId) => `projects/${projectId}/tasks`,
  transform: (raw) => ({
    ...raw,
    // Firestore Timestamp → JS Date
    dueDate: raw.dueDate?.toDate() ?? null,
    createdAt: raw.createdAt?.toDate() ?? null,
    updatedAt: raw.updatedAt?.toDate() ?? null,
    // Các field khác giữ nguyên
    title: raw.title,
    status: raw.status,
    assignee: raw.assignee,
  }),
});
```

**Transform chạy:**

- ✅ Trong `useDocument`, `useList`
- ✅ Trong `helpers.fetch()`, `helpers.fetchList()`
- ✅ Trong `usePaginatedCollection`
- ❌ KHÔNG chạy trong `batchWrite` (raw helper)

---

### 3.9. React Query Hooks — Return Types

**`useDocument(id)` — Single document:**

```typescript
interface UseDocumentResult<T> {
  data: WithId<T> | null | undefined; // undefined = loading, null = not found
  isLoading: boolean;
  isError: boolean;
  error: FirestoreError | null;
  refetch: () => void;
}

// Usage
const { data: task, isLoading } = tasksCollection(PROJECT_ID).useDocument('task-123');
```

**`useList(options?)` — Collection list:**

```typescript
interface UseCollectionResult<T> {
  data: WithId<T>[]; // [] khi không có docs hoặc đang loading
  isLoading: boolean;
  isError: boolean;
  error: FirestoreError | null;
  refetch: () => void;
}

// Usage
const { data: tasks, isLoading } = tasksCollection(PROJECT_ID).useList({ orderBy: { field: 'order' } });
```

> **Data states:** `data === undefined` → chưa fetch xong; `data === null` → doc không tồn tại; `data === []` → query thành công nhưng không có results.

---

### 3.10. Mutation Hooks — Usage Patterns

**`useCreate()` — Auto-ID document:**

```typescript
const create = tasksCollection(PROJECT_ID).useCreate();

// Trong form submit handler
await create.mutateAsync({
  title: 'New Task',
  status: 'todo',
  priority: 'medium',
});
// → Trả về auto-generated ID từ Firestore
// → Tự động invalidate tất cả lists của collection này
```

**`useSet({ id, data })` — Overwrite with custom ID:**

```typescript
const set = tasksCollection(PROJECT_ID).useSet();

await set.mutateAsync({
  id: 'task-custom-id', // ← ID do bạn chọn
  data: { title: 'Task', status: 'done' },
});
// → setDoc → overwrite toàn bộ doc (không merge)
// → Strips id/createdAt/updatedAt từ data input
// → Auto-sets createdAt/updatedAt = serverTimestamp()
```

**`useUpdate({ id, data })` — Partial update:**

```typescript
const update = tasksCollection(PROJECT_ID).useUpdate();

await update.mutateAsync({
  id: 'task-123',
  data: { status: 'done' }, // ← chỉ update field cần thay đổi
});
// → updateDoc → merge field đã cho (giữ nguyên field khác)
// → Auto-sets updatedAt = serverTimestamp()
```

**`useDelete(id)` — Remove document:**

```typescript
const remove = tasksCollection(PROJECT_ID).useDelete();

await remove.mutateAsync('task-123');
// → Xóa doc khỏi Firestore
// → Xóa detail cache + invalidate all lists
```

**Async state với TanStack Query:**

```typescript
// hooks/useTasks.ts
const create = tasksCollection(PROJECT_ID).useCreate();

async function handleSubmit(values: CreateTaskInput) {
  try {
    await create.mutateAsync(values);
    // ✅ success — list tự invalidate, UI tự cập nhật
    form.reset();
    toast.success('Task created');
  } catch (error) {
    // ❌ error — React Query tự set isError
    toast.error('Failed to create task');
  }
}

// isLoading = đang gọi mutation
// isError = mutation throw error
```

---

### 3.11. `useOptimistic` — Optimistic Updates

Dùng khi muốn UI phản hồi **ngay lập tức** trước khi server confirm.

```typescript
import { useOptimistic } from '@/lib/firestore-rq';
import { tasksCollection } from '../collections/tasks';

export function useTaskActions() {
  const create = tasksCollection(PROJECT_ID).useCreate();
  const optimistic = useOptimistic<Task>(`projects/${PROJECT_ID}/tasks`); // ← collection path

  async function handleCreate(data: CreateTaskInput) {
    const tempDoc: WithId<Task> = {
      ...data,
      id: `temp-${Date.now()}`, // ← temp ID
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WithId<Task>;

    // ── onMutate: thêm vào cache ngay ─────────────────────────────────────────
    const rollback = await optimistic.addToList(tempDoc);

    try {
      await create.mutateAsync(data);
      // ✅ Thành công — rollback tự cleanup khi settled
    } catch (error) {
      // ── onError: khôi phục cache ────────────────────────────────────────────
      rollback();
      throw error;
    }
  }

  return { handleCreate };
}
```

**Ba methods của `useOptimistic`:**

| Method                              | Args               | Returns                 | Use case          |
| ----------------------------------- | ------------------ | ----------------------- | ----------------- |
| `addToList(item, options?)`         | `WithId<T>`        | `() => void` (rollback) | Optimistic create |
| `updateInList(id, patch, options?)` | `id`, `Partial<T>` | `() => void` (rollback) | Optimistic update |
| `removeFromList(id, options?)`      | `id`               | `() => void` (rollback) | Optimistic delete |

> **Options param:** Truyền `QueryOptions` nếu muốn optimistic update chỉ affect query cụ thể (e.g., filtered list). Nếu không truyền, affect tất cả lists của collection.

---

### 3.12. `usePaginatedCollection` — Infinite Query

Dùng cursor-based pagination — dùng `QueryDocumentSnapshot` làm cursor để tránh duplicate/skip:

```typescript
import { usePaginatedCollection } from '@/lib/firestore-rq';
import { db } from '@/lib/firebase/firestore';
import { tasksCollection } from '../collections/tasks';

export function useTasksInfinite() {
  return usePaginatedCollection(db, tasksCollection.config, {
    // ← db + config object
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 20, // ← BẮT BUỘC phải có limit
  });
}

// Trong component
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTasksInfinite();
const tasks = data?.pages.flatMap((p) => p.items) ?? [];
```

**Return type (TanStack `useInfiniteQuery`):**

| Property             | Type                                                                   | Description          |
| -------------------- | ---------------------------------------------------------------------- | -------------------- |
| `data?.pages`        | `Array<{ items: WithId<T>[]; cursor: QueryDocumentSnapshot \| null }>` | Mỗi page             |
| `fetchNextPage()`    | `() => void`                                                           | Load thêm page       |
| `hasNextPage`        | `boolean`                                                              | Còn page để load     |
| `isFetchingNextPage` | `boolean`                                                              | Đang fetch page tiếp |
| `isLoading`          | `boolean`                                                              | Initial load         |

> **Cursor là raw `QueryDocumentSnapshot`:** KHÔNG dùng transformed item làm cursor — `startAfter` so sánh Firestore field values. Dùng transformed item sẽ gây duplicate/skip.

---

### 3.13. `useBatchFetch` — Parallel Multi-collection

Fetch nhiều collections/documents song song — nhanh hơn nhiều `useList()` riêng lẻ:

```typescript
import { useBatchFetch, createCollectionListItem, createDocumentItem } from '@/lib/firestore-rq';
import { membersCollection } from '../team/collections/members';
import { tasksCollection } from '../tasks/collections/tasks';

export function useDashboardData() {
  const items = [
    createCollectionListItem('members', membersCollection.config),
    createCollectionListItem('tasks', tasksCollection.config),
    // hoặc document item:
    createDocumentItem('project', projectsCollection.config, PROJECT_ID),
  ];

  const { data, isLoading } = useBatchFetch(items, 'dashboard');
  // data: Record<string, WithId<T>[] | WithId<T> | null>

  return {
    members: data['members'] as WithId<TeamMember>[],
    tasks: data['tasks'] as WithId<Task>[],
    project: data['project'] as WithId<Project> | null,
    isLoading,
  };
}
```

> **Khi nào dùng:** Dashboard overview, detail pages cần load nhiều related collections cùng lúc.

---

### 3.14. `batchWrite` — Atomic Batch Operations

Dùng khi cần write nhiều documents trong 1 Firestore transaction (all-or-nothing):

```typescript
import { batchWrite } from '@/lib/firestore-rq';

async function closeSprint(sprintId: string, taskIds: string[]) {
  const batch = batchWrite(); // ← dùng default db từ @/lib/firebase/firestore

  // Chain operations
  batch
    .update(`projects/${PROJECT_ID}/sprints/${sprintId}`, sprintId, {
      status: 'closed',
      completedAt: new Date(),
    })
    .update(`projects/${PROJECT_ID}/config/sprint`, 'sprint', {
      activeSprintId: null,
    });

  // Add task updates
  for (const taskId of taskIds) {
    batch.update(`projects/${PROJECT_ID}/tasks/${taskId}`, taskId, {
      status: 'done',
    });
  }

  await batch.commit();
}
```

**API:**

| Method                   | Params                              | Semantics                                              |
| ------------------------ | ----------------------------------- | ------------------------------------------------------ |
| `set(path, id, data)`    | `path, id, Record<string, unknown>` | Overwrite doc                                          |
| `update(path, id, data)` | `path, id, Record<string, unknown>` | Partial update                                         |
| `delete(path, id)`       | `path, id`                          | Delete doc                                             |
| `commit()`               | —                                   | Execute batch                                          |
| `rollback()`             | —                                   | **No-op** — Firestore writeBatch không hỗ trợ rollback |

> **⚠️ `rollback()` không hoạt động:** `writeBatch` của Firestore không có rollback. Nếu commit thất bại, tạo batch mới. Đây là limitation của Firestore SDK.
> **⚠️ Transform không chạy:** `batchWrite` dùng raw Firestore SDK — `transform` trong `CollectionConfig` không áp dụng. Tự convert Timestamp → Date nếu cần.

---

### 3.15. Invalidation Strategy

Mỗi mutation hook tự động invalidate đúng cache scope:

| Mutation                | Invalidate                                           |
| ----------------------- | ---------------------------------------------------- |
| `useCreate()`           | All lists (`firestoreKeys.lists(path)`)              |
| `useSet()`              | Detail key + all lists                               |
| `useUpdate()`           | Detail key + all lists                               |
| `useDelete()`           | Detail key removed + all lists                       |
| `createConfig.useSet()` | Only the specific config key (`['config', docPath]`) |

**React Query key structure:**

```json
['firestore', 'projects/proj-1/tasks', 'list', 'default']              ← useList() default
['firestore', 'projects/proj-1/tasks', 'list', '{"orderBy":{"field":"name"}}'] ← useList({ orderBy })
['firestore', 'projects/proj-1/tasks', 'detail', 'task-abc-123']        ← useDocument('task-abc-123')
['config', 'projects/proj-1/config/dashboard']                         ← createConfig
```

**Dùng `keys` helper để invalidate thủ công:**

```typescript
import { firestoreKeys } from '@/lib/firestore-rq';
import { queryClient } from '@tanstack/react-query';

// Invalidate tất cả tasks của project
queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(`projects/${PROJECT_ID}/tasks`) });

// Invalidate một task cụ thể
queryClient.invalidateQueries({ queryKey: firestoreKeys.detail(`projects/${PROJECT_ID}/tasks`, 'task-123') });
```

---

### 3.16. Firebase Import Isolation

**Component code KHÔNG BAO GIỜ import trực tiếp từ `firebase/firestore`:**

```typescript
// ✅ ĐÚNG — dùng barrel export
import { createCollection, createSubcollection, createConfig, WithId } from '@/lib/firestore-rq';
import { deleteField } from '@/lib/firestore-rq'; // ← re-exported từ firebase/firestore

// ❌ SAI — bypass abstraction
import { doc, getDoc, addDoc } from 'firebase/firestore';
```

**Re-exported symbols:**

```typescript
// src/lib/firestore-rq/index.ts
export { deleteField } from 'firebase/firestore'; // ← dùng khi muốn xóa field khỏi doc
```

---

### 3.17. ReactQueryProvider

Setup trong `src/app/layout.tsx`:

```tsx
// src/app/layout.tsx
import { ReactQueryProvider } from '@/lib/firestore-rq/ReactQueryProvider';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='vi'>
      <body>
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

**Default options:**

| Option                 | Value              | Implication                                          |
| ---------------------- | ------------------ | ---------------------------------------------------- |
| `staleTime`            | `60,000ms` (1 min) | Data considered fresh 1 phút — no background refetch |
| `refetchOnWindowFocus` | `false`            | Không tự refetch khi user focus lại tab              |
| `ReactQueryDevtools`   | Included           | Chỉ hiện trong development, đóng mặc định            |

---

## Collection Files

Mỗi subcollection được định nghĩa trong `src/modules/{module}/collections/`:

| File                                       | Path trong Firestore              | Factory               |
| ------------------------------------------ | --------------------------------- | --------------------- |
| `tasks/collections/tasks.ts`               | `projects/{id}/tasks`             | `createSubcollection` |
| `tasks/collections/taskColumns.ts`         | `projects/{id}/task_columns`      | `createSubcollection` |
| `tasks/collections/config.ts`              | `projects/{id}/config/{key}`      | `createCollection`    |
| `sprint/collections/sprint.ts`             | `projects/{id}/sprints`           | `createSubcollection` |
| `backlog/collections/epics.ts`             | `projects/{id}/epics`             | `createSubcollection` |
| `team/collections/members.ts`              | `members`                         | `createCollection`    |
| `team/collections/team.ts`                 | `projects/{id}/members`           | `createSubcollection` |
| `bugs/collections/bugs.ts`                 | `projects/{id}/bugs`              | `createSubcollection` |
| `risk/collections/risks.ts`                | `projects/{id}/risks`             | `createSubcollection` |
| `budget/collections/budget.ts`             | `projects/{id}/budget_items`      | `createSubcollection` |
| `budget/collections/expenses.ts`           | `projects/{id}/expenses`          | `createSubcollection` |
| `docs/collections/documents.ts`            | `projects/{id}/documents`         | `createSubcollection` |
| `docs/collections/wikiLinks.ts`            | `projects/{id}/wiki_links`        | `createSubcollection` |
| `docs/collections/docActivity.ts`          | `projects/{id}/doc_activity`      | `createSubcollection` |
| `meetings/collections/meetings.ts`         | `projects/{id}/meetings`          | `createSubcollection` |
| `meetings/collections/actionItems.ts`      | `projects/{id}/action_items`      | `createSubcollection` |
| `activity/collections/activityFeed.ts`     | `projects/{id}/activity_feed`     | `createSubcollection` |
| `activity/collections/activityComments.ts` | `projects/{id}/activity_comments` | `createSubcollection` |
| `activity/collections/notifications.ts`    | `projects/{id}/notifications`     | `createSubcollection` |
| `timeline/collections/milestones.ts`       | `projects/{id}/milestones`        | `createSubcollection` |
| `timeline/collections/ganttPhases.ts`      | `projects/{id}/gantt_phases`      | `createSubcollection` |
| `projects/collections/projects.ts`         | `projects`                        | `createCollection`    |

---

## projects/{projectId}/members — Query Pattern

### Firestore Structure

Subcollection path: `projects/{projectId}/members/{memberId}`

Document fields:

| Field       | Type       | Mô tả                                                   |
| ----------- | ---------- | -------------------------------------------------------- |
| `memberId`  | `string`   | References `/members/{uid}` at root                      |
| `roles`     | `string[]` | Project-level roles assigned to this member              |
| `notes`     | `string`   | Optional notes about this member                         |
| `name`      | `string`   | Denormalized from root — display name (for UI perf)      |
| `initials`  | `string`   | Denormalized from root — avatar initials                 |
| `gradient`  | `string`   | Denormalized from root — avatar gradient                 |
| `email`     | `string`   | Denormalized from root — email                           |

> **RBAC roles** (`project_roles` subcollection) là layer riêng cho permission. Đây là project-level roles cho display.

### Collection Definition

```typescript
// src/modules/team/collections/team.ts
export const projectMembersCollection = createSubcollection<ProjectTeamMember>(db, {
  path: (projectId: string) => `projects/${projectId}/members`,
  transform: (raw): WithId<ProjectTeamMember> => {
    const data = raw as unknown as ProjectTeamMember;
    return { id: data.memberId, ...data } as WithId<ProjectTeamMember>;
  },
});
```

### Query Pattern: JOIN với root `/members`

Khi cần enrich subcollection docs với root member data:

```typescript
// 1. Load project members subcollection
const { data: projectMemberships } = projectMembersCollection(projectId).useList();

// 2. Extract memberIds
const memberIds = new Set(projectMemberships.map(m => m.memberId));

// 3. Load root members
const { data: rootMembers } = membersCollection.useList();

// 4. Build lookup map
const rootMap = new Map(rootMembers.map(m => [m.id, m]));

// 5. Enrich subcollection docs
const enriched = projectMemberships.map(pm => ({
  ...pm,
  rootMember: rootMap.get(pm.memberId),
}));
```

> **Note:** `ProjectTeamMember` đã denormalize display fields (name, initials, gradient, email) nên **không cần join** cho mục đích hiển thị. JOIN chỉ cần khi cần đọc thêm fields từ root document.

### Project Membership Write Pattern

```typescript
await teamCollection.helpers.set(memberId, {
  memberId,
  name: root.displayName,
  initials,
  gradient,
  email: root.email,
  roles: [selectedRole],
  notes: '',
});
```

---

## Firestore Security Rules

> ⚠️ `firestore.rules` chưa có file riêng trong repo. Rules đang được quản lý qua Firebase Console.

Template hiện tại (check auth only):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /projects/{projectId}/{document=**} {
      allow read, write: if request.auth != null;
    }

    // members/ — nằm dưới projects/ nên được allow
    // Dùng bởi membersCollection (team module) để lookup member profiles
    match /members/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> **Lưu ý:** `membersCollection` (team module) query `/members/` — path này nằm trong `projects/{projectId}/**` nên được allow bởi security rules.
> Khi implement role-based access, tham khảo `.claude/agents/firebase-expert.md`.

---

## Composite Indexes

(`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "priority", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

> Thêm index mới mỗi khi query dùng `where()` + `orderBy()` trên 2+ fields khác nhau.

---

## Best Practices Checklist

### ✅ DO

```typescript
// 1. Luôn dùng collection helpers thay raw SDK
await tasksCollection(PROJECT_ID).useUpdate().mutateAsync({
  id: taskId,
  data: { status: 'done' },
});

// 2. Dùng transform để convert Timestamp → Date
transform: (raw) => ({ ...raw, dueDate: raw.dueDate?.toDate() ?? null }),

// 3. Luôn có limit trong query
tasksCollection(PROJECT_ID).useList({ limit: 50 });

// 4. Dùng batchWrite khi update nhiều documents cùng lúc
const batch = batchWrite();
batch.update(`path/${id1}`, id1, data1);
batch.update(`path/${id2}`, id2, data2);
await batch.commit();

// 5. Dùng enabled flag để gate query khi cần
tasksCollection(PROJECT_ID).useList({
  enabled: !!PROJECT_ID && !!currentUser,
});

// 6. Dùng createConfig cho singleton document
dashboardConfig.useDocument('dashboard');

// 7. Dùng useBatchFetch cho dashboard overview
useBatchFetch([createCollectionListItem('tasks', tasksCollection.config), ...]);
```

### ❌ DON'T

```typescript
// 1. KHÔNG gọi raw Firestore SDK trong component/hook
import { addDoc, collection } from 'firebase/firestore'; // ❌
await addDoc(collection(db, 'projects', PROJECT_ID, 'tasks'), data);

// 2. KHÔNG dùng useSet() khi chỉ muốn partial update
tasksCollection(PROJECT_ID)
  .useSet()
  .mutateAsync({ id, data: { status: 'done' } }); // ❌
// → Dùng useUpdate() thay thế

// 3. KHÔNG filter ở client sau khi fetch
const { data } = tasksCollection(PROJECT_ID).useList();
const highPriority = data.filter((t) => t.priority === 'high'); // ❌ tốn reads

// 4. KHÔNG dùng Date.now() hoặc new Date() cho timestamps trong mutations
data: {
  createdAt: new Date();
} // ❌ nên dùng serverTimestamp()
// → firestore-rq tự set createdAt/updatedAt = serverTimestamp()

// 5. KHÔNG hardcode project path
collection(db, 'projects', 'my-project', 'tasks'); // ❌
// → Dùng PROJECT_ID từ src/lib/project.ts

// 6. KHÔNG dùng transformed data làm pagination cursor
// → Dùng QueryDocumentSnapshot từ usePaginatedCollection return
```

---

## Firebase Instances

```typescript
// src/lib/firebase/firestore.ts
export const db = getFirestore(app);

// src/lib/firebase/auth.ts
export const auth = getAuth(app);

// src/lib/firebase/storage.ts
export const storage = getStorage(app);
```
