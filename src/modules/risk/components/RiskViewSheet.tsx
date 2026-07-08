'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PencilIcon } from 'lucide-react';
import { formatDateVi } from '@/lib/dayjs';
import type { Risk, RiskLevel } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

const levelVariant: Record<RiskLevel, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Critical: 'red',
  High: 'yellow',
  Medium: 'accent',
  Low: 'muted',
};
const statusVariant: Record<string, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  'Đang xử lý': 'accent',
  'Đang theo dõi': 'yellow',
  'Đã giảm thiểu': 'green',
};

interface Props {
  open: boolean;
  risk: (Risk & { id: string }) | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onEdit: () => void;
}

export function RiskViewSheet({ open, risk, teamMembers, onClose, onEdit }: Props) {
  if (!risk) return null;

  const owner = teamMembers.find((m) => m.id === risk.ownerId);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side='right' className='w-100 sm:max-w-100 bg-card border-l border-border p-0'>
        <SheetHeader className='p-5 border-b border-border'>
          <div className='flex items-center gap-2'>
            <span className='font-mono-dm text-[12px] text-primary'>{risk.id}</span>
            <PageBadge variant={levelVariant[risk.level]}>{risk.level}</PageBadge>
          </div>
          <SheetTitle className='font-sans text-[16px] font-bold text-foreground mt-1 leading-snug'>{risk.description}</SheetTitle>
        </SheetHeader>

        <div className='p-5 space-y-4 overflow-y-auto'>
          <Field label='Trạng thái'>
            <PageBadge variant={statusVariant[risk.status] ?? 'muted'}>{risk.status}</PageBadge>
          </Field>
          <Field label='Owner'>
            {owner ? (
              <div className='flex items-center gap-2'>
                <Avatar initials={owner.initials} gradient={owner.gradient} size='sm' />
                <span className='text-[13px]'>{owner.name}</span>
              </div>
            ) : (
              <span className='text-[13px] text-muted-foreground'>—</span>
            )}
          </Field>
          <Field label='Ngày hết hạn'>
            <span className='font-mono-dm text-[12px] text-muted-foreground'>{formatDateVi(risk.dueDate, 'DD/MM/YYYY')}</span>
          </Field>
          <Field label='Biện pháp giảm thiểu'>
            <p className='text-[13px] text-muted-foreground leading-relaxed'>{risk.mitigation}</p>
          </Field>
        </div>

        <div className='p-5 border-t border-border'>
          <Button onClick={onEdit} className='w-full text-[13px] font-semibold'>
            <PencilIcon />
            Chỉnh sửa rủi ro
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
