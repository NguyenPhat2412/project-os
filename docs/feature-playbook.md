# Feature Writing Playbook — ProjectOS

> Tài liệu quan trọng nhất cho Claude Code khi viết feature mới.
> Kiến trúc: **FE-Only Serverless** — không có backend riêng.

---

## Quy trình Chuẩn: 8 Bước

```text
1. Types      → src/lib/types/{module}.ts
2. Mock       → src/lib/mock/{module}.ts
3. Service    → src/modules/{module}/services/{module}Service.ts
4. Hook       → src/modules/{module}/hooks/use{Module}.ts
5. Components → src/modules/{module}/components/
6. Page       → src/app/(dashboard)/{route}/page.tsx
7. Context    → src/context/ProjectDataContext.tsx (nếu cần global data)
8. Seed       → src/lib/firestore/seed.ts
```

Sau 8 bước: cập nhật `firestore.rules` và `firestore.indexes.json` nếu có collection mới.

---

### Bước 1 — Định nghĩa TypeScript Types

```typescript
// src/lib/types/{module}.ts

export interface NewEntity {
  id: string;
  projectId: string;
  // ... các fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input type cho form (không có id, timestamps)
export type CreateNewEntityInput = Omit<NewEntity, 'id' | 'createdAt' | 'updatedAt'>;
```

Export từ `src/lib/types/index.ts`:

```typescript
export type { NewEntity, CreateNewEntityInput } from './{module}';
```

---

### Bước 2 — Mock Data

```typescript
// src/lib/mock/{module}.ts
import type { NewEntity } from '@/lib/types';

export const mock{Entities}: NewEntity[] = [
  {
    id: '{module}-1',
    projectId: 'default',
    // ... 5-8 items thực tế, đa dạng statuses
    createdAt: Timestamp.fromDate(new Date('2024-01-15')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
  },
];
```

**Quy tắc mock data:**

- Tối thiểu 5–8 items, cover tất cả status values
- Dùng tên/data tiếng Việt thực tế
- Vary ngày tháng, giá trị để hiển thị đa dạng

---

### Bước 3 — Service Layer

```typescript
// src/modules/{module}/services/{module}Service.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { NewEntity, CreateNewEntityInput } from '@/lib/types';

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'default';

export async function fetch{Entities}(): Promise<NewEntity[]> {
  const q = query(
    collection(db, 'projects', PROJECT_ID, '{entities}'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as NewEntity);
}

export async function create{Entity}(data: CreateNewEntityInput): Promise<string> {
  const ref = await addDoc(
    collection(db, 'projects', PROJECT_ID, '{entities}'),
    { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  );
  return ref.id;
}

export async function update{Entity}(id: string, data: Partial<NewEntity>): Promise<void> {
  await updateDoc(
    doc(db, 'projects', PROJECT_ID, '{entities}', id),
    { ...data, updatedAt: serverTimestamp() }
  );
}

export async function delete{Entity}(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', PROJECT_ID, '{entities}', id));
}
```

**Nguyên tắc service:**

- `const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'default'` ở đầu file
- Dùng `updateDoc` (không `setDoc`) khi update partial
- Dùng `serverTimestamp()` cho tất cả timestamps
- Wrap bằng try/catch nếu cần error message cụ thể

---

### Bước 4 — Module Hook (thin wrapper)

```typescript
// src/modules/{module}/hooks/use{Module}.ts
'use client';

import { useMemo } from 'react';
import { useProjectData } from '@/context/ProjectDataContext';
import type { NewEntity } from '@/lib/types';

export function use{Module}() {
  const { {entities}, loading, refresh } = useProjectData();

  const sorted = useMemo(() => {
    return [...({entities} ?? [])].sort((a, b) =>
      b.createdAt?.toMillis() - a.createdAt?.toMillis()
    );
  }, [{entities}]);

  return { {entities}: sorted, loading, refresh };
}
```

**Nguyên tắc hook:**

- **Chỉ** destructure từ `useProjectData()` — không gọi Firestore trực tiếp
- Thêm filter/sort/memo nếu cần, không thêm state/effect mới
- Không bao giờ dùng `onSnapshot` trong module hook

---

### Bước 5 — Components

Cấu trúc thư mục:

```text
src/modules/{module}/components/
├── {Module}Modal.tsx      ← Create/Edit modal (CRUD)
├── {Module}Table.tsx      ← Danh sách dạng table
├── {Module}Row.tsx        ← Một row trong table (nếu phức tạp)
└── index.ts               ← Re-export
```

**Modal template (dùng ModalShell):**

```tsx
// src/modules/{module}/components/{Module}Modal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalShell } from '@/components/shared/ModalShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getFieldErrorLabelClass,
  getFieldErrorInputClass,
  getInlineErrorTextClass,
} from '@/lib/form-validation';
import { create{Entity}, update{Entity}, delete{Entity} } from '../services/{module}Service';
import type { NewEntity } from '@/lib/types';

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc nhập tiêu đề'),
});

type FormData = z.infer<typeof schema>;

interface {Module}ModalProps {
  open: boolean;
  onClose: () => void;
  item?: NewEntity | null;
}

export function {Module}Modal({ open, onClose, item }: {Module}ModalProps) {
  const isEdit = !!item;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(item ? { title: item.title } : { title: '' });
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit && item) {
      await update{Entity}(item.id, data);
    } else {
      await create{Entity}(data);
    }
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
      onSubmit={handleSubmit(onSubmit)}
      onDelete={isEdit ? () => delete{Entity}(item!.id).then(onClose) : undefined}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
      submitLoading={isSubmitting}
    >
      <div className="space-y-4">
        <div>
          <Label className={getFieldErrorLabelClass(!!errors.title)}>Tiêu đề *</Label>
          <Input {...register('title')} className={getFieldErrorInputClass(!!errors.title)} />
          {errors.title && <p className={getInlineErrorTextClass()}>{errors.title.message}</p>}
        </div>
      </div>
    </ModalShell>
  );
}
```

---

### Bước 6 — Page

```tsx
// src/app/(dashboard)/{route}/page.tsx
'use client';

import { useState } from 'react';
import { PageHeader, PageBadge } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { use{Module} } from '@/modules/{module}/hooks/use{Module}';
import { {Module}Modal } from '@/modules/{module}/components/{Module}Modal';

export default function {Module}Page() {
  const { {entities}, loading, refresh } = use{Module}();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<NewEntity | null>(null);

  const handleClose = () => { setModalOpen(false); setSelected(null); refresh(); };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="{Module Title}"
        badge={<PageBadge count={{entities}.length} />}
        actions={
          <Button size="sm" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} className="mr-1" /> Thêm mới
          </Button>
        }
      />

      {({entities}.length === 0) ? (
        <EmptyState title="Chưa có dữ liệu" description="Tạo mục đầu tiên để bắt đầu" />
      ) : (
        <{Module}Table items={{entities}} onEdit={(item) => { setSelected(item); setModalOpen(true); }} />
      )}

      <{Module}Modal open={modalOpen} onClose={handleClose} item={selected} />
    </div>
  );
}
```

---

### Bước 7 — ProjectDataContext

Thêm field vào context nếu cần global data (data dùng ở nhiều module):

```typescript
// src/context/ProjectDataContext.tsx

// 1. Thêm vào ProjectData interface
interface ProjectData {
  // ... existing fields
  {entities}: NewEntity[];
}

// 2. Thêm state
const [{entities}, set{Entities}] = useState<NewEntity[]>([]);

// 3. Thêm fetch call trong fetchAll()
const raw{Entities} = await fetch{Entities}();
set{Entities}(raw{Entities});

// 4. Expose trong value
value={{ ..., {entities} }}
```

⚠️ **Chỉ thêm vào Context** khi data được dùng ở nhiều modules. Nếu chỉ dùng trong một page, giữ local state trong component.

---

### Bước 8 — Seed Data

```typescript
// src/lib/firestore/seed.ts
import { mock{Entities} } from '@/lib/mock/{module}';

// Trong hàm seedFirestore():
mock{Entities}.forEach(item => {
  const { id, ...data } = item;
  batch.set(doc(db, 'projects', PROJECT_ID, '{entities}', id), data);
});
```

---

## Sau 8 bước: Security Rules & Indexes

### Cập nhật firestore.rules

```javascript
match /projects/{projectId}/{entities}/{entityId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null
    && request.resource.data.keys().hasAll(['title', 'createdAt'])
    && request.resource.data.title is string;
  allow delete: if request.auth != null;
}
```

### Thêm composite index (nếu cần)

Cần index khi query dùng `where()` + `orderBy()` trên 2+ fields khác nhau:

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

## Patterns Hay Dùng

### Table Grouping Pattern (Hook/Utility Level)

**Pattern Overview:** Group table rows at the utility level using type-safe helpers, not React Table's built-in grouping. This allows flexible grouping by any field with custom label resolution and ordering.

**Types** (`src/lib/types/grouping.ts`):

```typescript
export interface GroupedData<T> {
  key: string; // raw field value (e.g., "open", "High", assigneeId)
  label: string; // display label (e.g., "Open", "High", "John Doe")
  items: T[];
}

export interface GroupableField<T> {
  id: string; // unique key for the dropdown (e.g., "status", "priority")
  label: string; // display label (e.g., "Trạng thái")
  accessor: (item: T) => string | undefined; // extract groupable value
  labelResolver?: (key: string) => string; // convert raw value -> display label
  orderMap?: Record<string, number>; // optional fixed ordering for groups
}
```

**Utility** (`src/lib/utils/group-items.ts`):

```typescript
import type { GroupedData, GroupableField } from '@/lib/types/grouping';

export function groupItems<T>(items: T[], field: GroupableField<T>): GroupedData<T>[] {
  // Returns array of grouped data with automatic handling of unassigned items
  // Sorting: respects orderMap if provided, else alphabetical, unassigned always last
}
```

**Usage in Components** (e.g., `TaskListView`):

```typescript
const [groupBy, setGroupBy] = useState('none');
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

// Define groupable fields (memoized)
const groupableFields = useMemo(() => ({
  status: {
    id: 'status',
    label: 'Trạng thái',
    accessor: (task) => task.status,
    labelResolver: (key) => getTaskColumnLabel(key, columns),
    orderMap: Object.fromEntries(columns.map((c, i) => [c.id, i])),
  },
  priority: {
    id: 'priority',
    label: 'Ưu tiên',
    accessor: (task) => task.priority,
    orderMap: { High: 0, Normal: 1, Low: 2 },
  },
  assignee: {
    id: 'assignee',
    label: 'Người xử lý',
    accessor: (task) => task.assigneeId,
    labelResolver: (id) => teamMembers.find((m) => m.id === id)?.name ?? id,
  },
}), [columns, teamMembers]);

// Apply grouping
const groupedData = groupBy !== 'none' ? groupItems(tasks, groupableFields[groupBy]) : [];

// In JSX: render groups with collapsible headers
{groupedData.map((group) => (
  <Fragment key={group.key}>
    <GroupSectionHeader
      label={group.label}
      count={group.items.length}
      isCollapsed={collapsedGroups.has(group.key)}
      onToggle={() => setCollapsedGroups(prev => {
        const next = new Set(prev);
        next.has(group.key) ? next.delete(group.key) : next.add(group.key);
        return next;
      })}
    />
    {!collapsedGroups.has(group.key) && (
      <TableBody>
        {/* render group.items as table rows */}
      </TableBody>
    )}
  </Fragment>
))}
```

**Key Design Decisions:**

1. **Utility-level grouping**: Done via `groupItems()` function, NOT React Table's built-in grouping plugin
2. **Type-safe field definition**: `GroupableField<T>` interface ensures compile-time safety
3. **Flexible label resolution**: Optional `labelResolver` callback handles any mapping (e.g., user IDs → names)
4. **Smart ordering**: Optional `orderMap` for semantic ordering (e.g., status workflow order), falls back to alphabetical
5. **Unassigned handling**: Items with undefined/null values automatically grouped under "Chưa phân loại"
6. **Collapsible UI**: Groups managed via `Set<string>` state, enabling expand/collapse per group
7. **Zero React Table coupling**: Works independently, allowing future table library migration

---

### Optimistic Update

```typescript
async function handleToggle(item: NewEntity) {
  setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i));
  try {
    await updateEntity(item.id, { status: 'done' });
  } catch {
    setItems(prev => prev.map(i => i.id === item.id ? item : i)); // rollback
  }
}
```

### Batch Write (multi-document atomic)

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);
batch.update(doc(db, 'projects', PROJECT_ID, 'sprints', sprintId), { status: 'completed' });
taskIds.forEach(id => batch.update(doc(db, 'projects', PROJECT_ID, 'tasks', id), { sprintId: null }));
await batch.commit();
```

---

## Checklist Trước Khi Commit

```text
[ ] TypeScript: không lỗi type, không có 'any'
[ ] Service: PROJECT_ID từ env, dùng serverTimestamp()
[ ] Hook: chỉ wrap useProjectData(), có useMemo
[ ] Modal: dùng ModalShell, Zod + RHF, error messages tiếng Việt
[ ] Page: Spinner khi loading, EmptyState khi rỗng
[ ] Context: đã thêm field nếu cần global
[ ] Seed: đã thêm mock data
[ ] firestore.rules: đã cập nhật
[ ] console.log: đã xóa hết
```
