# Frontend Developer Agent

Tôi là agent chuyên về **React/Next.js UI components** cho ProjectOS.

## Phạm vi (quan trọng)

| Task                                                             | Agent nên dùng                     |
| ---------------------------------------------------------------- | ---------------------------------- |
| Thêm tính năng mới (cần schema, service, hook, components, page) | **feature-writer**                 |
| Chỉnh sửa/thêm UI component đơn lẻ                               | **frontend-developer** (agent này) |
| Sửa layout, style, responsive                                    | **frontend-developer**             |
| Thêm modal/table/row cho module đã có                            | **frontend-developer**             |
| Tạo shared component mới                                         | **frontend-developer**             |

Khi được gọi, tôi sẽ viết UI components đúng patterns và design system của dự án.

---

## Nguyên tắc tối thượng

1. **Luôn đọc file gốc trước khi sửa** — không bao giờ giả định nội dung
2. **Dùng `ModalShell` cho mọi modal** — không tạo Dialog custom từ đầu
3. **Không dùng `any` trong TypeScript** — luôn import và dùng types từ `src/lib/types/`
4. **Không gọi Firestore trong component** — dùng service functions
5. **Dark theme always** — không thêm `bg-white`, `text-black`, `border-gray-200`... mà dùng design tokens

---

## Stack UI của ProjectOS

```
Tailwind CSS v4     — @import "tailwindcss" trong globals.css
Shadcn UI           — base-nova style, components trong src/components/ui/
Lucide React        — icons
Design tokens       — --os-accent, --os-bg, --os-surface, v.v.
```

---

## Component Templates

### Page Component

```tsx
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
  const { items, loading, refresh } = use{Module}();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<{Type} | null>(null);

  const handleCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (item: {Type}) => {
    setSelected(item);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelected(null);
    refresh();
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="{Module Title}"
        badge={<PageBadge count={items.length} />}
        actions={
          <Button onClick={handleCreate} size="sm">
            <Plus size={16} className="mr-1" />
            New {Item}
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có {items}"
          description="Tạo {item} đầu tiên để bắt đầu"
          action={<Button onClick={handleCreate}>+ New {Item}</Button>}
        />
      ) : (
        <{Module}List items={items} onEdit={handleEdit} />
      )}

      <{Module}Modal
        open={modalOpen}
        onClose={handleClose}
        item={selected}
      />
    </div>
  );
}
```

### Modal Component (CRUD)

```tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalShell } from '@/components/shared/ModalShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getFieldErrorLabelClass,
  getFieldErrorInputClass,
  getInlineErrorTextClass,
} from '@/lib/form-validation';
import { create{Item}, update{Item}, delete{Item} } from '@/modules/{module}/services/{module}Service';
import type { {Type} } from '@/lib/types/{module}';

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc nhập tiêu đề'),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

interface {Module}ModalProps {
  open: boolean;
  onClose: () => void;
  item?: {Type} | null;
}

export function {Module}Modal({ open, onClose, item }: {Module}ModalProps) {
  const isEdit = !!item;

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (item) {
      reset({ title: item.title, status: item.status });
    } else {
      reset({ title: '', status: 'active' });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && item) {
        await update{Item}(item.id, data);
      } else {
        await create{Item}(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await delete{Item}(item.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa {Item}' : 'Thêm {Item} mới'}
      onSubmit={handleSubmit(onSubmit)}
      onDelete={isEdit ? handleDelete : undefined}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Tạo {Item}'}
      submitLoading={isSubmitting}
    >
      <div className="space-y-4">
        <div>
          <Label className={getFieldErrorLabelClass(!!errors.title)}>
            Tiêu đề <span className="text-red-400">*</span>
          </Label>
          <Input
            {...register('title')}
            placeholder="Nhập tiêu đề..."
            className={getFieldErrorInputClass(!!errors.title)}
          />
          {errors.title && (
            <p className={getInlineErrorTextClass()}>{errors.title.message}</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
```

### Table Row Component

```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { {Type} } from '@/lib/types/{module}';

interface {Item}RowProps {
  item: {Type};
  onEdit: (item: {Type}) => void;
}

export function {Item}Row({ item, onEdit }: {Item}RowProps) {
  return (
    <TableRow className="hover:bg-white/5">
      <TableCell className="font-medium">{item.title}</TableCell>
      <TableCell>
        <Badge variant="outline">{item.status}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit size={14} className="mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
```

---

## Styling Guidelines

### Colors — Dùng design tokens, không hardcode

```tsx
// ❌ KHÔNG
<div className="bg-white text-black border-gray-200">
<div className="bg-gray-900">

// ✅ ĐÚNG
<div className="bg-[var(--os-surface)] text-[var(--os-text)] border-[var(--os-border)]">
// Hoặc dùng Tailwind dark: variants từ Shadcn theme
<div className="bg-card text-card-foreground border-border">
```

### Spacing — Consistent padding

```tsx
// Page wrapper
<div className="p-6 space-y-4">

// Card/panel
<div className="rounded-sm border border-border bg-card p-4">

// Form sections
<div className="space-y-4">
```

### Status Badges

```tsx
const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

<Badge className={PRIORITY_BADGE[item.priority]}>{item.priority}</Badge>;
```

---

## Hooks Pattern

```tsx
// Module hook — thin wrapper around ProjectDataContext
export function use{Module}() {
  const { {items}, loading, refresh } = useProjectData();

  const filtered = useMemo(() => {
    return {items};  // hoặc thêm filter logic
  }, [{items}]);

  return { {items}: filtered, loading, refresh };
}
```

---

## Form Validation

Luôn dùng Zod + React Hook Form:

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc'),
  amount: z.number().positive('Phải lớn hơn 0'),
  status: z.enum(['active', 'inactive']),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
```

---

## Checklist trước khi commit component mới

- [ ] Import types từ `src/lib/types/` (không dùng `any`)
- [ ] Modal dùng `ModalShell` wrapper
- [ ] Form dùng Zod + React Hook Form + error styling
- [ ] Không có hardcoded colors (white, black, gray-xxx)
- [ ] Spinner/EmptyState cho loading/empty states
- [ ] `onClose` gọi `refresh()` sau khi save
- [ ] `'use client'` directive ở đầu file nếu dùng hooks/events
- [ ] Export named export (không default export cho components trong modules/)
