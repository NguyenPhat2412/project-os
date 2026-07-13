'use client';
/**
 * DatePicker
 * ──────────
 * Reusable date picker dùng shadcn Calendar + Popover.
 * Hỗ trợ 2 stored formats: 'DD/MM/YYYY' và 'YYYY-MM-DD'.
 * Trigger button luôn hiển thị ngày theo locale vi.
 *
 * Dùng với react-hook-form qua Controller:
 *   <Controller name="deadline" control={control}
 *     render={({ field }) => (
 *       <DatePicker value={field.value} onChange={field.onChange} disabled={saving} />
 *     )}
 *   />
 */

import { vi, type Locale } from 'date-fns/locale';
import { CalendarIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import dayjs from '@/lib/dayjs';
import { cn } from '@/lib/utils';

/**
 * Vietnamese locale with 2-character weekday abbreviations for Calendar header.
 * T2 (Mon) · T3 (Tue) · T4 (Wed) · T5 (Thu) · T6 (Fri) · T7 (Sat) · CN (Sun)
 */
export const viCalendar: Locale = {
  ...vi,
  options: { ...vi.options, weekStartsOn: 1 as 0 | 1 },
  localize: {
    ...vi.localize,
    day: (n: number) => {
      // date-fns day index: 0=Sun, 1=Mon … 6=Sat
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[n] ?? '';
    },
  },
};

export type DateFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  format?: DateFormat;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  clearable?: boolean;
  className?: string;
}

/** Parse stored string → JS Date (returns undefined if invalid) */
function parseToDate(value: string | undefined, fmt: DateFormat): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const d = dayjs(value, fmt);
  return d.isValid() ? d.toDate() : undefined;
}

/** Convert JS Date → stored string in the given format */
function formatFromDate(date: Date, fmt: DateFormat): string {
  return dayjs(date).format(fmt);
}

/** Display string for trigger button (always vi locale) */
function displayValue(value: string | undefined, fmt: DateFormat): string {
  if (!value || typeof value !== 'string') return '';
  const d = dayjs(value, fmt);
  if (!d.isValid()) return value;
  return d.locale('vi').format('DD/MM/YYYY');
}

export function DatePicker({ value, onChange, onClear, format = 'DD/MM/YYYY', placeholder = 'Chọn ngày...', disabled = false, hasError = false, clearable = true, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = parseToDate(value, format);
  const label = displayValue(value, format);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange?.(formatFromDate(date, format));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange?.('');
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger disabled={disabled} className={cn('w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground', hasError && 'border-red-500/60 focus:border-red-500', className)} aria-label='Chọn ngày'>
        <span className={cn('flex-1 text-left', !label && 'text-muted-foreground')}>{label || placeholder}</span>
        <span className='flex items-center gap-1 shrink-0 ml-2'>
          {clearable && value && !disabled && (
            <span
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
          <CalendarIcon size={14} className='text-muted-foreground' />
        </span>
      </PopoverTrigger>

      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={handleSelect}
          locale={viCalendar}
          defaultMonth={selected ?? new Date()}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
