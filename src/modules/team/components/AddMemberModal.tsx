'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { ModalShell, ModalHeaderBar, DialogBody } from '@/components/ui/shared/modal-shell';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { DirectoryPage } from '@/modules/team/collections/members';
import type { TeamMember } from '@/modules/team/types/team';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

const PAGE_SIZE = 10;

interface Props {
  open: boolean;
  onClose: () => void;
  globalMembers: TeamMember[];
  projectMemberIds: Set<string>;
  roleDefs: RoleDefinition[];
  onAdd: (memberId: string, roles: string[]) => Promise<void>;
  adding: boolean;
  directoryLabel?: string;
  loadDirectoryPage?: (page: number, search: string) => Promise<DirectoryPage>;
}

export function AddMemberModal({
  open,
  onClose,
  globalMembers,
  projectMemberIds,
  roleDefs,
  onAdd,
  adding,
  directoryLabel,
  loadDirectoryPage,
}: Props) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [apiError, setApiError] = useState('');

  const directory = useQuery({
    queryKey: ['project-member-directory', page, deferredSearch],
    queryFn: () => loadDirectoryPage!(page - 1, deferredSearch),
    enabled: open && !!loadDirectoryPage,
    staleTime: 30_000,
  });

  const localAvailable = useMemo(
    () =>
      globalMembers.filter((m) => {
        if (projectMemberIds.has(m.id)) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      }),
    [globalMembers, projectMemberIds, search],
  );

  const databaseAvailable = useMemo(
    () => (directory.data?.data ?? []).filter((member) => !projectMemberIds.has(member.id)),
    [directory.data?.data, projectMemberIds],
  );
  const available = loadDirectoryPage ? databaseAvailable : localAvailable.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = loadDirectoryPage ? (directory.data?.meta.total ?? 0) : localAvailable.length;
  const totalPages = loadDirectoryPage
    ? (directory.data?.meta.totalPages ?? 0)
    : Math.ceil(localAvailable.length / PAGE_SIZE);

  const reset = () => {
    setSelectedMember(null);
    setSelectedRoles([]);
    setSearch('');
    setPage(1);
    setApiError('');
  };

  const handleConfirm = async () => {
    if (!selectedMember) return;
    setApiError('');
    try {
      await onAdd(selectedMember.id, selectedRoles.length > 0 ? selectedRoles : ['Developer']);
      onClose();
      reset();
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Không thể thêm thành viên vào dự án. Vui lòng thử lại.');
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName],
    );
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      size='md'
      header={<ModalHeaderBar heading='Thêm thành viên vào dự án' onClose={handleClose} />}
      submitLabel='Thêm vào dự án'
      submitDisabled={!selectedMember || adding || (roleDefs.length > 0 && selectedRoles.length === 0)}
      submitLoading={adding}
      onSubmit={handleConfirm}
      cancelLabel='Hủy'
      onCancel={handleClose}
    >
      <DialogBody className='flex flex-col gap-4'>
        <div className='relative'>
          <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setSelectedMember(null);
            }}
            placeholder='Tìm theo tên, email...'
            className='pl-8 h-8 text-[12px]'
            autoFocus
          />
        </div>

        {directoryLabel && <p className='text-[12px] text-muted-foreground'>{directoryLabel}</p>}

        {directory.isLoading ? (
          <div className='text-center py-8 text-[13px] text-muted-foreground'>Đang tải danh bạ...</div>
        ) : available.length === 0 ? (
          <div className='text-center py-8 text-[13px] text-muted-foreground'>
            {search ? 'Không tìm thấy người phù hợp.' : total === 0 && (loadDirectoryPage || globalMembers.length === 0) ? (
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
          <div className='flex flex-col gap-1 max-h-52 overflow-y-auto'>
            {available.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ${selectedMember?.id === member.id ? 'bg-primary/15 border border-primary' : 'hover:bg-secondary'}`}
              >
                <UserAvatar user={member} size='sm' />
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-semibold truncate'>{member.name}</div>
                  <div className='text-[11px] text-muted-foreground truncate'>{member.title ?? 'Chưa gán hồ sơ nhân sự'}</div>
                  <div className='text-[12px] text-muted-foreground truncate'>{member.email}</div>
                  <div className='text-[11px] text-muted-foreground truncate'>
                    {member.roles.length > 0 ? `Vai trò: ${member.roles.join(', ')}` : 'Vai trò dự án: chọn sau khi chọn thành viên'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setSelectedMember(null);
            }}
          />
        )}

        {selectedMember && (
          <div className='flex flex-col gap-2 p-3 bg-secondary border border-border panel-inner'>
            <div className='flex items-center gap-3'>
              <UserAvatar user={selectedMember} size='sm' />
              <div>
                <div className='text-[13px] font-semibold'>{selectedMember.name}</div>
                <div className='text-[11px] text-muted-foreground'>{selectedMember.title ?? 'Chưa gán hồ sơ nhân sự'}</div>
                <div className='text-[12px] text-muted-foreground'>{selectedMember.email}</div>
              </div>
            </div>
            <div>
              <label className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] block mb-1.5'>Vai trò trong dự án này</label>
              {roleDefs.length === 0 ? (
              <p className='text-[11px] text-muted-foreground/60 italic'>Chưa có role riêng. Thành viên sẽ được thêm với vai trò Developer mặc định.</p>
              ) : (
                <div className='flex flex-col gap-2'>
                  {roleDefs.map((r) => (
                    <div key={r.id} className='flex items-center gap-2'>
                      <Checkbox
                        id={`role-${r.id}`}
                        checked={selectedRoles.includes(r.name)}
                        onCheckedChange={() => toggleRole(r.name)}
                      />
                      <Label htmlFor={`role-${r.id}`} className='text-[12px] cursor-pointer'>
                        {r.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(directory.error || apiError) && (
          <p role='alert' className='rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive'>
            {apiError || 'Không thể tải danh bạ thành viên. Vui lòng thử lại.'}
          </p>
        )}
      </DialogBody>
    </ModalShell>
  );
}
