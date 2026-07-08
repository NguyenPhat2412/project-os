'use client';
import { useState } from 'react';
import { ModalShell, ModalHeaderBar, DialogBody } from '@/components/ui/shared/modal-shell';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { TeamMemberWithRole } from '@/modules/team/types/team';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

interface Props {
  open: boolean;
  member: TeamMemberWithRole | null;
  roleDefs: RoleDefinition[];
  onClose: () => void;
  onSave: (memberId: string, roles: string[]) => void;
  saving: boolean;
}

export function UpdateRoleModal({ open, member, roleDefs, onClose, onSave, saving }: Props) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(member?.roles ?? []);

  if (!member) return null;

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName],
    );
  };

  const rolesChanged =
    selectedRoles.length !== member.roles.length ||
    !selectedRoles.every((r) => member.roles.includes(r));

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth='max-w-sm'
      header={<ModalHeaderBar heading='Cập nhật vai trò' onClose={onClose} closeDisabled={saving} leading={<span className='text-[18px]'>🛡️</span>} />}
      submitLabel='Lưu thay đổi'
      submitDisabled={rolesChanged === false || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      onSubmit={() => onSave(member.id, selectedRoles)}
      cancelLabel='Hủy'
      onCancel={onClose}
      cancelDisabled={saving}
    >
      <DialogBody className='flex flex-col gap-4'>
        <div className='flex items-center gap-3 p-3 bg-secondary border border-border panel-inner'>
          <UserAvatar user={member} size='sm' />
          <div className='min-w-0'>
            <div className='text-[13px] font-semibold truncate'>{member.name}</div>
            <div className='text-[12px] text-muted-foreground truncate'>{member.email}</div>
          </div>
        </div>
        <div className='space-y-1.5'>
          <label className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] block'>Vai trò trong dự án</label>
          {roleDefs.length === 0 ? (
            <p className='text-[11px] text-muted-foreground/60 italic'>Chưa có role. Tạo role tại Admin &gt; Projects &gt; Vai trò.</p>
          ) : (
            <div className='flex flex-col gap-2'>
              {roleDefs.map((r) => (
                <div key={r.id} className='flex items-center gap-2'>
                  <Checkbox
                    id={`update-role-${r.id}`}
                    checked={selectedRoles.includes(r.name)}
                    onCheckedChange={() => toggleRole(r.name)}
                  />
                  <Label htmlFor={`update-role-${r.id}`} className='text-[12px] cursor-pointer'>
                    {r.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogBody>
    </ModalShell>
  );
}
