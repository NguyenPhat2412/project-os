import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-3 h-3 border',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-2',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-current border-t-transparent animate-spin shrink-0',
        sizeMap[size],
        className,
      )}
    />
  );
}
