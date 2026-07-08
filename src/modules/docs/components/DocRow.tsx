interface DocRowProps {
  icon: string;
  name: string;
  meta: string;
  size?: string;
}

export function DocRow({ icon, name, meta, size }: DocRowProps) {
  return (
    <div className='flex items-center gap-3 py-[11px] border-b border-border last:border-b-0 cursor-pointer group'>
      <div className='w-9 h-9 bg-secondary border border-border rounded-sm flex items-center justify-center text-[16px] shrink-0'>{icon}</div>
      <div className='flex-1 min-w-0'>
        <div className='text-[13.5px] font-medium group-hover:text-primary transition-colors truncate'>{name}</div>
        <div className='font-mono-dm text-[12px] text-muted-foreground mt-[2px]'>{meta}</div>
      </div>
      {size && <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap shrink-0'>{size}</span>}
      <button className='text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none text-[16px]'>⋯</button>
    </div>
  );
}
