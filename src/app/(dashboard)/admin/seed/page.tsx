'use client';
import { useState, useEffect } from 'react';
import { seedDefaultProject } from '@/modules/projects/seeds/default-seed';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import { seedHRMSystem } from '@/modules/projects/seeds/hrm-system-seed';
import { seedMobileBanking } from '@/modules/projects/seeds/mobile-banking-seed';
import { seedProjects } from '@/modules/projects/seed';
import { seedMembers } from '@/modules/team/seed';
import { clearProjectData, BASIC_SUBCOLLECTIONS, FULL_SUBCOLLECTIONS } from '@/modules/projects/seeds/seed-utils';
import { Button } from '@/components/ui/button';

type ResetTarget = 'ecommerce' | 'hrm' | 'ebanking';

interface ProjectInfo {
  key: ResetTarget;
  icon: string;
  label: string;
  description: string;
  seedFn: () => Promise<void>;
  subcollections: readonly string[];
}

const PROJECT_SEEDS: ProjectInfo[] = [
  {
    key: 'ecommerce',
    icon: '🛒',
    label: 'E-Commerce Platform',
    description: 'Tasks, sprints, budget, docs, meetings, timeline, bugs...',
    seedFn: seedDefaultProject,
    subcollections: FULL_SUBCOLLECTIONS,
  },
  {
    key: 'hrm',
    icon: '👥',
    label: 'HRM System',
    description: 'Team, sprints, tasks, bugs, risks, epics',
    seedFn: seedHRMSystem,
    subcollections: BASIC_SUBCOLLECTIONS,
  },
  {
    key: 'ebanking',
    icon: '🏦',
    label: 'Mobile Banking App',
    description: 'Team, sprints, tasks, bugs, risks, epics',
    seedFn: seedMobileBanking,
    subcollections: BASIC_SUBCOLLECTIONS,
  },
];

export default function SeedPage() {
  const [seeding, setSeeding] = useState<string | null>(null);
  const [seededProjects, setSeededProjects] = useState<Set<ResetTarget>>(new Set());
  const [seeded, setSeeded] = useState({ projects: false, members: false });
  const [message, setMessage] = useState('');
  const [resetConfirm, setResetConfirm] = useState<ResetTarget | null>(null);
  const [resetting, setResetting] = useState<ResetTarget | null>(null);

  // Auto-seed default project on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await seedDefaultProject();
        if (!cancelled) setSeededProjects((p) => new Set([...p, 'ecommerce']));
      } catch {
        // Silent — user can manually seed if auto-seed fails
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSeed = async (project: ProjectInfo) => {
    setSeeding(project.key);
    setMessage('');
    try {
      await project.seedFn();
      setSeededProjects((prev) => new Set([...prev, project.key]));
      setMessage(`✅ "${project.label}" đã được seed!`);
    } catch (err) {
      setMessage(`❌ Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(null);
    }
  };

  const handleSeedProjects = async () => {
    setSeeding('__projects__');
    setMessage('');
    try {
      await seedProjects();
      setSeeded((prev) => ({ ...prev, projects: true }));
      setMessage('✅ Projects collection đã được seed!');
    } catch (err) {
      setMessage(`❌ Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(null);
    }
  };

  const handleReset = async (target: ResetTarget) => {
    setResetConfirm(null);
    setResetting(target);
    setMessage('');
    try {
      const cfg = PROJECT_SEEDS.find((p) => p.key === target)!;
      const deleted = await clearProjectData(target, cfg.subcollections);
      setSeededProjects((prev) => {
        const next = new Set(prev);
        next.delete(target);
        return next;
      });
      setMessage(`✅ Reset "${cfg.label}" hoàn tất — đã xóa ${deleted} documents & project doc.`);
    } catch (err) {
      setMessage(`❌ Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setResetting(null);
    }
  };

  const handleSeedMembers = async () => {
    setSeeding('__members__');
    setMessage('');
    try {
      const result = await seedMembers();
      setSeeded((prev) => ({ ...prev, members: true }));
      setMessage(result.created > 0 ? `✅ Đã seed ${result.created} members!` : '✅ Members đã tồn tại, bỏ qua.');
    } catch (err) {
      setMessage(`❌ Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(null);
    }
  };

  const isProjectsSeeded = seeded.projects;
  const isSeedingProjects = seeding === '__projects__';
  const isMembersSeeded = seeded.members;
  const isSeedingMembers = seeding === '__members__';

  return (
    <div className='max-w-150 mx-auto'>
      <SimplePageHeader
        title='🌱 Seed Firestore'
        summary='Seed dữ liệu mẫu vào Firestore. Reset xóa toàn bộ data (project doc + subcollections) rồi Seed lại từ đầu.'
        segments={BREADCRUMBS.adminSeed}
      />
      <div className='bg-card border border-border panel p-8'>

        {/* Projects collection seed */}
        <div className='mb-4'>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            1. Seed danh sách Projects
          </div>
          <button
            onClick={handleSeedProjects}
            disabled={!!seeding || isProjectsSeeded}
            className={`w-full h-10 rounded-sm font-semibold text-sm transition-colors flex items-center justify-center gap-2
              ${isProjectsSeeded
                ? 'bg-green-500/10 border border-green-500/30 text-green-500 cursor-default'
                : isSeedingProjects
                  ? 'bg-primary text-white'
                  : 'border border-foreground/20 bg-secondary hover:bg-muted text-foreground'}`}
          >
            {isSeedingProjects && <span className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin' />}
            <span>🗂️</span>
            <span>Seed Projects Collection (3 projects)</span>
            {isProjectsSeeded && <span>✓</span>}
          </button>
        </div>

        {/* Members collection seed */}
        <div className='mb-4'>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            2. Seed danh sách Members
          </div>
          <button
            onClick={handleSeedMembers}
            disabled={!!seeding || isMembersSeeded}
            className={`w-full h-10 rounded-sm font-semibold text-sm transition-colors flex items-center justify-center gap-2
              ${isMembersSeeded
                ? 'bg-green-500/10 border border-green-500/30 text-green-500 cursor-default'
                : isSeedingMembers
                  ? 'bg-primary text-white'
                  : 'border border-foreground/20 bg-secondary hover:bg-muted text-foreground'}`}
          >
            {isSeedingMembers && <span className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin' />}
            <span>👤</span>
            <span>Seed Members Collection (15 members)</span>
            {isMembersSeeded && <span>✓</span>}
          </button>
        </div>

        {/* Per-project seed */}
        <div>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            3. Seed data theo Project
          </div>
          <div className='flex flex-col gap-2'>
            {PROJECT_SEEDS.map((project) => {
              const isSeeded = seededProjects.has(project.key);
              const isSeeding = seeding === project.key;
              return (
                <div key={project.key} className='flex items-center gap-3 p-3 rounded-sm border border-foreground/20 bg-secondary'>
                  <span className='text-xl'>{project.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <div className='text-[13px] font-semibold text-foreground'>{project.label}</div>
                    <div className='text-[12px] text-muted-foreground truncate'>{project.description}</div>
                  </div>
                  <button
                    onClick={() => handleSeed(project)}
                    disabled={!!seeding || isSeeded}
                    className={`shrink-0 h-8 px-4 rounded-sm font-semibold text-[12px] transition-colors flex items-center gap-1.5
                      ${isSeeded
                        ? 'bg-green-500/10 border border-green-500/30 text-green-500 cursor-default'
                        : isSeeding
                          ? 'bg-primary text-white'
                          : 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'}`}
                  >
                    {isSeeding && <span className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin' />}
                    {isSeeded ? '✓ Seeded' : 'Seed'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset / Danger Zone */}
        <div className='border-t border-red-500/30 pt-4 mt-6'>
          <div className='text-[12px] font-semibold text-red-500 uppercase tracking-wider mb-3'>
            ⚠️ Danger Zone — Reset data (xóa toàn bộ + project doc)
          </div>
          <div className='flex flex-col gap-1.5'>
            {PROJECT_SEEDS.map((cfg) => {
              const isResetting = resetting === cfg.key;
              const isConfirming = resetConfirm === cfg.key;
              const isSeeded = seededProjects.has(cfg.key);
              return (
                <div key={cfg.key} className='flex items-center gap-2 h-9'>
                  <span className='text-[12px] text-muted-foreground flex-1'>
                    {cfg.icon} {cfg.label}
                    {isSeeded && <span className='ml-2 text-green-500/60'>— đã seed</span>}
                  </span>
                  {isConfirming ? (
                    <>
                      <span className='text-[12px] text-red-500'>Xác nhận xóa?</span>
                      <Button size='sm' variant='destructive' onClick={() => handleReset(cfg.key)}>
                        Xóa
                      </Button>
                      <button
                        onClick={() => setResetConfirm(null)}
                        className='h-7 px-3 rounded-sm border border-foreground/20 bg-secondary text-muted-foreground text-[12px] hover:bg-muted transition-colors'
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setResetConfirm(cfg.key)}
                      disabled={!!seeding || !!resetting || !isSeeded}
                      className='h-7 px-3 rounded-sm border border-red-500/40 text-red-500 text-[12px] font-medium hover:bg-red-500/10 transition-colors disabled:opacity-30 flex items-center gap-1.5'
                    >
                      {isResetting && <span className='w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin' />}
                      Reset
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className='text-[11px] text-muted-foreground/60 mt-2'>
            Reset xóa project doc + toàn bộ subcollections. Sau reset, bấm &quot;Seed&quot; để tạo lại data từ đầu.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 rounded-sm px-4 py-3 text-[13px] ${message.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-500' : 'bg-red-500/10 border border-red-500/30 text-red-500'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
