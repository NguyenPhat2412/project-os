'use client';

import { memo, useCallback, useDeferredValue, useRef, useState } from 'react';
import { EyeIcon, GripVerticalIcon, MaximizeIcon, PencilIcon } from 'lucide-react';
import { MarkdownViewer } from '@/components/ui/shared/markdown-viewer';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ToolbarItem {
  label: string;
  title: string;
  action: (sel: string) => { before: string; placeholder: string; after: string };
}

const TOOLBAR: (ToolbarItem | '|')[] = [
  { label: 'H1', title: 'Heading 1', action: (sel) => ({ before: '# ', placeholder: sel || 'Tiêu đề 1', after: '' }) },
  { label: 'H2', title: 'Heading 2', action: (sel) => ({ before: '## ', placeholder: sel || 'Tiêu đề 2', after: '' }) },
  { label: 'H3', title: 'Heading 3', action: (sel) => ({ before: '### ', placeholder: sel || 'Tiêu đề 3', after: '' }) },
  '|',
  { label: 'B', title: 'Bold', action: (sel) => ({ before: '**', placeholder: sel || 'in đậm', after: '**' }) },
  { label: 'I', title: 'Italic', action: (sel) => ({ before: '*', placeholder: sel || 'in nghiêng', after: '*' }) },
  { label: '~~', title: 'Strikethrough', action: (sel) => ({ before: '~~', placeholder: sel || 'gạch ngang', after: '~~' }) },
  '|',
  { label: '`', title: 'Inline Code', action: (sel) => ({ before: '`', placeholder: sel || 'code', after: '`' }) },
  { label: '```', title: 'Code Block', action: (sel) => ({ before: '```\n', placeholder: sel || 'code block', after: '\n```' }) },
  '|',
  { label: '🔗', title: 'Link', action: (sel) => ({ before: '[', placeholder: sel || 'link text', after: '](https://)' }) },
  '|',
  { label: '• UL', title: 'Bullet List', action: (sel) => ({ before: '- ', placeholder: sel || 'mục danh sách', after: '' }) },
  { label: '1. OL', title: 'Numbered List', action: (sel) => ({ before: '1. ', placeholder: sel || 'mục đánh số', after: '' }) },
  { label: '☐', title: 'Checkbox', action: (sel) => ({ before: '- [ ] ', placeholder: sel || 'việc cần làm', after: '' }) },
  { label: '❝', title: 'Blockquote', action: (sel) => ({ before: '> ', placeholder: sel || 'trích dẫn', after: '' }) },
  { label: '—', title: 'Horizontal Rule', action: () => ({ before: '\n---\n', placeholder: '', after: '' }) },
];

// ── Toolbar (shared between inline & fullscreen) ─────────────────────────────

interface ToolbarProps {
  onApply: (item: ToolbarItem) => void;
  trailing?: React.ReactNode;
}

function Toolbar({ onApply, trailing }: ToolbarProps) {
  return (
    <div className='flex items-center gap-1 px-3 py-1.5 border-b border-border bg-secondary overflow-x-auto shrink-0'>
      {TOOLBAR.map((item, i) =>
        item === '|' ? (
          <div key={`sep-${i}`} className='w-px h-4 bg-border mx-0.5 shrink-0' />
        ) : (
          <Button key={item.label} type='button' variant='ghost' size='xs' title={item.title} onClick={() => onApply(item)} className='shrink-0 font-mono text-[12px]'>
            {item.label}
          </Button>
        ),
      )}
      {trailing && (
        <>
          <div className='flex-1' />
          {trailing}
        </>
      )}
    </div>
  );
}

// ── Memoized preview pane ────────────────────────────────────────────────────

const DeferredPreview = memo(function DeferredPreview({ content }: { content: string }) {
  return content.trim() ? (
    <MarkdownViewer content={content} className='text-[13px]' />
  ) : (
    <div className='flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-8'>
      <EyeIcon size={24} className='opacity-30' />
      <span className='text-[12px]'>Preview sẽ hiển thị ở đây</span>
    </div>
  );
});

// ── Draggable splitter ───────────────────────────────────────────────────────

function useSplitter(initialRatio = 50) {
  const [ratio, setRatio] = useState(initialRatio);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setRatio(Math.max(20, Math.min(80, pct)));
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return { ratio, containerRef, onMouseDown };
}

// ── Inline editor body (tabs: write / preview) ──────────────────────────────

interface EditorBodyProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
  onOpenFullscreen: () => void;
}

function EditorBody({ value, onChange, disabled, placeholder, minHeight = '180px', onOpenFullscreen }: EditorBodyProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyToolbar = useCallback(
    (item: ToolbarItem) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = value.substring(start, end);
      const { before, placeholder: ph, after } = item.action(selected);
      const next = value.substring(0, start) + before + ph + after + value.substring(end);
      onChange(next);
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + ph.length;
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      }, 0);
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      onChange(next);
      setTimeout(() => el.setSelectionRange(start + 2, start + 2), 0);
    }
  };

  return (
    <>
      {/* Tab bar + toolbar */}
      <div className='flex items-center gap-1 px-3 py-1.5 border-b border-border bg-secondary overflow-x-auto shrink-0'>
        <ToggleGroup
          type='single'
          variant='outline'
          size='sm'
          value={activeTab}
          onValueChange={(nextValue) => {
            if (nextValue === 'write' || nextValue === 'preview') {
              setActiveTab(nextValue);
            }
          }}
          className='mr-2'
        >
          <ToggleGroupItem value='write' className='px-2 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground'>
            <PencilIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value='preview' className='px-2 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground'>
            <EyeIcon />
          </ToggleGroupItem>
        </ToggleGroup>

        {activeTab === 'write' &&
          TOOLBAR.map((item, i) =>
            item === '|' ? (
              <div key={`sep-${i}`} className='w-px h-4 bg-border mx-0.5 shrink-0' />
            ) : (
              <Button key={item.label} type='button' variant='outline' size='xs' title={item.title} onClick={() => applyToolbar(item)} className='shrink-0 font-mono text-[12px]'>
                {item.label}
              </Button>
            ),
          )}

        <div className='flex-1' />
        <Button type='button' variant='ghost' size='icon-sm' title='Fullscreen' onClick={onOpenFullscreen} className='shrink-0 text-muted-foreground hover:text-foreground'>
          <MaximizeIcon size={13} />
        </Button>
      </div>

      {/* Editor / Preview */}
      {activeTab === 'write' ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className='w-full min-h-0 flex-1 resize-none rounded-none border-0 bg-background text-foreground text-[13px] leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0 p-4'
          style={{ minHeight, fontFamily: 'monospace', fieldSizing: 'fixed' as React.CSSProperties['fieldSizing'] }}
        />
      ) : (
        <div className='flex-1 overflow-y-auto p-4' style={{ minHeight }}>
          {value.trim() ? (
            <MarkdownViewer content={value} className='text-[13px]' />
          ) : (
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-8'>
              <EyeIcon size={24} className='opacity-30' />
              <span className='text-[12px]'>Preview sẽ hiển thị ở đây</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Fullscreen split-pane dialog ─────────────────────────────────────────────

function FullscreenEditorDialog({ open, onClose, value, onChange, disabled, placeholder }: { open: boolean; onClose: () => void; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { ratio, containerRef, onMouseDown } = useSplitter(50);
  const deferredValue = useDeferredValue(value);

  const applyToolbar = useCallback(
    (item: ToolbarItem) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = value.substring(start, end);
      const { before, placeholder: ph, after } = item.action(selected);
      const next = value.substring(0, start) + before + ph + after + value.substring(end);
      onChange(next);
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + ph.length;
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      }, 0);
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      onChange(next);
      setTimeout(() => el.setSelectionRange(start + 2, start + 2), 0);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth='max-w-[96vw]'
      className='h-[96vh] flex flex-col'
      title='Markdown Editor'
      icon={<PencilIcon size={16} className='text-muted-foreground' />}
      header={<ModalHeaderBar heading='Markdown Editor' onClose={onClose} leading={<PencilIcon size={16} className='text-muted-foreground' />} />}
      headerClassName='shrink-0'
      bodyClassName='flex flex-col min-h-0'
    >
      {/* Toolbar */}
      <Toolbar onApply={applyToolbar} />

      {/* Split pane: Editor | Splitter | Preview */}
      <div ref={containerRef} className='flex-1 flex min-h-0'>
        {/* Left: Editor */}
        <div className='flex flex-col overflow-hidden' style={{ width: `${ratio}%` }}>
          <div className='px-3 py-1.5 border-b border-border bg-secondary shrink-0'>
            <span className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
              <PencilIcon size={10} /> Editor
            </span>
          </div>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className='w-full min-h-0 flex-1 resize-none rounded-none border-0 bg-background text-foreground text-[13px] leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0 p-4'
            style={{ fontFamily: 'monospace', fieldSizing: 'fixed' as React.CSSProperties['fieldSizing'] }}
          />
        </div>

        {/* Splitter handle */}
        <div className='w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-primary active:bg-primary transition-colors flex items-center justify-center group' onMouseDown={onMouseDown}>
          <GripVerticalIcon size={12} className='text-muted-foreground group-hover:text-foreground transition-colors' />
        </div>

        {/* Right: Preview */}
        <div className='flex flex-col overflow-hidden' style={{ width: `${100 - ratio}%` }}>
          <div className='px-3 py-1.5 border-b border-border bg-secondary shrink-0'>
            <span className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
              <EyeIcon size={10} /> Preview
            </span>
          </div>
          <div className='flex-1 overflow-y-auto p-4 bg-background'>
            <DeferredPreview content={deferredValue} />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, disabled, placeholder = '# Bắt đầu viết...\n\nDùng Markdown để định dạng nội dung.', minHeight = '180px' }: MarkdownEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className='rounded-sm border border-border overflow-hidden bg-secondary flex flex-col'>
        <EditorBody value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} minHeight={minHeight} onOpenFullscreen={() => setFullscreen(true)} />
      </div>

      <FullscreenEditorDialog open={fullscreen} onClose={() => setFullscreen(false)} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} />
    </>
  );
}
