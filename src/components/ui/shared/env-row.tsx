import { PageBadge } from '@/components/ui/page-badge';

type EnvStatus = 'ok' | 'warn' | 'error';
type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

interface EnvRowProps {
  status: EnvStatus;
  name: string;
  badge: { label: string; variant: BadgeVariant };
  meta: string;
}

const dotClass: Record<EnvStatus, string> = {
  ok: 'bg-green-500',
  warn: 'bg-yellow-500 pulse-dot',
  error: 'bg-red-500 pulse-dot',
};
const rowStyle: Record<EnvStatus, React.CSSProperties> = {
  ok: { background: 'var(--secondary)' },
  warn: { background: 'bg-yellow-500/10', border: '1px solid rgba(245,197,24,0.18)' },
  error: { background: 'bg-red-500/10' },
};

export function EnvRow({ status, name, badge, meta }: EnvRowProps) {
  return (
    <div className='flex items-center gap-2.5 px-3 py-2.25 rounded-xs mb-2 last:mb-0' style={rowStyle[status]}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass[status]}`} />
      <span className='font-mono-dm text-[12px] font-medium min-w-14 tracking-[0.5px]'>{name}</span>
      <PageBadge variant={badge.variant}>{badge.label}</PageBadge>
      <span className='font-mono-dm text-[10.5px] text-muted-foreground ml-auto'>{meta}</span>
    </div>
  );
}
