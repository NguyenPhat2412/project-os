'use client';

import { FormEvent } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { OrganizationMembersPanel } from './OrganizationMembersPanel';
import { PermissionGroupsPanel } from './PermissionGroupsPanel';
import { CompanyPolicyPanel } from './CompanyPolicyPanel';
import { usePermission } from '@/hooks/usePermission';
import { rememberOrganization, useWorkspace } from '@/lib/api/workspace';
import { PageLoader } from '@/components/ui/page-loader';
import { useDepartments, useEmployees, useOrganizationMutations, useOrganizations } from '@/lib/api/organizations';
import { useProject } from '@/store/project-store';

const roleLabel = (role: string | undefined) => {
  if (role === 'PLATFORM_ADMIN') return 'Sếp';
  if (role === 'DEPARTMENT_MANAGER') return 'Quản lý';
  return 'Nhân viên';
};

export default function OrganizationPage() {
  const organizations = useOrganizations();
  const workspace = useWorkspace();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setProjectId } = useProject();
  const selectedOrganizationId = searchParams.get('organizationId') ?? workspace.data?.organization.id ?? organizations.data?.[0]?.id ?? null;
  const { createOrganization, createDepartment, createEmployee, updateEmployee } = useOrganizationMutations();
  const { isRootAdmin } = usePermission();
  const departments = useDepartments(selectedOrganizationId);
  const employees = useEmployees(selectedOrganizationId);
  const employeeList = employees.data ?? [];
  const isAdmin = workspace.data?.systemRole === 'PLATFORM_ADMIN';
  const canManageEmployees = isAdmin || workspace.data?.systemRole === 'HR';
  const canManageCompanyPolicy = isAdmin || isRootAdmin();
  const organizationHref = (organizationId: string) => `${pathname}?organizationId=${encodeURIComponent(organizationId)}`;
  const selectOrganization = (nextOrganizationId: string) => {
    rememberOrganization(nextOrganizationId);
    setProjectId('');
    window.location.assign(organizationHref(nextOrganizationId));
  };
  if (organizations.isLoading) return <PageLoader />;
  const selected = organizations.data?.find(item => item.id === selectedOrganizationId);
  const submitOrganization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get('name') ?? '').trim();
    if (name) createOrganization.mutate({ name, timezone: 'Asia/Ho_Chi_Minh' }, { onSuccess: response => selectOrganization(response.data.id) });
    event.currentTarget.reset();
  };
  const submitDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    if (selectedOrganizationId && name) createDepartment.mutate({ organizationId: selectedOrganizationId, name }); event.currentTarget.reset();
  };
  const submitEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const fullName = String(form.get('fullName') ?? '').trim(); const email = String(form.get('email') ?? '').trim();
    if (selectedOrganizationId && fullName && email) createEmployee.mutate({ organizationId: selectedOrganizationId, body: { fullName, email, title: String(form.get('title') ?? '').trim() || undefined, departmentId: String(form.get('departmentId') ?? '') || undefined, supervisorId: String(form.get('supervisorId') ?? '') || undefined } }); event.currentTarget.reset();
  };
  return <div className='space-y-6 p-6'>
    <div><h1 className='text-2xl font-bold'>Tổ chức & Nhân sự</h1><p className='text-sm text-muted-foreground'>Tổ chức sở hữu phòng ban, nhân sự và dự án. Vai trò hiện tại của bạn: {roleLabel(workspace.data?.systemRole)}.</p></div>
    <form onSubmit={submitOrganization} className='flex max-w-xl gap-2'><input name='name' required placeholder='Tên tổ chức' className='h-9 flex-1 rounded-md border bg-background px-3 text-sm' /><button disabled={createOrganization.isPending} className='inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50'><Plus size={16} />Tạo tổ chức</button></form>
    <div className='space-y-4'>{selected && <>
        <section className='rounded-lg border bg-card p-5'>
          <h2 className='font-semibold'>Luồng cấp tài khoản và quyền</h2>
          <ol className='mt-3 grid gap-2 text-sm md:grid-cols-4'>
            <li><Link className='text-primary hover:underline' href={`/admin/members?organizationId=${selected.id}`}>1. Tạo hoặc cập nhật tài khoản</Link></li>
            <li><a className='text-primary hover:underline' href='#organization-members'>2. Thêm vào tổ chức</a></li>
            <li><a className='text-primary hover:underline' href='#permission-groups'>3. Gán nhóm quyền</a></li>
            <li><Link className='text-primary hover:underline' href={`/admin/projects?organizationId=${selected.id}`}>4. Cấp vai trò dự án</Link></li>
          </ol>
        </section>
        <section className='grid gap-3 rounded-lg border bg-card p-5 md:grid-cols-3'>
          <RoleCard title='Sếp' description='Tạo tổ chức/dự án, quản lý phòng ban, thành viên và quyền tổ chức.' active={workspace.data?.systemRole === 'PLATFORM_ADMIN'} />
          <RoleCard title='Quản lý' description='Quản lý nhân sự trực tiếp và các dự án được giao; không có quyền vận hành hệ thống.' active={workspace.data?.systemRole === 'DEPARTMENT_MANAGER'} />
          <RoleCard title='Nhân viên' description='Chỉ làm việc với task, chấm công và dữ liệu được giao cho chính mình.' active={workspace.data?.systemRole === 'EMPLOYEE'} />
        </section>
        <CompanyPolicyPanel key={selected.id} organizationId={selected.id} canManage={canManageCompanyPolicy} />
        <section className='rounded-lg border bg-card p-5'><div className='mb-4 flex items-center gap-2 font-semibold'><Building2 size={18} />{selected.name}</div>{isAdmin && <form onSubmit={submitDepartment} className='flex gap-2'><input name='name' required placeholder='Tên phòng ban' className='h-9 flex-1 rounded-md border bg-background px-3 text-sm' /><button className='h-9 rounded-md border px-3 text-sm'>Thêm phòng ban</button></form>}<div className='mt-3 flex flex-wrap gap-2'>{departments.data?.map(item => <span key={item.id} className='rounded-full bg-muted px-3 py-1 text-xs'>{item.name}</span>)}</div></section>
        <section className='rounded-lg border bg-card p-5'>
          <div className='mb-4 flex items-center gap-2 font-semibold'><Users size={18} />Nhân sự</div>
          {canManageEmployees && <form onSubmit={submitEmployee} className='grid gap-2 md:grid-cols-5'>
            <input name='fullName' required placeholder='Họ tên' className='h-9 rounded-md border bg-background px-3 text-sm' />
            <input name='email' required type='email' placeholder='Email' className='h-9 rounded-md border bg-background px-3 text-sm' />
            <input name='title' placeholder='Chức danh' className='h-9 rounded-md border bg-background px-3 text-sm' />
            <select name='supervisorId' defaultValue='' className='h-9 rounded-md border bg-background px-3 text-sm'><option value=''>Quản lý trực tiếp (tùy chọn)</option>{employeeList.filter(candidate => candidate.userId).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.fullName}{candidate.title ? ` · ${candidate.title}` : ''}</option>)}</select>
            <button className='h-9 rounded-md border px-3 text-sm'>Thêm nhân sự</button>
          </form>}
          {updateEmployee.error instanceof Error && <p className='mt-3 text-sm text-destructive'>{updateEmployee.error.message}</p>}
          <div className='mt-4 divide-y'>{employeeList.map(item => {
            const managerOptions = employeeList.filter(candidate => candidate.id !== item.id && candidate.userId);
            return <div key={item.id} className='flex flex-wrap items-center justify-between gap-3 py-3 text-sm'>
              <div><div>{item.fullName}<span className='ml-2 text-muted-foreground'>{item.title}</span></div><div className='text-muted-foreground'>{item.email}</div></div>
              {canManageEmployees ? <label className='text-xs text-muted-foreground'>Quản lý trực tiếp<select defaultValue={item.supervisorId ?? ''} disabled={updateEmployee.isPending || !managerOptions.length} onChange={(event) => updateEmployee.mutate({ organizationId: selected.id, employeeId: item.id, body: { supervisorId: event.target.value } })} className='ml-2 h-8 rounded-md border bg-background px-2 text-sm text-foreground disabled:opacity-50'><option value='' disabled>{managerOptions.length ? 'Chọn quản lý' : 'Chưa có quản lý có tài khoản'}</option>{managerOptions.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.fullName}{candidate.title ? ` · ${candidate.title}` : ''}</option>)}</select></label> : null}
            </div>;
          })}</div>
        </section>
        {isRootAdmin() && <OrganizationMembersPanel organizationId={selected.id} />}
        {isAdmin && <PermissionGroupsPanel organizationId={selected.id} />}
      </>}</div>
  </div>;
}

function RoleCard({ title, description, active }: { title: string; description: string; active: boolean }) {
  return <div className={`rounded-md border p-4 ${active ? 'border-primary bg-primary/5' : 'bg-background'}`}>
    <div className='font-medium'>{title}{active && <span className='ml-2 text-xs text-primary'>Vai trò của bạn</span>}</div>
    <p className='mt-1 text-xs leading-5 text-muted-foreground'>{description}</p>
  </div>;
}
