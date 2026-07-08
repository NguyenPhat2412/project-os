# Seed Data Strategy — ProjectOS

## Tổng quan

ProjectOS hỗ trợ **multi-project**: mỗi project là một document trong collection `projects/`, data nằm trong subcollections `projects/{projectId}/{subcollection}`.

Có 2 loại seed:

| Loại                    | Mục đích                                                  |
| ----------------------- | --------------------------------------------------------- |
| **Projects collection** | Seed danh sách 3 projects mẫu vào Firestore               |
| **Per-project data**    | Seed toàn bộ data (tasks, team, bugs...) cho từng project |

---

## 3 Projects Mẫu

| projectId        | Tên                 | Seed function          | Loại data             |
| ---------------- | ------------------- | ---------------------- | --------------------- |
| `default`        | E-Commerce Platform | `seedDefaultProject()` | Full (13 modules)     |
| `hrm-system`     | HRM System          | `seedHRMSystem()`      | Basic (7 collections) |
| `mobile-banking` | Mobile Banking App  | `seedMobileBanking()`  | Basic (7 collections) |

---

## Cấu trúc File

```text
src/modules/projects/
├── seed.ts                          # seedProjects() — seed projects collection
├── mock.ts                          # Mock data cho 3 project documents
└── seeds/
    ├── seed-utils.ts                # Factory + reset utilities
    ├── default-seed.ts              # seedDefaultProject() — gọi tất cả module seeds
    ├── hrm-system-mock.ts           # Mock data: team, sprints, tasks, bugs, risks, epics
    ├── hrm-system-seed.ts           # seedHRMSystem()
    ├── mobile-banking-mock.ts       # Mock data: team, sprints, tasks, bugs, risks, epics
    └── mobile-banking-seed.ts       # seedMobileBanking()

src/modules/{module}/
├── mock.ts                          # Mock data per module (dùng cho default project)
└── seed.ts                          # Seed function per module
```

---

## Seed theo Project

### Default — E-Commerce Platform (`seedDefaultProject`)

Gọi tuần tự tất cả module seed functions theo thứ tự dependency:

```text
seedTaskColumns → seedTasks → seedSprints → seedTeamMembers
→ seedRisks → seedBugs → seedBudgetItems → seedExpenses
→ seedDocuments → seedWikiLinks (tự động backfill wiki summary)
→ seedMeetings → seedActivityFeed → seedNotifications
→ seedGanttPhases → seedMilestones → seedEpics → seedComments
```

Mock data lấy từ `src/modules/{module}/mock.ts` của từng module.

### HRM / Mobile Banking (`seedHRMSystem`, `seedMobileBanking`)

Dùng `createProjectCollections(projectId)` factory để tạo collection instances ad-hoc cho project ID bất kỳ, **không ảnh hưởng** các collection hiện tại của app.

Subcollections được seed (**BASIC_SUBCOLLECTIONS**):

```text
tasks, task_columns, team_members, sprints, bugs, risks, epics
```

Mock data nằm trong `seeds/hrm-system-mock.ts` và `seeds/mobile-banking-mock.ts`.

---

## Subcollections Constants

Dùng trong `clearProjectData()` để reset:

```typescript
// BASIC — dùng cho HRM / Mobile Banking
BASIC_SUBCOLLECTIONS = ['tasks', 'task_columns', 'team_members', 'sprints', 'bugs', 'risks', 'epics'];

// FULL — dùng cho default (E-Commerce)
FULL_SUBCOLLECTIONS = [...BASIC, 'budget_items', 'expenses', 'documents', 'wiki_links', 'meetings', 'activity_feed', 'notifications', 'gantt_phases', 'milestones', 'action_items', 'doc_activity', 'activity_comments'];
```

---

## Reset Data

```typescript
import { clearProjectData, FULL_SUBCOLLECTIONS, BASIC_SUBCOLLECTIONS } from '@/modules/projects/seeds/seed-utils';

await clearProjectData('default', FULL_SUBCOLLECTIONS); // xóa toàn bộ E-Commerce data
await clearProjectData('hrm-system', BASIC_SUBCOLLECTIONS); // xóa HRM data
await clearProjectData('mobile-banking', BASIC_SUBCOLLECTIONS);
```

UI reset có sẵn tại `/seed` (Danger Zone section).

---

## Seed UI — `/seed`

Trang seed data tại `src/app/(dashboard)/seed/page.tsx`:

1. **Seed Projects Collection** — chạy `seedProjects()` một lần
2. **Seed per project** — mỗi project có một nút "Seed" riêng
3. **Danger Zone** — reset từng project với confirm dialog

---

## Nguyên tắc khi thêm module mới

1. Tạo `src/modules/{module}/mock.ts` với data mẫu
2. Tạo `src/modules/{module}/seed.ts` với hàm `seed{Module}()`
3. Thêm `await seed{Module}()` vào `seedDefaultProject()` theo đúng thứ tự dependency
4. Nếu module tạo subcollection mới, thêm tên vào `FULL_SUBCOLLECTIONS` trong `seed-utils.ts`
