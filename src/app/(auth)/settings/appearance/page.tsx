'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/store/theme-store';
import { platformApi } from '@/lib/platform-api/client';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  sidebarWidth: z.string().optional(),
  contentWidth: z.string().optional(),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const STORAGE_KEY = 'projectos-appearance-preferences';
const DEFAULT_VALUES: AppearanceFormValues = {
  theme: 'dark',
  fontFamily: '',
  fontSize: '',
  sidebarWidth: '',
  contentWidth: '',
};

function readPreferences(): AppearanceFormValues {
  if (typeof window === 'undefined') return DEFAULT_VALUES;
  try {
    return { ...DEFAULT_VALUES, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return DEFAULT_VALUES;
  }
}

export default function AppearanceSettings() {
  const { setTheme } = useTheme();
  const [savedPreferences, setSavedPreferences] = useState<AppearanceFormValues>(() => readPreferences());
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: savedPreferences,
  });

  useEffect(() => {
    let active = true;
    platformApi.getData<Partial<AppearanceFormValues>>('/users/me/preferences/appearance')
      .then((preferences) => {
        if (active && Object.keys(preferences).length > 0) {
          const next = { ...DEFAULT_VALUES, ...preferences };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setSavedPreferences(next);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    form.reset(savedPreferences);
    setTheme(savedPreferences.theme);
  }, [form, savedPreferences, setTheme]);

  async function onSubmit(data: AppearanceFormValues) {
    setIsSaving(true);
    setStatus('');
    try {
      await platformApi.putData('/users/me/preferences/appearance', data);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTheme(data.theme);
      setSavedPreferences(data);
      setStatus('Preferences saved.');
    } catch {
      setStatus('Could not save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    form.reset(savedPreferences);
    setTheme(savedPreferences.theme);
    setStatus('Changes reset.');
  }

  return (
    <div className='space-y-6 px-4 lg:px-6'>
      <div>
        <h1 className='text-3xl font-bold'>Appearance</h1>
        <p className='text-muted-foreground'>Customize the appearance of the application.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Theme Section */}
          <h3 className='text-lg font-medium mb-2'>Theme</h3>
          <FormField
            control={form.control}
            name='theme'
            render={({ field }) => (
              <FormItem className='space-y-3'>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className='flex gap-4'>
                    <FormItem>
                      <FormLabel className='[&:has([data-state=checked])>div]:border-primary cursor-pointer'>
                        <FormControl>
                          <RadioGroupItem value='light' className='sr-only' />
                        </FormControl>
                        <div className='rounded-md border-2 border-muted p-4 hover:border-accent transition-colors'>
                          <div className='space-y-2'>
                            <div className='w-20 h-20 bg-white border rounded-md p-3'>
                              <div className='space-y-2'>
                                <div className='h-2 bg-gray-200 rounded w-3/4'></div>
                                <div className='h-2 bg-gray-200 rounded w-1/2'></div>
                                <div className='flex space-x-2'>
                                  <div className='h-2 w-2 bg-gray-300 rounded-full'></div>
                                  <div className='h-2 bg-gray-200 rounded flex-1'></div>
                                </div>
                                <div className='flex space-x-2'>
                                  <div className='h-2 w-2 bg-gray-300 rounded-full'></div>
                                  <div className='h-2 bg-gray-200 rounded flex-1'></div>
                                </div>
                              </div>
                            </div>
                            <span className='text-sm font-medium'>Light</span>
                          </div>
                        </div>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormLabel className='[&:has([data-state=checked])>div]:border-primary cursor-pointer'>
                        <FormControl>
                          <RadioGroupItem value='dark' className='sr-only' />
                        </FormControl>
                        <div className='rounded-md border-2 border-muted p-4 hover:border-accent transition-colors'>
                          <div className='space-y-2'>
                            <div className='w-20 h-20 bg-gray-900 border border-gray-700 rounded-md p-3'>
                              <div className='space-y-2'>
                                <div className='h-2 bg-gray-600 rounded w-3/4'></div>
                                <div className='h-2 bg-gray-600 rounded w-1/2'></div>
                                <div className='flex space-x-2'>
                                  <div className='h-2 w-2 bg-gray-500 rounded-full'></div>
                                  <div className='h-2 bg-gray-600 rounded flex-1'></div>
                                </div>
                                <div className='flex space-x-2'>
                                  <div className='h-2 w-2 bg-gray-500 rounded-full'></div>
                                  <div className='h-2 bg-gray-600 rounded flex-1'></div>
                                </div>
                              </div>
                            </div>
                            <span className='text-sm font-medium'>Dark</span>
                          </div>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='fontFamily'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Font Family</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='cursor-pointer'>
                      <SelectValue placeholder='Select a font' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='inter'>Inter</SelectItem>
                    <SelectItem value='roboto'>Roboto</SelectItem>
                    <SelectItem value='system'>System Default</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='fontSize'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Font Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='cursor-pointer'>
                      <SelectValue placeholder='Select font size' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='small'>Small</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='large'>Large</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Layout Section */}
          <FormField
            control={form.control}
            name='sidebarWidth'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sidebar Width</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='cursor-pointer'>
                      <SelectValue placeholder='Select sidebar width' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='compact'>Compact</SelectItem>
                    <SelectItem value='comfortable'>Comfortable</SelectItem>
                    <SelectItem value='spacious'>Spacious</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='contentWidth'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Width</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='cursor-pointer'>
                      <SelectValue placeholder='Select content width' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='fixed'>Fixed</SelectItem>
                    <SelectItem value='fluid'>Fluid</SelectItem>
                    <SelectItem value='container'>Container</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {status && <p className='text-[13px] text-muted-foreground'>{status}</p>}

          <div className='flex space-x-2 mt-12'>
            <Button type='submit' className='cursor-pointer' disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            <Button variant='outline' type='button' className='cursor-pointer' onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
