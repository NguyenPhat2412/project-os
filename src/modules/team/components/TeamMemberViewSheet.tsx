'use client';
/**
 * TeamMemberViewSheet
 * Read-only view of a TeamMember in a slide-in Sheet.
 * Shows member profile + RBAC roles with remove role functionality.
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageBadge } from '@/components/ui/page-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { PencilIcon, XIcon, PlusIcon } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import type { TeamMemberWithRole } from '@/modules/team/types/team';

const statusVariant: Record<string, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Active: 'green',
  Overloaded: 'red',
  Busy: 'yellow',
  Vacant: 'muted',
};

interface Props {
  open: boolean;
  member: TeamMemberWithRole | null;
  rbacRoles?: string[];
  rolesLabel?: string;
  onClose: () => void;
  onEdit: () => void;
  /** Remove a role from member */
  onRemoveRole?: (roleName: string) => void;
  /** Open modal to assign a new role */
  onAddRole?: () => void;
  removingRole?: boolean;
}

export function TeamMemberViewSheet({ open, member, rbacRoles = [], rolesLabel = 'Vai tro', onClose, onEdit, onRemoveRole, onAddRole, removingRole = false }: Props) {
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const handleRemoveConfirm = () => {
    if (removeTarget && onRemoveRole) {
      onRemoveRole(removeTarget);
    }
    setRemoveTarget(null);
  };

  const name = member?.name ?? '';
  const roles = member?.roles ?? [];
  const status = member?.status ?? 'Active';
  const taskCount = member?.taskCount ?? 0;
  const workload = member?.workload ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side='right' className='w-95 sm:max-w-95 bg-card border-l border-border p-0 flex flex-col'>
          <SheetHeader className='p-5 border-b border-border shrink-0'>
            <div className='flex items-center gap-3'>
              <UserAvatar user={member} size='lg' />
              <div>
                <SheetTitle className='font-sans text-[16px] font-bold text-foreground'>{name}</SheetTitle>
                <div className='text-[12px] text-muted-foreground mt-0.5'>{roles.join(', ') || '—'}</div>
              </div>
            </div>
          </SheetHeader>

          {member && (
            <div className='flex-1 overflow-y-auto p-5 space-y-4'>
              <Field label='Email'>
                <span className='font-mono-dm text-[12px] text-muted-foreground'>{member.email}</span>
              </Field>

              <Field label='Trang thai'>
                <PageBadge variant={statusVariant[status] ?? 'muted'}>{status}</PageBadge>
              </Field>

              <div className='grid grid-cols-2 gap-4'>
                <Field label='Tasks dang lam'>
                  <span className='font-mono-dm text-[20px] font-bold text-foreground'>{taskCount}</span>
                </Field>
                <Field label='Workload'>
                  <span className='font-mono-dm text-[20px] font-bold text-foreground'>{workload}%</span>
                </Field>
              </div>

              <Field label='Workload chi tiet'>
                <ProgressBar label={`${workload}%`} value={workload} noMargin color={workload >= 90 ? 'oklch(0.577 0.245 27.325)' : workload >= 75 ? 'oklch(0.769 0.188 70.08)' : 'oklch(0.646 0.222 142.116)'} />
              </Field>

              {/* RBAC Roles section */}
              <Field label={rolesLabel}>
                {rbacRoles.length === 0 ? (
                  <div className='flex items-center gap-2'>
                    <span className='text-[12px] text-muted-foreground italic'>Chua co vai tro.</span>
                    {onAddRole && (
                      <button onClick={onAddRole} className='text-[11px] text-primary hover:underline transition-colors'>
                        + Gan vai tro
                      </button>
                    )}
                  </div>
                ) : (
                  <div className='flex flex-col gap-1.5'>
                    {rbacRoles.map((r) => (
                      <div key={r} className='flex items-center justify-between px-2.5 py-2 bg-secondary border border-border panel-inner'>
                        <span className='text-[12px] font-medium text-foreground'>{r}</span>
                        {onRemoveRole && (
                          <button onClick={() => setRemoveTarget(r)} disabled={removingRole} className='text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40' title='Xoa vai tro'>
                            <XIcon size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {onAddRole && (
                      <button onClick={onAddRole} className='flex items-center gap-1.5 text-[11px] text-primary hover:underline transition-colors px-1 py-0.5 mt-1'>
                        <PlusIcon size={11} />
                        Them vai tro
                      </button>
                    )}
                  </div>
                )}
              </Field>
            </div>
          )}

          <div className='p-5 border-t border-border shrink-0'>
            <Button onClick={onEdit} className='w-full text-[13px] font-semibold'>
              <PencilIcon size={14} />
              Chinh sua thong tin
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ConfirmDialog outside Sheet so it's not hidden */}
      {removeTarget && member && <ConfirmDialog danger title='Xoa vai tro' message={`Xoa vai tro "${removeTarget}" khoi ${member.name}?`} confirmLabel='Xoa' onCancel={() => setRemoveTarget(null)} onConfirm={handleRemoveConfirm} />}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] mb-1.5'>{label}</div>
      {children}
    </div>
  );
}
