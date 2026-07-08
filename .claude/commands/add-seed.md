# Thêm hoặc cập nhật mock/seed data cho một module trong ProjectOS

**Module cần thêm seed data:** $ARGUMENTS

---

## Cấu trúc seed (thực tế)

Mỗi module tự quản lý mock và seed của mình — **không có global seed file**:

```text
src/modules/{module}/
├── mock.ts     ← Dữ liệu mock (mảng objects)
└── seed.ts     ← Hàm seed dùng collection helpers
```

---

## Bước 1 — Đọc types của module

```typescript
// src/modules/{module}/types/{module}.ts
// Đọc để biết chính xác interface cần implement
```

---

## Bước 2 — Tạo/cập nhật Mock Data (`src/modules/{module}/mock.ts`)

```typescript
import type { Task } from '@/modules/tasks/types/task';

// Dùng export named — tên biến = snake_case số nhiều, type = singular uppercase
export const tasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Thiết kế giao diện trang chủ',
    priority: 'High',
    status: 'done',
    // ... fields đầy đủ theo interface
    dueDate: new Date('2026-03-05'),
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  },
  {
    id: 'TASK-002',
    title: 'Tích hợp API thanh toán VNPay',
    priority: 'High',
    status: 'in-progress',
    // ... fields đầy đủ theo interface
    dueDate: new Date('2026-03-20'),
    createdAt: new Date('2026-03-02'),
    updatedAt: new Date('2026-03-02'),
  },
  // ... ít nhất 5-10 items
];
```

**Nguyên tắc mock data tốt:**

- Tối thiểu **5–10 items**, cover đủ các `status` và `priority` values
- Dates dùng `new Date()` (không cần `Timestamp.fromDate()` — seed.ts tự convert)
- Amounts/numbers có biến thiên thực tế
- Tên người/dự án bằng tiếng Việt thực tế
- `id` có format nhất quán: `TASK-001`, `TASK-002`, `BUG-001`...
- **Không import `Timestamp` từ Firebase** — dùng `new Date()` trong mock

---

## Bước 3 — Cập nhật Seed Function (`src/modules/{module}/seed.ts`)

**Pattern 1 — Module có columns (tasks, bugs):**

```typescript
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { tasks as mockTasks, mockTaskColumns } from '@/modules/tasks/mock';

export async function seedTaskColumns(): Promise<{ created: number }> {
  const existing = await taskColumnsCollection.helpers.fetchList();
  if (existing.length > 0) return { created: 0 };

  for (const column of mockTaskColumns) {
    await taskColumnsCollection.helpers.set(column.id, column as never);
  }

  console.log(`🧱 Seeded ${mockTaskColumns.length} task columns`);
  return { created: mockTaskColumns.length };
}

export async function seedTasks(): Promise<{ created: number }> {
  const existing = await tasksCollection.helpers.fetchList();
  if (existing.length > 0) return { created: 0 };

  for (const task of mockTasks) {
    const { id, ...data } = task;
    await tasksCollection.helpers.set(id, data as never);
  }

  console.log(`✅ Seeded ${mockTasks.length} tasks`);
  return { created: mockTasks.length };
}
```

**Pattern 2 — Module không có columns (team, budget...):**

```typescript
import { membersCollection } from '@/modules/team/collections/members';
import { teamMembers as mockMembers } from '@/modules/team/mock';

export async function seedTeamMembers(): Promise<{ created: number }> {
  const existing = await membersCollection.helpers.fetchList();
  if (existing.length > 0) return { created: 0 };

  for (const member of mockMembers) {
    const { id, ...data } = member;
    await membersCollection.helpers.set(id, data as never);
  }

  console.log(`👥 Seeded ${mockMembers.length} members`);
  return { created: mockMembers.length };
}
```

---

## Bước 4 — Đăng ký vào Default Seed (`src/modules/projects/seeds/default-seed.ts`)

Nếu là module mới, thêm vào `default-seed.ts` (hoặc các seed file khác tương ứng):

```typescript
import { seedTasks, seedTaskColumns } from '@/modules/tasks/seed';
// ... các import khác

export async function seedDefaultProject(): Promise<void> {
  await seedTaskColumns();
  await seedTasks();
  // ... các seed khác
}
```

**KHÔNG cập nhật seed page** — seed page (`admin/seed/page.tsx`) gọi các project seed functions cấp cao, không gọi từng module riêng lẻ.

---

## Bước 5 — Đăng ký Clear (nếu cần)

Nếu module mới cần được xóa khi reset, thêm subcollection vào `seed-utils.ts`:

```typescript
// BASIC_SUBCOLLECTIONS hoặc FULL_SUBCOLLECTIONS tùy project
export const FULL_SUBCOLLECTIONS = [
  // ... existing ...
  'new_subcollection',
] as const;
```

---

## Ví dụ: Mock tốt vs xấu

```typescript
// ❌ XẤU — đơn điệu, không realistic, dùng Timestamp
import { Timestamp } from 'firebase/firestore';
export const mockTasks = [
  { id: 'task-1', title: 'Task 1', status: 'todo', priority: 'medium' },
  { id: 'task-2', title: 'Task 2', status: 'todo', priority: 'medium' },
];

// ✅ TỐT — đa dạng, realistic, dùng new Date()
export const tasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Thiết kế giao diện trang chủ',
    priority: 'High',
    status: 'done',
    assigneeId: 'TM-01',
    reporterId: 'TM-04',
    points: 5,
    dueDate: new Date('2026-03-05'),
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  },
  {
    id: 'TASK-002',
    title: 'Tích hợp API thanh toán VNPay',
    priority: 'High',
    status: 'in-progress',
    assigneeId: 'TM-02',
    reporterId: 'TM-05',
    points: 8,
    dueDate: new Date('2026-03-20'),
    createdAt: new Date('2026-03-02'),
    updatedAt: new Date('2026-03-02'),
  },
  // ... thêm 4-8 items nữa với statuses/priorities khác nhau
];
```

---

## Sau khi xong

1. Vào trang `/admin/seed` trong app để seed Firestore
2. Chọn project seed phù hợp (E-Commerce, HRM, Mobile Banking...)
3. Kiểm tra UI hiển thị đúng và đa dạng

**Lưu ý:**

- Seed function idempotent — chỉ chạy nếu collection đang rỗng
- Dùng **Reset** trong seed page để force clear + re-seed
- Mock data KHÔNG dùng `Timestamp` — chỉ dùng `new Date()`
- Seed functions KHÔNG import từ `@/modules/projects/seeds/` (tránh circular dependency)
