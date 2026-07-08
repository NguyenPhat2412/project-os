'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CameraIcon, SaveIcon, Phone, Building2, Briefcase, Globe, FileText, Lightbulb, Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { profileConfig, type UserProfile, type NotificationPrefs } from '@/lib/project-config';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';

// ── Constants ──────────────────────────────────────────────────────────────────
const TIMEZONES = ['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'UTC'];

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA / Testing', 'DevOps', 'Data / Analytics', 'Marketing', 'Sales', 'HR / People', 'Finance', 'Operations', 'Security', 'Legal', 'Customer Success'];

const SKILL_SUGGESTIONS = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'AWS',
  'GCP',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'Figma',
  'GraphQL',
  'REST API',
  'CI/CD',
  'Agile',
  'Scrum',
  'Product Management',
  'UX Research',
  'Data Analysis',
];

// ── Schema ─────────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  phone: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().max(300, 'Bio tối đa 300 ký tự.').optional(),
  skills: z.array(z.string()).optional(),
  notificationEmail: z.boolean().optional(),
  notificationDesktop: z.boolean().optional(),
  notificationSlack: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ── Shared styles ──────────────────────────────────────────────────────────────
const iCls = 'h-9 bg-secondary border-border rounded-sm text-[13px] text-white placeholder:text-muted-foreground focus:border-primary';
const iClsError = 'border-red-500 focus:border-red-500';

// ── Sub-components ─────────────────────────────────────────────────────────────

function AvatarBlock({ user }: { user: { displayName?: string | null; email?: string | null; photoURL?: string | null } }) {
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className='flex items-center gap-4'>
      <div className='relative shrink-0'>
        <div className='w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-[20px] font-bold'>
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={displayName} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
          ) : (
            initials
          )}
        </div>
        {/* Google badge */}
        <div className='absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#4285F4] text-white text-[9px] font-bold'>
          <span>G</span>
        </div>
      </div>
      <div>
        <div className='font-sans text-[15px] font-bold text-white'>{displayName}</div>
        <div className='text-[12px] text-muted-foreground mt-0.5'>{user.email}</div>
        <div className='flex items-center gap-1.5 mt-1'>
          <div className='w-1.5 h-1.5 rounded-full bg-green-500' />
          <span className='text-[12px] text-green-500 font-medium'>Đăng nhập qua Google</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      phone: profile?.phone ?? '',
      department: profile?.department ?? '',
      title: profile?.title ?? '',
      timezone: profile?.timezone ?? 'Asia/Ho_Chi_Minh',
      bio: profile?.bio ?? '',
      skills: profile?.skills ?? [],
      notificationEmail: profile?.notificationPrefs?.email ?? true,
      notificationDesktop: profile?.notificationPrefs?.desktop ?? true,
      notificationSlack: profile?.notificationPrefs?.slack ?? false,
    },
  });

  const skills = watch('skills') ?? [];
  const bioValue = watch('bio') ?? '';

  const toggleSkill = (skill: string) => {
    const current = skills;
    if (current.includes(skill)) {
      setValue(
        'skills',
        current.filter((s) => s !== skill),
        { shouldValidate: true },
      );
    } else {
      setValue('skills', [...current, skill], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setSaved(false);
    setApiError('');
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email ?? profile?.email,
        displayName: user.displayName ?? profile?.displayName,
        photoURL: user.photoURL ?? profile?.photoURL,
        phone: values.phone?.trim() || undefined,
        department: values.department || undefined,
        title: values.title?.trim() || undefined,
        timezone: values.timezone || undefined,
        bio: values.bio?.trim() || undefined,
        skills: values.skills ?? [],
        notificationPrefs: {
          email: values.notificationEmail ?? true,
          desktop: values.notificationDesktop ?? true,
          slack: values.notificationSlack ?? false,
        } as NotificationPrefs,
        updatedAt: new Date().toISOString(),
      };
      if (!payload.createdAt && !profile?.createdAt) {
        payload.createdAt = new Date().toISOString();
      }
      await profileConfig.helpers.set(user.uid, payload);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-[13px] text-muted-foreground'>Vui lòng đăng nhập để xem hồ sơ.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='font-sans text-[20px] font-bold text-white'>Hồ sơ cá nhân</div>
          <div className='text-[12px] text-muted-foreground mt-0.5'>Quản lý thông tin tài khoản của bạn</div>
        </div>
        <div className='flex items-center gap-3'>
          {saved && (
            <span className='flex items-center gap-1.5 text-[13px] text-green-500 font-medium'>
              <CheckCircle2 size={15} />
              Đã lưu
            </span>
          )}
          <Button type='submit' disabled={saving} className='h-9 px-5 bg-primary hover:bg-primary/90 text-white font-semibold text-[13px] gap-2 disabled:opacity-60'>
            {saving ? (
              <>
                <span className='w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Đang lưu...
              </>
            ) : (
              <>
                <SaveIcon size={14} />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>

      {apiError && <div className='rounded-sm px-4 py-3 bg-red-500/10 border border-red-500/30 text-[13px] text-red-500'>{apiError}</div>}

      {/* ── 2-column layout ──────────────────────────────────────────── */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-5'>
        {/* ── LEFT column (2/3) ───────────────────────────────────── */}
        <div className='xl:col-span-2 flex flex-col gap-5'>
          {/* Google Auth Info */}
          <div className='bg-card border border-border panel p-5'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
              <AvatarBlock user={user} />
            </div>
          </div>

          {/* Thông tin cá nhân — 2-col grid */}
          <div className='bg-card border border-border panel p-5'>
            <div className='font-sans text-[14px] font-bold mb-4 text-white'>Thông tin cá nhân</div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField label='Số điện thoại'>
                <div className='relative'>
                  <Phone size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                  <Input {...register('phone')} placeholder='0901 234 567' className={`${iCls} ${errors.phone ? iClsError : ''} pl-9`} />
                </div>
                {errors.phone && <span className={`${getInlineErrorTextClass()} mt-1`}>{errors.phone.message}</span>}
              </FormField>

              <FormField label='Chức danh'>
                <div className='relative'>
                  <Briefcase size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                  <Input {...register('title')} placeholder='Frontend Developer' className={`${iCls} ${errors.title ? iClsError : ''} pl-9`} />
                </div>
                {errors.title && <span className={`${getInlineErrorTextClass()} mt-1`}>{errors.title.message}</span>}
              </FormField>

              <FormField label='Phòng ban'>
                <Controller
                  control={control}
                  name='department'
                  render={({ field }) => (
                    <div className='relative'>
                      <Building2 size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10' />
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className={`${iCls} ${errors.department ? iClsError : ''} pl-9`}>
                          <SelectValue placeholder='Chọn phòng ban' />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                {errors.department && <span className={`${getInlineErrorTextClass()} mt-1`}>{errors.department.message}</span>}
              </FormField>

              <FormField label='Múi giờ'>
                <Controller
                  control={control}
                  name='timezone'
                  render={({ field }) => (
                    <div className='relative'>
                      <Globe size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10' />
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className={`${iCls} ${errors.timezone ? iClsError : ''} pl-9`}>
                          <SelectValue placeholder='Chọn múi giờ' />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </FormField>
            </div>
          </div>

          {/* Bio */}
          <div className='bg-card border border-border panel p-5'>
            <div className='font-sans text-[14px] font-bold mb-4 text-white'>Giới thiệu bản thân</div>
            <div className='relative'>
              <FileText size={13} className='absolute left-3 top-3 text-muted-foreground pointer-events-none' />
              <textarea {...register('bio')} placeholder='Mô tả ngắn về bản thân, kinh nghiệm và sở thích nghề nghiệp...' rows={4} className={`${iCls} resize-none w-full pt-2.5 pl-9 ${errors.bio ? iClsError : ''}`} />
            </div>
            <div className='flex justify-end mt-1'>
              <span className={`text-[12px] ${bioValue.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>{bioValue.length}/300</span>
            </div>
            {errors.bio && <span className={`${getInlineErrorTextClass()} mt-1`}>{errors.bio.message}</span>}
          </div>
        </div>

        {/* ── RIGHT column (1/3) ────────────────────────────────────── */}
        <div className='xl:col-span-1 flex flex-col gap-5'>
          {/* Kỹ năng */}
          <div className='bg-card border border-border panel p-5'>
            <div className='font-sans text-[14px] font-bold mb-4 text-white'>Kỹ năng</div>

            {/* Selected chips */}
            {skills.length > 0 && (
              <div className='flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border'>
                {skills.map((s) => (
                  <span key={s} className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[12px] text-primary'>
                    <Lightbulb size={9} />
                    {s}
                    <button type='button' onClick={() => toggleSkill(s)} className='ml-0.5 hover:text-white cursor-pointer leading-none'>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div className='flex flex-wrap gap-1.5'>
              {SKILL_SUGGESTIONS.map((skill) => {
                const active = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type='button'
                    onClick={() => toggleSkill(skill)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer border ${
                      active ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-white'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thông báo */}
          <div className='bg-card border border-border panel p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <Bell size={15} className='text-muted-foreground' />
              <div className='font-sans text-[14px] font-bold text-white'>Thông báo</div>
            </div>

            <div className='flex flex-col gap-4'>
              <Controller
                name='notificationEmail'
                control={control}
                render={({ field }) => (
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-[13px] text-white'>Email</div>
                      <div className='text-[12px] text-muted-foreground'>Thông báo qua email</div>
                    </div>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </div>
                )}
              />

              <div className='h-px bg-border' />

              <Controller
                name='notificationDesktop'
                control={control}
                render={({ field }) => (
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-[13px] text-white'>Desktop</div>
                      <div className='text-[12px] text-muted-foreground'>Thông báo trên trình duyệt</div>
                    </div>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </div>
                )}
              />

              <div className='h-px bg-border' />

              <Controller
                name='notificationSlack'
                control={control}
                render={({ field }) => (
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-[13px] text-white'>Slack</div>
                      <div className='text-[12px] text-muted-foreground'>Đồng bộ qua Slack</div>
                    </div>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
