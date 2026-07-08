interface NavSectionProps {
  label: string;
}
export function NavSection({ label }: NavSectionProps) {
  return <div className='px-4.5 pt-3.5 pb-1.25 text-[12px] font-medium text-muted-foreground uppercase tracking-[1px]'>{label}</div>;
}
