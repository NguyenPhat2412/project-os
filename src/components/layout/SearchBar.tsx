'use client';

import { SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { useProject } from '@/store/project-store';

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  projectId?: string;
};

const QUICK_LINKS: SearchResult[] = [
  { id: 'tasks', title: 'Tasks', subtitle: 'Open task board', href: '/tasks' },
  { id: 'team', title: 'Team', subtitle: 'Open team members', href: '/team' },
  { id: 'docs', title: 'Documents', subtitle: 'Open project documents', href: '/docs' },
  { id: 'projects', title: 'Projects', subtitle: 'Open project overview', href: '/projects' },
];

function matches(value: string | undefined, query: string) {
  return (value ?? '').toLowerCase().includes(query);
}

export function SearchBar() {
  const router = useRouter();
  const { projects } = useProjects();
  const { switchProject } = useProject();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const trimmedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmedQuery) return [];

    const projectResults: SearchResult[] = projects
      .filter((project) => matches(project.name, trimmedQuery) || matches(project.description, trimmedQuery))
      .map((project) => ({
        id: `project-${project.id}`,
        title: project.name,
        subtitle: 'Switch active project',
        projectId: project.id,
      }));

    const linkResults = QUICK_LINKS.filter((item) => matches(item.title, trimmedQuery) || matches(item.subtitle, trimmedQuery));
    return [...projectResults, ...linkResults].slice(0, 8);
  }, [projects, trimmedQuery]);

  const chooseResult = (result: SearchResult) => {
    setQuery('');
    setFocused(false);
    if (result.projectId) {
      switchProject(result.projectId);
      const url = new URL(window.location.href);
      url.searchParams.set('projectId', result.projectId);
      url.searchParams.delete('taskId');
      router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
      return;
    }
    if (result.href) router.push(result.href);
  };

  return (
    <div className='relative flex-1 min-w-[220px] max-w-md'>
      <div className='h-9 flex items-center gap-2 px-3 rounded-sm bg-secondary border border-border text-[13px] focus-within:border-primary/70'>
        <SearchIcon size={14} className='text-muted-foreground shrink-0' />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) {
              event.preventDefault();
              chooseResult(results[0]);
            }
          }}
          placeholder='Search projects, tasks, team, docs'
          className='w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none'
        />
      </div>

      {focused && query && (
        <div
          className='absolute top-10 left-0 z-50 w-full overflow-hidden rounded-sm border border-border bg-popover shadow-lg'
          onMouseDown={(event) => event.preventDefault()}
        >
          {results.length > 0 ? (
            results.map((result) => (
              <button key={result.id} type='button' onClick={() => chooseResult(result)} className='block w-full px-3 py-2 text-left hover:bg-secondary'>
                <span className='block text-[13px] font-medium text-foreground'>{result.title}</span>
                <span className='block text-[12px] text-muted-foreground'>{result.subtitle}</span>
              </button>
            ))
          ) : (
            <div className='px-3 py-3 text-[12px] text-muted-foreground'>No results yet. Try a project name, Tasks, Team, or Docs.</div>
          )}
        </div>
      )}
    </div>
  );
}
