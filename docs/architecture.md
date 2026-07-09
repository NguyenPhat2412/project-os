# Kiến trúc Tổng thể — ProjectOS

## Tổng quan

ProjectOS là **single-page application** theo mô hình **FE-Only Serverless**:

``` markdown
Browser (Next.js React app)
       │
       ├─→ Firebase Auth         (authentication)
       ├─→ Cloud Firestore       (database, real-time)
       └─→ Firebase Storage      (file uploads)
```

Không có backend server riêng. Toàn bộ business logic chạy trên client thông qua Firebase SDK.

---

## Data Flow Tổng thể

``` markdown
User Action
    │
    ▼
React Component
    │
    ├─ Read  → useProjectData() / module hook → ProjectDataContext → Firestore
    │
    └─ Write → moduleService.ts → Firestore → (onSnapshot triggers refresh)
```

### Chi tiết luồng đọc dữ liệu

``` markdown
Firestore
  └─ ProjectDataContext (onSnapshot listeners)
       └─ useProjectData() hook
            └─ Module hook (useTasks, useBudget, ...)
                 └─ Page Component
                      └─ UI Components
```

### Chi tiết luồng ghi dữ liệu

``` markdown
User fills form → Zod validation → moduleService.ts → Firestore
                                                          │
                                                          ▼
                                                   onSnapshot fires
                                                          │
                                                          ▼
                                             ProjectDataContext updates
                                                          │
                                                          ▼
                                              UI re-renders automatically
```

---

## Kiến trúc Layers

### Layer 1: Firebase (Backend)

``` markdown
Firestore database
├── projects/{PROJECT_ID}/          ← Single project document
│   ├── config/                     ← Config sub-collection (dashboard, sprint, ...)
│   ├── tasks/                      ← Task documents
│   ├── team_members/
│   ├── meetings/
│   └── ...
└── (xem firebase.md để chi tiết đầy đủ)
```

### Layer 2: Service Layer (`src/modules/{module}/services/`)

- Chứa tất cả Firestore CRUD operations
- Không có side effects — pure async functions
- Trả về typed data

```typescript
// Pattern chuẩn của service
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID!;
const tasksCol = () => collection(db, 'projects', PROJECT_ID, 'tasks');

export async function fetchTasks(): Promise<Task[]> { ... }
export async function createTask(data: Omit<Task, 'id'>): Promise<string> { ... }
export async function updateTask(id: string, data: Partial<Task>): Promise<void> { ... }
export async function deleteTask(id: string): Promise<void> { ... }
```

### Layer 3: Data Context (`src/context/ProjectDataContext.tsx`)

**Trái tim của toàn bộ app.** Loads ALL project data on mount, provides via Context.

```typescript
// ProjectDataContext mount sequence:
// 1. Gọi fetchAll() — parallel getDocs cho tất cả collections
// 2. Nếu Firestore trống → set [] và hiển thị empty state / số 0
// 3. Set state → các components re-render

interface ProjectData {
  loading: boolean;
  refresh: () => void;        // Manual refetch

  // Dashboard
  dashboardStats: StatData[];
  priorityTasks: TaskItem[];
  // ...

  // Modules
  tasks: Task[];
  taskColumns: TaskColumn[];
  teamMembers: TeamMember[];
  risks: RiskEntry[];
  meetings: Meeting[];
  documents: DocEntry[];
  budgetItems: BudgetItem[];
  expenses: ExpenseEntry[];
  milestones: Milestone[];
  // ... 30+ fields
}
```

**Lưu ý quan trọng:**

- Context dùng `getDocs` (one-time fetch) + `refresh()` manual, **không phải** `onSnapshot`
- Firestore trống thì UI hiển thị empty state và số liệu bằng 0, không tự tạo dữ liệu
- Reload toàn bộ data mỗi khi `refresh()` được gọi

### Layer 4: Module Hooks (`src/modules/{module}/hooks/`)

Thin wrappers, chỉ destructure từ context + add filter/memo:

```typescript
// use{Module}.ts pattern
export function useTasks({ search = '', priority = 'all', status = 'all' } = {}) {
  const { tasks, taskColumns, teamMembers, loading, refresh } = useProjectData();

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (priority !== 'all' && t.priority !== priority) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, search, priority, status]);

  return { tasks: filtered, taskColumns, teamMembers, loading, refresh };
}
```

### Layer 5: UI Components

``` markdown
Page (src/app/(dashboard)/{route}/page.tsx)
  └─ Module Hook (useTasks, useBudget, ...)
       └─ Module Components (TaskKanbanView, BudgetTable, ...)
            └─ Shared Components (ModalShell, DataTable, Avatar, ...)
                 └─ Shadcn UI (Button, Input, Dialog, ...)
```

---

## Module Structure (Vertical Slice)

Mỗi module là một **vertical slice** — tự chứa mọi thứ cần thiết:

``` markdown
src/modules/{module}/
├── components/
│   ├── {Module}List.tsx        # View component
│   ├── {Module}Modal.tsx       # CRUD modal
│   └── {Module}Row.tsx         # Table row
├── hooks/
│   └── use{Module}.ts          # Data hook
└── services/
    └── {module}Service.ts      # Firestore CRUD
```

### Module Hook chỉ được phép

- Destructure từ `useProjectData()`
- Apply `useMemo` để filter/sort
- Expose computed values

### Module Hook KHÔNG được phép

- Gọi Firestore trực tiếp (dùng service)
- Manage local state phức tạp
- Fetch data độc lập ngoài context

---

## Authentication Architecture

``` text
src/app/layout.tsx
  └─ <AuthProvider>           ← wrap toàn bộ app
       └─ <LayoutShell>
            └─ [children]

AuthProvider:
  - onAuthStateChanged() listener
  - Lưu user state: { user, loading }
  - Cung cấp: useAuth() hook

Protected routes:
  src/app/(dashboard)/layout.tsx
    └─ Kiểm tra useAuth().user
    └─ Redirect → /login nếu chưa đăng nhập
```

Xem chi tiết: `.claude/docs/auth.md`

---

## State Management

ProjectOS **không dùng Zustand hay Redux**. State được quản lý bằng:

| State Type | Giải pháp |
| ----------- | ---------- |
| Auth state | `AuthContext` (Firebase onAuthStateChanged) |
| Global project data | `ProjectDataContext` (30+ fields) |
| Module-level filter/sort | `useState` trong page component |
| Modal open/close | `useState` trong page component |
| Sidebar state | `useSidebar()` hook (localStorage) |
| Form state | React Hook Form |

---

## Firestore Architecture

### Single-Project Design

App được thiết kế cho **một project duy nhất**:

```typescript
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'default';
// Tất cả data nằm dưới: projects/{PROJECT_ID}/
```

### Config Pattern

Một số data được lưu trong `config/` sub-collection dưới dạng named documents:

``` markdown
projects/{PROJECT_ID}/config/dashboard  → dashboard stats, priority tasks
projects/{PROJECT_ID}/config/sprint     → sprint info, sprint columns
projects/{PROJECT_ID}/config/budget     → budget summary
projects/{PROJECT_ID}/config/timeline   → gantt phases, timeline stats
projects/{PROJECT_ID}/config/reports    → report metrics
```

### Collections Pattern

``` markdown
projects/{PROJECT_ID}/tasks/            → Task[]
projects/{PROJECT_ID}/team_members/     → TeamMember[]
projects/{PROJECT_ID}/risks/            → RiskEntry[]
projects/{PROJECT_ID}/meetings/         → Meeting[]
projects/{PROJECT_ID}/documents/        → DocEntry[]
projects/{PROJECT_ID}/wiki_links/       → WikiLink[]
projects/{PROJECT_ID}/budget_items/     → BudgetItem[]
projects/{PROJECT_ID}/expenses/         → ExpenseEntry[]
projects/{PROJECT_ID}/milestones/       → Milestone[]
projects/{PROJECT_ID}/bugs/             → BugEntry[]
```

---

## Empty Data Strategy

App không tự tạo dữ liệu khi Firestore rỗng:

``` markdown
ProjectDataContext.mount()
  → fetchAll() → data rỗng?
  → Yes → render empty state và số liệu 0
  → No  → render dữ liệu thật
```

Các dashboard card, badge và report phải tính từ records đã fetch. Nếu collection rỗng, hiển thị `0`, `0%`, hoặc empty state có hướng dẫn hành động tiếp theo.

---

## Responsive & Theme

- **Dark theme only**: `<html className='dark'>` hardcoded
- **Sidebar**: 256px trên desktop, overlay + slide trên mobile
- **Breakpoint**: `max-sm:` (< 640px) cho mobile adjustments
- **Design tokens**: `--os-*` CSS variables trong `globals.css`

---

## Anti-Patterns — Tránh tuyệt đối

```typescript
// ❌ KHÔNG gọi Firestore trong component
const MyComponent = () => {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    getDocs(collection(db, 'tasks')).then(snap => setTasks(...)); // ❌
  }, []);
};

// ✅ ĐÚNG: dùng hook
const MyComponent = () => {
  const { tasks } = useTasks(); // ✅
};

// ❌ KHÔNG bypass service layer
const handleSave = async () => {
  await setDoc(doc(db, 'projects', PROJECT_ID, 'tasks', id), data); // ❌ trong component
};

// ✅ ĐÚNG: gọi service
const handleSave = async () => {
  await updateTask(id, data); // ✅ từ taskService
};

// ❌ KHÔNG dùng any
const data: any = await fetchTasks(); // ❌

// ✅ ĐÚNG
const data: Task[] = await fetchTasks(); // ✅
```
