'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile } from '@/lib/project-config';
import { platformApi } from '@/lib/platform-api/client';

const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  company: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const EMPTY_VALUES: UserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  website: '',
  location: '',
  role: '',
  bio: '',
  company: '',
  timezone: '',
  language: '',
};

function settingsKey(uid: string) {
  return `projectos-user-settings:${uid}`;
}

function splitName(displayName?: string | null) {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function readLocalSettings(uid: string): { values?: Partial<UserFormValues>; profileImage?: string | null } {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(settingsKey(uid)) ?? '{}');
  } catch {
    return {};
  }
}

export default function UserSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [useDefaultIcon, setUseDefaultIcon] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');
  const [savedValues, setSavedValues] = useState<UserFormValues>(EMPTY_VALUES);
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const userId = user?.uid;
  const userEmail = user?.email;
  const userDisplayName = user?.displayName;
  const userPhotoURL = user?.photoURL;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!userId) return;

    const local = readLocalSettings(userId);
    const names = splitName(profile?.displayName ?? userDisplayName);
    const values: UserFormValues = {
      ...EMPTY_VALUES,
      ...local.values,
      firstName: local.values?.firstName ?? names.firstName,
      lastName: local.values?.lastName ?? names.lastName,
      email: profile?.email ?? userEmail ?? local.values?.email ?? '',
      phone: profile?.phone ?? local.values?.phone ?? '',
      location: profile?.address ?? local.values?.location ?? '',
      role: profile?.title ?? local.values?.role ?? '',
      bio: profile?.bio ?? local.values?.bio ?? '',
      company: profile?.department ?? local.values?.company ?? '',
      timezone: profile?.timezone ?? local.values?.timezone ?? '',
    };

    form.reset(values);
    const avatar = local.profileImage ?? profile?.photoURL ?? userPhotoURL ?? null;
    setProfileImage(avatar);
    setSavedValues(values);
    setSavedImage(avatar);
    setUseDefaultIcon(!avatar);
  }, [form, profile, userDisplayName, userEmail, userId, userPhotoURL]);

  async function onSubmit(data: UserFormValues) {
    if (!user) {
      setApiError('Please sign in before saving your profile.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setApiError('');

    try {
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      const payload: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email ?? data.email,
        displayName,
        photoURL: profile?.photoURL ?? user.photoURL ?? undefined,
        phone: data.phone?.trim() || undefined,
        department: data.company?.trim() || undefined,
        title: data.role?.trim() || undefined,
        address: data.location?.trim() || undefined,
        timezone: data.timezone || undefined,
        bio: data.bio?.trim() || undefined,
        createdAt: profile?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await platformApi.patchData('/users/me/profile', payload);

      window.localStorage.setItem(settingsKey(user.uid), JSON.stringify({ values: data, profileImage }));
      await refreshProfile().catch(() => undefined);
      setSavedValues(data);
      setSavedImage(profileImage);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        setApiError('Photo is too large. Please choose an image under 800K.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setUseDefaultIcon(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setProfileImage(null);
    setUseDefaultIcon(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    form.reset(savedValues);
    setProfileImage(savedImage);
    setUseDefaultIcon(!savedImage);
    setApiError('');
    setSaved(false);
  };

  return (
    <div className='px-4 lg:px-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Picture Section */}
              <div className='flex items-center gap-6 '>
                {useDefaultIcon ? (
                  <div className='flex h-20 w-20 items-center justify-center rounded-lg'>
                    <Logo size={56} />
                  </div>
                ) : (
                  <Avatar className='h-20 w-20 rounded-lg'>
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback>SS</AvatarFallback>
                  </Avatar>
                )}
                <div className='flex flex-col gap-2'>
                  <div className='flex gap-2'>
                    <Button type='button' variant='default' size='sm' onClick={handleFileUpload} className='cursor-pointer'>
                      <Upload className='mr-2 h-4 w-4' />
                      Upload new photo
                    </Button>
                    <Button type='button' variant='outline' size='sm' onClick={handleReset} className='cursor-pointer'>
                      Reset
                    </Button>
                  </div>
                  <p className='text-xs text-muted-foreground'>Allowed JPG, GIF or PNG. Max 800K. Photo preview is saved on this device until avatar storage is connected.</p>
                </div>
                <input ref={fileInputRef} type='file' accept='image/jpeg,image/gif,image/png' onChange={handleFileChange} className='hidden' />
              </div>

              <Separator className='mb-10' />
              {/* Form Fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* First Name */}
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your first name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your last name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='Enter your email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company */}
                <FormField
                  control={form.control}
                  name='company'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your company' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type='tel' placeholder='Enter your phone number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your location' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Website */}
                <FormField
                  control={form.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type='url' placeholder='Enter your website' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name='language'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select Language' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='english'>English</SelectItem>
                          <SelectItem value='spanish'>Spanish</SelectItem>
                          <SelectItem value='french'>French</SelectItem>
                          <SelectItem value='german'>German</SelectItem>
                          <SelectItem value='italian'>Italian</SelectItem>
                          <SelectItem value='portuguese'>Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your role' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Timezone */}
                <FormField
                  control={form.control}
                  name='timezone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select Timezone' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='pst'>PST (Pacific Standard Time)</SelectItem>
                          <SelectItem value='est'>EST (Eastern Standard Time)</SelectItem>
                          <SelectItem value='cst'>CST (Central Standard Time)</SelectItem>
                          <SelectItem value='mst'>MST (Mountain Standard Time)</SelectItem>
                          <SelectItem value='utc'>UTC (Coordinated Universal Time)</SelectItem>
                          <SelectItem value='cet'>CET (Central European Time)</SelectItem>
                          <SelectItem value='jst'>JST (Japan Standard Time)</SelectItem>
                          <SelectItem value='aest'>AEST (Australian Eastern Standard Time)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bio - Full Width */}
              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Tell us a little about yourself...' className='min-h-[100px]' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              {apiError && <div className='rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-400'>{apiError}</div>}
              {saved && <div className='rounded-sm border border-green-500/30 bg-green-500/10 px-3 py-2 text-[13px] text-green-400'>Profile saved.</div>}

              <div className='flex justify-start gap-3'>
                <Button type='submit' className='cursor-pointer' disabled={saving}>
                  Save Changes
                </Button>
                <Button variant='outline' type='button' className='cursor-pointer' onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
