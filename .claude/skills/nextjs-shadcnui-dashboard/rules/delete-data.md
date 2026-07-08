---
title: Delete Data with Confirmation
impact: HIGH
impactDescription: prevents accidental data loss
tags: data-management, user-interaction, confirmation
---

## Delete Data with Confirmation

Every delete action in tables must show a confirmation dialog before executing. This prevents accidental data loss.

### Components Used

- **`ConfirmDialog`** from `components/ui/shared/confirm-dialog.tsx` — wraps `ModalShell` (Radix Dialog), size `xs` (max-w-[360px]).
- **`deleteAction`** from `components/ui/shared/table-actions-menu.tsx` — creates the menu item with label `"Xóa"`, `Trash2Icon`, shortcut `"⌘⌫"`, and `variant: 'destructive'`.

### State Pattern

On the page (or parent component), hold the delete target in a nullable state variable:

```tsx
const [delTarget, setDelTarget] = useState<TTarget | null>(null);
```

### Table Wiring

Pass `onDelete` callback to the table. In the table's action column builder:

```tsx
actions.push(deleteAction(() => onDelete(info.row.original), disabled));
```

### Dialog Render Pattern

Render `ConfirmDialog` inline in the JSX (not in a portal or separate component). Use conditional rendering — no `open` prop needed:

```tsx
{delTarget && (
  <ConfirmDialog
    danger
    title="Xoá {entity}"
    message={`Bạn có chắc muốn xoá "${delTarget.name}"? Hành động này không thể hoàn tác.`}
    confirmLabel="Xoá"
    onCancel={() => setDelTarget(null)}
    onConfirm={handleDelete}
  />
)}
```

### Handler Pattern

```tsx
const deleteMutation = collection.useDelete();

const handleDelete = async () => {
  if (!delTarget) return;
  await deleteMutation.mutateAsync(delTarget.id);
  setDelTarget(null);
};
```

`ConfirmDialog` handles its own loading state internally. `onConfirm` returns `Promise<void>` or is `async`.

### Dialog Content Rules

| Field | Value |
| --- | --- |
| `danger` | Always `true` |
| `title` | `"Xoá {entity}"` (e.g. "Xoá task", "Xoá cột Kanban") |
| `message` | Must include the item's name in quotes: `"Tên"` |
| `confirmLabel` | `"Xoá"` or `"Xoá {entity}"` |
| `onCancel` | Always `() => setDelTarget(null)` |

For entity-specific consequences, append to the message:

- Task: `"Bạn có chắc muốn xoá task \"{title}\"? Hành động này không thể hoàn tác."`
- Column (Kanban): `"Xoá cột \"{title}\"? Các task trong cột này sẽ được chuyển sang cột đầu tiên."`
- Member: `"Bạn có chắc muốn xoá \"{name}\" khỏi tổ chức? Hành động này không thể hoàn tác."`

### Full Flow

```text
Table row → deleteAction() → TableActionsMenu item (destructive)
  → onDelete callback → setDelTarget(rowData) → ConfirmDialog rendered
    → user confirms → handleDelete() → collection.useDelete().mutateAsync(id)
    → onSuccess: setDelTarget(null)
```

### What NOT to Do

- Do **not** add a second confirmation step (e.g. typing the name). One dialog is sufficient.
- Do **not** skip the `danger` prop — it applies red styling to the confirm button.
- Do **not** call the delete mutation directly from the table action. Always go through the state + dialog flow.
- Do **not** skip validation of `delTarget` before calling the mutation.
