'use client';
import { Button } from '@/components/ui/button';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel?: string;
}

export function CommentInput({ value, onChange, onSubmit, placeholder = 'Nhập bình luận...', submitLabel = 'Gửi' }: Props) {
  return (
    <div className='flex gap-2 mt-4'>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='flex-1 bg-secondary border border-border rounded-sm px-3 py-[9px] text-[13px] outline-none focus:border-primary transition-colors'
      />
      <Button onClick={onSubmit} className='text-[13px] font-medium'>
        {submitLabel}
      </Button>
    </div>
  );
}
