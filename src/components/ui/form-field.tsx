import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.25', className)}>
      <Label className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.1px]'>
        {label}
        {required && <span className='text-red-500 ml-0.5'>*</span>}
      </Label>
      {children}
    </div>
  );
}
