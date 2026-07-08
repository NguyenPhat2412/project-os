import { PencilIcon } from 'lucide-react';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { PageBadge } from '@/components/ui/page-badge';
import { Button } from '@/components/ui/button';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

export interface MeetingRowProps {
  day: string | number;
  month: string;
  title: string;
  time: string;
  attendees?: { initials: string; color?: string }[];
  badge?: { label: string; variant: BadgeVariant };
  onView?: () => void;
  onEdit?: () => void;
}

export function MeetingRow({ day, month, title, time, attendees, badge, onView, onEdit }: MeetingRowProps) {
  return (
    <div className='flex gap-2.5 items-center py-2 border-b border-border last:border-b-0 group cursor-pointer' onClick={onView}>
      <div className='text-center w-9 shrink-0'>
        <div className='text-[20px] font-bold leading-none'>{day}</div>
        <div className='font-mono-dm text-[9px] text-muted-foreground uppercase'>{month}</div>
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-[13px] font-semibold truncate'>{title}</div>
        <div className='font-mono-dm text-[12px] text-muted-foreground'>{time}</div>
      </div>
      {attendees && <AvatarStack avatars={attendees} size='sm' />}
      {badge && <PageBadge variant={badge.variant}>{badge.label}</PageBadge>}
      {onEdit && (
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          title='Chỉnh sửa'
          className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0'
        >
          <PencilIcon size={13} />
        </Button>
      )}
    </div>
  );
}
