'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon, UserPlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { getRootDirectoryPage } from '@/modules/team/collections/members';
import { useOrganizationMembers, useOrganizationMutations } from '@/lib/api/organizations';

const PAGE_SIZE = 10;
const ROLES = [
  ['MEMBER', 'Nhân viên'],
  ['HR', 'Nhân sự'],
  ['DEPARTMENT_MANAGER', 'Quản lý phòng ban'],
  ['ADMIN', 'Quản trị tổ chức'],
] as const;

export function OrganizationMembersPanel({ organizationId }: { organizationId: string }) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<(typeof ROLES)[number][0]>('MEMBER');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const memberships = useOrganizationMembers(organizationId);
  const { upsertMember } = useOrganizationMutations();
  const directory = useQuery({
    queryKey: ['organizations', organizationId, 'directory', page, deferredSearch],
    queryFn: () => getRootDirectoryPage(page - 1, deferredSearch),
    staleTime: 30_000,
  });
  const membershipsByUserId = useMemo(() => new Map((memberships.data ?? []).map((member) => [member.userId, member])), [memberships.data]);
  const candidates = directory.data?.data ?? [];
  const selected = candidates.find((member) => member.id === selectedId) ?? null;
  const selectedMembership = selected ? membershipsByUserId.get(selected.id) : null;

  const addMember = async () => {
    if (!selected) return;
    await upsertMember.mutateAsync({
      organizationId,
      userId: selected.id,
      role: selectedMembership?.role.toUpperCase() ?? role,
      fullName: selected.name,
      email: selected.email,
    });
    setSelectedId(null);
  };

  return (
    <section id='organization-members' className='space-y-3 rounded-lg border bg-card p-5'>
      <div>
        <h2 className='font-semibold'>Cấp tài khoản vào tổ chức</h2>
        <p className='mt-1 text-xs text-muted-foreground'>Thêm hoặc đồng bộ tài khoản để tạo hồ sơ nhân sự, liên kết userId và membership trong một lần. Sau đó gán nhóm quyền hoặc dự án.</p>
      </div>
      <div className='grid gap-2 md:grid-cols-[1fr_220px_auto]'>
        <div className='relative'>
          <SearchIcon size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedId(null); }}
            placeholder='Tìm tài khoản theo tên hoặc email'
            className='pl-9'
          />
        </div>
        <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className='h-9 rounded-md border bg-background px-3 text-sm'>
          {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type='button' disabled={!selected || upsertMember.isPending} onClick={addMember} className='inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50'>
          <UserPlusIcon size={15} /> {selectedMembership ? 'Đồng bộ hồ sơ' : 'Thêm & đồng bộ'}
        </button>
      </div>
      {directory.isLoading ? <p className='py-5 text-center text-sm text-muted-foreground'>Đang tải tài khoản...</p> : (
        <div className='divide-y rounded-md border bg-background'>
          {candidates.map((member) => (
            <button key={member.id} type='button' onClick={() => setSelectedId(member.id)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${selectedId === member.id ? 'bg-primary/10' : 'hover:bg-muted'}`}>
              <span className='grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary'>{member.initials}</span>
              <span className='min-w-0 flex-1'><span className='block truncate font-medium'>{member.name}</span><span className='block truncate text-xs text-muted-foreground'>{member.email}{membershipsByUserId.has(member.id) ? ' · Đã thuộc tổ chức' : ''}</span></span>
            </button>
          ))}
          {!candidates.length && <p className='p-4 text-center text-sm text-muted-foreground'>{search ? 'Không tìm thấy tài khoản phù hợp.' : 'Chưa có tài khoản trong danh sách này.'}</p>}
        </div>
      )}
      {(directory.data?.meta.totalPages ?? 0) > 1 && (
        <Pagination page={page} totalPages={directory.data!.meta.totalPages} total={directory.data!.meta.total} limit={PAGE_SIZE} onPageChange={(next) => { setPage(next); setSelectedId(null); }} />
      )}
    </section>
  );
}
