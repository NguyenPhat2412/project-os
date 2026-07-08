# Code Conventions — ProjectOS

## Formatting & i18n

> ⚠️ **Nguyên tắc bắt buộc: Tất cả date/time formatting dùng `@/lib/dayjs`, number/currency dùng `@/lib/numberjs`.**
>
> - **KHÔNG dùng** `Intl.DateTimeFormat`, `Intl.NumberFormat`
> - **KHÔNG dùng** `new Date()` trực tiếp trong JSX
> - **KHÔNG viết** hàm format local trong component — khai báo một lần, reuse toàn project

### Import

```typescript
// Date / time — từ dayjs
import dayjs, { formatDateVi, currentDate, formatDate, formatDateRelative, isOverdue } from '@/lib/dayjs';

// Number / currency / file size — từ numberjs
import { formatCurrencyVND, formatFileSize } from '@/lib/numberjs';
```

### Date / Time helpers

| Helper                           | Signature                               | Ví dụ output                  |
| -------------------------------- | --------------------------------------- | ----------------------------- |
| `formatDateVi(value, inputFmt?)` | `string \| null \| undefined → string`  | `"15/03/2026"`                |
| `currentDate()`                  | `() → string`                           | `"21/03/2026"` (hôm nay)      |
| `yesterdayDate()`                | `() → string`                           | `"20/03/2026"`                |
| `formatDate(value, fmt?)`        | `Date \| string \| null → string`       | `"15 thg 3, 2026"`            |
| `formatDateRelative(value)`      | `string \| null \| undefined → string`  | `"Hôm nay"`, `"3 ngày trước"` |
| `isOverdue(deadline)`            | `string \| null \| undefined → boolean` | `true`                        |

```typescript
// ✅ Đúng — dùng từ @/lib/dayjs
<span>{formatDateVi(task.deadline, 'DD/MM/YYYY')}</span>
<span>{currentDate()}</span> // cho defaultValues form

// ❌ Sai — không viết local helper trong component
function formatDate(d: string) { return new Intl.DateTimeFormat('vi-VN', ...).format(new Date(d)); }
```

### Number / Currency helpers

| Helper                  | Signature         | Ví dụ output                        |
| ----------------------- | ----------------- | ----------------------------------- |
| `formatCurrencyVND(n)`  | `number → string` | `"₫1.5B"`, `"₫12M"`, `"₫1,234,567"` |
| `formatFileSize(bytes)` | `number → string` | `"1.2 MB"`, `"500 KB"`, `"300 B"`   |

```typescript
// ✅ Đúng
import { formatCurrencyVND, formatFileSize } from '@/lib/numberjs';
<span>{formatCurrencyVND(item.budget)}</span>
<span>{formatFileSize(file.size)}</span>

// ❌ Sai — không viết local helper
function formatVND(n: number) { return `₫${n.toLocaleString('vi-VN')}`; }
function formatBytes(bytes: number) { return `${bytes} B`; }
```

### dayjs.ts mở rộng plugins

`@/lib/dayjs` đã include sẵn các plugins: `customParseFormat`, `relativeTime`, `isToday`, `isYesterday`, `isSameOrAfter`, `isSameOrBefore`. Locale mặc định: `vi`.

```typescript
import dayjs from '@/lib/dayjs';

// Parse date với format cụ thể
const d = dayjs(value, 'DD/MM/YYYY', true); // strict mode

// Relative time
dayjs().subtract(3, 'day').fromNow(); // "3 ngày trước"

// Check
dayjs().isToday();
dayjs().isYesterday();
```

### Cấu trúc file

| File                  | Chứa                                       |
| --------------------- | ------------------------------------------ |
| `src/lib/dayjs.ts`    | dayjs config + plugins + date/time helpers |
| `src/lib/numberjs.ts` | `formatCurrencyVND`, `formatFileSize`      |

---

## Nguyên tắc Chung

- **TypeScript strict mode** — không dùng `any`, không dùng `// @ts-ignore`
- **Functional components** — không dùng class components
- **Named exports** — ưu tiên named export, chỉ dùng default export cho pages/layouts
- **Co-location** — đặt test file cạnh source file (`Component.test.tsx`)

---

## App Router — Page vs Component

ProjectOS dùng **Next.js App Router**. Mỗi route trong `src/app/` có 2 trách nhiệm rõ ràng:

| Trách nhiệm                | Nơi thực hiện                                                              |
| -------------------------- | -------------------------------------------------------------------------- |
| **Bố cục HTML / semantic** | `src/app/(dashboard)/page.tsx`                                             |
| **Load data từ Firestore** | `src/app/(dashboard)/page.tsx` (server component, async)                   |
| **Khối UI / tương tác**    | `src/modules/{module}/components/*.tsx` (client component, `'use client'`) |

### Page = Layout + Data Loader (Server Component)

```typescript
// src/app/(dashboard)/tasks/page.tsx

import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { TeamWidget } from '@/modules/team/components/TeamWidget'; // nhận data đã fetch
import { TaskBoard } from '@/modules/tasks/components/TaskBoard';

export default async function TasksPage() {
  // ✅ Server component — fetch trực tiếp, không cần useEffect
  const tasks = await tasksCollection.getAll();

  return (
    <div className="space-y-6">
      {/* ✅ Bố cục HTML thuần — không có useState/useEffect */}
      <header>
        <h1>Danh sách công việc</h1>
      </header>
      <TaskBoard tasks={tasks} />
    </div>
  );
}
```

### UI Block = Client Component

```typescript
// src/modules/tasks/components/TaskBoard.tsx

'use client';
// ✅ Tương tác: drag-drop, filter, sort, form dialog
import { useState } from 'react';

interface Props {
  tasks: Task[]; // nhận data từ page
}

export function TaskBoard({ tasks }: Props) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  // ...
}
```

### Nguyên tắc phân tách

```text
src/app/(dashboard)/tasks/page.tsx
  ├── Load data (async/await, không có useState)
  ├── Return JSX thuần — chỉ layout, không logic tương tác
  └── Render UI components nhận data làm props

src/modules/tasks/components/TaskBoard.tsx
  ├── 'use client'
  ├── Nhận data qua props
  ├── Chứa useState, useEffect, event handlers
  └── KHÔNG fetch trực tiếp (trừ trường hợp isolated re-fetch)
```

### KHÔNG làm ngược

```typescript
// ❌ Sai — đặt fetch + JSX layout chung trong client component
'use client';
export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => { fetchTasks().then(setTasks); }, []);
  return (
    <div className="space-y-6">
      <h1>Công việc</h1>          // layout
      <TaskBoard tasks={tasks} />  // UI
    </div>
  );
}

// ✅ Đúng — page chỉ layout + fetch, component lo UI
// page.tsx: server component, layout + fetch
// TaskBoard.tsx: 'use client', nhận tasks làm prop
```

### Khi nào dùng Client Component ở Page level

Dùng `'use client'` ở page **chỉ khi** page cần tương tác thực sự (không phải vì nó "có data thay đổi"):

- Page có filter/sort state cục bộ → extract thành `<TaskFilterBar>` riêng
- Page cần real-time listener (onSnapshot) → `useProjectData()` context đã wrap sẵn
- Page không có tương tác → giữ nguyên server component, truyền data qua props

---

## Naming Conventions

### Files & Folders

```markdown
components/ PascalCase.tsx TaskCard.tsx
hooks/ camelCase.ts useTasks.ts
stores/ camelCase.ts projectStore.ts
utils/ camelCase.ts formatDate.ts
types/ camelCase.ts task.types.ts
constants/ SCREAMING_SNAKE.ts TASK_STATUS.ts
pages/ kebab-case/ task-detail/
```

### Variables & Functions

```typescript
// Variables: camelCase
const taskList: Task[] = [];
const isLoading: boolean = false;

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;

// Functions: camelCase, verb + noun
function fetchTasks() {}
function handleSubmit() {}
function validateTaskForm() {}

// Boolean variables: is/has/can/should prefix
const isLoading = true;
const hasPermission = false;
const canDelete = role === 'admin';

// Event handlers: handle + Event
const handleTaskClick = () => {};
const handleFormSubmit = () => {};
```

### Components

```typescript
// PascalCase, descriptive name
export function TaskCard({ task }: TaskCardProps) {}
export function SprintBurndownChart({ sprintId }: Props) {}

// Props interface: ComponentName + Props
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}
```

---

## Component Structure Template

```typescript
// modules/tasks/components/TaskCard.tsx

'use client'; // Chỉ thêm nếu cần tương tác (useState, event handlers)

import { useState } from 'react';
import { Task } from '@/modules/tasks/types/task';
import { Badge } from '@/components/ui/badge';
import { formatDateRelative } from '@/lib/dayjs';

// ─── Types ────────────────────────────────────
interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

// ─── Constants ────────────────────────────────
const PRIORITY_COLOR = {
  critical: 'destructive',
  high: 'warning',
  medium: 'secondary',
  low: 'outline',
} as const;

// ─── Component ────────────────────────────────
export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = () => {
    onEdit?.(task);
  };

  return (
    <div className="rounded-sm border p-4 hover:shadow-md transition-shadow">
      {/* Content */}
    </div>
  );
}
```

---

## Shared UI Primitives

### Loading State — `PageLoader`

Dùng `<PageLoader />` cho loading state ở mọi page. KHÔNG viết inline markup.

```typescript
// ✅ Đúng
import { PageLoader } from '@/components/shared/PageLoader';
if (loading) return <PageLoader />;

// ❌ Sai — viết spinner trực tiếp trong page
<div className='flex justify-center py-20'>
  <div className='w-8 h-8 border-2 border-(--os-accent) border-t-transparent rounded-full animate-spin' />
</div>
```

`PageLoader` nằm ở `src/components/shared/PageLoader.tsx`, dùng `<Spinner size="lg" />` bọc trong flex container chuẩn.

---

## Tailwind Spacing — Page vs Component

**Nguyên tắc: Tailwind spacing (margin, padding, grid wrapper) THUỘC về component, KHÔNG thuộc về page.**

| Spacing                                    | Khu vực      | Nơi đặt                                                          |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------- |
| `space-y-4`, `mb-6` (giữa các section lớn) | Page wrapper | `src/app/(dashboard)/*/page.tsx`                                 |
| `p-5`, `rounded-sm`, `border`              | Card surface | Component con (`TaskStatsPanel`, `BugStatsPanel`…)               |
| `gap-4.5`, `grid-cols-*`                   | Layout grid  | Component layout chuyên dụng (`MeetingsContent`, `DocsContent`…) |

### Page chỉ chứa

```typescript
// ✅ Đúng — page KHÔNG có Tailwind wrapper layout
export default function MeetingsPage() {
  return (
    <div>
      <MeetingsPageHeader ... />
      <MeetingsContent ... />       {/* grid + spacing ở đây */}
      <MeetingDialog ... />
      <ConfirmDialog ... />
    </div>
  );
}
```

### Layout grid extracted thành `{Module}Content`

Khi page có grid layout (2 cột, 3 cột…), tạo `{Module}Content` component:

```text
src/modules/meetings/components/
  MeetingsContent.tsx     ← grid wrapper + spacing
  MeetingsPageHeader.tsx  ← title + view tabs
  MeetingsSidebar.tsx     ← sidebar
```

```typescript
// src/modules/meetings/components/MeetingsContent.tsx
export function MeetingsContent({ ... }) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-[1fr_280px] max-lg:grid-cols-1 gap-4.5'>
        {/* ... */}
      </div>
      <MeetingNotesList notes={allNotes} />
    </div>
  );
}
```

### KHÔNG làm ngược

```typescript
// ❌ Sai — page chứa grid spacing
return (
  <div>
    <MeetingsPageHeader ... />
    <div className='grid grid-cols-[1fr_280px] gap-4.5'>
      <MeetingListView ... />
      <MeetingsSidebar ... />
    </div>
  </div>
);

// ✅ Đúng — spacing thuộc component
<MeetingsContent meetings={...} teamMembers={...} ... />
```

---

## Zod Validation Template

```typescript
// lib/validations/task.ts

import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được trống').max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['epic', 'story', 'task', 'subtask']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  assigneeId: z.string().nullable(),
  storyPoints: z.number().int().min(0).max(100),
  dueDate: z.date().nullable(),
  labels: z.array(z.string()).max(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

---

## Import Aliases (@/)

```typescript
// tsconfig.json paths
"@/*": ["./*"]

// Sử dụng:
import { Task } from '@/lib/types';
import { db } from '@/lib/firebase/config';
import { TaskCard } from '@/components/modules/tasks/TaskCard';
import { useTasks } from '@/lib/hooks/useTasks';
```

---

## Error Handling Pattern

```typescript
// Luôn wrap Firestore operations trong try-catch
// Dùng collection helpers thay vì gọi trực tiếp firebase/firestore
const createTask = tasksCollection.useCreate();

async function handleCreate(data: CreateTaskInput) {
  try {
    await createTask.mutateAsync({
      title: data.title,
      status: 'open',
    });
    // React Query tự invalidate → UI cập nhật
  } catch (error) {
    console.error('[createTask]', error);
    // Throw để UI có thể catch và hiển thị toast
    throw new Error('Không thể tạo task. Vui lòng thử lại.');
  }
}
```

---

## Firestore — firestore-rq Patterns

ProjectOS dùng **firestore-rq** — wrapper React Query quanh Firebase SDK. KHÔNG bao giờ import trực tiếp `doc`, `getDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `writeBatch`, `collection`, `addDoc` từ `firebase/firestore` ở tầng component/module.

### Import paths

```typescript
// ✅ Đúng — dùng helpers từ collection hoặc project-config
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { dashboardConfig, budgetConfig } from '@/lib/project-config';
import { batchWrite } from '@/lib/firestore-rq';

// ❌ Sai — import trực tiếp từ firebase/firestore ở tầng component
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
```

### Collection CRUD — `createCollection` / `createSubcollection`

Mỗi collection có một collection object đã được factory. Dùng hooks hoặc helpers:

```typescript
// collections/tasks.ts
import { db } from '@/lib/firebase/firestore';
import { createSubcollection } from '@/lib/firestore-rq';

export const tasksCollection = createSubcollection<Task>(db, {
  path: (projectId) => `projects/${projectId}/tasks`,
  transform: (raw) => raw as unknown as WithId<Task>,
})(PROJECT_ID);

// ─── Trong component ─────────────────────────────────────────────────────────

// Read — dùng hooks (React Query, auto cache + refetch)
const { data: tasks = [] } = tasksCollection.useList();
const { data: task } = tasksCollection.useDocument(taskId);

// Write — dùng mutation hooks
const createTask = tasksCollection.useCreate();
await createTask.mutateAsync({ title: '...', status: 'open' });

const updateTask = tasksCollection.useUpdate();
await updateTask.mutateAsync({ id: taskId, data: { status: 'done' } });

const deleteTask = tasksCollection.useDelete();
await deleteTask.mutateAsync(taskId);

// Batch create (custom id)
const setTask = tasksCollection.useSet();
await setTask.mutateAsync({ id: 'TASK-01', title: '...' });

// Hoặc dùng helpers (trong handler, useEffect, dialog — không cần React Query)
await tasksCollection.helpers.create({ title: '...' });
await tasksCollection.helpers.set(id, { title: '...' });
await tasksCollection.helpers.update(id, { status: 'done' });
await tasksCollection.helpers.delete(id);
```

### Config Documents — `createConfig` / `project-config.ts`

Config documents (projects/{projectId}/config/{name}) dùng `createConfig`:

```typescript
// Pre-defined trong src/lib/project-config.ts
import { dashboardConfig, budgetConfig, reportsConfig, sprintConfig } from '@/lib/project-config';

// Trong component
const { data, isLoading } = dashboardConfig.useDocument('dashboard');
// → data: DashboardConfig | null (React Query, auto-refetch on window focus)

// Helpers cho useEffect hoặc handler
const snap = await dashboardConfig.helpers.fetch('dashboard');
```

### Batch Writes — `batchWrite()`

Khi cần ghi nhiều documents trong một transaction:

```typescript
import { batchWrite } from '@/lib/firestore-rq';

// ✅ Đúng
const bw = batchWrite();
bw.update(tasksCollection.path, taskId1, { status: 'done' });
bw.update(tasksCollection.path, taskId2, { status: 'done' });
bw.delete(someCollection.path, docId);
await bw.commit();

// ❌ Sai
import { writeBatch, doc } from 'firebase/firestore';
const batch = writeBatch(db);
batch.update(doc(db, 'projects', PROJECT_ID, 'tasks', id), { ... });
```

### Nguyên tắc bắt buộc

| Thao tác            | Cách đúng                             | Nguồn             |
| ------------------- | ------------------------------------- | ----------------- |
| Đọc 1 document      | `collection.useDocument(id)`          | firestore-rq      |
| Đọc list            | `collection.useList()`                | firestore-rq      |
| Tạo (auto-id)       | `collection.helpers.create(data)`     | firestore-rq      |
| Tạo (custom id)     | `collection.helpers.set(id, data)`    | firestore-rq      |
| Cập nhật            | `collection.helpers.update(id, data)` | firestore-rq      |
| Xoá                 | `collection.helpers.delete(id)`       | firestore-rq      |
| Batch write         | `batchWrite()`                        | firestore-rq      |
| Config document     | `configCollection.useDocument(id)`    | project-config.ts |
| Path của collection | `collection.path`                     | firestore-rq      |

### File cấu trúc

| File                                               | Chứa                              |
| -------------------------------------------------- | --------------------------------- |
| `src/lib/firestore-rq/core/createCollection.ts`    | Factory hooks CRUD cho collection |
| `src/lib/firestore-rq/core/createSubcollection.ts` | Factory cho subcollection         |
| `src/lib/firestore-rq/core/createConfig.ts`        | Factory cho config document       |
| `src/lib/firestore-rq/core/batchWrite.ts`          | Wrapper `batchWrite()`            |
| `src/lib/project-config.ts`                        | Pre-defined config helpers        |
| `src/lib/firestore-rq/index.ts`                    | Barrel export tất cả helpers      |

### KHÔNG làm ngược

```typescript
// ❌ Sai — gọi trực tiếp từ firebase/firestore ở component
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const ref = doc(db, 'projects', PROJECT_ID, 'tasks', id);
await updateDoc(ref, { status: 'done' });
await deleteDoc(ref);

// ✅ Đúng — dùng collection helpers
await tasksCollection.helpers.update(id, { status: 'done' });
await tasksCollection.helpers.delete(id);

// ❌ Sai — gọi getDoc trực tiếp trong useEffect
useEffect(() => {
  const snap = await getDoc(doc(db, `projects/${PROJECT_ID}/config/budget`));
}, []);

// ✅ Đúng — dùng config collection
const { data } = budgetConfig.useDocument('budget');
```

### Mutation hooks vs Helpers

```typescript
// Dùng hooks (mutation) khi muốn React Query tự động invalidate queries
const updateTask = tasksCollection.useUpdate();
await updateTask.mutateAsync({ id, data: { status } });
// → React Query tự invalidate → UI tự cập nhật

// Dùng helpers khi cần inline trong handler hoặc cần batch
const handleMove = async (taskId, newStatus) => {
  await tasksCollection.helpers.update(taskId, { status: newStatus });
  refetch(); // gọi thủ công
};
```

---

## Git Commit Convention

```markdown
feat(tasks): add sprint assignment to task form
fix(bugs): resolve duplicate bug report on refresh  
refactor(auth): simplify permission check logic
docs(readme): update environment setup guide
chore(deps): upgrade firebase to v10.7
test(tasks): add unit tests for task validation
style(board): fix kanban column overflow on mobile
```

Format: `type(scope): short description`

Types: `feat` | `fix` | `refactor` | `docs` | `chore` | `test` | `style` | `perf`
