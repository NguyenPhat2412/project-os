'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { useDepartments, useEmployees, useOrganizationMutations, useOrganizations } from '@/lib/api/organizations';

export default function OrganizationPage() {
  const organizations = useOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { createOrganization, createDepartment, createEmployee } = useOrganizationMutations();
  const departments = useDepartments(organizationId);
  const employees = useEmployees(organizationId);
  useEffect(() => { if (!organizationId && organizations.data?.[0]) setOrganizationId(organizations.data[0].id); }, [organizationId, organizations.data]);
  if (organizations.isLoading) return <PageLoader />;
  const selected = organizations.data?.find(item => item.id === organizationId);
  const submitOrganization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get('name') ?? '').trim();
    if (name) createOrganization.mutate({ name, timezone: 'Asia/Ho_Chi_Minh' }, { onSuccess: response => setOrganizationId(response.data.id) });
    event.currentTarget.reset();
  };
  const submitDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    if (organizationId && name) createDepartment.mutate({ organizationId, name }); event.currentTarget.reset();
  };
  const submitEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const fullName = String(form.get('fullName') ?? '').trim(); const email = String(form.get('email') ?? '').trim();
    if (organizationId && fullName && email) createEmployee.mutate({ organizationId, body: { fullName, email, title: String(form.get('title') ?? '').trim() || undefined, departmentId: String(form.get('departmentId') ?? '') || undefined } }); event.currentTarget.reset();
  };
  return <div className='space-y-6 p-6'>
    <div><h1 className='text-2xl font-bold'>Tổ chức & Nhân sự</h1><p className='text-sm text-muted-foreground'>Quản lý tổ chức, phòng ban và hồ sơ nhân sự.</p></div>
    <form onSubmit={submitOrganization} className='flex max-w-xl gap-2'><input name='name' required placeholder='Tên tổ chức' className='h-9 flex-1 rounded-md border bg-background px-3 text-sm' /><button className='inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground'><Plus size={16} />Tạo tổ chức</button></form>
    <div className='grid gap-4 lg:grid-cols-[260px_1fr]'>
      <aside className='rounded-lg border bg-card p-3'>{organizations.data?.length ? organizations.data.map(item => <button key={item.id} onClick={() => setOrganizationId(item.id)} className={`mb-1 w-full rounded-md p-3 text-left text-sm ${item.id === organizationId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><div className='font-medium'>{item.name}</div><div className='text-xs opacity-75'>{item.timezone}</div></button>) : <p className='p-3 text-sm text-muted-foreground'>Chưa có tổ chức.</p>}</aside>
      <main className='space-y-4'>{selected && <>
        <section className='rounded-lg border bg-card p-5'><div className='mb-4 flex items-center gap-2 font-semibold'><Building2 size={18} />{selected.name}</div><form onSubmit={submitDepartment} className='flex gap-2'><input name='name' required placeholder='Tên phòng ban' className='h-9 flex-1 rounded-md border bg-background px-3 text-sm' /><button className='h-9 rounded-md border px-3 text-sm'>Thêm phòng ban</button></form><div className='mt-3 flex flex-wrap gap-2'>{departments.data?.map(item => <span key={item.id} className='rounded-full bg-muted px-3 py-1 text-xs'>{item.name}</span>)}</div></section>
        <section className='rounded-lg border bg-card p-5'><div className='mb-4 flex items-center gap-2 font-semibold'><Users size={18} />Nhân sự</div><form onSubmit={submitEmployee} className='grid gap-2 md:grid-cols-4'><input name='fullName' required placeholder='Họ tên' className='h-9 rounded-md border bg-background px-3 text-sm' /><input name='email' required type='email' placeholder='Email' className='h-9 rounded-md border bg-background px-3 text-sm' /><input name='title' placeholder='Chức danh' className='h-9 rounded-md border bg-background px-3 text-sm' /><button className='h-9 rounded-md border px-3 text-sm'>Thêm nhân sự</button></form><div className='mt-4 divide-y'>{employees.data?.map(item => <div key={item.id} className='flex items-center justify-between py-2 text-sm'><span>{item.fullName}<span className='ml-2 text-muted-foreground'>{item.title}</span></span><span className='text-muted-foreground'>{item.email}</span></div>)}</div></section>
      </>}</main>
    </div>
  </div>;
}
