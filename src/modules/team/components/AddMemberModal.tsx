'use client';
import { useState, useMemo } from 'react';
import { SearchIcon } from 'lucide-react';
import { ModalShell, ModalHeaderBar, DialogBody } from '@/components/ui/shared/modal-shell';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { TeamMember } from '@/modules/team/types/team';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

interface Props {
  open: boolean;
  onClose: () => void;
  globalMembers: TeamMember[];
  projectMemberIds: Set<string>;
  roleDefs: RoleDefinition[];
  onAdd: (memberId: string, roles: string[]) => void;
  adding: boolean;
}

export function AddMemberModal({ open, onClose, globalMembers, projectMemberIds, roleDefs, onAdd, adding }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const available = useMemo(
    () =>
      globalMembers.filter((m) => {
        if (projectMemberIds.has(m.id)) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      }),
    [globalMembers, projectMemberIds, search],
  );

  const selectedMember = useMemo(() => globalMembers.find((m) => m.id === selectedId) ?? null, [globalMembers, selectedId]);

  const reset = () => {
    setSelectedId(null);
    setSelectedRoles([]);
    setSearch('');
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onAdd(selectedId, selectedRoles);
    onClose();
    reset();
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
      submitDisabled={!selectedId || selectedRoles.length === 0 || adding}
      submitLoading={adding}
      onSubmit={handleConfirm}
      cancelLabel='Hủy'
      onCancel={handleClose}
    >
      <DialogBody className='flex flex-col gap-4'>
        <div className='relative'>
          <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Tìm theo tên, email...' className='pl-8 h-8 text-[12px]' autoFocus />
        </div>

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
          <div className='flex flex-col gap-1 max-h-52 overflow-y-auto'>
            {available.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedId(member.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ${selectedId === member.id ? 'bg-primary/15 border border-primary' : 'hover:bg-secondary'}`}
              >
                <UserAvatar user={member} size='sm' />
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-semibold truncate'>{member.name}</div>
                  <div className='text-[12px] text-muted-foreground truncate'>{member.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMember && (
          <div className='flex flex-col gap-2 p-3 bg-secondary border border-border panel-inner'>
            <div className='flex items-center gap-3'>
              <UserAvatar user={selectedMember} size='sm' />
              <div>
                <div className='text-[13px] font-semibold'>{selectedMember.name}</div>
                <div className='text-[12px] text-muted-foreground'>{selectedMember.email}</div>
              </div>
            </div>
            <div>
              <label className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] block mb-1.5'>Vai trò trong dự án này</label>
              {roleDefs.length === 0 ? (
                <p className='text-[11px] text-muted-foreground/60 italic'>Chưa có role. Tạo role tại Admin &gt; Projects &gt; Vai trò trước.</p>
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
      </DialogBody>
    </ModalShell>
  );
}
