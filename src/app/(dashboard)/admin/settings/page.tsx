'use client';

import { useEffect, useState } from 'react';
import { BotIcon, SparklesIcon, CheckCircle2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import { aiSettingsConfig, type AIProvider } from '@/lib/project-config';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';

const PROVIDERS: { value: AIProvider; label: string; description: string }[] = [
  {
    value: 'CLAUDE',
    label: 'Claude',
    description: 'Dùng Claude để Improve title/description/steps trong Tasks và Bugs.',
  },
  {
    value: 'GEMINI',
    label: 'Gemini',
    description: 'Dùng Gemini để Improve title/description/steps trong Tasks và Bugs.',
  },
];

const DOC_ID = 'ai_settings';

export default function AdminSettingsPage() {
  const { data, isLoading } = aiSettingsConfig.useDocument();
  const saveSettings = aiSettingsConfig.useSet();

  const [provider, setProvider] = useState<AIProvider>('CLAUDE');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const current = data?.provider;
    if (current === 'CLAUDE' || current === 'GEMINI') {
      setProvider(current);
    } else {
      setProvider('CLAUDE');
    }
  }, [data]);

  const handleSave = async () => {
    setSaved(false);
    setError('');
    try {
      await saveSettings.mutateAsync({
        id: DOC_ID,
        data: {
          provider,
          updatedAt: new Date().toISOString(),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu cài đặt AI');
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className='max-w-4xl'>
      <SimplePageHeader
        title='Admin Settings'
        summary='Chọn AI provider để dùng cho tính năng Improve trong Tasks và Bugs.'
        segments={BREADCRUMBS.adminSettings}
        actions={
          <Button onClick={handleSave} disabled={saveSettings.isPending} className='h-9 px-5 bg-primary hover:bg-primary/90 text-white font-semibold text-[13px]'>
            {saveSettings.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        }
      />

      <div className='bg-card border border-border panel p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <BotIcon size={16} className='text-primary' />
          <div className='font-sans text-[15px] font-bold'>AI Provider</div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {PROVIDERS.map((item) => {
            const active = provider === item.value;
            return (
              <button
                key={item.value}
                type='button'
                onClick={() => setProvider(item.value)}
                className={`text-left p-4 rounded-sm border transition-colors ${active ? 'border-primary bg-primary/10' : 'border-foreground/20 bg-secondary hover:bg-muted'}`}
              >
                <div className='flex items-center justify-between mb-1.5'>
                  <div className='flex items-center gap-2'>
                    <SparklesIcon size={14} className={active ? 'text-primary' : 'text-muted-foreground'} />
                    <span className='text-[14px] font-semibold text-foreground'>{item.label}</span>
                  </div>
                  {active && <CheckCircle2Icon size={15} className='text-primary' />}
                </div>
                <p className='text-[12px] text-muted-foreground leading-relaxed'>{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className='mt-4 text-[12px] text-muted-foreground'>
          Cấu hình hiện tại: <span className='font-semibold text-foreground'>{provider}</span>
        </div>
      </div>

      {saved && <div className='mt-4 rounded-sm px-4 py-3 bg-green-500/10 border border-green-500/30 text-[13px] text-green-500'>✅ Đã lưu cài đặt AI thành công.</div>}

      {error && <div className='mt-4 rounded-sm px-4 py-3 bg-red-500/10 border border-red-500/30 text-[13px] text-red-500'>❌ {error}</div>}
    </div>
  );
}
