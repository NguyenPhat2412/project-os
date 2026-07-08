# Modules — Chi tiết thực tế

> ⚠️ **Single-Project App**: Không có `/projects/[id]/` routing. Toàn bộ routes nằm trực tiếp dưới `/(dashboard)/`.
> PROJECT_ID cố định từ env var `NEXT_PUBLIC_PROJECT_ID`.

---

## Tổng quan các Modules

| # | Module | Route | Hook | Service |
| --- | ------- | ------- | ----- | ------- |
| 01 | Dashboard | `/` | `useProjectData()` | — |
| 02 | Tasks | `/tasks` | `useTasks()` | `taskService` |
| 03 | Sprint Board | `/sprint` | `useSprint()` | — |
| 04 | Backlog | `/backlog` | `useBacklog()` | — |
| 05 | Timeline | `/timeline` | `useTimeline()` | — |
| 06 | Team | `/team` | `useTeam()` | `teamService` |
| 07 | Budget | `/budget` | `useBudget()` | `budgetService` |
| 08 | Risk | `/risk` | `useRisk()` | — |
| 09 | Documents | `/docs` | `useDocs()` | `docService` |
| 10 | Meetings | `/meetings` | `useMeetings()` | — |
| 11 | Reports | `/reports` | `useProjectData()` | — |
| 12 | Activity | `/activity` | `useActivity()` | — |

---

## Module 01: Dashboard

**Route:** `/` (dashboard page)
**File:** `src/app/(dashboard)/page.tsx`

### Mục đích

Tổng quan nhanh toàn bộ project: stats, priority tasks, sprint progress, meetings sắp tới.

### Data sources (từ `useProjectData()`)

- `dashboardStats` — StatData[]
- `sprintProgress` — `{ current: number, label: string }`
- `priorityTasks` — TaskItem[] (tasks cần xử lý gấp)
- `dashboardMeetings` — Meeting[] (meetings sắp tới)
- `baStats`, `baProgress`, `qaStats` — Metrics cho BA/QA panels
- `deployEnvs` — DeployEnv[] (môi trường deploy)

### Firestore

`projects/{PROJECT_ID}/config/dashboard` (doc)

---

## Module 02: Tasks

**Route:** `/tasks`
**File:** `src/app/(dashboard)/tasks/page.tsx`

### Mục đích

Quản lý toàn bộ tasks của project với 3 views: List, Kanban, Calendar.

### Views

- **List View** — `TaskListView` — table với filter/sort/search
- **Kanban View** — `TaskKanbanView` — kéo thả giữa các columns
- **Calendar View** — `TaskCalendarView` — tasks theo ngày

### Components

```  markdown
src/modules/tasks/components/
├── TaskListView.tsx
├── TaskKanbanView.tsx
├── TaskCalendarView.tsx
├── TaskDialog.tsx        ← Create/Edit modal
└── TaskColumnDialog.tsx  ← Manage kanban columns
```

### Hook: `useTasks(options?)`

```typescript
interface UseTasksOptions {
  search?: string;
  priority?: 'all' | 'critical' | 'high' | 'medium' | 'low';
  status?: 'all' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
}

// Returns
{ tasks, allTasks, taskColumns, teamMembers, loading, refresh, nextTaskIndex }
```

### Service: `taskService`

```typescript
// src/modules/tasks/services/taskService.ts
fetchTasks(): Promise<Task[]>
createTask(data): Promise<string>
updateTask(id, data): Promise<void>
deleteTask(id): Promise<void>
```

### Types (từ `src/lib/types/task.ts`)

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigneeId?: string;
  columnId?: string;
  dueDate?: string;
  order: number;
  tags?: string[];
  storyPoints?: number;
}

interface TaskColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}
```

### Table Grouping Capability

**TaskListView** supports grouping via the `groupBy` prop with the following options:

- **none** (default) — flat list, no grouping
- **status** — group by task status (Backlog, Todo, In Progress, In Review, Done)
- **priority** — group by priority (High, Normal, Low)
- **assignee** — group by assigned team member (includes "Chưa phân loại" for unassigned)

**Implementation:** Uses `groupItems<Task>()` utility function with type-safe `GroupableField<Task>` definitions. Groups support expand/collapse UI via collapsible headers.

**Example:**

```typescript
<TaskListView
  tasks={tasks}
  columns={columns}
  teamMembers={teamMembers}
  groupBy="status"  // or "priority" | "assignee" | "none"
  onEditTask={handleEdit}
  onDeleteTask={handleDelete}
/>
```

See `docs/feature-playbook.md` → "Table Grouping Pattern" for detailed implementation guide.

### Firestore

```
projects/{PROJECT_ID}/tasks/          ← Task collection
projects/{PROJECT_ID}/task_columns/   ← Column definitions
```

---

## Module 03: Sprint Board

**Route:** `/sprint`
**File:** `src/app/(dashboard)/sprint/page.tsx`

### Mục đích

Kanban board cho sprint hiện tại. Hiển thị burndown progress, sprint goal.

### Hook: `useSprint()`

Returns: `{ sprintInfo, sprintColumns, loading, refresh }`

### Types

```typescript
interface SprintInfo {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  completedPoints: number;
  status: 'planning' | 'active' | 'completed';
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanCard[];
  color?: string;
}
```

### Firestore

`projects/{PROJECT_ID}/config/sprint` (doc) — sprint info + columns với embedded tasks

---

## Module 04: Backlog

**Route:** `/backlog`
**File:** `src/app/(dashboard)/backlog/page.tsx`

### Mục đích

Quản lý epics và backlog items chưa được assign vào sprint.

### Hook: `useBacklog()`

Returns: `{ epics, loading, refresh }`

### Types

```typescript
interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed';
  progress: number;   // 0-100
  color: string;
  items: BacklogItem[];
}

interface BacklogItem {
  id: string;
  title: string;
  type: 'story' | 'task' | 'bug';
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyPoints: number;
  status: string;
}
```

---

## Module 05: Timeline

**Route:** `/timeline`
**File:** `src/app/(dashboard)/timeline/page.tsx`

### Mục đích

Gantt-style timeline view. Hiển thị các phases và milestones của project.

### Components

`src/components/shared/` có `GanttBar` component (hoặc trong modules/timeline).

### Hook: `useTimeline()`

Returns: `{ timelineStats, ganttPhases, milestones, loading, refresh }`

### Types

```typescript
interface GanttPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
  tasks: string[];    // task titles
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'delayed';
  description?: string;
}
```

### Firestore

`projects/{PROJECT_ID}/config/timeline` (doc) — gantt phases
`projects/{PROJECT_ID}/milestones/` (collection) — milestones

---

## Module 06: Team

**Route:** `/team`
**File:** `src/app/(dashboard)/team/page.tsx`

### Mục đích

Quản lý thành viên trong dự án: xem workload, thêm/xoá members khỏi project. Mỗi project có thể có danh sách thành viên khác nhau.

### Components

```
src/modules/team/components/
├── TeamMembersTable.tsx       ← Sortable data table (TanStack Table)
├── MemberCardGrid.tsx         ← Card grid view
├── MemberFilterBar.tsx       ← Search + role filter
├── MemberModal.tsx            ← Add/Edit member (root profile)
├── TeamStatsPanel.tsx         ← Stats + workload charts + health score
├── TeamMemberViewSheet.tsx    ← Read-only detail sheet
└── OverloadedWarning.tsx     ← Alert for overloaded members
```

### Hook: `useTeam()`

JOINs `projects/{projectId}/team_members` (subcollection) với `members` (root) để lấy đầy đủ thông tin.

```typescript
// Returns: { teamMembers, teamStats, loading, setMember, updateMember, deleteMember }
// teamMembers: TeamMemberWithRole[] — joined data
// setMember: viết { memberId, role } vào subcollection
// updateMember: cập nhật role trong subcollection
// deleteMember: xoá khỏi subcollection (không xoá khỏi root)
```

### Types (từ `src/modules/team/types/team.ts`)

```typescript
// Root collection — global member profile (stored in `members/{id}`)
interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  gradient: string;
  role: string;         // global/default role
  taskCount: number;
  workload: number;     // 0-100 percentage
  status: WorkloadStatus;
}

type WorkloadStatus = 'Active' | 'Overloaded' | 'Busy' | 'Vacant';

// Subcollection — project-specific role assignment
interface ProjectTeamMember {
  memberId: string;  // ref → members/{memberId}
  role: string;      // project-specific role override
}

// Joined result — dùng trong UI
interface TeamMemberWithRole extends TeamMember {
  // All fields from TeamMember, role từ subcollection (project-specific)
}
```

### Firestore

```
members/{memberId}                              ← Root: global profile
projects/{PROJECT_ID}/team_members/{memberId}  ← Sub: { memberId, role }
```

> ⚠️ **Lưu ý:** `team_members` subcollection chỉ lưu `memberId` + `role`. Dữ liệu profile (name, email...) lấy từ root `members` qua JOIN.

---

## Module 07: Budget

**Route:** `/budget`
**File:** `src/app/(dashboard)/budget/page.tsx`

### Mục đích

Theo dõi ngân sách project: budget items và expense entries. Hiển thị summary và overspend alerts.

### Components

```
src/modules/budget/components/
├── BudgetTable.tsx       ← Budget items table
├── ExpenseTable.tsx      ← Expense entries table
├── BudgetItemModal.tsx   ← Add/Edit budget item
└── ExpenseModal.tsx      ← Add/Edit expense
```

### Hook: `useBudget()`

Returns: `{ budgetItems, expenses, budgetSummary, loading, refresh }`

### Service: `budgetService`

```typescript
// src/modules/budget/services/budgetService.ts
fetchBudgetItems(): Promise<BudgetItem[]>
fetchExpenses(): Promise<ExpenseEntry[]>
createBudgetItem(data): Promise<string>
updateBudgetItem(id, data): Promise<void>
deleteBudgetItem(id): Promise<void>
createExpense(data): Promise<string>
updateExpense(id, data): Promise<void>
deleteExpense(id): Promise<void>
```

### Types (từ `src/lib/types/budget.ts`)

```typescript
interface BudgetItem {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  currency: string;
  status: 'on_track' | 'at_risk' | 'over_budget';
}

interface ExpenseEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
}
```

### Firestore

```
projects/{PROJECT_ID}/budget_items/  (collection)
projects/{PROJECT_ID}/expenses/      (collection)
projects/{PROJECT_ID}/config/budget  (doc) — summary stats
```

---

## Module 08: Risk

**Route:** `/risk`
**File:** `src/app/(dashboard)/risk/page.tsx`

### Mục đích

Risk register: liệt kê, đánh giá và theo dõi các rủi ro của project.

### Hook: `useRisk()`

Returns: `{ risks, loading, refresh }`

### Types (từ `src/lib/types/risk.ts`)

```typescript
interface RiskEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  level: RiskLevel;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
  owner: string;
  mitigation: string;
  createdAt: string;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

### Firestore

`projects/{PROJECT_ID}/risks/` (collection)

---

## Module 09: Documents

**Route:** `/docs`
**File:** `src/app/(dashboard)/docs/page.tsx`

### Mục đích

Tài liệu kỹ thuật và wiki. Hỗ trợ upload file + tạo/chỉnh sửa wiki pages (markdown).

### Components

```
src/modules/docs/components/
├── DocumentTable.tsx     ← File documents table
├── WikiTable.tsx         ← Wiki pages table
├── DocRow.tsx            ← Document table row
├── UploadDocDialog.tsx   ← Upload file modal
├── EditDocDialog.tsx     ← Edit document metadata
├── WikiEditorDialog.tsx  ← Create/Edit wiki (markdown)
├── WikiViewDialog.tsx    ← View wiki page (rendered)
├── DocsDeleteDialogs.tsx ← Confirm delete modals
└── DocActivityPanel.tsx  ← Document activity sidebar
```

### Hook: `useDocs()`

Returns: `{ documents, wikiLinks, docActivity, loading, refresh }`

### Service: `docService`

```typescript
// src/modules/docs/services/docService.ts
fetchDocuments(): Promise<DocEntry[]>
fetchWikiLinks(): Promise<WikiLink[]>
createDocument(data): Promise<string>
updateDocument(id, data): Promise<void>
deleteDocument(id): Promise<void>
createWikiLink(data): Promise<string>
updateWikiLink(id, data): Promise<void>
deleteWikiLink(id): Promise<void>
```

### Types

```typescript
interface DocEntry {
  id: string;
  title: string;
  type: string;         // file extension hoặc 'wiki'
  size?: string;
  author: string;
  updatedAt: string;
  url?: string;         // download URL (Firebase Storage)
  tags?: string[];
}

interface WikiLink {
  id: string;
  title: string;
  content: string;      // Markdown content
  author: string;
  updatedAt: string;
  category?: string;
}
```

### Firestore

```
projects/{PROJECT_ID}/documents/      (collection)
projects/{PROJECT_ID}/wiki_links/     (collection)
projects/{PROJECT_ID}/doc_activity/   (collection)
```

---

## Module 10: Meetings

**Route:** `/meetings`
**File:** `src/app/(dashboard)/meetings/page.tsx`

### Mục đích

Quản lý cuộc họp: lịch meeting, ghi chú, action items, comments.

### Components

```
src/modules/meetings/components/
└── MeetingRow.tsx    ← Meeting table row
```

### Hook: `useMeetings()`

Returns: `{ meetings, loading, refresh }`

### Types (từ `src/lib/types/meeting.ts`)

```typescript
interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;   // minutes
  type: 'standup' | 'planning' | 'review' | 'retrospective' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendees: string[];
  location?: string;
  description?: string;
  notes?: MeetingNote[];
  actionItems?: ActionItem[];
}

interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'done';
}
```

### Firestore

```
projects/{PROJECT_ID}/meetings/          (collection)
projects/{PROJECT_ID}/meeting_notes/     (collection)
projects/{PROJECT_ID}/action_items/      (collection)
projects/{PROJECT_ID}/meeting_comments/  (collection)
```

---

## Module 11: Reports

**Route:** `/reports`
**File:** `src/app/(dashboard)/reports/page.tsx`

### Mục đích

Biểu đồ hiệu suất: velocity chart, burndown, bug trends, workload distribution.

### Data source

Dùng trực tiếp `useProjectData()` — data được tính từ config doc.

### Types

```typescript
interface SprintMetric {
  sprint: string;
  planned: number;
  completed: number;
  velocity: number;
}

interface BurndownPoint {
  day: string;
  ideal: number;
  actual: number;
}
```

### Firestore

`projects/{PROJECT_ID}/config/reports` (doc)

---

## Module 12: Activity

**Route:** `/activity`
**File:** `src/app/(dashboard)/activity/page.tsx`

### Mục đích

Activity feed — theo dõi mọi hoạt động trong project (ai làm gì, khi nào).

### Hook: `useActivity()`

Returns: `{ activityFeed, activityComments, notifications, loading, refresh }`

### Types (từ `src/lib/types/activity.ts`)

```typescript
interface ActivityEntry {
  id: string;
  type: string;         // 'task_created', 'bug_resolved', 'doc_uploaded', ...
  actor: string;        // user name
  actorAvatar?: string;
  description: string;
  entityId?: string;
  entityTitle?: string;
  timestamp: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  timestamp: string;
  link?: string;
}
```

### Firestore

```
projects/{PROJECT_ID}/activity_feed/      (collection)
projects/{PROJECT_ID}/activity_comments/  (collection)
projects/{PROJECT_ID}/notifications/      (collection)
```

---

## Module 13: Bugs

**Route:** `/bugs`
**File:** `src/app/(dashboard)/bugs/page.tsx`

### Mục đích

Quản lý toàn bộ bugs của project. Cung cấp danh sách bugs với filter, sort, và khả năng nhóm dữ liệu.

### Components

```text
src/modules/bugs/components/
├── BugTable.tsx          ← Main table with grouping support
├── BugFilterBar.tsx      ← Filter/search/grouping controls
├── BugDialog.tsx         ← Create/Edit modal
└── ...
```

### Hook: `useBugs(options?)`

```typescript
interface UseBugsOptions {
  search?: string;
  severity?: 'all' | 'Critical' | 'High' | 'Medium' | 'Low';
  status?: 'all' | 'open' | 'in_progress' | 'fixed' | 'wontfix';
}

// Returns
{ bugs, bugColumns, teamMembers, sprints, loading, refresh }
```

### Types (từ `src/lib/types/bug.ts`)

```typescript
type BugSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

interface Bug {
  id: string;
  title: string;
  description?: string;
  severity: BugSeverity;
  status: 'open' | 'in_progress' | 'fixed' | 'wontfix' | 'duplicate';
  assigneeId?: string;
  reporterId?: string;
  sprintId?: string;
  reproducible?: boolean;
  attachments?: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BugColumn {
  id: string;
  title: string;
}
```

### Table Grouping Capability

**BugTable** supports grouping via the `groupBy` prop with the following options:

- **none** (default) — flat list, no grouping
- **status** — group by bug status (Open, In Progress, Fixed, Wontfix, Duplicate)
- **severity** — group by severity (Critical, High, Medium, Low)
- **assignee** — group by assigned team member (includes "Chưa phân loại" for unassigned)

**Implementation:** Uses `groupItems<Bug>()` utility function with type-safe `GroupableField<Bug>` definitions. Groups support expand/collapse UI via collapsible headers.

**Example:**

```typescript
<BugTable
  bugs={bugs}
  teamMembers={teamMembers}
  columns={bugColumns}
  sprints={sprints}
  groupBy="severity"  // or "status" | "assignee" | "none"
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>
```

See `docs/feature-playbook.md` → "Table Grouping Pattern" for detailed implementation guide.

### Firestore

```text
projects/{PROJECT_ID}/bugs/              ← Bug collection
projects/{PROJECT_ID}/bug_columns/       ← Column definitions
```
