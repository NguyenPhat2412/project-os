import { Avatar } from '@/components/ui/avatar';
import { PageBadge } from '@/components/ui/page-badge';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

interface ActivityItemProps {
  avatar: { initials: string; color?: string; gradient?: string };
  content: string;
  time: string;
  badge?: { label: string; variant: BadgeVariant };
}

export function ActivityItem({ avatar, content, time, badge }: ActivityItemProps) {
  return (
    <div className='flex gap-3 py-3 border-b border-border last:border-b-0'>
      <Avatar initials={avatar.initials} color={avatar.color} gradient={avatar.gradient} size='md' className='shrink-0 mt-0.5' />
      <div className='flex-1 min-w-0'>
        <div className='text-[13px] leading-normal text-muted-foreground' dangerouslySetInnerHTML={{ __html: content }} />
        <div className='flex items-center gap-2 mt-1'>
          <span className='font-mono-dm text-[10.5px] text-muted-foreground'>{time}</span>
          {badge && <PageBadge variant={badge.variant}>{badge.label}</PageBadge>}
        </div>
      </div>
    </div>
  );
}
