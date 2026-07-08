# Tạo một module mới hoàn chỉnh cho ProjectOS theo đúng cấu trúc chuẩn

**Tên module được yêu cầu:** $ARGUMENTS

---

## Đọc trước khi bắt đầu

- `.claude/docs/architecture.md` — data flow và patterns
- `.claude/docs/conventions.md` — naming conventions
- `.claude/docs/firebase.md` — Firestore schema
- `.claude/agents/feature-writer.md` — quy trình chi tiết

---

## Cấu trúc module chuẩn (thực tế)

```text
src/modules/{module}/
├── types/
│   └── {module}.ts          ← TypeScript interfaces
├── collections/
│   └── {collection}.ts      ← Firestore collection factory (createSubcollection)
├── hooks/
│   └── use{Module}.ts       ← Compose collection hooks + business logic
├── components/
│   ├── {Module}Dialog.tsx   ← Create/Edit modal (ModalShell + Zod + RHF)
│   ├── {Module}Table.tsx    ← Table/list view
│   └── {Module}ViewSheet.tsx ← Read-only detail sheet (optional)
├── mock.ts                  ← Mock data (5–8 items thực tế)
└── seed.ts                  ← Seed functions dùng collection helpers
```

---

## 8 Bước Thực Hiện

### Bước 1 — Types (`src/modules/{module}/types/{module}.ts`)

```typescript
import type { Timestamp } from 'firebase/firestore';

export interface {Entity} {
  id: string;
  title: string;
  status: {Entity}Status;
  // ... fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type {Entity}Status = 'active' | 'inactive';

export type Create{Entity}Input = Omit<{Entity}, 'id' | 'createdAt' | 'updatedAt'>;
```

Sau đó thêm re-export vào `src/lib/types/index.ts`:

```typescript
export * from '../../modules/{module}/types/{module}';
```

---

### Bước 2 — Mock Data (`src/modules/{module}/mock.ts`)

```typescript
import type { {Entity} } from './types/{module}';
import { Timestamp } from 'firebase/firestore';

export const {entities}: {Entity}[] = [
  {
    id: '{module}-001',
    title: 'Ví dụ item đầu tiên',
    status: 'active',
    createdAt: Timestamp.fromDate(new Date('2024-01-15')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
  },
  // ... ít nhất 5-8 items, đa dạng statuses, realistic data tiếng Việt
];
```

---

### Bước 3 — Collection Factory (`src/modules/{module}/collections/{collection}.ts`)

```typescript
import { db } from '@/lib/firebase/firestore';
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { {Entity} } from '@/modules/{module}/types/{module}';
import { PROJECT_ID } from '@/lib/project';

/**
 * {Entity}s subcollection: projects/{PROJECT_ID}/{entities}
 */
export const {entities}Collection = createSubcollection<{Entity}>(db, {
  path: (projectId: string) => `projects/${projectId}/{entities}`,
  transform: (raw): WithId<{Entity}> => raw as unknown as WithId<{Entity}>,
})(PROJECT_ID);
```

---

### Bước 4 — Hook (`src/modules/{module}/hooks/use{Module}.ts`)

```typescript
import { useMemo } from 'react';
import { {entities}Collection } from '@/modules/{module}/collections/{collection}';
import type { {Entity} } from '@/modules/{module}/types/{module}';
import type { WithId } from '@/lib/firestore-rq';

export function use{Module}() {
  const { data: raw = [], isLoading } = {entities}Collection.useList();
  const {entities} = raw as WithId<{Entity}>[];

  const create{Entity} = {entities}Collection.useCreate();
  const update{Entity} = {entities}Collection.useUpdate();
  const delete{Entity} = {entities}Collection.useDelete();

  const stats = useMemo(() => ({
    total: {entities}.length,
    active: {entities}.filter(i => i.status === 'active').length,
  }), [{entities}]);

  return {
    {entities},
    stats,
    isLoading,
    create{Entity},
    update{Entity},
    delete{Entity},
  };
}
```

---

### Bước 5 — Components (`src/modules/{module}/components/`)

**Modal (Create/Edit):**

```tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serverTimestamp } from 'firebase/firestore';
import { ModalShell } from '@/components/shared/ModalShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getFieldErrorLabelClass,
  getFieldErrorInputClass,
  getInlineErrorTextClass,
} from '@/lib/form-validation';
import type { WithId } from '@/lib/firestore-rq';
import type { {Entity} } from '@/modules/{module}/types/{module}';

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc nhập tiêu đề'),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

interface {Module}DialogProps {
  open: boolean;
  onClose: () => void;
  item?: WithId<{Entity}> | null;
  onCreate: ReturnType<typeof {entities}Collection.useCreate>;
  onUpdate: ReturnType<typeof {entities}Collection.useUpdate>;
  onDelete: ReturnType<typeof {entities}Collection.useDelete>;
}

export function {Module}Dialog({ open, onClose, item, onCreate, onUpdate, onDelete }: {Module}DialogProps) {
  const isEdit = !!item;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(item ? { title: item.title, status: item.status } : { title: '', status: 'active' });
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit && item) {
      await onUpdate.mutateAsync({ id: item.id, data: { ...data, updatedAt: serverTimestamp() } });
    } else {
      await onCreate.mutateAsync({ ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!item) return;
    await onDelete.mutateAsync(item.id);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
      onSubmit={handleSubmit(onSubmit)}
      onDelete={isEdit ? handleDelete : undefined}
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

### Bước 6 — Page (`src/app/(dashboard)/{route}/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageBadge } from '@/components/shared/PageBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/shared/Spinner';
import { use{Module} } from '@/modules/{module}/hooks/use{Module}';
import { {Module}Dialog } from '@/modules/{module}/components/{Module}Dialog';
import { {Module}Table } from '@/modules/{module}/components/{Module}Table';
import type { WithId } from '@/lib/firestore-rq';
import type { {Entity} } from '@/modules/{module}/types/{module}';

export default function {Module}Page() {
  const { {entities}, isLoading, create{Entity}, update{Entity}, delete{Entity} } = use{Module}();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<WithId<{Entity}> | null>(null);

  const openCreate = () => { setSelected(null); setDialogOpen(true); };
  const openEdit = (item: WithId<{Entity}>) => { setSelected(item); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setSelected(null); };

  if (isLoading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="{Module Title}"
        badge={<PageBadge count={{entities}.length} />}
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon size={16} className="mr-1" /> Thêm mới
          </Button>
        }
      />

      {{entities}.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" description="Tạo mục đầu tiên để bắt đầu" />
      ) : (
        <{Module}Table items={{entities}} onEdit={openEdit} />
      )}

      <{Module}Dialog
        open={dialogOpen}
        onClose={handleClose}
        item={selected}
        onCreate={create{Entity}}
        onUpdate={update{Entity}}
        onDelete={delete{Entity}}
      />
    </div>
  );
}
```

---

### Bước 7 — Seed (`src/modules/{module}/seed.ts`)

```typescript
import { {entities}Collection } from '@/modules/{module}/collections/{collection}';
import { {entities} as mock{Entities} } from '@/modules/{module}/mock';

export async function seed{Entities}(): Promise<{ created: number }> {
  // Idempotent — chỉ seed nếu collection rỗng
  const existing = await {entities}Collection.helpers.fetchList();
  if (existing.length > 0) return { created: 0 };

  for (const item of mock{Entities}) {
    const { id, ...data } = item;
    await {entities}Collection.helpers.set(id, data as never);
  }

  console.log(`Seeded ${mock{Entities}.length} {entities}`);
  return { created: mock{Entities}.length };
}
```

Sau đó gọi hàm này trong `src/app/(dashboard)/seed/page.tsx`.

---

### Bước 8 — Sidebar NavItem (nếu là top-level route mới)

```tsx
// src/components/layout/Sidebar.tsx — thêm NavItem
<NavItem href="/{route}" icon={SomeIcon} label="{Module Title}" />
```

---

## Checklist sau khi xong

```text
[ ] Types: không có 'any', export từ lib/types/index.ts
[ ] Collections: đúng path, transform đúng type
[ ] Hook: dùng {entities}Collection.useList/Create/Update/Delete
[ ] Dialog: ModalShell + Zod + RHF + error messages tiếng Việt
[ ] Page: isLoading → Spinner, empty → EmptyState, PageHeader
[ ] Seed: idempotent (check existing trước khi seed)
[ ] Sidebar: NavItem nếu là route mới
[ ] npm run type-check → 0 errors
```
