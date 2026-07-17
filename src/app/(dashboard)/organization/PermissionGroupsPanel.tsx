'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, GripVertical, ShieldCheck, Trash2 } from 'lucide-react';
import {
  PermissionGroup,
  useEmployees,
  useOrganizationMembers,
  usePermissionGroupMutations,
  usePermissionGroups,
} from '@/lib/api/organizations';

const MODULES = [
  ['dashboard', 'Tổng hợp'], ['projects', 'Dự án'], ['tasks', 'Công việc'],
  ['daily-reports', 'Báo cáo ngày'], ['attendance', 'Chấm công'], ['organization', 'Tổ chức'],
  ['employees', 'Nhân sự'], ['project-management', 'Quản lý dự án'], ['operations', 'Vận hành'],
  ['knowledge', 'Tài liệu & Wiki'], ['meetings', 'Cuộc họp'], ['activity', 'Hoạt động'], ['reports', 'Báo cáo'],
  ['admin', 'Quản trị'], ['profile', 'Hồ sơ cá nhân'],
] as const;

const label = (key: string) => MODULES.find(([value]) => value === key)?.[1] ?? key;

export function PermissionGroupsPanel({ organizationId }: { organizationId: string }) {
  const groups = usePermissionGroups(organizationId);
  const members = useOrganizationMembers(organizationId);
  const employees = useEmployees(organizationId);
  const { createGroup, updateGroup, deleteGroup } = usePermissionGroupMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAvailable, setSelectedAvailable] = useState<string | null>(null);
  const [selectedAssigned, setSelectedAssigned] = useState<string | null>(null);

  const selected = groups.data?.find(group => group.id === selectedId) ?? groups.data?.[0] ?? null;
  const assigned = useMemo(() => new Set(selected?.modules ?? []), [selected?.modules]);
  const available = MODULES.filter(([key]) => !assigned.has(key));
  const employeeNames = useMemo(() => new Map((employees.data ?? []).filter(item => item.userId)
    .map(item => [item.userId!, item.fullName])), [employees.data]);

  const saveModules = (group: PermissionGroup, modules: string[]) => {
    updateGroup.mutate({ organizationId, groupId: group.id, body: { modules: [...new Set(modules)] } });
  };
  const assign = (module: string | null) => {
    if (selected && module && !assigned.has(module)) saveModules(selected, [...selected.modules, module]);
    setSelectedAvailable(null);
  };
  const unassign = (module: string | null) => {
    if (selected && module) saveModules(selected, selected.modules.filter(value => value !== module));
    setSelectedAssigned(null);
  };
  const toggleMember = (userId: string) => {
    if (!selected) return;
    const next = selected.memberIds.includes(userId)
      ? selected.memberIds.filter(value => value !== userId)
      : [...selected.memberIds, userId];
    updateGroup.mutate({ organizationId, groupId: selected.id, body: { memberIds: next } });
  };
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    if (!name) return;
    createGroup.mutate({ organizationId, body: { name, description: String(data.get('description') ?? '').trim() } }, {
      onSuccess: response => { setSelectedId(response.data.id); form.reset(); },
    });
  };

  return <section id='permission-groups' className='space-y-4 rounded-lg border bg-card p-5'>
    <div className='flex items-start justify-between gap-3'>
      <div><div className='flex items-center gap-2 font-semibold'><ShieldCheck size={18} />Nhóm quyền & module</div>
        <p className='mt-1 text-xs text-muted-foreground'>Module được cấp theo nhóm. Kéo thả hoặc dùng nút mũi tên bằng bàn phím.</p></div>
    </div>
    <form onSubmit={create} className='grid gap-2 md:grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_auto]'>
      <input name='name' required maxLength={100} placeholder='Tên nhóm quyền' className='h-9 rounded-md border bg-background px-3 text-sm' />
      <input name='description' maxLength={500} placeholder='Mô tả ngắn' className='h-9 rounded-md border bg-background px-3 text-sm' />
      <button disabled={createGroup.isPending} className='h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50'>Tạo nhóm</button>
    </form>
    <div className='grid gap-4 xl:grid-cols-[230px_1fr]'>
      <div className='rounded-md border bg-background p-2'>
        {groups.data?.length ? groups.data.map(group => <button key={group.id} type='button' onClick={() => setSelectedId(group.id)}
          className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${group.id === selected?.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
          <span className='block font-medium'>{group.name}</span><span className='text-xs opacity-75'>{group.modules.length} module · {group.memberIds.length} thành viên</span>
        </button>) : <p className='p-3 text-sm text-muted-foreground'>Chưa có nhóm quyền. Tạo nhóm đầu tiên để cấu hình module.</p>}
      </div>
      {selected ? <div className='space-y-4'>
        <div className='flex items-center justify-between gap-2'><div><h3 className='font-medium'>{selected.name}</h3><p className='text-xs text-muted-foreground'>{selected.description || 'Chưa có mô tả'}</p></div>
          <button type='button' aria-label='Xóa nhóm quyền' onClick={() => { if (window.confirm(`Xóa nhóm “${selected.name}”?`)) deleteGroup.mutate({ organizationId, groupId: selected.id }); }} className='rounded-md border p-2 text-destructive hover:bg-destructive/10'><Trash2 size={16} /></button></div>
        {selected.memberIds.length === 0 && <p className='rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300'>Nhóm này chưa có thành viên, nên các module đang gán chưa được cấp cho tài khoản nào.</p>}
        <div className='grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]'>
          <ModuleList title='Module khả dụng' modules={available.map(([key]) => key)} selected={selectedAvailable}
            onSelect={setSelectedAvailable} onDrop={module => unassign(module)} />
          <div className='flex justify-center gap-2 md:flex-col'>
            <button type='button' aria-label='Gán module đã chọn' disabled={!selectedAvailable || updateGroup.isPending} onClick={() => assign(selectedAvailable)} className='rounded-md border p-2 disabled:opacity-40'><ArrowRight size={17} /></button>
            <button type='button' aria-label='Bỏ gán module đã chọn' disabled={!selectedAssigned || updateGroup.isPending} onClick={() => unassign(selectedAssigned)} className='rounded-md border p-2 disabled:opacity-40'><ArrowLeft size={17} /></button>
          </div>
          <ModuleList title='Module đã gán' modules={selected.modules} selected={selectedAssigned}
            onSelect={setSelectedAssigned} onDrop={module => assign(module)} />
        </div>
        <div><h4 className='mb-2 text-sm font-medium'>Thành viên nhóm</h4><div className='grid max-h-48 gap-2 overflow-y-auto rounded-md border bg-background p-3 sm:grid-cols-2'>
          {members.data?.map(member => <label key={member.userId} className='flex items-center gap-2 text-sm'><input type='checkbox' checked={selected.memberIds.includes(member.userId)} onChange={() => toggleMember(member.userId)} />
            <span className='truncate'>{employeeNames.get(member.userId) ?? 'Tài khoản chưa liên kết nhân sự'}<span className='ml-1 text-xs text-muted-foreground'>({member.role})</span></span></label>)}
          {!members.data?.length && <p className='text-sm text-muted-foreground'>Chưa có thành viên tổ chức để gán.</p>}
        </div></div>
      </div> : <div className='grid min-h-64 place-items-center rounded-md border border-dashed text-sm text-muted-foreground'>Chọn hoặc tạo một nhóm quyền.</div>}
    </div>
  </section>;
}

function ModuleList({ title, modules, selected, onSelect, onDrop }: { title: string; modules: string[]; selected: string | null; onSelect: (value: string) => void; onDrop: (value: string) => void }) {
  return <div className='min-h-56 rounded-md border bg-background p-2' onDragOver={event => event.preventDefault()}
    onDrop={event => { event.preventDefault(); const moduleKey = event.dataTransfer.getData('text/projectos-module'); if (moduleKey) onDrop(moduleKey); }}>
    <div className='px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{title}</div>
    <div className='space-y-1'>{modules.map(module => <button type='button' key={module} draggable
      onDragStart={event => event.dataTransfer.setData('text/projectos-module', module)} onClick={() => onSelect(module)}
      className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm ${selected === module ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
      <GripVertical size={14} className='shrink-0 opacity-60' /><span>{label(module)}</span></button>)}
      {!modules.length && <p className='p-3 text-center text-xs text-muted-foreground'>Kéo module vào đây.</p>}</div>
  </div>;
}
