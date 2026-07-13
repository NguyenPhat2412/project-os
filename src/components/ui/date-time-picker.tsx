'use client';
/**
 * DateTimePicker
 * ───────────────
 * Date picker + time picker (input[type=time]).
 * Storage format: "DD/MM/YYYY,HH:mm"  (ví dụ "25/04/2026,09:00")
 */

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { viCalendar } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import dayjs from '@/lib/dayjs';
import { cn } from '@/lib/utils';
import { CalendarIcon, CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface DateTimePickerProps {
  value?: string; // "DD/MM/YYYY,HH:mm"
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  clearable?: boolean;
  className?: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────────── */

function nowTime() {
  const h = String(new Date().getHours()).padStart(2, '0');
  const m = String(new Date().getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function parseValue(value: string | undefined) {
  if (!value || typeof value !== 'string') return { date: undefined, time: nowTime() };
  const [datePart, timePart] = value.split(',');
  const d = datePart ? dayjs(datePart, 'DD/MM/YYYY') : dayjs();
  return {
    date: d.isValid() ? d.toDate() : undefined,
    time: timePart ?? nowTime(),
  };
}

function buildValue(date: Date | undefined, time: string): string {
  if (!date) return '';
  return `${dayjs(date).format('DD/MM/YYYY')},${time}`;
}

function displayLabel(value: string | undefined): string {
  if (!value || typeof value !== 'string') return '';
  const [datePart, timePart] = value.split(',');
  if (!datePart) return value;
  const d = dayjs(datePart, 'DD/MM/YYYY');
  if (!d.isValid()) return value;
  return timePart ? `${d.locale('vi').format('DD/MM/YYYY')} ${timePart}` : d.locale('vi').format('DD/MM/YYYY');
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function DateTimePicker({ value, onChange, onClear, placeholder = 'Chọn ngày & giờ...', disabled = false, hasError = false, clearable = true, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const { date: selected, time } = parseValue(value);
  const label = displayLabel(value);

  const [draftDate, setDraftDate] = useState<Date | undefined>(selected);
  const [draftTime, setDraftTime] = useState(() => (value ? time : nowTime()));

  const presetValue = draftDate ? (dayjs(draftDate).isSame(dayjs(), 'day') ? 'today' : dayjs(draftDate).isSame(dayjs().add(1, 'day'), 'day') ? 'tomorrow' : dayjs(draftDate).isSame(dayjs().add(7, 'day'), 'day') ? 'next-week' : undefined) : undefined;

  const handlePresetChange = (nextValue: string) => {
    const nextDate = new Date();

    if (nextValue === 'today') {
      setDraftDate(nextDate);
      return;
    }

    if (nextValue === 'tomorrow') {
      nextDate.setDate(nextDate.getDate() + 1);
      setDraftDate(nextDate);
      return;
    }

    if (nextValue === 'next-week') {
      nextDate.setDate(nextDate.getDate() + 7);
      setDraftDate(nextDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange?.('');
    }
    setDraftDate(undefined);
    setDraftTime(nowTime());
    setOpen(false);
  };

  const handleConfirm = () => {
    if (!draftDate) return;
    onChange?.(buildValue(draftDate, draftTime));
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset draft when closing
      setDraftDate(selected);
      setDraftTime(time);
    }
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-0 py-0 text-base shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          className,
        )}
        aria-label='Chọn ngày và giờ'
      >
        <Input type='text' readOnly value={label || ''} placeholder={placeholder} disabled={disabled} className='bg-transparent border-none p-0 px-3 h-auto flex-1 focus-visible:ring-0 focus-visible:border-none shadow-none' />
        <span className='flex items-center gap-1 shrink-0 pr-3'>
          {clearable && value && !disabled && (
            <span
              title='Xóa'
              role='button'
              tabIndex={0}
              data-clear-button='true'
              onMouseDown={handleClear}
              onClick={(e) => e.preventDefault()}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as never)}
              className='rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer'
            >
              <XIcon size={12} />
            </span>
          )}
          <CalendarIcon size={14} />
        </span>
      </PopoverTrigger>

      <PopoverContent className='w-auto' align='start' onClick={(e) => e.stopPropagation()}>
        {/* Body */}
        <div className='flex flex-col gap-3'>
          {/* CALENDAR */}
          <Calendar mode='single' selected={draftDate} onSelect={(d) => setDraftDate(d ?? new Date())} locale={viCalendar} defaultMonth={draftDate ?? new Date()} autoFocus classNames={{ root: 'bg-card' }} />
          {/* HOUR & MINUTE SELECTORS */}
          <div className='flex gap-4 px-6'>
            {/* HOUR SELECTOR */}
            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs font-medium text-muted-foreground'>Giờ</label>
              <Select value={draftTime.split(':')[0] || '00'} onValueChange={(hours) => setDraftTime(`${hours}:${draftTime.split(':')[1] || '00'}`)}>
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* MINUTE SELECTOR */}
            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs font-medium text-muted-foreground'>Phút</label>
              <Select value={draftTime.split(':')[1] || '00'} onValueChange={(minutes) => setDraftTime(`${draftTime.split(':')[0] || '00'}:${minutes}`)}>
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }).map((_, i) => (
                    <SelectItem key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='border-t -mx-4 mt-4 px-4 py-3'>
          <div className='flex items-center justify-between gap-1'>
            <ToggleGroup
              type='single'
              variant='outline'
              size='sm'
              value={presetValue}
              onValueChange={(nextValue) => {
                if (!nextValue) return;
                handlePresetChange(nextValue);
              }}
            >
              <ToggleGroupItem value='today' onClick={(e) => e.stopPropagation()} className='px-2'>
                Hôm nay
              </ToggleGroupItem>
              <ToggleGroupItem value='tomorrow' onClick={(e) => e.stopPropagation()} className='px-2'>
                Ngày mai
              </ToggleGroupItem>
              <ToggleGroupItem value='next-week' onClick={(e) => e.stopPropagation()} className='px-2'>
                Tuần sau
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              type='button'
              variant='default'
              size='sm'
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={!draftDate}
            >
              <CheckIcon size={12} />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
