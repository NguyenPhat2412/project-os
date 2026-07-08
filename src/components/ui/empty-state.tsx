interface EmptyStateProps {
  icon?: string;
  text: string;
}

export function EmptyState({ icon = '📭', text }: EmptyStateProps) {
  return (
    <div className='text-center py-12 text-muted-foreground'>
      <div className='text-[36px] mb-3'>{icon}</div>
      <div className='text-[14px]'>{text}</div>
    </div>
  );
}
