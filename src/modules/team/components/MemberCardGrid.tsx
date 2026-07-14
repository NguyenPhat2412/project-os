'use client';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PageBadge } from '@/components/ui/page-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TeamMember } from '@/modules/team/types/team';

const statusVariant: Record<string, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Active: 'green',
  Overloaded: 'red',
  Busy: 'yellow',
  Vacant: 'muted',
};

interface Props {
  members: TeamMember[];
  disabled?: boolean;
  onView?: (member: TeamMember) => void;
  onUpdateRole: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

export function MemberCardGrid({ members, disabled, onView, onUpdateRole, onDelete }: Props) {
  if (members.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground'>
        <span className='text-4xl'>👤</span>
        <p className='font-sans text-[15px]'>Chưa có thành viên nào.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4'>
      {members.map((member) => (
        <div key={member.id} onClick={() => onView?.(member)} className='bg-card border border-border panel p-4 cursor-pointer hover:border-foreground/20 hover:bg-secondary transition-colors group'>
          {/* Avatar + name */}
          <div className='flex items-start gap-3 mb-3'>
            <UserAvatar user={member} size='lg' />
            <div className='flex-1 min-w-0'>
              <p className='text-[13px] font-semibold truncate leading-tight'>{member.name}</p>
              <p className='text-[12px] text-muted-foreground truncate mt-0.5'>{member.email}</p>
            </div>
          </div>

          {/* Role + status */}
          <div className='flex items-center gap-2 mb-3'>
            <span className='text-[12px] text-muted-foreground'>{member.roles.join(', ') || '—'}</span>
            <PageBadge variant={statusVariant[member.status] ?? 'muted'}>{member.status}</PageBadge>
          </div>

          {/* Workload */}
          <div className='mb-3'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-[12px] text-muted-foreground uppercase tracking-wide'>Workload</span>
              <span className='text-[12px] font-mono-dm font-semibold'>{member.workload}%</span>
            </div>
            <ProgressBar label={`${member.workload ?? 0}%`} value={member.workload ?? 0} noMargin color={(member.workload ?? 0) >= 90 ? 'oklch(0.577 0.245 27.325)' : (member.workload ?? 0) >= 75 ? 'oklch(0.769 0.188 70.08)' : 'oklch(0.646 0.222 142.116)'} />
          </div>

          {/* Tasks */}
          <div className='flex items-center justify-between'>
            <span className='text-[12px] text-muted-foreground'>{member.taskCount} tasks</span>
            {/* Actions */}
            <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateRole(member);
                }}
                disabled={disabled}
                title='Cập nhật vai trò'
                className='text-muted-foreground hover:text-foreground'
              >
                <PencilIcon size={12} />
              </Button>
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(member);
                }}
                disabled={disabled}
                title='Vô hiệu hóa tài khoản'
                aria-label={`Vô hiệu hóa ${member.name}`}
                className='text-muted-foreground hover:text-red-500'
              >
                <Trash2Icon size={12} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
