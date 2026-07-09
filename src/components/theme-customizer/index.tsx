'use client';

import React from 'react';
import { Layout, Palette, RotateCcw, Settings, X, Settings2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeManager } from '@/hooks/use-theme-manager';
import { useSidebarConfig } from '@/store/sidebar-store';
import { useThemeCustomizerStore } from '@/store/theme-customizer-store';
import { tweakcnThemes } from '@/config/theme-data';
import { ThemeTab } from './theme-tab';
import { LayoutTab } from './layout-tab';
import { ImportModal } from './import-modal';
import type { ImportedTheme } from '@/types/theme-customizer';

interface ThemeCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeCustomizer({ open, onOpenChange }: ThemeCustomizerProps) {
  const { applyImportedTheme, isDarkMode, resetTheme, applyRadius, setBrandColorsValues, applyTheme, applyTweakcnTheme } = useThemeManager();
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig();
  const {
    selectedTheme, setSelectedTheme,
    selectedTweakcnTheme, setSelectedTweakcnTheme,
    selectedRadius, setSelectedRadius,
    importedTheme, setImportedTheme,
    resetCustomizer,
  } = useThemeCustomizerStore();

  const [activeTab, setActiveTab] = React.useState('theme');
  const [importModalOpen, setImportModalOpen] = React.useState(false);

  const handleReset = () => {
    resetCustomizer();
    setBrandColorsValues({});
    resetTheme();
    applyRadius('0.5rem');
    updateSidebarConfig({ variant: 'inset', collapsible: 'offcanvas', side: 'left' });
  };

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData);
    // Clear other selections to indicate custom import is active
    setSelectedTheme('');
    setSelectedTweakcnTheme('');

    // Apply the imported theme
    applyImportedTheme(themeData, isDarkMode);
  };

  const handleImportClick = () => {
    setImportModalOpen(true);
  };

  // Re-apply themes when mode or selection changes.
  // Also re-apply radius because applyTheme calls resetTheme() which clears --radius.
  React.useEffect(() => {
    if (importedTheme) {
      applyImportedTheme(importedTheme, isDarkMode);
    } else if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode);
    } else if (selectedTweakcnTheme) {
      const selectedPreset = tweakcnThemes.find((t) => t.value === selectedTweakcnTheme)?.preset;
      if (selectedPreset) {
        applyTweakcnTheme(selectedPreset, isDarkMode);
      }
    }
    applyRadius(selectedRadius);
  }, [isDarkMode, importedTheme, selectedTheme, selectedTweakcnTheme, selectedRadius, applyImportedTheme, applyTheme, applyTweakcnTheme, applyRadius]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side={sidebarConfig.side === 'left' ? 'right' : 'left'}
          className='w-100 p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col'
          onInteractOutside={(e) => {
            // Prevent the sheet from closing when dialog is open
            if (importModalOpen) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className='space-y-0 p-4 pb-2'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Settings className='h-4 w-4' />
              </div>
              <SheetTitle className='text-lg font-semibold'>Customizer</SheetTitle>
              <div className='ml-auto flex items-center gap-2'>
                <Button variant='outline' size='icon' onClick={handleReset} className='cursor-pointer h-8 w-8'>
                  <RotateCcw className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon' onClick={() => onOpenChange(false)} className='cursor-pointer h-8 w-8'>
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <SheetDescription className='text-sm text-muted-foreground sr-only'>Customize the them and layout of your dashboard.</SheetDescription>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full flex flex-col'>
              <div className='py-2'>
                <TabsList className='grid w-full grid-cols-2 rounded-none p-1.5' style={{ height: '44px' }}>
                  <TabsTrigger value='theme' className='cursor-pointer data-[state=active]:bg-background'>
                    <Palette className='h-4 w-4 mr-1' /> Theme
                  </TabsTrigger>
                  <TabsTrigger value='layout' className='cursor-pointer data-[state=active]:bg-background'>
                    <Layout className='h-4 w-4 mr-1' /> Layout
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='theme' className='flex-1 mt-0'>
                <ThemeTab
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                  selectedTweakcnTheme={selectedTweakcnTheme}
                  setSelectedTweakcnTheme={setSelectedTweakcnTheme}
                  selectedRadius={selectedRadius}
                  setSelectedRadius={setSelectedRadius}
                  setImportedTheme={setImportedTheme}
                  onImportClick={handleImportClick}
                />
              </TabsContent>

              <TabsContent value='layout' className='flex-1 mt-0'>
                <LayoutTab />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} onImport={handleImport} />
    </>
  );
}

// Floating trigger button - positioned dynamically based on sidebar side
export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button type='button' onClick={onClick} variant='outline' size='icon' className='bg-secondary border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-secondary' title='Customize theme'>
      <Settings2Icon size={15} />
    </Button>
  );
}
