'use client';
import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchIcon, UserPlusIcon, PencilIcon } from 'lucide-react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { createSubcollection } from '@/lib/firestore-rq';
import { firestoreKeys } from '@/lib/firestore-rq/core/queryKeys';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { membersCollection } from '@/modules/team/collections/members';
import { projectRolesCollection } from '@/modules/project-roles/collections/project-roles';
import { roleDefinitionsCollection } from '@/modules/project-roles/collections/role-definitions';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { TeamMemberViewSheet } from '@/modules/team/components/TeamMemberViewSheet';
import { PageLoader } from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableActionsMenu } from '@/components/ui/shared/table-actions-menu';
import type { TableAction } from '@/components/ui/shared/table-actions-menu';
import type { Member, TeamMember, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { ProjectRole } from '@/modules/project-roles/types/project-role';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';
import type { SortingState } from '@tanstack/react-table';

// ─── Firestore collection paths ────────────────────────────────────────────────

const TEAM_MEMBERS_PATH = (pid: string) => `projects/${pid}/members`;
const PROJECT_ROLES_PATH = (pid: string) => `projects/${pid}/project_roles`;

// ─── Hook: project team members ──────────────────────────────────────────────

function useProjectTeamCollection(projectId: string, globalMembers: Member[]) {
  const teamCol = useMemo(
    () =>
      createSubcollection<ProjectTeamMember>({
        path: (pid: string) => `projects/${pid}/members`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: (raw: any): ProjectTeamMember & { id: string } => ({ ...raw, id: raw.memberId }),
      })(projectId),
    [projectId],
  );

  const { data: projectEntries, isLoading } = teamCol.useList() as {
    data: (ProjectTeamMember & { id: string })[];
    isLoading: boolean;
  };

  // Build lookup map from root member id → member data
  const memberMap = useMemo(() => new Map(globalMembers.map((m) => [m.id, m])), [globalMembers]);

  // Join: subcollection docs + root member data
  const members = useMemo((): TeamMemberWithRole[] => {
    return (projectEntries ?? [])
      .map((entry) => {
        const root = memberMap.get(entry.memberId);
        if (!root) return null;
        return {
          id: root.id,
          name: root.name,
          displayName: root.displayName,
          email: root.email,
          initials: root.initials,
          gradient: root.gradient,
          roles: entry.roles,
          taskCount: 0,
          workload: 0,
          status: 'Active' as const,
        } as TeamMemberWithRole;
      })
      .filter((m): m is TeamMemberWithRole => m !== null);
  }, [projectEntries, memberMap]);

  return { members, isLoading, collection: teamCol };
}

// ─── Add Member Modal ────────────────────────────────────────────────────────

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  globalMembers: TeamMember[];
  projectMemberIds: Set<string>;
  roleDefs: RoleDefinition[];
  onAdd: (memberId: string, rbacRoles: string[]) => void;
  adding: boolean;
}

function AddMemberModal({ open, onClose, globalMembers, projectMemberIds, roleDefs, onAdd, adding }: AddMemberModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRbacRoles, setSelectedRbacRoles] = useState<string[]>([]);

  // Reset khi modal mở lại — dùng key={open} ở ngoài nên component tự remount + reset,
  // không cần useEffect cleanup

  const available = useMemo(() => {
    return globalMembers.filter((m) => {
      if (projectMemberIds.has(m.id)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [globalMembers, projectMemberIds, search]);

  const selectedMember = useMemo(() => globalMembers.find((m) => m.id === selectedId) ?? null, [globalMembers, selectedId]);

  const toggleRole = (roleName: string) => {
    setSelectedRbacRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]));
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onAdd(selectedId, selectedRbacRoles);
  };

  const handleClose = () => {
    if (adding) return;
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-md'
      header={<ModalHeaderBar onClose={handleClose} closeDisabled={adding} heading='Thêm thành viên vào dự án' leading={<span className='text-[18px]'>👤</span>} />}
      submitLabel='Thêm vào dự án'
      submitDisabled={!selectedId || adding}
      submitLoading={adding}
      submitLoadingLabel='Đang thêm...'
      onSubmit={handleConfirm}
      cancelLabel='Hủy'
      onCancel={handleClose}
      cancelDisabled={adding}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Search */}
        <div className='relative'>
          <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Tìm theo tên, email...' className='pl-8 h-8 text-[12px]' autoFocus />
        </div>

        {/* Member list */}
        {available.length === 0 ? (
          <div className='text-center py-8 text-[13px] text-muted-foreground'>
            {globalMembers.length === 0 ? (
              <>
                Chưa có thành viên. Thêm tại{' '}
                <a href='/admin/members' className='text-primary hover:underline'>
                  Admin &gt; Members
                </a>
                .
              </>
            ) : (
              'Tất cả thành viên đã được thêm vào dự án.'
            )}
          </div>
        ) : (
          <div className='flex flex-col gap-1 max-h-48 overflow-y-auto'>
            {available.map((m) => (
              <div key={m.id} onClick={() => setSelectedId(m.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ${selectedId === m.id ? 'bg-primary/15 border border-primary' : 'hover:bg-secondary'}`}>
                <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-semibold truncate'>{m.name}</div>
                  <div className='text-[12px] text-muted-foreground truncate'>{m.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected member + RBAC roles */}
        {selectedMember && (
          <div className='flex flex-col gap-2 p-3 bg-secondary border border-border panel-inner'>
            <div className='flex items-center gap-3'>
              <Avatar initials={selectedMember.initials} gradient={selectedMember.gradient} size='sm' />
              <div>
                <div className='text-[13px] font-semibold'>{selectedMember.name}</div>
                <div className='text-[12px] text-muted-foreground'>{selectedMember.email}</div>
              </div>
            </div>
            <div>
              <Label className='font-mono-dm text-[11px] text-muted-foreground uppercase tracking-[1.2px] block mb-2'>RBAC Roles</Label>
              {roleDefs.length === 0 ? (
                <p className='text-[11px] text-muted-foreground/60 italic'>Chưa có role. Tạo role tại tab Vai trò trước.</p>
              ) : (
                <div className='flex flex-col gap-1.5'>
                  {roleDefs.map((def) => (
                    <label key={def.name} className='flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-card cursor-pointer transition-colors'>
                      <input type='checkbox' checked={selectedRbacRoles.includes(def.name)} onChange={() => toggleRole(def.name)} className='accent-primary' />
                      <Badge variant={def.color} className='text-[10px]'>
                        {def.name}
                      </Badge>
                      {def.description && <span className='text-[11px] text-muted-foreground'>{def.description}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── RBAC Role Modal ─────────────────────────────────────────────────────────

interface RbacRoleModalProps {
  open: boolean;
  roleDefs: RoleDefinition[];
  currentRoles: string[];
  onClose: () => void;
  onSave: (roles: string[]) => void;
  saving?: boolean;
}

function RbacRoleModal({ open, roleDefs, currentRoles, onClose, onSave, saving }: RbacRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);

  // Sync selectedRoles when modal opens so user always sees the server state.
  useEffect(() => {
    if (open) setSelectedRoles(currentRoles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleSubmit = () => {
    onSave(selectedRoles);
  };

  const handleClose = () => {
    if (saving) return;
    setSelectedRoles(currentRoles);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-md'
      header={<ModalHeaderBar onClose={handleClose} closeDisabled={saving} heading='Gán Vai trò' leading={<span className='text-[18px]'>🔑</span>} />}
      submitLabel='Lưu thay đổi'
      submitDisabled={saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      onSubmit={handleSubmit}
      cancelLabel='Hủy'
      onCancel={handleClose}
      cancelDisabled={saving}
    >
      <div className='px-6 py-5 space-y-4'>
        {roleDefs.length === 0 ? (
          <p className='text-[12px] text-muted-foreground/60 italic text-center py-4'>Chưa có role. Tạo role tại tab Vai trò trước.</p>
        ) : (
          <div className='flex flex-col gap-1.5'>
            {roleDefs.map((def) => (
              <label key={def.name} className='flex items-center gap-2.5 px-3 py-2.5 rounded-sm hover:bg-secondary cursor-pointer transition-colors border border-transparent hover:border-border'>
                <input type='checkbox' checked={selectedRoles.includes(def.name)} onChange={() => toggleRole(def.name)} className='accent-primary' />
                <Badge variant={def.color} className='text-[11px]'>
                  {def.name}
                </Badge>
                {def.description && <span className='text-[12px] text-muted-foreground'>{def.description}</span>}
              </label>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Table column helper ─────────────────────────────────────────────────────

const columnHelper = createColumnHelper<TeamMemberWithRole>();

// ─── Component ─────────────────────────────────────────────────────────────

export function ProjectMembersTable({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  // Global members (root members collection)
  const { data: globalData, isLoading: globalLoading } = membersCollection.useList();
  const globalMembers = (globalData ?? []) as Member[];

  // Project-level team members (joined with root members)
  const { members, isLoading } = useProjectTeamCollection(projectId, globalMembers);

  // Role definitions (for badges)
  const defCol = roleDefinitionsCollection(projectId);
  const { data: defsData } = defCol.useList();
  const roleDefs = (defsData ?? []) as RoleDefinition[];

  // RBAC roles per member
  const rbacCol = projectRolesCollection(projectId);
  const { data: rbacData } = rbacCol.useList();
  const rbacRoles = useMemo(() => (rbacData ?? []) as ProjectRole[], [rbacData]);

  // Map: memberId → roles[]
  const rbacMap = useMemo((): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    for (const r of rbacRoles) {
      map.set(r.uid || r.memberId, r.roles ?? []);
    }
    return map;
  }, [rbacRoles]);

  // Firestore mutations
  const teamCol = useMemo(
    () =>
      createSubcollection<ProjectTeamMember>({
        path: (pid: string) => `projects/${pid}/members`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: (raw: any): ProjectTeamMember & { id: string } => {
          const ref: unknown = raw.memberRef;
          const memberId: string =
            typeof ref === 'object' && ref !== null && 'id' in (ref as object)
              ? ((ref as { id: string }).id || '')
              : typeof ref === 'string'
                ? (ref as string).split('/').pop() ?? ''
                : '';
          return { ...raw, id: memberId };
        },
      })(projectId),
    [projectId],
  );
  const setMember = teamCol.useSet();
  const deleteMember = teamCol.useDelete();
  const setRbacRole = rbacCol.useSet();
  const deleteRbacRole = rbacCol.useDelete();

  const mutating = setMember.isPending || deleteMember.isPending || setRbacRole.isPending || deleteRbacRole.isPending;

  // ─── Cache invalidation ───────────────────────────────────────────────────
  const invalidateTeamData = () => {
    queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(TEAM_MEMBERS_PATH(projectId)) });
    queryClient.invalidateQueries({ queryKey: firestoreKeys.lists(PROJECT_ROLES_PATH(projectId)) });
  };

  // ─── Table state ────────────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // ─── Modal state ────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<TeamMemberWithRole | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberWithRole | null>(null);
  const [rbacTarget, setRbacTarget] = useState<{ member: TeamMemberWithRole; currentRoles: string[] } | null>(null);

  // ─── RBAC roles cho viewTarget (đọc fresh từ map) ──────────────────────────
  const viewTargetRoles = viewTarget ? (rbacMap.get(viewTarget.id) ?? []) : [];

  // ─── Handler: xóa một role khỏi member ────────────────────────────────────
  // Capture id/email/name TRƯỚC async call để tránh stale closure
  const handleRemoveRole = async (roleName: string) => {
    if (!viewTarget) return;
    const memberId = viewTarget.id;
    const email = viewTarget.email;
    const name = viewTarget.name;
    const current = rbacMap.get(memberId) ?? [];
    const updated = current.filter((r) => r !== roleName);
    try {
      if (updated.length === 0) {
        await deleteRbacRole.mutateAsync(memberId);
      } else {
        await setRbacRole.mutateAsync({
          id: memberId,
          data: { uid: memberId, memberId, email, displayName: name, roles: updated, projectId },
        });
      }
      invalidateTeamData();
    } catch {
      // Error state handled by mutation
    }
  };

  // ─── Handler: đóng Sheet → mở RbacModal cho member ────────────────────────
  const handleAddRoleFromSheet = () => {
    if (!viewTarget) return;
    const current = rbacMap.get(viewTarget.id) ?? [];
    setViewTarget(null); // Đóng Sheet
    setRbacTarget({ member: viewTarget, currentRoles: current }); // Mở Modal
  };

  // ─── Column definitions ─────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Thành viên',
        cell: (info) => {
          const m = info.row.original;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewTarget(m);
              }}
              className='flex items-center gap-2 text-left w-full hover:opacity-80 transition-opacity'
            >
              <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
              <div>
                <p className='text-[12px] font-medium text-foreground'>{m.name}</p>
                <p className='text-[10px] text-muted-foreground'>{m.email}</p>
              </div>
            </button>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('id', {
        header: 'Vai trò',
        id: 'rbac',
        cell: (info) => {
          const m = info.row.original;
          // Luôn đọc từ rbacMap — sau add/update/remove sẽ được invalidate
          const roles = rbacMap.get(m.id) ?? [];
          return (
            <div className='flex flex-wrap gap-1 items-center'>
              {roles.length === 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRbacTarget({ member: m, currentRoles: [] });
                  }}
                  className='text-[10px] text-muted-foreground hover:text-primary transition-colors underline cursor-pointer'
                >
                  + Gán vai trò
                </button>
              ) : (
                <>
                  {roles.map((r) => (
                    <Badge key={r} variant={r === 'Project Admin' ? 'destructive' : 'default'} className='text-[10px]'>
                      {r}
                    </Badge>
                  ))}
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={(e) => {
                      e.stopPropagation();
                      setRbacTarget({ member: m, currentRoles: roles });
                    }}
                    className='text-muted-foreground hover:text-primary'
                    title='Sửa vai trò'
                  >
                    <PencilIcon size={11} />
                  </Button>
                </>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => {
          const actions: TableAction[] = [
            {
              label: 'Xóa khỏi dự án',
              icon: (
                <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' /><polyline points='16 17 21 12 16 7' /><line x1='21' y1='12' x2='9' y2='12' />
                </svg>
              ),
              variant: 'destructive',
              onClick: () => setRemoveTarget(info.row.original),
            },
          ];
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rbacMap, defsData],
  );

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  });

  const projectMemberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  // ─── CRUD handlers ──────────────────────────────────────────────────────────

  /**
   * Thêm member vào dự án:
   * 1. Tạo / cập nhật document trong project_members
   * 2. Tạo document trong project_roles (LUÔN ghi, kể cả roles rỗng → đảm bảo có doc để query)
   */
  const handleAdd = async (memberId: string, rbacRolesToGrant: string[]) => {
    const root = globalMembers.find((m) => m.id === memberId);
    if (!root) return;

    try {
      // Ghi team_members với denormalized fields
      await setMember.mutateAsync({
        id: memberId,
        data: { memberId, roles: [root.roles[0] ?? 'Viewer'], notes: '' },
      });

      // Luôn ghi project_roles — kể cả khi không có role nào
      // Nếu không có doc → rbacMap.get(memberId) = undefined → modal mở với []
      // Và khi user bấm save với roles rỗng, ta sẽ xóa doc
      if (rbacRolesToGrant.length > 0) {
        await setRbacRole.mutateAsync({
          id: memberId,
          data: {
            uid: memberId,
            memberId,
            email: root.email,
            displayName: root.name,
            roles: rbacRolesToGrant,
            projectId,
          },
        });
      } else {
        // Roles rỗng → tạo doc với roles = []
        await setRbacRole.mutateAsync({
          id: memberId,
          data: {
            uid: memberId,
            memberId,
            email: root.email,
            displayName: root.name,
            roles: [],
            projectId,
          },
        });
      }

      invalidateTeamData();
    } catch {
      // Error state handled by mutation
    }
  };

  /**
   * Cập nhật roles cho member:
   * - Nếu roles rỗng → xóa document project_roles (member vẫn ở trong project_members)
   * - Nếu có roles → upsert document
   */
  const handleSaveRbac = async (roles: string[]) => {
    if (!rbacTarget) return;
    const m = rbacTarget.member;

    try {
      if (roles.length === 0) {
        // Xóa doc project_roles nếu không có role nào
        await deleteRbacRole.mutateAsync(m.id);
      } else {
        await setRbacRole.mutateAsync({
          id: m.id,
          data: {
            uid: m.id,
            memberId: m.id,
            email: m.email,
            displayName: m.name,
            roles,
            projectId,
          },
        });
      }

      setRbacTarget(null);
      invalidateTeamData();
    } catch {
      // Error state handled by mutation
    }
  };

  if (isLoading || globalLoading) return <PageLoader />;

  return (
    <div className='space-y-4'>
      {/* Header + search */}
      <div className='flex items-center justify-between gap-3'>
        <p className='text-[13px] text-muted-foreground'>{table.getFilteredRowModel().rows.length} thành viên trong dự án</p>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder='Tìm tên, email...' className='pl-8 h-8 text-[12px] w-52' />
          </div>
          <Button onClick={() => setShowAddModal(true)} disabled={mutating} className='gap-1.5 h-8 text-[12px]'>
            <UserPlusIcon size={13} /> Thêm
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='bg-card border border-border panel overflow-hidden'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='border-border hover:bg-transparent'>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className='font-mono-dm text-[11px] text-muted-foreground uppercase tracking-[1.2px] py-2.5 px-3 select-none'
                    onClick={h.column.getToggleSortingHandler()}
                    style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center gap-1'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && <span className='text-muted-foreground'>{{ asc: <ChevronUp size={11} />, desc: <ChevronDown size={11} /> }[h.column.getIsSorted() as string] ?? <ChevronsUpDown size={11} />}</span>}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={columns.length} className='py-10 text-center text-[13px] text-muted-foreground'>
                  {globalFilter ? `Không có kết quả cho "${globalFilter}"` : 'Chưa có thành viên nào.'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='border-border hover:bg-secondary/50 transition-colors'>
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
      </div>

      {/* Modals */}
      <TeamMemberViewSheet
        open={!!viewTarget}
        member={viewTarget}
        rbacRoles={viewTargetRoles}
        rolesLabel='Vai trò dự án'
        onClose={() => setViewTarget(null)}
        onEdit={() => setViewTarget(null)}
        onRemoveRole={handleRemoveRole}
        onAddRole={handleAddRoleFromSheet}
        removingRole={deleteRbacRole.isPending || setRbacRole.isPending}
      />

      <AddMemberModal key='add-member-modal' open={showAddModal} onClose={() => setShowAddModal(false)} globalMembers={globalMembers} projectMemberIds={projectMemberIds} roleDefs={roleDefs} onAdd={handleAdd} adding={setMember.isPending} />

      <RbacRoleModal
        key={`rbac-modal-${rbacTarget?.member.id ?? 'none'}`}
        open={!!rbacTarget}
        roleDefs={roleDefs}
        currentRoles={rbacTarget?.currentRoles ?? []}
        onClose={() => setRbacTarget(null)}
        onSave={handleSaveRbac}
        saving={setRbacRole.isPending || deleteRbacRole.isPending}
      />

      {removeTarget && (
        <ConfirmDialog
          danger
          title='Xóa thành viên khỏi dự án'
          message={`Xóa "${removeTarget.name}" khỏi dự án? Thành viên vẫn tồn tại trong tổ chức.`}
          confirmLabel='Xóa khỏi dự án'
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            const id = removeTarget.id;
            deleteMember.mutate(id);
            deleteRbacRole.mutate(id);
            setRemoveTarget(null);
            invalidateTeamData();
          }}
        />
      )}
    </div>
  );
}
