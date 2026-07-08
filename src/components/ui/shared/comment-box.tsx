import { Avatar } from '@/components/ui/avatar';

interface CommentBoxProps {
  author: string;
  avatar: { initials: string; color?: string };
  time: string;
  content: string;
}

export function CommentBox({ author, avatar, time, content }: CommentBoxProps) {
  return (
    <div className='bg-secondary border border-border rounded-2.5 px-3.75 py-3.25 mb-2.5 last:mb-0'>
      <div className='flex items-center gap-2 mb-2'>
        <Avatar initials={avatar.initials} color={avatar.color} size='sm' />
        <span className='text-[13px] font-semibold'>{author}</span>
        <span className='font-mono-dm text-[10.5px] text-muted-foreground ml-auto'>{time}</span>
      </div>
      <div className='text-[13px] text-muted-foreground leading-[1.6]'>{content}</div>
    </div>
  );
}
