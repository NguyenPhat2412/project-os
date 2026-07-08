'use client';
import { useState } from 'react';
import { ClockIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // stored as "HH:mm" string
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({ value, onChange, placeholder = 'Chọn giờ', disabled, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(() => (value ? value.split(':')[0] : '09'));
  const [minute, setMinute] = useState(() => (value ? value.split(':')[1] : '00'));

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  const displayValue = value ?? '';

  const handleConfirm = () => {
    const h = hour.padStart(2, '0');
    const m = minute.padStart(2, '0');
    onChange?.(`${h}:${m}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' disabled={disabled} className={cn('w-full justify-start text-left font-normal h-9 px-3 text-[13px]', !displayValue && 'text-muted-foreground', className)}>
          <ClockIcon size={13} className='mr-2 shrink-0 text-muted-foreground' />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-3' align='start'>
        <div className='space-y-2'>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Giờ</div>
          <div className='grid grid-cols-4 gap-1 max-h-40 overflow-y-auto'>
            {HOURS.map((h) => (
              <button
                key={h}
                type='button'
                onClick={() => setHour(h)}
                className={cn('px-2 py-1 text-[12px] rounded-sm border transition-colors', hour === h ? 'bg-primary border-primary text-white' : 'border-border text-foreground hover:bg-secondary')}
              >
                {h}
              </button>
            ))}
          </div>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Phút</div>
          <div className='flex gap-1'>
            {MINUTES.map((m) => (
              <button
                key={m}
                type='button'
                onClick={() => setMinute(m)}
                className={cn('flex-1 px-2 py-1 text-[12px] rounded-sm border transition-colors', minute === m ? 'bg-primary border-primary text-white' : 'border-border text-foreground hover:bg-secondary')}
              >
                {m}
              </button>
            ))}
          </div>
          <Button size='sm' onClick={handleConfirm} className='w-full h-7'>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
