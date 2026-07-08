'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label: string;
  cssVar: string;
  value: string;
  onChange: (cssVar: string, value: string) => void;
}

export function ColorPicker({ label, cssVar, value, onChange }: ColorPickerProps) {
  return (
    <div className='grid w-full grid-cols-[1fr_auto] items-center gap-3'>
      <div className='space-y-1'>
        <Label className='text-xs font-medium'>{label}</Label>
        <Input
          value={value}
          placeholder='oklch(...) hoặc #hex'
          onChange={(event) => onChange(cssVar, event.target.value)}
          className='h-8 text-xs'
        />
      </div>
      <input
        type='color'
        aria-label={label}
        value={value.startsWith('#') ? value : '#000000'}
        onChange={(event) => onChange(cssVar, event.target.value)}
        className='h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-1'
      />
    </div>
  );
}
