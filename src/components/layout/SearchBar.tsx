/**
 * SearchBar — placeholder component
 * TODO: implement full-text search across tasks, docs, members, etc.
 */
export function SearchBar() {
  return (
    <div className='flex-1 min-w-0'>
      <div className='h-9 flex items-center gap-2 px-3 rounded-sm bg-secondary border border-border text-muted-foreground text-[13px] cursor-not-allowed opacity-50'>
        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <circle cx='11' cy='11' r='8' />
          <path d='m21 21-4.35-4.35' />
        </svg>
        <span>Tìm kiếm... (sẽ code sau)</span>
      </div>
    </div>
  );
}
