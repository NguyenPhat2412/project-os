'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';

interface StepsFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function parseSteps(value: string): string[] {
  const lines = value.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [''];
  return lines.map((l) => l.replace(/^\d+\.\s*/, ''));
}

function serializeSteps(steps: string[]): string {
  return steps
    .filter((s) => s.trim())
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');
}

export function StepsField({ value, onChange, disabled }: StepsFieldProps) {
  const [stepState, setStepState] = useState(() => ({
    value,
    steps: parseSteps(value),
  }));
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  let steps = stepState.steps;
  if (value !== stepState.value) {
    steps = parseSteps(value);
    setStepState({ value, steps });
  }

  const commit = (nextSteps: string[]) => {
    const nextValue = serializeSteps(nextSteps);
    setStepState({ value: nextValue, steps: nextSteps });
    onChange(nextValue);
  };

  const handleChange = (index: number, text: string) => {
    const next = [...steps];
    next[index] = text;
    commit(next);
  };

  const addStep = (afterIndex?: number) => {
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : steps.length;
    const next = [...steps];
    next.splice(insertAt, 0, '');
    commit(next);
    setTimeout(() => inputRefs.current[insertAt]?.focus(), 0);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      commit(['']);
      return;
    }
    const next = steps.filter((_, i) => i !== index);
    commit(next);
    setTimeout(() => {
      const focusIndex = Math.min(index, next.length - 1);
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStep(index);
    } else if (e.key === 'Backspace' && steps[index] === '') {
      e.preventDefault();
      removeStep(index);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowDown' && index < steps.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className='space-y-1'>
      {steps.map((step, index) => (
        <div key={index} className='flex items-center gap-2'>
          <span className='w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-muted-foreground select-none'>{index + 1}</span>
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type='text'
            value={step}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            placeholder={`Bước ${index + 1}...`}
            className='flex-1 h-8 bg-secondary border border-border rounded-sm px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/20 disabled:opacity-50'
          />
          <button
            type='button'
            onClick={() => setConfirmIndex(index)}
            disabled={disabled}
            className='w-5 h-5 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors disabled:hidden'
            tabIndex={-1}
          >
            <XIcon size={12} />
          </button>
        </div>
      ))}
      <button type='button' onClick={() => addStep()} disabled={disabled} className='flex items-center gap-1.5 mt-1 ml-7 h-8 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer'>
        <PlusIcon size={12} />
        Thêm bước
      </button>
      {confirmIndex !== null && (
        <ConfirmDialog
          title='Xoá bước'
          message={`Bạn có chắc muốn xoá bước ${confirmIndex + 1}?`}
          confirmLabel='Xoá'
          danger
          onConfirm={() => {
            removeStep(confirmIndex);
            setConfirmIndex(null);
          }}
          onCancel={() => setConfirmIndex(null)}
        />
      )}
    </div>
  );
}
