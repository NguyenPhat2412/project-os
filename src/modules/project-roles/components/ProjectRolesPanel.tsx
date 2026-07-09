'use client';
import { useState, useMemo, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldIcon, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageLoader } from '@/components/ui/page-loader';
import { RoleFilterBar } from './RoleFilterBar';
import { roleDefinitionsCollection } from '@/modules/project-roles/collections/role-definitions';
import { projectRolesCollection } from '@/modules/project-roles/collections/project-roles';
import type { ProjectRole } from '@/modules/project-roles/types/project-role';
import { DEFAULT_ROLE_DEFINITIONS } from '@/modules/project-roles/types/role-definition';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { slugify } from '@/lib/utils';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { value: RoleDefinition['color']; label: string; swatch: string }[] = [
  { value: 'default', label: 'Xanh', swatch: 'var(--primary)' },
  { value: 'secondary', label: 'Phụ', swatch: 'var(--muted)' },
  { value: 'destructive', label: 'Đỏ', swatch: 'oklch(0.577 0.245 27.325)' },
  { value: 'success', label: 'Lục', swatch: 'oklch(0.646 0.222 142.116)' },
  { value: 'warning', label: 'Vàng', swatch: 'oklch(0.769 0.188 70.08)' },
  { value: 'info', label: 'Lam', swatch: 'oklch(0.646 0.222 41.116)' },
  { value: 'purple', label: 'Tím', swatch: 'oklch(0.769 0.188 303.9)' },
  { value: 'orange', label: 'Cam', swatch: 'oklch(0.628 0.182 44.24)' },
  { value: 'rose', label: 'Hồng', swatch: 'oklch(0.64 0.22 16.04)' },
  { value: 'cyan', label: 'Cyan', swatch: 'oklch(0.7 0.15 210)' },
];

// ─── Schema ──────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z.string().trim().min(1, 'Tên role không được để trống'),
  description: z.string().optional(),
  color: z.enum(['default', 'secondary', 'destructive', 'success', 'warning', 'info', 'purple', 'orange', 'rose', 'cyan'] as const),
});
type RoleFormValues = z.infer<typeof roleSchema>;

// ─── Role Definition Modal ────────────────────────────────────────────────────

interface RoleDefModalProps {
  open: boolean;
  editDef: RoleDefinition | null;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function RoleDefModal({ open, editDef, projectId, onClose, onSuccess }: RoleDefModalProps) {
  const isNew = editDef === null;
  const originalId = editDef?.id ?? null;

  const col = roleDefinitionsCollection(projectId);
  const setDef = col.useSet();
  const deleteDef = col.useDelete();

  const saving = setDef.isPending || deleteDef.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    mode: 'onChange',
    defaultValues: {
      name: editDef?.name ?? '',
      description: editDef?.description ?? '',
      color: editDef?.color ?? 'default',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editDef?.name ?? '',
      description: editDef?.description ?? '',
      color: editDef?.color ?? 'default',
    });
  }, [open, editDef, reset]);

  const onSubmit = async (data: RoleFormValues) => {
    const newName = data.name.trim();
    const newId = slugify(newName);
    const payload = { name: newName, description: data.description?.trim() || '', color: data.color };

    if (isNew) {
      await setDef.mutateAsync({ id: newId, data: payload as never });
    } else {
      if (originalId && newId !== originalId) {
        await deleteDef.mutateAsync(originalId);
        await setDef.mutateAsync({ id: newId, data: payload as never });
      } else {
        await setDef.mutateAsync({ id: originalId!, data: payload as never });
      }
    }

    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };
  const selectedColor = watch('color');

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-md'
      header={<ModalHeaderBar onClose={handleClose} closeDisabled={saving} heading={isNew ? 'Tạo Role Mới' : 'Sửa Role'} leading={<span className='text-[18px]'>🛡️</span>} />}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Hủy'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Tạo Role' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Live role preview */}
        <div className='flex items-center gap-3 p-4 bg-secondary border border-border panel-inner'>
          <div className='w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[16px] shrink-0 ring-2 ring-white/10' style={{ background: COLOR_OPTIONS.find((opt) => opt.value === selectedColor)?.swatch || 'var(--primary)' }}>
            {getInitials(watch('name') || 'RD')}
          </div>
          <div className='min-w-0'>
            <div className='text-[13.5px] font-semibold truncate'>{watch('name') || 'Tên Role'}</div>
            <div className='text-[12px] text-muted-foreground truncate mt-0.5'>{watch('description') || '—'}</div>
          </div>
        </div>

        {/* Name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tên Role <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('name')} disabled={saving} placeholder='VD: QA Engineers' className={getFieldErrorInputClass(!!errors.name)} />
          {errors.name && <span className={getInlineErrorTextClass()}>{errors.name.message}</span>}
          {isNew && (
            <p className='text-[11px] text-muted-foreground'>
              ID: <code className='text-primary'>{slugify(watch('name') || '...')}</code>
            </p>
          )}
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mô tả</Label>
          <Input {...register('description')} disabled={saving} placeholder='VD: Nhóm kiểm thử chất lượng' className='text-[13px]' />
        </div>

        {/* Color */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Màu Badge</Label>
          <Controller
            name='color'
            control={control}
            render={({ field }) => (
              <div className='flex items-center gap-2 flex-wrap'>
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type='button'
                    title={opt.label}
                    disabled={saving}
                    onClick={() => field.onChange(opt.value)}
                    className='w-7 h-7 rounded-full transition-all duration-100 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60'
                    style={{
                      background: opt.swatch,
                      outline: field.value === opt.value ? '2.5px solid white' : '2.5px solid transparent',
                      outlineOffset: '1px',
                      boxShadow: field.value === opt.value ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          />
        </div>

        {setDef.isError && <div className='bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-[12px] text-red-500'>{setDef.error?.message || 'Đã xảy ra lỗi khi lưu role'}</div>}
      </div>
    </ModalShell>
  );
}

// ─── Column helper ────────────────────────────────────────────────────────────

const helper = createColumnHelper<RoleDefinition>();

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-3';
const PINNED_LEFT = new Set<string>(['role']);

function getStickyHeaderClass(colId: string, base: string): string {
  if (!PINNED_LEFT.has(colId)) return base;
  return `${base} sticky z-20 bg-card shadow-[1px_0_0_0_var(--border)]`;
}

function getStickyCell(colId: string, base: string): string {
  if (!PINNED_LEFT.has(colId)) return base;
  return `${base} sticky z-10 bg-card group-hover:bg-secondary transition-colors shadow-[1px_0_0_0_var(--border)]`;
}

function getStickyStyle(colId: string): React.CSSProperties | undefined {
  if (!PINNED_LEFT.has(colId)) return undefined;
  return { left: '0px' };
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

type ColorFilter = RoleDefinition['color'] | 'all';
const ALL = 'all' as const;

export function ProjectRolesPanel({ projectId }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filterColor, setFilterColor] = useState<ColorFilter>(ALL);
  const [showModal, setShowModal] = useState(false);
  const [editDef, setEditDef] = useState<RoleDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDefinition | null>(null);

  const col = roleDefinitionsCollection(projectId);
  const { data, isLoading, refetch } = col.useList();
  const setDef = col.useSet();
  const deleteDef = col.useDelete();

  const { data: projectRolesData } = projectRolesCollection(projectId).useList();

  const roles = useMemo(() => (data ?? []) as RoleDefinition[], [data]);

  // Count how many members have each role
  const memberCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pr of (projectRolesData ?? []) as ProjectRole[]) {
      (pr.roles ?? []).forEach((roleId) => {
        counts[roleId] = (counts[roleId] ?? 0) + 1;
      });
    }
    return counts;
  }, [projectRolesData]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch = !globalFilter || role.name.toLowerCase().includes(globalFilter.toLowerCase()) || (role.description ?? '').toLowerCase().includes(globalFilter.toLowerCase());
      const matchesColor = filterColor === ALL || role.color === filterColor;
      return matchesSearch && matchesColor;
    });
  }, [roles, globalFilter, filterColor]);

  const handleCreateDefaults = () => {
    DEFAULT_ROLE_DEFINITIONS.forEach((def) => {
      setDef.mutate({ id: slugify(def.name), data: { ...def } as never });
    });
  };

  const tableCols = useMemo(
    () => [
      helper.accessor('name', {
        id: 'role',
        header: 'Vai trò',
        size: 220,
        cell: (info) => (
          <div className='flex items-center gap-3'>
            <div
              className='w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0 ring-1.5 ring-white/10'
              style={{ background: COLOR_OPTIONS.find((opt) => opt.value === info.row.original.color)?.swatch || 'var(--primary)' }}
            >
              {getInitials(info.getValue())}
            </div>
            <span className='text-[13.5px] font-semibold whitespace-nowrap'>{info.getValue()}</span>
          </div>
        ),
      }),
      helper.accessor('description', {
        header: 'Mô tả',
        enableSorting: false,
        cell: (info) => <span className='text-[12px] text-muted-foreground'>{info.getValue() || <em className='text-muted-foreground/50'>—</em>}</span>,
      }),
      helper.display({
        id: 'member-count',
        header: 'Thành viên',
        size: 120,
        enableSorting: false,
        cell: (info) => {
          const count = memberCountByRole[info.row.original.id] ?? 0;
          return <span className='font-mono-dm text-[12px] text-muted-foreground'>{count > 0 ? count : <em className='not-italic text-muted-foreground/50'>—</em>}</span>;
        },
      }),
      helper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => (
          <div className='flex items-center justify-end'>
            <TableActionsMenu
              actions={[
                editAction(() => {
                  setEditDef(info.row.original);
                  setShowModal(true);
                }),
                deleteAction(() => setDeleteTarget(info.row.original)),
              ]}
            />
          </div>
        ),
      }),
    ],
    [memberCountByRole, setEditDef, setShowModal, setDeleteTarget],
  );

  const table = useReactTable({
    data: filteredRoles,
    columns: tableCols,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className='flex flex-col h-full gap-3'>
      {/* Filter bar (merged with header actions) */}
      <div className='px-5 py-3 bg-card border border-border panel shrink-0'>
        <RoleFilterBar
          search={globalFilter}
          onSearchChange={setGlobalFilter}
          filterColor={filterColor}
          onColorChange={setFilterColor}
          rolesCount={roles.length}
          filteredRolesCount={filteredRoles.length}
          onCreateDefaults={handleCreateDefaults}
          onCreate={() => {
            setEditDef(null);
            setShowModal(true);
          }}
        />
      </div>

      {/* Table */}
      <div className='flex-1 overflow-auto bg-card border border-border panel'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='border-border hover:bg-transparent'>
                {hg.headers.map((h) => {
                  const colId = h.column.id;
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead
                      key={h.id}
                      className={getStickyHeaderClass(colId, TH_CLASS)}
                      style={{ ...getStickyStyle(colId), cursor: h.column.getCanSort() ? 'pointer' : 'default' }}
                      onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                    >
                      {h.column.getCanSort() ? (
                        <div className='flex items-center gap-1 select-none'>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === 'asc' ? <ChevronUp size={11} /> : sorted === 'desc' ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className='opacity-40' />}
                        </div>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={tableCols.length} className='py-12 text-center'>
                  {roles.length === 0 ? (
                    <div className='flex flex-col items-center gap-3'>
                      <ShieldIcon size={28} className='text-muted-foreground/40' />
                      <div>
                        <p className='text-[13px] text-muted-foreground mb-1'>Chưa có role nào.</p>
                        <p className='text-[12px] text-muted-foreground/60'>Nhấn &quot;Tạo mặc định&quot; để tạo nhanh hoặc thêm thủ công.</p>
                      </div>
                    </div>
                  ) : (
                    <p className='text-[12px] text-muted-foreground'>Không tìm thấy kết quả cho &quot;{globalFilter}&quot;</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id;
                    return (
                      <TableCell key={cell.id} className={getStickyCell(colId, 'py-3 px-3')} style={getStickyStyle(colId)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <RoleDefModal open={showModal} editDef={editDef} projectId={projectId} onClose={() => setShowModal(false)} onSuccess={refetch} />

      {deleteTarget && (
        <ConfirmDialog
          danger
          title='Xóa Role'
          message={`Xóa role "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xóa'
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteDef.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }}
        />
      )}
    </div>
  );
}
