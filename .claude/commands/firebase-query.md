# Viết hoặc tối ưu Firestore query đúng chuẩn cho ProjectOS

**Yêu cầu query:** $ARGUMENTS

---

## Đọc trước

`.claude/docs/firebase.md` và `.claude/agents/firebase-expert.md` để nắm schema và best practices.

---

## Kiến trúc Data Layer

ProjectOS dùng `src/lib/firestore-rq/` — wrapper TanStack React Query trên Firestore SDK.

**Không viết raw Firestore queries trong components hoặc hooks.** Thay vào đó:

1. Định nghĩa collection trong `collections/{collection}.ts`
2. Dùng hooks từ collection trong hook/component

---

## Bước 1 — Định nghĩa Collection

```typescript
// src/modules/{module}/collections/{collection}.ts
import { db } from '@/lib/firebase/firestore';
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { {Entity} } from '@/modules/{module}/types/{module}';
import { PROJECT_ID } from '@/lib/project';  // ← import từ đây, không dùng process.env trực tiếp

export const {entities}Collection = createSubcollection<{Entity}>(db, {
  path: (projectId: string) => `projects/${projectId}/{entities}`,
  transform: (raw): WithId<{Entity}> => raw as unknown as WithId<{Entity}>,
})(PROJECT_ID);
```

---

## Bước 2 — Dùng Collection Hooks

### Query danh sách (có filter/sort)

```typescript
// Trong hook hoặc component
const { data, isLoading } = {entities}Collection.useList({
  where: { field: 'status', op: '==', value: 'active' },
  orderBy: { field: 'createdAt', direction: 'desc' },
});
```

### Query một document

```typescript
const { data } = {entities}Collection.useDocument(id);
```

### Mutations

```typescript
const create = {entities}Collection.useCreate();
const update = {entities}Collection.useUpdate();
const del    = {entities}Collection.useDelete();

// Sử dụng:
await create.mutateAsync({ ...data, createdAt: serverTimestamp() });
await update.mutateAsync({ id, data: { status: 'done', updatedAt: serverTimestamp() } });
await del.mutateAsync(id);
```

---

## Bước 3 — One-time fetch (ngoài React, e.g. trong seed)

```typescript
// Dùng helpers cho non-hook context (seed, server-side)
const items = await {entities}Collection.helpers.fetchList();
await {entities}Collection.helpers.set(id, data);
await {entities}Collection.helpers.update(id, data);
await {entities}Collection.helpers.delete(id);
```

---

## Bước 4 — Composite Index (nếu cần)

Query với `where` + `orderBy` trên **2+ fields khác nhau** cần composite index.

Thêm vào `firestore.indexes.json`:

```json
{
  "collectionGroup": "{entities}",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## Collection Paths thực tế

```text
projects/{PROJECT_ID}/tasks/
projects/{PROJECT_ID}/task_columns/
projects/{PROJECT_ID}/team_members/
projects/{PROJECT_ID}/meetings/
projects/{PROJECT_ID}/action_items/
projects/{PROJECT_ID}/budget_items/
projects/{PROJECT_ID}/expenses/
projects/{PROJECT_ID}/risks/
projects/{PROJECT_ID}/documents/
projects/{PROJECT_ID}/wiki_links/
projects/{PROJECT_ID}/milestones/
projects/{PROJECT_ID}/gantt_phases/
projects/{PROJECT_ID}/bugs/
projects/{PROJECT_ID}/epics/
projects/{PROJECT_ID}/activity_feed/
projects/{PROJECT_ID}/notifications/
projects/{PROJECT_ID}/comments/
projects/{PROJECT_ID}/sprints/
```

---

## Anti-patterns cần tránh

```typescript
// ❌ Raw Firestore SDK trong component
import { collection, getDocs } from 'firebase/firestore';
const snap = await getDocs(collection(db, 'projects', PROJECT_ID, 'tasks'));

// ✅ Dùng collection hook
const { data } = tasksCollection.useList();

// ❌ Hardcode PROJECT_ID
createSubcollection(db, { path: () => 'projects/my-abc-id/tasks' })(PROJECT_ID);

// ✅ Import từ lib/project
import { PROJECT_ID } from '@/lib/project';

// ❌ setDoc khi chỉ update vài fields
await helpers.set(id, { status: 'done' }); // ❌ xóa fields khác

// ✅ update cho partial update
await helpers.update(id, { status: 'done', updatedAt: serverTimestamp() });
```

---

## Output

Tôi sẽ cung cấp:

1. Collection definition file hoàn chỉnh
2. Hook usage pattern
3. Composite index (nếu query phức tạp)
4. Vị trí đặt code trong project
