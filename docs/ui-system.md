# UI System — Design System, Components & Tailwind

## Tech Stack UI

``` markdown
Tailwind CSS v4     — utility-first CSS, dùng @import "tailwindcss"
Shadcn UI           — base-nova style, CSS variables
Lucide React        — icon library (^0.577.0)
```

---

## Design Tokens (`src/app/globals.css`)

ProjectOS dùng CSS custom properties với prefix `--os-*`:

### Colors

**Dark theme** (default, `:root` / `.dark`):

```css
--os-bg: #09090e          /* Page background */
--os-surface: #0f0f17     /* Cards, panels */
--os-surface2: #17171f    /* Elevated elements */
--os-surface3: #1e1e2a    /* Code blocks, inputs */
--os-border: #252535      /* Default border */
--os-border2: #2e2e42     /* Hover border */
--os-text: #e2e2ef        /* Primary text */
--os-text2: #a0a0bc       /* Secondary text */
--os-muted: #5e5e78       /* Muted/placeholder */

--os-accent: #6c63ff       /* Primary accent (purple) */
--os-accent-h: #5a52e0    /* Accent hover */
--os-accent-s: rgba(108,99,255,0.12) /* Accent background tint */

--os-red: #ff5f5f         /* Danger, critical */
--os-green: #3dd68c       /* Success, done */
--os-yellow: #f5c518      /* Warning, medium priority */
--os-purple: #b06ef3      /* Tag, label, AI features */
--os-blue: #60a5fa         /* Info, link */

/* Sidebar icon accent colors */
--os-icon-amber: #f59e0b;
--os-icon-emerald: #10b981;
--os-icon-orange: #f97316;
--os-icon-rose: #f43f5e;
--os-icon-cyan: #06b6d4;
--os-icon-violet: #8b5cf6;
```

**Light theme** (`.light`): toàn bộ `--os-*` tokens được override với giá trị phù hợp nền sáng. Xem `src/app/globals.css` để biết chi tiết.

### Layout

```css
--os-sidebar-w: 256px     /* Sidebar width */
--os-topbar-h: 60px       /* Topbar height */
```

### Animations

```css
/* Sẵn có để dùng */
fadeIn        /* opacity 0→1 */
pulse-dot     /* pulse animation cho status indicators */
```

---

## Light / Dark Theme

App hỗ trợ **light + dark mode** có thể chuyển đổi qua nút trên Topbar. Theme được lưu vào Firestore tại `projects/{projectId}/config/theme`.

### Theme Toggle

Nút toggle nằm trên Topbar — nhấn để chuyển giữa dark ↔ light.

### Theme Provider

`ThemeProvider` (src/context/ThemeProvider.tsx) quản lý theme state:

- **LocalStorage**: fast path → không flash khi load
- **Firestore**: source of truth → đồng bộ cross-device
- Áp dụng class `dark`/`light` lên `<html>` ngay khi mount

### Sử dụng CSS Variables cho Colors

**BẮT BUỘC** — tất cả component colors phải dùng `--os-*` CSS variables để tự động đổi theo theme:

```tsx
// ✅ ĐÚNG — dùng CSS variables
<span className="text-(--os-text)">Tiêu đề</span>
<span className="text-(--os-text2)">Mô tả</span>
<span className="text-(--os-muted)">Placeholder</span>
<span className="bg-(--os-red) text-white">Lỗi</span>
<span className="bg-(--os-green-s) text-(--os-green)">Thành công</span>
<span className="border-(--os-border)">Border</span>
<span className="bg-(--os-surface2) hover:bg-(--os-surface3)">Surface</span>

// ❌ SAI — hardcoded Tailwind colors không đổi khi chuyển theme
<span className="text-white">Tiêu đề</span>
<span className="bg-green-500">Thành công</span>
<span className="text-red-400">Lỗi</span>
<span className="hover:text-white">Hover icon</span>
```

### Pattern cho Interactive Elements

| Context | Text color | Hover color | Notes |
| ------- | --------- | ----------- | ----- |
| Muted / icon (topbar, table actions) | `text-(--os-muted)` | `hover:text-(--os-text)` | Đúng |
| Muted / icon → `hover:text-white` | ❌ | | Chỉ dùng khi bg đậm |
| Active / selected (accent bg) | `text-white` | `hover:text-white` | Đúng — trên nền accent |
| Priority badges | `text-white` on dark bg | — | Đúng |
| Status badges | `text-(--os-green)` | — | Đúng |
| Error / alerts | `bg-(--os-red-s) text-(--os-red)` | — | Đúng |

### Allowed Hardcoded Exceptions

Có thể dùng hardcoded colors cho:

- Overlay backdrops (`bg-black/60`) — overlay luôn tối
- Avatar gradients — decorative, không phụ thuộc theme

### Shadcn Components — Đã Fixed cho Light Theme

Tất cả `dark:` modifiers đã được loại bỏ khỏi UI components. Các component sau **đã được override** để dùng `--os-*` variables:

| Component | Files | Override |
| --------- | ----- | -------- |
| `Button` | `ui/Button.tsx` | `outline`, `ghost`, `destructive` variants |
| `Input` | `ui/Input.tsx` | bg, border, focus ring |
| `Textarea` | `ui/Textarea.tsx` | bg, border, focus ring |
| `Badge` | `ui/Badge.tsx` | all variants |
| `Select` | `ui/Select.tsx` | trigger bg, item focus |
| `DropdownMenu` | `ui/DropdownMenu.tsx` | item focus |
| `Tabs` | `ui/Tabs.tsx` | active state, hover |
| `Calendar` | `ui/Calendar.tsx` | selected range |

**KHÔNG thêm lại `dark:` modifiers** khi chỉnh sửa các file này.

**KHÔNG thêm lại `dark:` modifiers** khi chỉnh sửa các file này.

---

## Component Organization

ProjectOS components được tổ chức thành 3 folders rõ ràng:

### 1. **Layout Components** (`src/components/layout/`)

Phục vụ **ProjectOS layout structure** — không tái sử dụng ở các modules khác:

| Component | Mục đích |
| --------- | ------- |
| `AppShell`, `DashboardShell`, `LayoutShell` | Layout containers |
| `Sidebar`, `SidebarLogo`, `SidebarFooter`, `SidebarProjectPill` | Sidebar sections |
| `Topbar`, `SearchBar` | Topbar & header |
| `NavSection`, `NavItem` | Navigation menus |
| `UserMenu`, `SubmenuPopover` | Menu dropdowns |
| `PageHeader` | Trang title + actions |
| `SidebarOverlay` | Mobile backdrop |

### 2. **UI Components** (`src/components/ui/`)

**Shadcn UI base components** + **trung lập, tái sử dụng UI controls**:

| Danh mục | Components |
| -------- | ---------- |
| **Shadcn Base** | button, input, label, textarea, dialog, dropdown-menu, select, badge, card, tabs, table, progress, scroll-area, separator, sheet, tooltip, calendar, popover, collapsible |
| **Reusable UI** | FormField, Avatar, AvatarStack, PageBadge, ProgressBar, DatePicker, TimePicker, Spinner, PageLoader, EmptyState |

Những components này **trung lập về domain ProjectOS** — có thể tái sử dụng ở bất kỳ module nào.

### 3. **Shared Components** (`src/components/shared/`)

**ProjectOS-specific components** — dùng đi dùng lại nhiều nơi, tính đặc thù cao:

| Danh mục | Components |
| -------- | ---------- |
| **Modal/Dialog** | ModalShell, ConfirmDialog |
| **Data Tables** | DataTable, TaskRow, KabanView |
| **Comments/Activity** | CommentBox, CommentInput, ActivityItem |
| **Attachments** | AttachmentList, FileAttachmentsField |
| **Sections & Cards** | DashboardSection, StatCard, MiniStatRow, ScoreDonut, BreakdownBarChart |
| **Other** | EnvRow |

---

## Shadcn UI Components (`src/components/ui/`)

Các components đã được cài đặt và sẵn sàng dùng:

| Component | Import |
| --------- | ------ |
| Button | `@/components/ui/button` |
| Input | `@/components/ui/input` |
| Label | `@/components/ui/label` |
| Textarea | `@/components/ui/textarea` |
| Dialog | `@/components/ui/dialog` |
| DropdownMenu | `@/components/ui/dropdown-menu` |
| Select | `@/components/ui/select` |
| Badge | `@/components/ui/badge` |
| Card | `@/components/ui/card` |
| Tabs | `@/components/ui/tabs` |
| Table | `@/components/ui/table` |
| Progress | `@/components/ui/progress` |
| ScrollArea | `@/components/ui/scroll-area` |
| Separator | `@/components/ui/separator` |
| Sheet | `@/components/ui/sheet` |
| Tooltip | `@/components/ui/tooltip` |

---

## Shared Components (`src/components/shared/`)

### ModalShell — Modal chuẩn

**Dùng cho mọi modal trong app.** Không tạo dialog custom từ Shadcn Dialog trực tiếp.

```typescript
interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';  // default: 'md'
  onSubmit?: () => void;
  onDelete?: () => void;
  submitLabel?: React.ReactNode;      // default: 'Lưu'
  deleteLabel?: React.ReactNode;      // default: 'Xoá'
  submitLoading?: boolean;
  submitDanger?: boolean;             // Button submit màu đỏ
  children: React.ReactNode;
}
```

```tsx
// Usage
<ModalShell
  open={open}
  onClose={() => setOpen(false)}
  title="Thêm Task mới"
  size="lg"
  onSubmit={handleSubmit}
  onDelete={handleDelete}
  submitLabel="Tạo Task"
  submitLoading={loading}
>
  {/* Form fields */}
</ModalShell>
```

### Avatar & AvatarStack

```tsx
// Single avatar with initials
<Avatar initials="NVA" color="var(--os-accent)" size="md" />

// Avatar with gradient
<Avatar initials="JD" gradient="linear-gradient(135deg, #6c63ff, #a855f7)" size="lg" />

// Stack (show first N, +rest indicator)
<AvatarStack
  avatars={[
    { initials: "JD", color: "var(--os-accent)" },
    { initials: "MN", color: "var(--os-green)" }
  ]}
  max={3}
  size="sm"
/>
```

### StatCard & MiniStatRow

```tsx
// Dashboard stat card
<StatCard label="Total Tasks" value={42} icon={<CheckCircle />} trend="+5%" />

// Compact row stat
<MiniStatRow label="Completed" value={18} color="green" />
```

### PageHeader

```tsx
<PageHeader
  title="Tasks"
  badge={<PageBadge count={tasks.length} />}
  actions={<Button onClick={() => setOpen(true)}>+ New Task</Button>}
/>
```

### DataTable

```tsx
// Reusable table với sorting
<DataTable columns={columns} data={tasks} />
```

### ConfirmDialog

```tsx
// Xác nhận trước khi xoá
<ConfirmDialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Xoá task?"
  description="Hành động này không thể hoàn tác."
/>
```

### EmptyState

```tsx
import { EmptyState } from '@/components/ui/empty-state';

// Simple empty state
<EmptyState text="Chưa có tasks" />

// With custom icon (emoji)
<EmptyState icon="🚀" text="Bắt đầu dự án mới" />
```

### Spinner & PageLoader

```tsx
import { Spinner } from '@/components/ui/spinner';
import { PageLoader } from '@/components/ui/page-loader';

<Spinner />              // Inline spinner (md)
<Spinner size="sm" />    // Small spinner
<Spinner size="lg" />    // Large spinner

// Chuẩn cho loading pages
<PageLoader />           // Centered large spinner + padding
<PageLoader className="py-40" />  // Custom padding
```

---

## Layout Components (`src/components/layout/`)

### AppShell

Main layout wrapper. Đặt trong `(dashboard)/layout.tsx`:

``` markdown
AppShell
├── Sidebar (256px, fixed left)
│   ├── SidebarLogo
│   ├── SidebarProjectPill (project name/status)
│   ├── NavSection + NavItem (menu items)
│   └── SidebarFooter (user avatar + logout)
├── SidebarOverlay (mobile backdrop)
└── Main content area
    └── Topbar (60px, fixed top)
        └── {children} (page content)
```

### Navigation Structure

Sidebar chia thành 4 sections:

``` markdown
NAV_MAIN:     Dashboard, Timeline, Backlog, Sprints, Tasks, Bugs
NAV_MANAGE:   Team, Budget, Risks, Docs
NAV_COMM:     Meetings, Reports, Activity
NAV_ADMIN:    Projects (admin), Seed Data
```

### Nav Icon Color Convention

Mỗi nav item dùng `--os-*` CSS variable để tự động đổi theo theme:

| Route | CSS Variable |
| ----- | ----------- |
| `/dashboard` | `--os-blue` |
| `/projects` | `--os-purple` |
| `/timeline` | `--os-icon-violet` |
| `/backlog` | `--os-icon-amber` |
| `/sprint` | `--os-icon-emerald` |
| `/tasks` | `--os-blue` |
| `/bugs` | `--os-red` |
| `/team` | `--os-icon-cyan` |
| `/budget` | `--os-green` |
| `/risk` | `--os-icon-orange` |
| `/docs` | `--os-yellow` |
| `/wiki` | `--os-icon-amber` |
| `/meetings` | `--os-purple` |
| `/activity` | `--os-icon-rose` |
| `/admin/*` | `--os-muted` |

```tsx
// Cú pháp chuẩn cho nav icon
<ZapIcon size={15} className='text-(--os-icon-emerald)' />
```

---

## Icons

Dùng **Lucide React** cho tất cả icons:

```tsx
import { Plus, Trash2, Edit, ChevronDown, Search } from 'lucide-react';

// Size chuẩn
<Plus size={15} />   // nav sidebar item (SZ = 15)
<Plus size={16} />   // inline trong button
<Plus size={20} />   // standalone action icon
<Plus size={24} />   // header/hero icon
```

---

## Utility Function

```typescript
import { cn } from '@/lib/utils';

// Merge Tailwind classes (clsx + tailwind-merge)
<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'danger' && 'text-red-500'
)} />
```

---

## Tailwind v4 Notes

ProjectOS dùng Tailwind CSS v4 — một số khác biệt so với v3:

```css
/* globals.css — không dùng @tailwind directives */
@import "tailwindcss";

/* Theme extension */
@theme {
  --color-os-accent: #6c63ff;
}
```

```tsx
// Arbitrary values vẫn hoạt động bình thường
<div className="w-[256px] h-15" />

// CSS variables được expose trực tiếp
<div style={{ color: 'var(--os-accent)' }} />
```

---

## Priority & Status Colors

Chuẩn màu cho priority và status trong toàn app. Dùng `--os-*` CSS variables để tự động đổi theo theme:

### Priority

```typescript
const PRIORITY_COLORS = {
  critical: 'text-(--os-red) bg-(--os-red-s)',
  high:     'text-(--os-yellow) bg-(--os-yellow-s)',
  medium:   'text-(--os-yellow) bg-(--os-yellow-s)',
  low:      'text-(--os-muted) bg-(--os-surface2)',
};
```

### Task Status

```typescript
const STATUS_COLORS = {
  backlog:     'text-(--os-muted)',
  todo:        'text-(--os-blue)',
  in_progress: 'text-(--os-yellow)',
  in_review:   'text-(--os-purple)',
  done:        'text-(--os-green)',
};
```

### Risk Level

```typescript
const RISK_COLORS = {
  low:      'bg-(--os-green-s) text-(--os-green)',
  medium:   'bg-(--os-yellow-s) text-(--os-yellow)',
  high:     'bg-(--os-yellow-s) text-(--os-yellow)',
  critical: 'bg-(--os-red-s) text-(--os-red)',
};
```

---

## Form Validation Styling

ProjectOS có helper functions cho Zod + React Hook Form error styling:

```typescript
import {
  getFieldErrorLabelClass,
  getFieldErrorInputClass,
  getInlineErrorTextClass,
} from '@/lib/form-validation';

// Usage trong form field
<label className={getFieldErrorLabelClass(!!errors.title)}>
  Title
</label>
<Input
  {...register('title')}
  className={getFieldErrorInputClass(!!errors.title)}
/>
{errors.title && (
  <p className={getInlineErrorTextClass()}>
    {errors.title.message}
  </p>
)}
```

---

## Responsive Design

App được thiết kế mobile-first nhưng primary target là desktop:

```tsx
// Sidebar collapse trên mobile
className="hidden sm:block"        // Ẩn trên mobile
className="max-sm:hidden"          // Ẩn trên mobile (v4 syntax)

// Stack vertically trên mobile
className="flex flex-col sm:flex-row"

// Full width trên mobile
className="w-full sm:w-auto"
```

Sidebar dùng overlay + animation trên màn hình nhỏ, quản lý bởi `useSidebar()` hook.

---

## Wiki/Markdown Content

Docs module render markdown với class `.wiki-content`:

```tsx
<div
  className="wiki-content"
  dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
/>
```

Styles định nghĩa trong `globals.css`, bao gồm: h1-h4, p, ul, ol, blockquote, code, pre, table.
