/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import mermaid from 'mermaid';
import { Highlight, Prism, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { InfoIcon, LightbulbIcon, FlameIcon, TriangleAlertIcon } from 'lucide-react';

// ── Mermaid config ───────────────────────────────────────────────────────────

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  darkMode: true,
  fontFamily: 'var(--font-dm-sans), sans-serif',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#4f46e5',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
  },
});

function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '_');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(`mermaid${id}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Mermaid render error');
      }
    })();
    return () => { cancelled = true; };
  }, [code, id]);

  if (error) {
    return (
      <pre className='bg-muted text-red-500 text-[12px] p-3 rounded-md my-2 overflow-x-auto'>
        {error}
      </pre>
    );
  }
  return <div ref={containerRef} className='my-3 flex justify-center [&_svg]:max-w-full' />;
}

// ── Admonition directive ─────────────────────────────────────────────────────

type AdmonitionType = 'tip' | 'info' | 'note' | 'warning' | 'danger' | 'caution';

const ADMONITION_CONFIG: Record<AdmonitionType, { icon: React.ReactNode; border: string; bg: string; accent: string; label: string }> = {
  tip:     { icon: <LightbulbIcon size={14} />,      border: 'border-green-500/40',  bg: 'bg-green-500/10',  accent: 'text-green-500',  label: 'Tip' },
  info:    { icon: <InfoIcon size={14} />,            border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   accent: 'text-blue-500',   label: 'Info' },
  note:    { icon: <InfoIcon size={14} />,            border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   accent: 'text-blue-500',   label: 'Note' },
  warning: { icon: <TriangleAlertIcon size={14} />,   border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', accent: 'text-yellow-500', label: 'Warning' },
  caution: { icon: <TriangleAlertIcon size={14} />,   border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', accent: 'text-yellow-500', label: 'Caution' },
  danger:  { icon: <FlameIcon size={14} />,           border: 'border-red-500/40',    bg: 'bg-red-500/10',    accent: 'text-red-500',    label: 'Danger' },
};

function remarkAdmonitions() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective') {
        const directive = node as typeof node & { name: string; attributes?: Record<string, string>; data?: Record<string, unknown> };
        const name = directive.name as AdmonitionType;
        if (!(name in ADMONITION_CONFIG)) return;

        const data = directive.data || (directive.data = {});
        data.hName = 'div';
        data.hProperties = { className: `admonition admonition-${name}`, 'data-admonition': name };

        // Extract title from first text child if the directive label is present
        const titleNode = (directive.children as Array<{ data?: { directiveLabel?: boolean }; children?: Array<{ value?: string }> }>)[0];
        if (titleNode?.data?.directiveLabel && titleNode.children?.[0]?.value) {
          (data.hProperties as Record<string, unknown>)['data-title'] = titleNode.children[0].value;
          (directive.children as unknown[]).splice(0, 1);
        }
      }
    });
  };
}

function Admonition({ type, title, children }: { type: AdmonitionType; title?: string; children: React.ReactNode }) {
  const config = ADMONITION_CONFIG[type] ?? ADMONITION_CONFIG.note;
  return (
    <div className={cn('my-3 rounded-md border-l-[3px] px-4 py-3', config.border, config.bg)}>
      <div className={cn('flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider mb-1.5', config.accent)}>
        {config.icon}
        {title || config.label}
      </div>
      <div className='text-[13px] text-foreground leading-relaxed [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1'>
        {children}
      </div>
    </div>
  );
}

// ── Prism language registration ──────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
(typeof globalThis !== 'undefined' ? globalThis : window).Prism = Prism;
await import('prismjs/components/prism-java' as any);
await import('prismjs/components/prism-bash' as any);
await import('prismjs/components/prism-ruby' as any);
await import('prismjs/components/prism-csharp' as any);
await import('prismjs/components/prism-dart' as any);
await import('prismjs/components/prism-docker' as any);
await import('prismjs/components/prism-nginx' as any);
await import('prismjs/components/prism-scss' as any);
await import('prismjs/components/prism-markup-templating' as any);
await import('prismjs/components/prism-php' as any);
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── MarkdownViewer ───────────────────────────────────────────────────────────

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn('wiki-content text-foreground text-[13px] leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkAdmonitions]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className: codeClass, children, node: _node, ...rest }) {
            const match = /language-(\w+)/.exec(codeClass || '');
            const raw = typeof children === 'string' ? children.replace(/\n$/, '') : '';
            if (match?.[1] === 'mermaid' && raw) {
              return <MermaidBlock code={raw} />;
            }
            if (match && typeof children === 'string') {
              return (
                <Highlight theme={themes.vsDark} code={children.replace(/\n$/, '')} language={match[1]}>
                  {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      style={{
                        ...style,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        padding: '12px 16px',
                        margin: '8px 0',
                        overflowX: 'auto',
                      }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })}>
                              {token.content}
                            </span>
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              );
            }
            return (
              <code {...rest} className='bg-muted text-purple-500 px-1 py-0.5 rounded text-[12px] font-mono'>
                {children}
              </code>
            );
          },
          div({ className: divClass, children, ...rest }) {
            const props = rest as Record<string, unknown>;
            const admonitionType = props['data-admonition'] as AdmonitionType | undefined;
            if (admonitionType && admonitionType in ADMONITION_CONFIG) {
              return (
                <Admonition type={admonitionType} title={props['data-title'] as string | undefined}>
                  {children}
                </Admonition>
              );
            }
            return <div className={divClass} {...rest}>{children}</div>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
