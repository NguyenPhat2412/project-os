import { Avatar } from './avatar';

interface StackAvatar {
  initials: string;
  color?: string;
  gradient?: string;
}
interface AvatarStackProps {
  avatars: StackAvatar[];
  size?: 'sm' | 'md';
  max?: number;
}

export function AvatarStack({ avatars, size = 'sm', max = 3 }: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const extra = avatars.length - max;
  return (
    <div className='flex'>
      {visible.map((a, i) => (
        <Avatar key={i} initials={a.initials} color={a.color} gradient={a.gradient} size={size} className={i > 0 ? '-ml-1.5 border-1.5 border-background' : ''} />
      ))}
      {extra > 0 && <div className={`${size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[12px]'} -ml-1.5 border-1.5 border-background rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold`}>+{extra}</div>}
    </div>
  );
}
