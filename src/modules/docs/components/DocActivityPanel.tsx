import type { ActivityEntry } from '@/modules/activity/types/activity';
import { ActivityItem } from '@/components/ui/shared/activity-item';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

interface DocActivityPanelProps {
  docActivity: ActivityEntry[];
}

export function DocActivityPanel({ docActivity }: DocActivityPanelProps) {
  return (
    <div className='bg-card border border-border panel p-5'>
      <div className='font-sans text-[15px] font-bold mb-3'>Hoạt động tài liệu</div>
      {docActivity.map((activity) => (
        <ActivityItem key={activity.id} avatar={activity.avatar} content={activity.content} time={activity.time} badge={activity.badge ? { label: activity.badge, variant: (activity.badgeVariant ?? 'muted') as BadgeVariant } : undefined} />
      ))}
    </div>
  );
}
