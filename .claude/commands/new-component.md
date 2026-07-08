# Scaffold một React component mới theo đúng patterns của ProjectOS

**Mô tả component cần tạo:** $ARGUMENTS

---

## Hướng dẫn

Đọc `.claude/docs/ui-system.md` và `.claude/agents/frontend-developer.md` trước.

Xác định loại component trước khi viết:

### A. Modal (CRUD Dialog)

Dùng khi: cần form create/edit/delete một entity

**Checklist:**

- [ ] Dùng `ModalShell` từ `@/components/shared/ModalShell`
- [ ] React Hook Form + Zod schema validation
- [ ] Import types từ `@/modules/{module}/types/{module}` — không dùng `any`
- [ ] Dùng `WithId<{Entity}>` từ `@/lib/firestore-rq` cho item prop
- [ ] `useEffect` để reset form khi `item` prop thay đổi
- [ ] Error messages dùng `getFieldErrorInputClass`, `getInlineErrorTextClass`
- [ ] `submitLoading={isSubmitting}` trên ModalShell
- [ ] `onDelete` prop chỉ khi edit mode (`isEdit && item`)
- [ ] Nhận `onCreate`, `onUpdate`, `onDelete` từ collection hooks qua props (không tự gọi collection trong modal)
- [ ] Gọi `.mutateAsync()` trên mutation props, không gọi Firestore trực tiếp

### B. List/Table View

Dùng khi: hiển thị danh sách items

**Checklist:**

- [ ] Props: `items: {Type}[], onEdit: (item: {Type}) => void`
- [ ] Shadcn `Table` hoặc custom list layout
- [ ] Dùng `Avatar` / `AvatarStack` cho user display
- [ ] `Badge` cho status/priority với màu đúng convention
- [ ] DropdownMenu cho action buttons (Edit, Delete)
- [ ] Named export (không default export)

### C. Display Card/Row

Dùng khi: đơn vị hiển thị trong list

**Checklist:**

- [ ] Props nhỏ gọn, không drilling quá sâu
- [ ] Dùng design tokens — không hardcode màu (bg-white, text-black, ...)
- [ ] Hover state: `hover:bg-white/5` hoặc `hover:bg-accent/5`

### D. Shared Component

Dùng khi: dùng nhiều nơi → đặt vào `src/components/shared/`

**Checklist:**

- [ ] Generic props, không couple với một module cụ thể
- [ ] Có default values hợp lý cho optional props
- [ ] Export từ `src/components/shared/index.ts` nếu có

---

## Template nhanh

Sau khi xác định loại component, tôi sẽ:

1. Đọc file liên quan nếu cần extend existing component
2. Viết component theo đúng template trong `frontend-developer.md`
3. Đảm bảo `'use client'` nếu dùng hooks hoặc event handlers
4. Chạy mental type-check: không có `any`, props đúng types

## Vị trí file

- Module-specific: `src/modules/{module}/components/{ComponentName}.tsx`
- Shared (dùng nhiều module): `src/components/shared/{ComponentName}.tsx`
- UI primitive: `src/components/ui/{component-name}.tsx` (chỉ khi cài thêm Shadcn)

## Import pattern chuẩn

```typescript
// Types — từ module, không từ lib/types trực tiếp
import type { {Entity} } from '@/modules/{module}/types/{module}';
import type { WithId } from '@/lib/firestore-rq';

// Hoặc dùng barrel (cả hai đều OK)
import type { {Entity} } from '@/lib/types';
```
