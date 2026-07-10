'use client';
import { BarChart2Icon, BugIcon, CheckSquareIcon, GanttChartIcon, LockIcon, MailIcon, MessageSquareIcon, ShieldCheckIcon, UsersIcon, WalletIcon, ZapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getInlineErrorTextClass, getPlainLabelErrorClass } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { platformAuth } from '@/lib/platform-api/client';
import { useAuthStore } from '@/store/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Địa chỉ email không hợp lệ.'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: CheckSquareIcon, text: 'Quản lý Tasks & Sprints' },
  { icon: GanttChartIcon, text: 'Timeline & Gantt Chart' },
  { icon: UsersIcon, text: 'Cộng tác Team' },
  { icon: BugIcon, text: 'Theo dõi Bugs' },
  { icon: WalletIcon, text: 'Quản lý Budget' },
  { icon: BarChart2Icon, text: 'Reports & Analytics' },
  { icon: MessageSquareIcon, text: 'Comments & Meetings' },
  { icon: ShieldCheckIcon, text: 'Risk Management' },
];

function getSafeCallbackUrl() {
  if (typeof window === 'undefined') return '/dashboard';

  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/dashboard';
  }

  return callbackUrl;
}

export default function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  // Redirect to dashboard when authenticated (only after hydration, no SSR conflict)
  useEffect(() => {
    if (user) {
      window.location.href = getSafeCallbackUrl();
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async (values: LoginFormValues) => {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await platformAuth.login(values.email, values.password);
        window.location.assign(getSafeCallbackUrl());
      } else {
        await platformAuth.register(values.email, values.password, values.email.split('@')[0]);
        window.location.assign(getSafeCallbackUrl());
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      const callback = encodeURIComponent(getSafeCallbackUrl());
      const result = { error: null, url: `/api/v1/oauth2/authorization/google?callbackUrl=${callback}` };
      if (result?.error) {
        setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        setSubmitting(false);
        return;
      }
      // NextAuth v5: signIn returns { url } with the OAuth redirect URL
      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.assign(getSafeCallbackUrl());
      }
    } catch {
      setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  // Wait for NextAuth to initialize
  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center' style={{ background: 'var(--background)' }}>
        <div className='w-8 h-8 border-2 rounded-full animate-spin' style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen' style={{ background: 'var(--background)' }}>
      {/* ── LEFT PANEL – INTRO ──────────────────────────────────────── */}
      <div className='hidden lg:flex flex-col justify-between relative w-1/2 min-h-screen overflow-hidden'>
        {/* Ambient background blobs */}
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute -top-40 -left-40 w-120 h-120 rounded-full' style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)' }} />
          <div className='absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-120 h-120 rounded-full' style={{ background: 'radial-gradient(circle, rgba(176,110,243,0.12) 0%, transparent 70%)' }} />
          <div className='absolute -bottom-20 right-0 w-120 h-120 rounded-full' style={{ background: 'radial-gradient(circle, rgba(61,214,140,0.08) 0%, transparent 70%)' }} />

          {/* Grid pattern overlay */}
          <div
            className='absolute inset-0 opacity-[0.03]'
            style={{
              backgroundImage: 'linear-gradient(rgba(108,99,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Top bar */}
        <div className='relative z-10 flex items-center justify-between p-10'>
          <div className='flex items-center gap-3'>
            <div className='h-15 px-2.5 shrink-0 flex items-center'>
              <svg width='36' height='36' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <rect x='2' y='2' width='24' height='24' rx='5' fill='var(--primary)' fillOpacity='0.15' stroke='var(--primary)' strokeWidth='1.5'></rect>
                <rect x='6' y='6' width='6' height='6' rx='1.5' fill='var(--primary)'></rect>
                <rect x='16' y='6' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.6'></rect>
                <rect x='6' y='16' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.6'></rect>
                <rect x='16' y='16' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.3'></rect>
              </svg>
            </div>
            <div className='h-15 shrink-0 flex items-center'>
              <div className='font-sans text-[32px] font-extrabold tracking-[-0.5px] text-nowrap'>
                Project <span className='text-primary'>OS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className='relative z-10 px-14 py-8'>
          {/* Headline */}
          <div className='mb-8'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6'>
              <ZapIcon className='size-3.5' style={{ color: 'var(--primary)' }} strokeWidth={2} />
              <span className='text-[12px] font-semibold tracking-wide uppercase' style={{ color: 'var(--primary)' }}>
                Nền tảng quản lý dự án
              </span>
            </div>

            <h1 className='font-sans text-[36px] xl:text-[42px] font-bold leading-[1.2] mb-5' style={{ color: 'var(--foreground)' }}>
              Quản lý dự án
              <span className='mx-2' style={{ color: 'var(--primary)' }}>
                thế hệ mới
              </span>
            </h1>

            <p className='text-lg leading-relaxed' style={{ color: 'var(--muted-foreground)' }}>
              Tập trung, minh bạch, hiệu quả. Nền tảng toàn diện cho đội nhóm kỹ thuật hiện đại.
            </p>
          </div>

          {/* Feature grid */}
          <div className='grid grid-cols-2 gap-2'>
            {features.map(({ icon: Icon, text }) => (
              <Card key={text} className='py-3 px-3 bg-muted/25 border-muted/20'>
                <div className='flex items-center gap-2.5'>
                  <Icon className='size-5 shrink-0 text-primary' strokeWidth={1.8} />
                  <span className='text-foreground'>{text}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className='mt-8 rounded-sm border border-border/60 bg-muted/20 px-4 py-3'>
            <span className='text-[12px] text-muted-foreground'>
              Workspace mới bắt đầu trống và lưu dữ liệu thật vào PostgreSQL.
            </span>
          </div>
        </div>

        {/* Bottom quote */}
        <div className='relative z-10 px-10 pb-10'>
          <div className='border-t pt-6' style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className='text-[13px] leading-relaxed' style={{ color: 'var(--muted)' }}>
              Không nạp dữ liệu mẫu. Người dùng tự tạo project, task, team và báo cáo từ dữ liệu thật.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL – FORM ─────────────────────────────────────── */}
      <div className='flex flex-1 items-center justify-center p-6 lg:p-14'>
        <div className='w-full max-w-100'>
          {/* Mobile logo */}

          {/* Card */}
          <Card className='w-full shadow-xl'>
            <CardHeader className='space-y-1 pb-2'>
              <CardTitle className='text-[24px] font-bold'>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</CardTitle>
              <CardDescription>{mode === 'login' ? 'Đăng nhập để truy cập workspace của bạn.' : 'Điền thông tin để bắt đầu với ProjectOS.'}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* OAuth buttons */}
              <div className='flex flex-col gap-3'>
                <Button variant='outline' size='lg' className='w-full gap-3' onClick={handleGoogle} disabled={submitting}>
                  <GoogleIcon />
                  Tiếp tục với Google
                </Button>
              </div>

              <div className='flex items-center gap-3 my-6'>
                <div className='flex-1 h-px' style={{ background: 'var(--border)' }} />
                <span className='text-[12px] shrink-0' style={{ color: 'var(--foreground)' }}>
                  hoặc
                </span>
                <div className='flex-1 h-px' style={{ background: 'var(--border)' }} />
              </div>

              {/* Email form */}
              <form noValidate onSubmit={handleSubmit(handleEmailSubmit)} className='space-y-6'>
                {/* Email field */}
                <div className='space-y-1.5'>
                  <Label htmlFor='email' className={getPlainLabelErrorClass(!!errors.email)}>
                    Email
                  </Label>
                  <div className='relative'>
                    <MailIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' strokeWidth={1.8} />
                    <Input id='email' type='email' autoComplete='email' placeholder='you@company.com' className={cn('pl-10', errors.email && 'border-destructive')} aria-invalid={!!errors.email} {...register('email')} />
                  </div>
                  {errors.email?.message && <span className={getInlineErrorTextClass()}>{errors.email.message}</span>}
                </div>

                {/* Password field */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='password' className={getPlainLabelErrorClass(!!errors.password)}>
                      Mật khẩu
                    </Label>
                    {mode === 'login' && (
                      <Button variant='link' size='sm' className='h-auto p-0 text-[12px] text-primary'>
                        Quên mật khẩu?
                      </Button>
                    )}
                  </div>
                  <div className='relative'>
                    <LockIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' strokeWidth={1.8} />
                    <Input id='password' type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder='••••••••' className={cn('pl-10 pr-10', errors.password && 'border-destructive')} aria-invalid={!!errors.password} {...register('password')} />
                    <Button type='button' variant='ghost' size='icon' className='absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent text-muted-foreground' onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                  </div>
                  {errors.password?.message && <span className={getInlineErrorTextClass()}>{errors.password.message}</span>}
                </div>

                {/* Error alert */}
                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription className='text-[12px]'>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit button */}
                <Button type='submit' size='lg' className='w-full mt-1' disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      {mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}
                    </>
                  ) : mode === 'login' ? (
                    'Đăng nhập'
                  ) : (
                    'Tạo tài khoản'
                  )}
                </Button>
              </form>

              {/* Toggle mode */}
              <p className='text-center text-[12px] text-muted-foreground'>
                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                <Button
                  variant='link'
                  size='sm'
                  className='h-auto p-0 text-[12px] font-medium text-primary'
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                >
                  {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className='text-center text-[12px] mt-6' style={{ color: 'rgba(255,255,255,0.3)' }}>
            Bằng việc tiếp tục, bạn đồng ý với <br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Điều khoản sử dụng</span> & <span style={{ color: 'rgba(255,255,255,0.4)' }}>Chính sách bảo mật</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── SVG ICONS ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width='17' height='17' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='#4285F4' />
      <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='#34A853' />
      <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' fill='#FBBC05' />
      <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='#EA4335' />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  );
}
