---
name: react-table
description: TanStack React Table v8 — ProjectOS patterns for sortable, filterable tables with Shadcn UI. ALWAYS activate when writing, editing, or refactoring any table component.
argument-hint: '[table component or feature]'
---

# TanStack React Table v8 — ProjectOS Skill

> Skill này hướng dẫn sử dụng `@tanstack/react-table` trong ProjectOS.
> Tích hợp với Shadcn UI Table, Tailwind v4, design tokens `--os-*`.

---

## Khi Nào Dùng TanStack Table

| Tình huống                                     | Giải pháp                                          |
| ---------------------------------------------- | -------------------------------------------------- |
| Bảng đơn giản, dữ liệu tĩnh, không sort/filter | Dùng `RiskTable` / `TaskListView` pattern hiện tại |
| Cần sort cột có thể click                      | **TanStack Table**                                 |
| Cần filter theo cột hoặc global search         | **TanStack Table**                                 |
| Cần phân trang client-side có state            | **TanStack Table**                                 |
| Cần ẩn/hiện cột, chọn hàng                     | **TanStack Table**                                 |
| Table với >200 rows client-side                | **TanStack Table** + virtualization                |

---

## Cài Đặt

```bash
npm install @tanstack/react-table
```

**Kiểm tra phiên bản:** v8.x (`package.json` → `@tanstack/react-table`)

---

## Setup Cơ Bản

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type Task = { id: string; title: string; status: string; priority: string };

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => <span className='font-mono-dm text-[12px] text-(--os-accent)'>{info.getValue()}</span>,
  }),
  columnHelper.accessor('title', {
    header: 'Tiêu đề',
    cell: (info) => <span className='text-[12.5px]'>{info.getValue()}</span>,
  }),
];

export function TaskTable({ tasks }: { tasks: Task[] }) {
  // ✅ PHẢI memoize data & columns — tránh re-render vô hạn
  const data = useMemo(() => tasks, [tasks]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className='border-(--os-border) hover:bg-transparent'>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className='font-mono-dm text-[12px] text-(--os-muted) uppercase tracking-[1.2px] py-2 px-3'>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className='border-(--os-border) hover:bg-(--os-surface2) transition-colors cursor-pointer'>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className='py-3 px-3'>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {table.getRowModel().rows.length === 0 && (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={columns.length} className='py-10 text-center text-[13px] text-(--os-muted)'>
              Không có dữ liệu.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

---

## Column Definitions

### Ba Loại Cột

```tsx
const columnHelper = createColumnHelper<MyType>();

// 1. Accessor — truy cập dữ liệu, có thể sort/filter
columnHelper.accessor('fieldName', {
  header: 'Label',
  cell: info => info.getValue(),
})

// Accessor bằng function — transform trước khi render
columnHelper.accessor(row => `${row.firstName} ${row.lastName}`, {
  id: 'fullName',   // ← bắt buộc khi dùng accessorFn
  header: 'Họ tên',
})

// 2. Display — không có dữ liệu, không sort/filter
columnHelper.display({
  id: 'actions',
  cell: info => (
    <Button onClick={() => onEdit(info.row.original)}>Sửa</Button>
  ),
})

// 3. Group — gộp nhiều cột dưới một header chung
{
  header: 'Thông tin',
  columns: [
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phone', { header: 'SĐT' }),
  ],
}
```

### Cột Actions Chuẩn ProjectOS

```tsx
columnHelper.display({
  id: 'actions',
  cell: (info) => (
    <div className='flex items-center justify-end gap-1'>
      <Button
        variant='ghost'
        size='icon-xs'
        onClick={(e) => {
          e.stopPropagation();
          onEdit(info.row.original);
        }}
        className='text-(--os-muted) hover:text-white'
      >
        <PencilIcon size={12} />
      </Button>
      <Button
        variant='ghost'
        size='icon-xs'
        onClick={(e) => {
          e.stopPropagation();
          onDelete(info.row.original);
        }}
        className='text-(--os-muted) hover:text-(--os-red)'
      >
        <Trash2Icon size={12} />
      </Button>
    </div>
  ),
});
```

---

## Sorting

```tsx
import { getSortedRowModel, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const [sorting, setSorting] = useState<SortingState>([]);

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: { sorting },
  onSortingChange: setSorting,
});

// Header có thể click để sort
<TableHead key={header.id} className='font-mono-dm text-[12px] text-(--os-muted) uppercase tracking-[1.2px] py-2 px-3 select-none' onClick={header.column.getToggleSortingHandler()} style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}>
  <div className='flex items-center gap-1'>
    {flexRender(header.column.columnDef.header, header.getContext())}
    {header.column.getCanSort() && <span className='text-(--os-muted)'>{{ asc: <ChevronUp size={11} />, desc: <ChevronDown size={11} /> }[header.column.getIsSorted() as string] ?? <ChevronsUpDown size={11} />}</span>}
  </div>
</TableHead>;

// Tắt sort cho cột cụ thể
columnHelper.accessor('actions', {
  header: '',
  enableSorting: false,
});
```

---

## Filtering

### Global Search

```tsx
import { getFilteredRowModel, type ColumnFiltersState } from '@tanstack/react-table';

const [globalFilter, setGlobalFilter] = useState('');

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter,
  globalFilterFn: 'includesString', // built-in: exact, equalsString, includesString, auto
});

// Input search
<input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder='Tìm kiếm...' className='bg-(--os-surface2) border border-(--os-border) rounded-sm px-3 h-8.5 text-[13px] w-56 focus:outline-none focus:border-(--os-accent)' />;
```

### Column Filter

```tsx
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: { columnFilters },
  onColumnFiltersChange: setColumnFilters,
});

// Set filter từ ngoài
table.getColumn('status')?.setFilterValue('active');

// Tắt filter cho cột cụ thể
columnHelper.accessor('id', {
  header: 'ID',
  enableColumnFilter: false,
});
```

---

## Pagination

```tsx
import { getPaginationRowModel, type PaginationState } from '@tanstack/react-table';

const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 20,
});

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: { pagination },
  onPaginationChange: setPagination,
});

// Controls
<div className='flex items-center justify-between mt-4 text-[12px] text-(--os-muted)'>
  <span>
    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getPrePaginationRowModel().rows.length)} /{' '}
    {table.getPrePaginationRowModel().rows.length}
  </span>
  <div className='flex items-center gap-2'>
    <Button variant='ghost' size='sm' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
      ← Trước
    </Button>
    <span>
      Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
    </span>
    <Button variant='ghost' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
      Sau →
    </Button>
  </div>
</div>;
```

---

## Row Selection

```tsx
import { type RowSelectionState } from '@tanstack/react-table';

const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

const columns = [
  // Cột checkbox — đặt đầu tiên
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type='checkbox'
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected();
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className='rounded accent-(--os-accent)'
      />
    ),
    cell: ({ row }) => <input type='checkbox' checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} onClick={(e) => e.stopPropagation()} className='rounded accent-(--os-accent)' />,
    size: 40,
    enableSorting: false,
  },
  // ...rest of columns
];

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
});

// Lấy các row đã chọn
const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
```

---

## Column Visibility

```tsx
import { type VisibilityState } from '@tanstack/react-table';

const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  description: false, // ẩn mặc định
});

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
});

// Toggle dropdown
{
  table
    .getAllLeafColumns()
    .filter((col) => col.getCanHide())
    .map((col) => (
      <label key={col.id} className='flex items-center gap-2 text-[12px] cursor-pointer'>
        <input type='checkbox' checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} className='accent-(--os-accent)' />
        {String(col.columnDef.header)}
      </label>
    ));
}

// Tắt khả năng ẩn cột
columnHelper.accessor('id', {
  header: 'ID',
  enableHiding: false,
});
```

---

## Full Pattern — Sorting + Filter + Pagination

Đây là pattern đầy đủ dùng trong module mới:

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender, createColumnHelper, type SortingState, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type MyItem = { id: string; name: string; status: string; createdAt: string };

const columnHelper = createColumnHelper<MyItem>();

const TABLE_COLUMNS = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (i) => <span className='font-mono-dm text-[12px] text-(--os-accent)'>{i.getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor('name', {
    header: 'Tên',
    cell: (i) => <span className='text-[12.5px]'>{i.getValue()}</span>,
  }),
  columnHelper.accessor('status', {
    header: 'Trạng thái',
    cell: (i) => <span className='text-[12px] text-(--os-text2)'>{i.getValue()}</span>,
  }),
];

interface Props {
  items: MyItem[];
  onEdit: (item: MyItem) => void;
}

export function MyItemTable({ items, onEdit }: Props) {
  const data = useMemo(() => items, [items]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const table = useReactTable({
    data,
    columns: TABLE_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (val) => {
      setGlobalFilter(val);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    globalFilterFn: 'includesString',
  });

  return (
    <div>
      {/* Search */}
      <div className='mb-3'>
        <input
          value={globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          placeholder='Tìm kiếm...'
          className='bg-(--os-surface2) border border-(--os-border) rounded-sm px-3 h-8.5 text-[13px] w-56 focus:outline-none focus:border-(--os-accent)'
        />
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className='border-(--os-border) hover:bg-transparent'>
              {hg.headers.map((h) => (
                <TableHead key={h.id} className='font-mono-dm text-[12px] text-(--os-muted) uppercase tracking-[1.2px] py-2 px-3 select-none' onClick={h.column.getToggleSortingHandler()} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
                  <div className='flex items-center gap-1'>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanSort() && <span className='text-(--os-muted)'>{{ asc: <ChevronUp size={11} />, desc: <ChevronDown size={11} /> }[h.column.getIsSorted() as string] ?? <ChevronsUpDown size={11} />}</span>}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={TABLE_COLUMNS.length} className='py-10 text-center text-[13px] text-(--os-muted)'>
                Không có dữ liệu{globalFilter ? ` cho "${globalFilter}"` : ''}.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className='border-(--os-border) hover:bg-(--os-surface2) transition-colors cursor-pointer' onClick={() => onEdit(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='py-3 px-3'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className='flex items-center justify-between mt-4 text-[12px] text-(--os-muted)'>
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getPrePaginationRowModel().rows.length)} /{' '}
            {table.getPrePaginationRowModel().rows.length}
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              ← Trước
            </Button>
            <span>
              Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant='ghost' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Sau →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## TypeScript Patterns

```tsx
// Generic reusable table với typed columns
interface SortableTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onRowClick?: (row: TData) => void;
  pageSize?: number;
}

export function SortableTable<TData>({ data, columns, onRowClick, pageSize = 20 }: SortableTableProps<TData>) {
  const memoData = useMemo(() => data, [data]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable<TData>({
    data: memoData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  // ...render
}
```

---

## Data Pipeline — Thứ Tự Xử Lý

```
getCoreRowModel (data gốc)
  → getFilteredRowModel (sau lọc)
  → getGroupedRowModel  (sau nhóm)
  → getSortedRowModel   (sau sort)
  → getPaginationRowModel (sau phân trang)
  → table.getRowModel() ← render từ đây
```

Lấy count trước/sau phân trang:

```tsx
table.getPrePaginationRowModel().rows.length; // tổng sau filter
table.getRowModel().rows.length; // trên trang hiện tại
```

---

## Gotchas & Best Practices

### ❌ Unstable Reference — Gây Infinite Re-render

```tsx
// ❌ SAI — new array mỗi render
const table = useReactTable({ data: items.map(i => ({ ...i })), columns: [...] });

// ✅ ĐÚNG
const data = useMemo(() => items, [items]);
const table = useReactTable({ data, columns: TABLE_COLUMNS });
// TABLE_COLUMNS khai báo ngoài component hoặc useMemo
```

### ❌ Quên getCoreRowModel

```tsx
// ❌ SAI — table không render được gì
const table = useReactTable({ data, columns, getSortedRowModel: getSortedRowModel() });

// ✅ ĐÚNG — getCoreRowModel luôn bắt buộc
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(), // ← LUÔN CÓ
  getSortedRowModel: getSortedRowModel(),
});
```

### Reset Page Khi Search/Filter Thay Đổi

```tsx
onGlobalFilterChange: val => {
  setGlobalFilter(val);
  setPagination(p => ({ ...p, pageIndex: 0 })); // ← reset về trang 1
},
```

### Truy Cập Dữ Liệu Gốc

```tsx
cell: (info) => {
  const original = info.row.original; // ← typed as TData
  return <span>{original.createdAt}</span>;
};
```

### Server-side Sorting/Filtering/Pagination

```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true, // tắt client-side sort
  manualFiltering: true, // tắt client-side filter
  manualPagination: true, // tắt client-side pagination
  pageCount: totalPagesFromServer,
  state: { sorting, columnFilters, pagination },
  // on*Change handlers gọi API để fetch data mới
});
```

---

## Tham Khảo Thêm

- [TanStack Table Docs](https://tanstack.com/table/latest)
- [API Reference](https://tanstack.com/table/latest/docs/reference/useReactTable)
- Shadcn UI Table: `src/components/ui/table.tsx`
- Design tokens: `src/app/globals.css`
