# Serverless FE-Only — Constraints & Patterns

> ProjectOS không có backend server. Toàn bộ là Next.js FE + Firebase SDK.
> Tài liệu này mô tả những gì **có thể** và **không thể** làm, và cách xử lý từng trường hợp.

---

## Data Layer — `firestore-rq` Abstraction

ProjectOS **không gọi Firebase SDK trực tiếp** trong components/hooks. Toàn bộ Firestore CRUD đi qua abstraction layer `src/lib/firestore-rq`:

```typescript
// 3 factory functions — dùng tùy loại collection
createCollection(db, { path })       // top-level collection (vd: 'projects')
createSubcollection(db, { path })    // subcollection (vd: 'projects/{id}/tasks')
createConfig(db, { path })           // single config document
```

Mỗi factory trả về object với:

- React Query hooks: `useList()`, `useDocument()`
- CRUD helpers: `helpers.set()`, `helpers.update()`, `helpers.delete()`, `helpers.fetchList()`

```typescript
// Ví dụ — không bao giờ gọi addDoc/setDoc trực tiếp trong component
const tasksCollection = createSubcollection<Task>(db, { path: 'projects/{id}/tasks' });
const { data } = tasksCollection.useList();
await tasksCollection.helpers.set(id, data);
```

---

## Multi-Project & Project Switching

ProjectOS hỗ trợ nhiều projects. `PROJECT_ID` được resolve từ `localStorage` (SSR-safe):

```typescript
// src/lib/project.ts
function resolveProjectId(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeProjectId');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_PROJECT_ID ?? 'default';
}
export const PROJECT_ID = resolveProjectId(); // module-level constant
```

**Cơ chế switch project:** cập nhật localStorage + hard reload (`window.location.href`).
Hard reload là bắt buộc vì 32+ collection files khởi tạo `PROJECT_ID` ở module level — chỉ re-read được khi reload toàn bộ module.

```typescript
// src/context/ProjectContext.tsx
const switchProject = (id: string) => {
  localStorage.setItem('activeProjectId', id);
  window.location.href = '/dashboard'; // hard reload
};
```

---

## ✅ Làm được ở Client (Firebase SDK)

| Tác vụ | Cách làm |
| -------- | ---------- |
| CRUD documents | Qua `firestore-rq` helpers (set, update, delete) |
| Batch write | `batchWrite` từ `src/lib/firestore-rq/core/batchWrite.ts` |
| File upload | Firebase Storage SDK |
| Auth (login/logout) | Firebase Auth SDK |
| Query với filter/sort | `useList({ where, orderBy, limit })` |
| Real-time sync | `onSnapshot` (được wrap trong `useList`) |
| Conditional write | `runTransaction` (dùng khi cần, gọi trực tiếp SDK) |

---

## ❌ Không làm được ở Client → Dùng Cloud Functions

| Tác vụ | Lý do | Giải pháp |
| -------- | ------- | ----------- |
| Gửi email | Cần SMTP credentials | Cloud Function trigger |
| Push notification (FCM) | Cần server key | Cloud Function |
| Đọc/ghi không qua Security Rules | Admin SDK | Cloud Function |
| Aggregate lớn (count, sum toàn collection) | Tốn reads | Cloud Function + cache |
| Webhook từ bên ngoài (GitLab, Slack) | Cần endpoint | Cloud Function HTTP |
| Scheduled jobs (daily report) | Cần cron | Cloud Function scheduled |

> ⚠️ **Hiện tại** ProjectOS chưa có Cloud Functions (`/functions` chưa tồn tại). Khi cần, tạo theo Firebase Functions v2 pattern.

---

## Security Rules — Quan trọng Nhất

Vì không có backend, **Security Rules là rào cản duy nhất** giữa user và data.

### Rule cơ bản cho mỗi collection mới

```javascript
// Luôn bắt đầu với deny-by-default
match /{document=**} {
  allow read, write: if false;
}

// Sau đó mở từng path cụ thể
match /projects/{projectId}/newCollection/{docId} {
  allow read: if isProjectMember(projectId);
  allow create: if isProjectMember(projectId)
    && request.resource.data.authorId == request.auth.uid;
  allow update: if isOwner(resource.data.authorId)
    || isProjectAdmin(projectId);
  allow delete: if isProjectAdmin(projectId);
}
```

### Validate data trong Rules

```javascript
allow create: if isProjectMember(projectId)
  && request.resource.data.keys().hasAll(['title', 'status', 'authorId'])
  && request.resource.data.title is string
  && request.resource.data.title.size() <= 200
  && request.resource.data.status in ['open', 'in_progress', 'resolved'];
```

---

## Giới hạn Firestore cần biết

| Limit | Giá trị |
| ------- | --------- |
| Document size | 1 MB |
| Array field | Không index được, không query được |
| `in` operator | Tối đa 30 values |
| `or` conditions | Tối đa 30 disjunctions |
| Writes/second per document | 1 write/second |
| Free tier reads/day | 50,000 |
| Free tier writes/day | 20,000 |

### Giải pháp cho array không query được

```typescript
// ❌ Không thể query khi array lớn
// ✅ Dùng map thay array cho lookup
{ tagMap: { 'frontend': true, 'urgent': true } }
// Query: where('tagMap.urgent', '==', true)
```

---

## Rate Limiting & Cost Control

```typescript
// Đặt limit cho mọi query — không bao giờ fetch unbounded
tasksCollection.useList({
  where: [['status', '!=', 'done']],
  orderBy: { field: 'dueDate', direction: 'asc' },
  limit: 50, // ← LUÔN có limit
});

// Cache counter trong project document thay vì count() mỗi lần
await tasksCollection.helpers.update(projectRef, {
  taskCount: increment(1),
});
```

---

## Next.js API Routes — Khi nào dùng?

> ⚠️ **Hiện tại** ProjectOS chưa có `src/app/api/`. Chỉ tạo khi thực sự cần.

Chỉ dùng Next.js API Routes khi:

- Cần **proxy** request để giấu API key của third-party (AI API, Slack API...)
- Nhận **webhook** từ external services (GitLab, Stripe...)

**Không dùng** API Routes cho business logic thông thường — dùng trực tiếp Firebase SDK ở client.
