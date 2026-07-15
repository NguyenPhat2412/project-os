'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, ExternalLinkIcon, CheckIcon, EyeIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ModalShell, ModalHeaderBar, DialogBody, SubmitButton, CancelButton } from '@/components/ui/shared/modal-shell';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { useProjectMutations, useProjects } from '@/modules/projects/hooks/useProjects';
import { useProject } from '@/store/project-store';
import { useWorkspace } from '@/lib/api/workspace';
import { cn } from '@/lib/utils';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import type { Project, ProjectStatus } from '@/modules/projects/types/project';
import type { WithId } from '@/lib/api-rq';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: 'bg-green-500/15 text-green-400 border-green-500/30',
  archived: 'bg-muted/15 text-muted-foreground border-muted/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};
const STATUS_DOT: Record<ProjectStatus, string> = {
  active: 'bg-green-500',
  archived: 'bg-muted',
  completed: 'bg-blue-500',
};
const ICON_OPTIONS = ['🛒', '👥', '🏦', '📱', '🚀', '🌐', '⚙️', '📊', '🎯', '💡', '🔐', '🎮'];
const COLOR_OPTIONS = [
  { label: 'Violet', value: 'from-violet-500 to-purple-600' },
  { label: 'Blue', value: 'from-blue-500 to-cyan-600' },
  { label: 'Green', value: 'from-emerald-500 to-green-600' },
  { label: 'Orange', value: 'from-orange-500 to-amber-600' },
  { label: 'Pink', value: 'from-pink-500 to-rose-600' },
  { label: 'Indigo', value: 'from-indigo-500 to-blue-600' },
  { label: 'Teal', value: 'from-teal-500 to-cyan-600' },
  { label: 'Red', value: 'from-red-500 to-rose-600' },
];

const EMPTY_FORM: Omit<Project, 'id'> = {
  name: '',
  description: '',
  status: 'active',
  icon: '🚀',
  color: 'from-violet-500 to-purple-600',
  currentSprint: '',
  quarter: '',
  startDate: '',
  endDate: '',
  techStack: [],
  teamSize: undefined,
  createdAt: new Date().toISOString().slice(0, 10),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProjectAvatar({ project, size = 'md' }: { project: Pick<Project, 'icon' | 'color'>; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-6 h-6 text-sm rounded-sm', md: 'w-10 h-10 text-xl rounded-sm', lg: 'w-12 h-12 text-2xl rounded-sm' }[size];
  return <div className={cn('shrink-0 flex items-center justify-center bg-linear-to-br', project.color, sz)}>{project.icon}</div>;
}

function ProjectCard({ project, isCurrent, onEdit, onDelete, onSwitch }: { project: WithId<Project>; isCurrent: boolean; onEdit: (p: WithId<Project>) => void; onDelete: (p: WithId<Project>) => void; onSwitch: (id: string) => void }) {
  return (
    <div className={cn('bg-card border rounded-sm p-5 flex flex-col gap-3 transition-colors', isCurrent ? 'border-primary' : 'border-border')}>
      {/* Header row */}
      <div className='flex items-start gap-3'>
        <ProjectAvatar project={project} />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-[15px] font-semibold'>{project.name}</span>
            {isCurrent && <span className='text-[12px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium'>Đang chọn</span>}
          </div>
          <span className={cn('inline-flex items-center gap-1.5 text-[12px] px-1.5 py-0.5 rounded-full border mt-1 capitalize', STATUS_STYLES[project.status])}>
            <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[project.status])} />
            {project.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {project.description && <p className='text-[12px] text-muted-foreground line-clamp-2 leading-relaxed'>{project.description}</p>}

      {/* Meta */}
      <div className='flex items-center gap-1.5 text-[12px] text-muted-foreground flex-wrap'>
        {project.currentSprint && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.currentSprint}</span>}
        {project.quarter && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.quarter}</span>}
        {project.teamSize && <span className='px-2 py-0.5 rounded-full bg-secondary border border-foreground/20'>{project.teamSize} members</span>}
      </div>

      {/* Tech stack */}
      {project.techStack && project.techStack.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className='text-[12px] px-2 py-0.5 rounded bg-secondary border border-foreground/20 text-muted-foreground font-mono-dm'>
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && <span className='text-[12px] px-2 py-0.5 rounded bg-secondary border border-foreground/20 text-muted-foreground'>+{project.techStack.length - 4}</span>}
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center gap-2 mt-auto pt-3 border-t border-border'>
        <Link href={`/admin/projects/${project.id}`} className='flex items-center gap-1.5 text-[12px] text-primary hover:underline font-medium'>
          <EyeIcon size={11} />
          Chi tiết
        </Link>
        {!isCurrent && (
          <button onClick={() => onSwitch(project.id)} className='flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:underline font-medium'>
            <ExternalLinkIcon size={11} />
            Chuyển dự án
          </button>
        )}
        <div className='flex items-center gap-1 ml-auto'>
          <Button aria-label={`Edit ${project.name}`} variant='ghost' size='icon-sm' onClick={() => onEdit(project)} className='text-muted-foreground hover:text-white'>
            <PencilIcon size={13} />
          </Button>
          {project.id !== 'ecommerce' && (
            <Button aria-label={`Delete ${project.name}`} variant='ghost' size='icon-sm' onClick={() => onDelete(project)} className='text-muted-foreground hover:text-red-500'>
              ✕
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Project Form Modal ───────────────────────────────────────────────────────

function ProjectFormModal({
  open,
  editId,
  form,
  techStackInput,
  isPending,
  error,
  onClose,
  onSubmit,
  onChange,
  onTechStackChange,
}: {
  open: boolean;
  editId: string | null;
  form: Omit<Project, 'id'>;
  techStackInput: string;
  isPending: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<Omit<Project, 'id'>>) => void;
  onTechStackChange: (v: string) => void;
}) {
  const inputCls = 'w-full h-9 px-3 rounded-sm bg-secondary border border-foreground/20 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary';
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      size='md'
      header={<ModalHeaderBar heading={editId ? 'Edit Project' : 'New Project'} onClose={onClose} />}
      footer={
        <div className='flex w-full items-center justify-end gap-2'>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SubmitButton onClick={onSubmit} loading={isPending} loadingLabel='Saving...'>
            <CheckIcon size={14} />
            {editId ? 'Save Changes' : 'Create Project'}
          </SubmitButton>
        </div>
      }
    >
      <DialogBody className='flex flex-col gap-4'>
        {error && <div className='rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-400'>{error}</div>}

        {/* Icon + Color */}
        <div className='flex gap-5'>
          <div className='flex-1'>
            <label className='text-[12px] font-medium text-muted-foreground mb-2 block'>Icon</label>
            <div className='flex flex-wrap gap-1.5'>
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} onClick={() => onChange({ icon: ic })} className={cn('w-8 h-8 rounded-sm flex items-center justify-center text-lg transition-colors', form.icon === ic ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary')}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className='flex-1'>
            <label className='text-[12px] font-medium text-muted-foreground mb-2 block'>Color</label>
            <div className='flex flex-wrap gap-2'>
              {COLOR_OPTIONS.map((c) => (
                <button key={c.value} onClick={() => onChange({ color: c.value })} title={c.label} className={cn('w-6 h-6 rounded-full bg-linear-to-br transition-transform', c.value, form.color === c.value ? 'ring-2 ring-white scale-110' : '')} />
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Project Name *</label>
          <input value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder='E.g. E-Commerce Platform' className={inputCls} />
        </div>

        {/* Description */}
        <div>
          <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder='Brief description of the project'
            rows={2}
            className='w-full px-3 py-2 rounded-sm bg-secondary border border-foreground/20 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none'
          />
        </div>

        {/* Status */}
        <div>
          <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Status</label>
          <Select value={form.status} onValueChange={(v) => onChange({ status: v as ProjectStatus })}>
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder='Chọn trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='archived'>Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sprint + Quarter */}
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Current Sprint</label>
            <input value={form.currentSprint ?? ''} onChange={(e) => onChange({ currentSprint: e.target.value })} placeholder='Sprint 1' className={inputCls} />
          </div>
          <div>
            <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Quarter</label>
            <input value={form.quarter ?? ''} onChange={(e) => onChange({ quarter: e.target.value })} placeholder='Q1 2025' className={inputCls} />
          </div>
        </div>

        {/* Dates */}
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Start Date</label>
            <DatePicker value={form.startDate} onChange={(v) => onChange({ startDate: v as string })} format='YYYY-MM-DD' />
          </div>
          <div>
            <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>End Date</label>
            <DatePicker value={form.endDate} onChange={(v) => onChange({ endDate: v as string })} format='YYYY-MM-DD' />
          </div>
        </div>

        {/* Tech stack */}
        <div>
          <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>
            Tech Stack <span className='text-muted-foreground font-normal'>(comma-separated)</span>
          </label>
          <input value={techStackInput} onChange={(e) => onTechStackChange(e.target.value)} placeholder='React, Node.js, PostgreSQL' className={inputCls} />
        </div>

        {/* Team size */}
        <div>
          <label className='text-[12px] font-medium text-muted-foreground mb-1.5 block'>Team Size</label>
          <input type='number' min={1} value={form.teamSize ?? ''} onChange={(e) => onChange({ teamSize: e.target.value ? Number(e.target.value) : undefined })} placeholder='5' className={inputCls} />
        </div>
      </DialogBody>
    </ModalShell>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjects();
  const { projectId, switchProject } = useProject();
  const workspace = useWorkspace();
  const { create: createProject, update: updateProject, remove: deleteProject } = useProjectMutations();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Project, 'id'>>(EMPTY_FORM);
  const [techStackInput, setTechStackInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WithId<Project> | null>(null);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, createdAt: new Date().toISOString().slice(0, 10) });
    setTechStackInput('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (project: WithId<Project>) => {
    setEditId(project.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = project;
    setForm(rest);
    setTechStackInput(project.techStack?.join(', ') ?? '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setFormError('');

    const data: Omit<Project, 'id'> = {
      ...form,
      techStack: techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editId) {
        const { organizationId, ...projectPatch } = data;
        void organizationId;
        await updateProject.mutateAsync({ id: editId, data: projectPatch });
      } else {
        const organizationId = workspace.data?.organization.id;
        if (!organizationId) {
          setFormError('Create an organization before creating a project.');
          return;
        }
        await createProject.mutateAsync({ ...data, organizationId });
      }
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save project. Check admin access and try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormError('');
    try {
      await deleteProject.mutateAsync(deleteTarget.id);
      if (projectId === deleteTarget.id) {
        switchProject('');
        const url = new URL(window.location.href);
        url.searchParams.delete('projectId');
        router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
      }
      setDeleteTarget(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not delete project. Check admin access and try again.');
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <div>
      <SimplePageHeader
        title='Projects'
        summary={`${projects.length} project${projects.length !== 1 ? 's' : ''} · Project đang active quyết định data được hiển thị`}
        segments={BREADCRUMBS.adminProjects}
        actions={
          <Button onClick={openCreate} disabled={!workspace.data?.organization.id} className='gap-2 h-9'>
            <PlusIcon size={15} /> New Project
          </Button>
        }
      />

      {/* ── Content ── */}
      <section className='mb-4'>
        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-52 rounded-sm bg-secondary animate-pulse' />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className='text-center py-16 text-muted-foreground'>
            <div className='text-4xl mb-3'>📁</div>
            <p className='text-[14px] font-medium mb-1'>No projects yet</p>
            <p className='text-[12px]'>Click &quot;New Project&quot; to create your first project.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} isCurrent={project.id === projectId} onEdit={openEdit} onDelete={setDeleteTarget} onSwitch={switchProject} />
            ))}
          </div>
        )}
      </section>

      {/* ── Form Modal ── */}
      <ProjectFormModal
        open={showForm}
        editId={editId}
        form={form}
        techStackInput={techStackInput}
        isPending={isPending}
        error={formError}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onTechStackChange={setTechStackInput}
      />

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmDialog
          danger
          title='Delete Project'
          message={`Delete "${deleteTarget.name}"? The project will be removed from PostgreSQL. Domain data remains isolated in its owning service.`}
          confirmLabel='Delete'
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Form error toast ── */}
      {formError && <div className='fixed bottom-4 right-4 z-50 bg-red-500/15 border border-red-500/30 text-red-400 text-[13px] px-4 py-2.5 rounded-sm'>{formError}</div>}
    </div>
  );
}
