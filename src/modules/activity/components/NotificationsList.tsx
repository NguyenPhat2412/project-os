'use client';

export interface NotificationItem {
  id: string;
  icon: string;
  content: string;
  time: string;
  unread?: boolean;
}

interface Props {
  notifications: NotificationItem[];
}

export function NotificationsList({ notifications }: Props) {
  return (
    <div className='bg-card border border-border panel p-5 h-fit'>
      <div className='font-sans text-[15px] font-bold mb-3'>Thông báo</div>
      {notifications.map((n) => (
        <div key={n.id} className={`flex gap-3 py-[11px] border-b border-border last:border-b-0 ${n.unread ? 'opacity-100' : 'opacity-60'}`}>
          <span className='text-[18px]'>{n.icon}</span>
          <div className='flex-1'>
            <div className='text-[12.5px] leading-[1.5]'>{n.content}</div>
            <div className='font-mono-dm text-[10.5px] text-muted-foreground mt-[3px]'>{n.time}</div>
          </div>
          {n.unread && <div className='w-2 h-2 rounded-full bg-primary shrink-0 mt-1' />}
        </div>
      ))}
    </div>
  );
}
