'use client';

import { FormEvent } from 'react';
import { Clock3, Save } from 'lucide-react';
import { CompanyPolicyInput, useCompanyPolicy, useOrganizationMutations } from '@/lib/api/organizations';

const fallbackPolicy: CompanyPolicyInput = {
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '13:00',
  afternoonEnd: '17:00',
  rules: [
    'Làm việc từ 08:00–12:00 và 13:00–17:00, từ Thứ 2 đến Thứ 6.',
    'Có mặt đúng giờ, cập nhật tiến độ và bàn giao công việc đúng hạn.',
    'Tập trung vào công việc được giao; hạn chế việc riêng trong giờ làm việc.',
    'Tuân thủ quy trình, bảo mật thông tin và các quy định của công ty TTA.',
  ],
};

export function CompanyPolicyPanel({ organizationId, canManage }: { organizationId: string; canManage: boolean }) {
  const policy = useCompanyPolicy(organizationId);
  const { updateCompanyPolicy } = useOrganizationMutations();
  const value = policy.data ?? fallbackPolicy;

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rules = String(form.get('rules') ?? '')
      .split(/\r?\n/)
      .map(rule => rule.trim())
      .filter(Boolean);
    if (!rules.length) return;
    updateCompanyPolicy.mutate({
      organizationId,
      body: {
        morningStart: String(form.get('morningStart')),
        morningEnd: String(form.get('morningEnd')),
        afternoonStart: String(form.get('afternoonStart')),
        afternoonEnd: String(form.get('afternoonEnd')),
        rules,
      },
    });
  };

  return <section className='rounded-lg border bg-card p-5'>
    <div className='mb-4 flex items-center gap-2 font-semibold'><Clock3 size={18} />Quy định & giờ làm việc</div>
    {policy.isLoading ? <p className='text-sm text-muted-foreground'>Đang tải quy định của tổ chức…</p> : <form key={organizationId} onSubmit={save} className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <TimeInput label='Bắt đầu buổi sáng' name='morningStart' value={value.morningStart} disabled={!canManage} />
        <TimeInput label='Kết thúc buổi sáng' name='morningEnd' value={value.morningEnd} disabled={!canManage} />
        <TimeInput label='Bắt đầu buổi chiều' name='afternoonStart' value={value.afternoonStart} disabled={!canManage} />
        <TimeInput label='Kết thúc buổi chiều' name='afternoonEnd' value={value.afternoonEnd} disabled={!canManage} />
      </div>
      <label className='block text-sm font-medium'>Quy định áp dụng
        <textarea name='rules' required readOnly={!canManage} defaultValue={value.rules.join('\n')} rows={5} className='mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm read-only:cursor-default read-only:bg-muted' />
      </label>
      {canManage ? <div className='flex items-center gap-3'>
        <button type='submit' disabled={updateCompanyPolicy.isPending} className='inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50'><Save size={16} />Lưu quy định</button>
        {updateCompanyPolicy.isSuccess && <p className='text-sm text-emerald-600'>Đã lưu quy định của tổ chức.</p>}
        {updateCompanyPolicy.error instanceof Error && <p role='alert' className='text-sm text-destructive'>{updateCompanyPolicy.error.message}</p>}
      </div> : <p className='text-sm text-muted-foreground'>Chỉ quản trị tổ chức có thể cập nhật quy định.</p>}
    </form>}
  </section>;
}

function TimeInput({ label, name, value, disabled }: { label: string; name: string; value: string; disabled: boolean }) {
  return <label className='block text-sm font-medium'>{label}
    <input name={name} type='time' required defaultValue={value} disabled={disabled} className='mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-default disabled:bg-muted' />
  </label>;
}
