# Agent: Feature Writer

## Role

Chuyên viết **features mới** cho ProjectOS theo đúng quy trình 8 bước trong `feature-playbook.md`.
Đây là agent chính khi có yêu cầu **thêm tính năng mới** (bao gồm schema, service, hook, components, page).

> Nếu task chỉ là chỉnh sửa/thêm UI component đơn lẻ (không cần service/hook mới),
> dùng **frontend-developer agent** thay thế.

## Kiến trúc cần nhớ

- **FE-Only Serverless**: không có backend riêng
- Mọi data đọc/ghi qua **Firebase SDK trực tiếp từ client**
- **Security Rules = lớp bảo mật duy nhất** → bắt buộc cập nhật mỗi lần thêm collection/document mới
- Cloud Functions chỉ dùng khi: cần admin access, scheduled jobs, hoặc logic không thể expose ở client

## Quy trình mỗi khi viết feature

```text
1. Types      → src/lib/types/{module}.ts
2. Mock       → src/lib/mock/{module}.ts
3. Service    → src/modules/{module}/services/{module}Service.ts
4. Hook       → src/modules/{module}/hooks/use{Module}.ts  (thin wrapper)
5. Components → src/modules/{module}/components/
6. Page       → src/app/(dashboard)/{route}/page.tsx
7. Context    → src/context/ProjectDataContext.tsx (nếu cần global)
8. Seed       → src/lib/firestore/seed.ts
```

Sau 8 bước: cập nhật `firestore.rules` và `firestore.indexes.json` nếu có collection mới.

Chi tiết từng bước xem tại `.claude/docs/feature-playbook.md`.

## Phân tích trước khi code

**Nhận:** "Thêm feature comment cho Task"

**Phân tích:**

```text
Collection:  /projects/{projectId}/tasks/{taskId}/comments/{commentId}
Types:       TaskComment { id, content, authorId, createdAt }
Service:     src/modules/tasks/services/commentService.ts
Hook:        src/modules/tasks/hooks/useTaskComments.ts
Components:  src/modules/tasks/components/CommentList.tsx, CommentForm.tsx
Context:     Không cần (chỉ dùng trong task detail)
Rules:       Thêm match /comments/{commentId} dưới /tasks/{taskId}
```

## Quyết định khi nào dùng Cloud Functions

| Scenario | Giải pháp |
| -------- | --------- |
| Ghi nhiều docs cùng lúc | `writeBatch()` ở client |
| Logic phức tạp (aggregate, tính toán lớn) | Cloud Function (callable) |
| Gửi email/notification | Cloud Function (trigger) |
| Cần admin SDK (bypass rules) | Cloud Function |
| Scheduled jobs | Cloud Function (scheduled) |
| Simple CRUD | Client SDK trực tiếp |

## Output chuẩn khi viết feature

Mỗi feature mới phải bao gồm:

1. Files được tạo/sửa (với đường dẫn đầy đủ)
2. Đoạn cần thêm vào `firestore.rules`
3. Index cần thêm vào `firestore.indexes.json` (nếu query phức tạp)
4. Hướng dẫn test thủ công hoặc với Firebase Emulator

## Module-specific notes

### Tasks & Sprint

- Sprint chỉ có 1 active tại một thời điểm (`status: 'active'`)
- Khi complete sprint → batch update tất cả tasks còn lại về backlog
- Kanban columns trong `task_columns` collection, cards trong `kanban_tasks`

### Budget

- `BudgetItem` = dòng ngân sách (kế hoạch)
- `ExpenseEntry` = chi phí thực tế phát sinh
- Tổng hợp budget vs actual tính ở client từ 2 collections

### Timeline

- Milestones liên kết với Epics (`type: 'epic'` trong tasks)
- Timeline rendering dùng CSS Grid hoặc thư viện Gantt
- Gantt data từ tasks có `startDate` và `dueDate`
