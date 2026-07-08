'use client';
import { AlertTriangleIcon } from 'lucide-react';
import type { TeamMemberWithRole } from '@/modules/team/types/team';

interface OverloadedWarningProps {
  members: TeamMemberWithRole[];
}

export function OverloadedWarning({ members }: OverloadedWarningProps) {
  const overloaded = members.filter((m) => m.status === 'Overloaded');
  if (overloaded.length === 0) return null;

  return (
    <div className='flex items-start gap-2 bg-red-500/10 border border-[rgba(239,68,68,0.2)] rounded-sm p-4 text-[13px]'>
      <AlertTriangleIcon size={15} className='text-red-500 shrink-0 mt-px' />
      <span>
        <strong>Cảnh báo:</strong> {overloaded.map((m) => m.name).join(', ')} đang overloaded. Cân nhắc phân phối lại task.
      </span>
    </div>
  );
}
