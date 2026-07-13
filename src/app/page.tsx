'use client';
import './landing-page.css';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ActivitySquareIcon, ArrowRightIcon, BarChart2Icon, BugIcon, CheckSquareIcon, FileTextIcon, GanttChartIcon, GithubIcon, MessageSquareIcon, ShieldAlertIcon, ShieldCheckIcon, UsersIcon, WalletIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';

// ActivitySquareIcon for lucide-react named import compatibility
const ActivityIcon = ActivitySquareIcon;

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className='landing-page-root min-h-screen relative' data-landing-page style={{ background: 'var(--lp-bg-base)', color: 'var(--lp-text-primary)' }}>
      <SectionProgressIndicator />
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <OpenSourceSection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}

function SectionProgressIndicator() {
  const sections = useMemo(
    () => [
      { id: 'about', label: 'About' },
      { id: 'products', label: 'Sản phẩm' },
      { id: 'services', label: 'Dịch vụ' },
      { id: 'contact', label: 'Liên hệ' },
    ],
    [],
  );
  const [activeId, setActiveId] = useState<string>('about');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            setActiveId(section.id);
          }
        },
        { threshold: 0.35, rootMargin: '-20% 0px -45% 0px' },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  return (
    <motion.aside className='fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
      {sections.map((section) => {
        const active = section.id === activeId;
        return (
          <a key={section.id} href={`#${section.id}`} className='group flex items-center justify-end gap-2' title={section.label}>
            <span className='text-[12px] font-mono-dm uppercase tracking-[1.2px] transition-all duration-200 opacity-0 group-hover:opacity-100' style={{ color: active ? 'var(--lp-primary)' : 'var(--lp-text-muted)' }}>
              {section.label}
            </span>
            <motion.span
              className='block rounded-full'
              animate={{
                width: active ? 22 : 8,
                height: 8,
                backgroundColor: active ? 'var(--lp-primary)' : 'var(--lp-border)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            />
          </a>
        );
      })}
    </motion.aside>
  );
}

/* ─────────────────────────────── SHARED VARIANTS ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeUpFast = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* ─────────────────────────────── NAV ─────────────────────────────── */
function LandingNav() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-15 border-b'
      style={{
        background: 'rgba(7, 8, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--lp-border)',
      }}
    >
      {/* Logo */}
      <div className='flex items-center gap-2.5'>
        <motion.div
          className='w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[14px] text-white'
          style={{ background: 'linear-gradient(135deg, var(--lp-primary), #9b6ef3)' }}
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          ⊞
        </motion.div>
        <span className='font-sans text-[16px] font-bold tracking-tight'>ProjectOS</span>
      </div>

      {/* Links */}
      <div className='hidden md:flex items-center gap-7 text-[13px]' style={{ color: 'var(--lp-text-secondary)' }}>
        {['About', 'Sản phẩm', 'Dịch vụ', 'Liên hệ'].map((label, i) => (
          <motion.a key={label} href={['#about', '#products', '#services', '#contact'][i]} className='hover:text-white transition-colors relative' whileHover={{ y: -1 }} style={{ display: 'inline-block' }}>
            {label}
          </motion.a>
        ))}
      </div>

      {/* CTAs */}
      <div className='flex items-center gap-2.5'>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href='/login' className='hidden sm:flex items-center h-8.5 px-4 rounded-sm text-[13px] font-medium' style={{ color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}>
            Đăng nhập
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href='/login' className='flex items-center h-8.5 px-4 rounded-sm text-[13px] font-semibold text-white' style={{ background: 'var(--lp-primary)' }}>
            Dùng thử miễn phí
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <motion.section id='about' ref={ref} className='relative overflow-hidden pt-20 pb-24 px-6'>
      {/* Background glow */}
      <motion.div
        className='absolute top-0 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 124, 247, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />

      <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center'>
        {/* Left: text content */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-6 relative'
            style={{
              background: 'var(--lp-primary-muted)',
              border: '1px solid var(--lp-primary-border)',
              color: 'var(--lp-primary)',
            }}
          >
            <span className='w-1.5 h-1.5 rounded-full animate-pulse' style={{ background: 'var(--lp-primary)' }} />
            Mã nguồn mở · Miễn phí mãi mãi
          </motion.div>

          {/* Headline */}
          <motion.h1 className='font-sans font-bold text-[38px] md:text-[54px] leading-[1.15] mb-5 relative' variants={fadeUp} initial='hidden' animate='visible' transition={{ delay: 0.2, duration: 0.5 }}>
            Quản lý dự án{' '}
            <span
              className='inline-block'
              style={{
                background: 'linear-gradient(135deg, var(--lp-primary) 0%, #9b6ef3 50%, #e879f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              thế hệ mới
            </span>
            <br />
            dành cho team kỹ thuật
          </motion.h1>

          {/* Subheadline */}
          <motion.p className='text-[16px] md:text-[18px] leading-relaxed mb-8 max-w-xl' style={{ color: 'var(--lp-text-secondary)' }} variants={fadeUpFast} initial='hidden' animate='visible' transition={{ delay: 0.35, duration: 0.4 }}>
            Tích hợp Task, Sprint, Bug Tracker, Budget, Timeline và Team trong một nền tảng duy nhất. Không cần cấu hình phức tạp.
          </motion.p>

          {/* CTA buttons */}
          <motion.div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 relative' variants={container} initial='hidden' animate='visible'>
            <motion.div variants={fadeUpFast} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href='/login' className='flex items-center gap-2 h-11.5 px-7 rounded-sm text-[14px] font-semibold text-white' style={{ background: 'linear-gradient(135deg, var(--lp-primary), #9b6ef3)' }}>
                Bắt đầu ngay
                <ArrowRightIcon size={15} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUpFast} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a href='https://github.com' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 h-11.5 px-7 rounded-sm text-[14px] font-medium' style={{ border: '1px solid var(--lp-border)', color: 'var(--lp-text-secondary)' }}>
                <GithubIcon size={15} />
                Xem trên GitHub
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Right: visual panel */}
        <motion.div className='relative' style={{ y, opacity }}>
          <motion.div className='absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full pointer-events-none' style={{ background: 'rgba(139, 124, 247, 0.2)', filter: 'blur(24px)' }} />
          <motion.div initial={{ opacity: 0, y: 60, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}>
            <ProductPreview />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function ProductPreview() {
  return (
    <div
      className='rounded-sm overflow-hidden relative'
      style={{
        border: '1px solid var(--lp-border)',
        background: 'var(--lp-bg-surface)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,124,247,0.1)',
      }}
    >
      {/* Topbar */}
      <div className='flex items-center gap-2 px-4 h-10 border-b' style={{ background: 'var(--lp-bg-base)', borderColor: 'var(--lp-border)' }}>
        <div className='flex gap-1.5'>
          {['#ff5f5f', '#f5c518', '#3dd68c'].map((c) => (
            <div key={c} className='w-2.5 h-2.5 rounded-full' style={{ background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div className='flex-1 flex justify-center'>
          <div className='h-5 w-48 rounded-sm' style={{ background: 'var(--lp-bg-elevated)' }} />
        </div>
      </div>

      <div className='flex'>
        {/* Sidebar */}
        <div className='hidden sm:flex flex-col w-45 shrink-0 p-3 gap-1 border-r' style={{ background: 'var(--lp-bg-base)', borderColor: 'var(--lp-border)' }}>
          {[
            { label: 'Dashboard', active: true },
            { label: 'Tasks', active: false },
            { label: 'Sprint Board', active: false },
            { label: 'Bug Tracker', active: false },
            { label: 'Timeline', active: false },
            { label: 'Budget', active: false },
            { label: 'Team', active: false },
          ].map((item) => (
            <div
              key={item.label}
              className='h-7 rounded-sm px-2.5 flex items-center text-[12px] font-medium'
              style={{
                background: item.active ? 'var(--lp-primary-muted)' : 'transparent',
                color: item.active ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className='flex-1 p-4'>
          <div className='grid grid-cols-3 gap-2.5 mb-3'>
            {[
              { label: 'Tasks hoàn thành', value: '0', color: 'var(--lp-success)' },
              { label: 'Bugs đang mở', value: '0', color: 'var(--lp-danger)' },
              { label: 'Sprint progress', value: '0%', color: 'var(--lp-primary)' },
            ].map((s) => (
              <div key={s.label} className='rounded-sm p-3' style={{ background: 'var(--lp-bg-elevated)', border: '1px solid var(--lp-border)' }}>
                <div className='text-[9px] mb-1' style={{ color: 'var(--lp-text-muted)' }}>
                  {s.label}
                </div>
                <div className='font-sans text-[18px] font-bold' style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className='grid grid-cols-2 gap-2.5'>
            <div className='rounded-sm p-3' style={{ background: 'var(--lp-bg-elevated)', border: '1px solid var(--lp-border)' }}>
              <div className='text-[9px] font-semibold mb-2' style={{ color: 'var(--lp-text-secondary)' }}>
                Sprint 08 Progress
              </div>
              <div className='h-1.5 rounded-full mb-1' style={{ background: 'var(--lp-text-muted)' }}>
                <div className='h-full rounded-full w-[68%]' style={{ background: 'var(--lp-primary)' }} />
              </div>
              <div className='text-[8px]' style={{ color: 'var(--lp-text-muted)' }}>
                No tasks yet
              </div>
            </div>
            <div className='rounded-sm p-3' style={{ background: 'var(--lp-bg-elevated)', border: '1px solid var(--lp-border)' }}>
              <div className='text-[9px] font-semibold mb-2' style={{ color: 'var(--lp-text-secondary)' }}>
                Task ưu tiên cao
              </div>
              {['Tạo project đầu tiên', 'Thêm task thật', 'Mời thành viên'].map((t, i) => (
                <div key={t} className='flex items-center gap-1.5 mb-1'>
                  <div className='w-2.5 h-2.5 rounded-sm' style={{ background: i === 0 ? 'var(--lp-primary)' : 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} />
                  <span className='text-[8px]' style={{ color: 'var(--lp-text-secondary)' }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── FEATURES ────────────────────────────── */
const FEATURES = [
  {
    icon: CheckSquareIcon,
    color: '#6c63ff',
    bg: 'rgba(108,99,255,0.12)',
    title: 'Task Management',
    tag: 'Kanban · List · Calendar',
    desc: '3 chế độ xem: Kanban board với drag-and-drop, danh sách có phân trang 20 items/trang, và Calendar view theo ngày. Sprint board kết hợp Task + Bug trên cùng Kanban. Auto-categorize task bằng tiêu đề vào Frontend, Backend, Testing, DevOps, Design. Group by Status, Priority, Assignee. Sprint planning với gán task vào sprint, tracking completion %.',
  },
  {
    icon: BugIcon,
    color: '#ff5f5f',
    bg: 'rgba(255,95,95,0.12)',
    title: 'Bug Tracker',
    tag: 'Kanban · Severity · Assignee',
    desc: 'Ghi nhận bug với 5 mức severity: Critical, High, Medium, Low. Group theo Status, Severity, Assignee. Kanban drag-drop tự động set resolvedAt khi move sang Fixed. Bug + Task cùng hiển thị trên Sprint board. Filter theo sprint, search theo title/id. Auto-generated ID: BUG-01, BUG-02...',
  },
  {
    icon: WalletIcon,
    color: '#3dd68c',
    bg: 'rgba(61,214,140,0.12)',
    title: 'Budget & Expenses',
    tag: 'VND · Categories · Alerts',
    desc: 'Theo dõi ngân sách chi tiết theo hạng mục (category). Ghi nhận expense entries với thông tin người chi, ngày, số tiền. Link expense đến team member. Cảnh báo overspend. Budget stats panel tổng hợp planned vs. actual. Currency VND format.',
  },
  {
    icon: GanttChartIcon,
    color: '#f5c518',
    bg: 'rgba(245,197,24,0.12)',
    title: 'Timeline & Milestones',
    tag: 'Gantt · Epics · MS',
    desc: 'Gantt chart trực quan hóa các Epic theo date range và progress. Milestone tracking với 4 trạng thái: Upcoming, In Progress, Completed, Delayed. CRUD milestones với giao diện table. Epic stats grid hiển thị tổng quan. Tất cả dữ liệu từ API, real-time.',
  },
  {
    icon: UsersIcon,
    color: '#b06ef3',
    bg: 'rgba(176,110,243,0.12)',
    title: 'Team & Workload',
    tag: 'Join · Role · Status',
    desc: 'Quản lý thành viên riêng theo từng dự án. Member picker gán role cụ thể cho project (Frontend Lead, Backend Dev, QA, BA, PO...). Team stats panel với workload %, health score, radial chart. Danh sách thành viên global tại /admin/members. Cảnh báo overloaded.',
  },
  {
    icon: FileTextIcon,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    title: 'Docs & Wiki',
    tag: 'Markdown · Upload · Search',
    desc: 'Wiki pages với full Markdown editor và live preview. Upload file lên Spring/PostgreSQL Storage với preview trong app. 7 loại file preview: PDF, Image, Video, Office docs. File metadata: title, type, size, author, tags. Xóa file đồng thời xóa cả Storage reference. Search toàn văn bản trong wiki.',
  },
  {
    icon: MessageSquareIcon,
    color: '#ff9f43',
    bg: 'rgba(255,159,67,0.12)',
    title: 'Meetings & Action Items',
    tag: 'Calendar · Notes · Attendees',
    desc: 'Meeting list với 3 view: List, Card, Calendar. Ghi chú cuộc họp (notes), attendance tracking, action items có assignee + due date. Filter theo tháng, attendee, important. Import danh sách người họp từ team members. Auto-generated ID: M-01, M-02...',
  },
  {
    icon: ShieldAlertIcon,
    color: '#f53b57',
    bg: 'rgba(245,59,87,0.12)',
    title: 'Risk Register',
    tag: 'Matrix · Mitigation · Owner',
    desc: 'Risk register đầy đủ với probability × impact matrix. 4 mức risk: Low, Medium, High, Critical. Mitigation plan và owner assignment. Track status: Identified → Mitigating → Resolved → Accepted. Fresh data refetch khi mở dialog. Auto-generated ID: R-001, R-002...',
  },
  {
    icon: ActivityIcon,
    color: '#0abde3',
    bg: 'rgba(10,189,227,0.12)',
    title: 'Activity Feed',
    tag: 'Real-time · Comments · Notifications',
    desc: 'Activity feed tự động tổng hợp từ Tasks, Bugs, Sprints, Meetings. Mỗi entry có avatar, content bold-formatted, relative timestamp ("2 hours ago"). Team comments trên discussion thread. Notifications system riêng. Top 30 entries, sorted by timestamp. Stats: tasks done, bugs open, active sprints.',
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id='products' className='py-20 px-6' ref={ref}>
      <div className='max-w-5xl mx-auto'>
        {/* Header */}
        <motion.div className='text-center mb-12' initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1, duration: 0.3 }}
            className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-4'
            style={{ background: 'var(--lp-primary-muted)', border: '1px solid var(--lp-primary-border)', color: 'var(--lp-primary)' }}
          >
            <ZapIcon size={11} />
            Tính năng đầy đủ
          </motion.div>
          <h2 className='font-sans text-[32px] md:text-[38px] font-bold mb-3'>Mọi thứ team cần, trong một nơi</h2>
          <p className='text-[15px] max-w-lg mx-auto' style={{ color: 'var(--lp-text-secondary)' }}>
            Từ task nhỏ nhất đến báo cáo tổng kết dự án — không cần chuyển qua lại giữa nhiều tool.
          </p>
        </motion.div>

        {/* Feature grid — staggered */}
        <motion.div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' variants={container} initial='hidden' animate={inView ? 'visible' : 'hidden'}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={cardVariant}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(139,124,247,0.15)', borderColor: 'rgba(139,124,247,0.4)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className='rounded-sm p-5 cursor-default'
                style={{ background: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)' }}
              >
                <motion.div className='w-9 h-9 rounded-sm flex items-center justify-center mb-3.5' style={{ background: f.bg }} whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  <Icon size={17} style={{ color: f.color }} />
                </motion.div>
                <div className='font-sans text-[15px] font-bold mb-0.5'>{f.title}</div>
                <div className='text-[12px] font-mono-dm uppercase tracking-widest mb-2.5' style={{ color: f.color, opacity: 0.7 }}>
                  {f.tag}
                </div>
                <p className='text-[13px] leading-relaxed' style={{ color: 'var(--lp-text-secondary)' }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────── OPEN SOURCE ──────────────────────────── */
function OpenSourceSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id='services' className='py-20 px-6' ref={ref}>
      <motion.div
        className='max-w-4xl mx-auto rounded-sm overflow-hidden relative'
        initial={{ opacity: 0, scale: 0.97 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        style={{
          background: 'linear-gradient(135deg, var(--lp-primary-muted) 0%, rgba(176,110,243,0.08) 100%)',
          border: '1px solid var(--lp-primary-border)',
        }}
      >
        {/* Background glow */}
        <motion.div
          className='absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none'
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(176,110,243,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <div className='relative p-10 md:p-14 text-center'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-6'
            style={{ background: 'var(--lp-success-muted)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--lp-success)' }}
          >
            <ShieldCheckIcon size={11} />
            100% Mã nguồn mở
          </motion.div>

          <motion.h2 className='font-sans text-[30px] md:text-[38px] font-bold mb-4' initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.4 }}>
            Miễn phí mãi mãi.
            <br />
            <span style={{ color: 'var(--lp-primary)' }}>Tự deploy. Toàn quyền kiểm soát.</span>
          </motion.h2>

          <motion.p className='text-[15px] max-w-lg mx-auto mb-10 leading-relaxed' style={{ color: 'var(--lp-text-secondary)' }} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.4 }}>
            Không phí subscription. Không vendor lock-in. Dữ liệu của bạn nằm trên Spring/PostgreSQL của bạn. Deploy lên Vercel trong vài phút.
          </motion.p>

          {/* Stats */}
          <motion.div className='grid grid-cols-3 gap-6 max-w-sm mx-auto mb-10' initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.35, duration: 0.4 }}>
            {[
              { value: '100%', label: 'Free forever' },
              { value: '14+', label: 'Modules' },
              { value: '∞', label: 'Scalable' },
            ].map((s) => (
              <div key={s.label}>
                <div className='font-sans text-[28px] font-bold' style={{ color: 'var(--lp-primary)' }}>
                  {s.value}
                </div>
                <div className='text-[12px]' style={{ color: 'var(--lp-text-muted)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Checklist */}
          <motion.div className='flex flex-col sm:flex-row gap-3 justify-center mb-10' initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.4, duration: 0.3 }}>
            {['Spring/PostgreSQL + Next.js', 'TanStack Table + Recharts', 'Framer Motion', 'MIT License'].map((item, i) => (
              <motion.div
                key={item}
                className='flex items-center gap-2 text-[13px]'
                style={{ color: 'var(--lp-text-secondary)' }}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.45 + i * 0.06, duration: 0.3 }}
              >
                <div className='w-4 h-4 rounded-full flex items-center justify-center shrink-0' style={{ background: 'var(--lp-success-muted)' }}>
                  <CheckSquareIcon size={9} style={{ color: 'var(--lp-success)' }} />
                </div>
                {item}
              </motion.div>
            ))}
          </motion.div>

          <motion.a
            href='https://github.com'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 h-11 px-7 rounded-sm text-[14px] font-semibold text-white'
            style={{ background: 'var(--lp-bg-elevated)', border: '1px solid var(--lp-primary-border)' }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(139,124,247,0.3)' }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.55, duration: 0.3 }}
          >
            <GithubIcon size={15} />
            Xem source code
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────── CONTACT ──────────────────────────────── */
function ContactSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id='contact' className='py-20 px-6' ref={ref}>
      <motion.div className='max-w-2xl mx-auto text-center' initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}>
        <motion.h2 className='font-sans text-[32px] md:text-[38px] font-bold mb-4' initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.4 }}>
          Sẵn sàng bắt đầu?
        </motion.h2>
        <motion.p className='text-[15px] mb-10 leading-relaxed' style={{ color: 'var(--lp-text-secondary)' }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2, duration: 0.3 }}>
          Tạo workspace miễn phí trong vài phút. Không cần thẻ tín dụng. Không cần cấu hình phức tạp.
        </motion.p>

        <motion.div className='flex flex-col sm:flex-row items-center justify-center gap-3 mb-14' initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.3 }}>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link href='/login' className='flex items-center gap-2 h-12 px-8 rounded-sm text-[15px] font-semibold text-white' style={{ background: 'linear-gradient(135deg, var(--lp-primary), #9b6ef3)' }}>
              Tạo tài khoản miễn phí
              <ArrowRightIcon size={15} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <a href='mailto:hello@projectos.dev' className='flex items-center gap-2 h-12 px-8 rounded-sm text-[15px] font-medium' style={{ border: '1px solid var(--lp-border)', color: 'var(--lp-text-secondary)' }}>
              Liên hệ với chúng tôi
            </a>
          </motion.div>
        </motion.div>

        {/* Contact info */}
        <motion.div className='flex flex-col sm:flex-row items-center justify-center gap-6 text-[13px]' style={{ color: 'var(--lp-text-muted)' }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.45, duration: 0.3 }}>
          <a href='mailto:hello@projectos.dev' className='flex items-center gap-2 hover:text-white transition-colors'>
            <BarChart2Icon size={13} />
            hello@projectos.dev
          </a>
          <a href='https://github.com' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 hover:text-white transition-colors'>
            <GithubIcon size={13} />
            github.com/projectos
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────── FOOTER ──────────────────────────────── */
function LandingFooter() {
  return (
    <footer className='border-t px-6 py-8' style={{ borderColor: 'var(--lp-border)' }}>
      <div className='max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>
        {/* Brand */}
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-sm flex items-center justify-center font-bold text-[12px] text-white' style={{ background: 'linear-gradient(135deg, var(--lp-primary), #9b6ef3)' }}>
            ⊞
          </div>
          <span className='font-sans text-[14px] font-bold'>ProjectOS</span>
        </div>

        {/* Links */}
        <div className='flex items-center gap-6 text-[12px]' style={{ color: 'var(--lp-text-muted)' }}>
          {['About', 'Sản phẩm', 'Dịch vụ', 'Đăng nhập', 'GitHub'].map((label, i) => (
            <a key={label} href={['#about', '#products', '#services', '/login', 'https://github.com'][i]} target={i === 3 ? '_blank' : undefined} rel={i === 3 ? 'noopener noreferrer' : undefined} className='hover:text-white transition-colors'>
              {label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className='text-[12px]' style={{ color: 'var(--lp-text-muted)' }}>
          © 2025 ProjectOS · MIT License
        </div>
      </div>
    </footer>
  );
}
