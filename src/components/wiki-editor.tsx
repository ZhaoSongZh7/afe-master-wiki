'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Minus,
  Eye,
  Pencil,
} from 'lucide-react';

type EditorProps = {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
};

type ToolbarAction = {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement) => { before: string; after: string; placeholder?: string };
};

const toolbarActions: ToolbarAction[] = [
  {
    icon: <Bold size={16} />,
    label: 'Bold',
    action: () => ({ before: '**', after: '**', placeholder: 'bold text' }),
  },
  {
    icon: <Italic size={16} />,
    label: 'Italic',
    action: () => ({ before: '_', after: '_', placeholder: 'italic text' }),
  },
  {
    icon: <Heading1 size={16} />,
    label: 'Heading 1',
    action: () => ({ before: '# ', after: '', placeholder: 'Heading' }),
  },
  {
    icon: <Heading2 size={16} />,
    label: 'Heading 2',
    action: () => ({ before: '## ', after: '', placeholder: 'Heading' }),
  },
  {
    icon: <Heading3 size={16} />,
    label: 'Heading 3',
    action: () => ({ before: '### ', after: '', placeholder: 'Heading' }),
  },
  {
    icon: <List size={16} />,
    label: 'Bullet List',
    action: () => ({ before: '- ', after: '', placeholder: 'list item' }),
  },
  {
    icon: <ListOrdered size={16} />,
    label: 'Numbered List',
    action: () => ({ before: '1. ', after: '', placeholder: 'list item' }),
  },
  {
    icon: <Link size={16} />,
    label: 'Link',
    action: () => ({ before: '[', after: '](url)', placeholder: 'link text' }),
  },
  {
    icon: <Code size={16} />,
    label: 'Code',
    action: () => ({ before: '`', after: '`', placeholder: 'code' }),
  },
  {
    icon: <Quote size={16} />,
    label: 'Blockquote',
    action: () => ({ before: '> ', after: '', placeholder: 'quote' }),
  },
  {
    icon: <Minus size={16} />,
    label: 'Divider',
    action: () => ({ before: '\n---\n', after: '', placeholder: '' }),
  },
];

export function WikiEditor({ initialContent = '', onChange, placeholder }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      onChange?.(value);
    },
    [onChange],
  );

  const applyAction = useCallback(
    (action: ToolbarAction['action']) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);
      const { before, after, placeholder: ph } = action(textarea);

      const insertion = selectedText || ph || '';
      const newContent =
        content.slice(0, start) + before + insertion + after + content.slice(end);

      handleChange(newContent);

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + before.length + insertion.length;
        textarea.setSelectionRange(
          selectedText ? cursorPos + after.length : start + before.length,
          selectedText ? cursorPos + after.length : start + before.length + insertion.length,
        );
      });
    },
    [content, handleChange],
  );

  return (
    <div className="border border-fd-border rounded-lg overflow-hidden bg-fd-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-fd-border bg-fd-muted/50 flex-wrap">
        {toolbarActions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => applyAction(item.action)}
            className="p-1.5 rounded hover:bg-fd-accent hover:text-fd-accent-foreground text-fd-muted-foreground transition-colors"
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 border border-fd-border rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
            aria-label="Edit mode"
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
            aria-label="Preview mode"
          >
            <Eye size={12} />
            Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || 'Write your content here using Markdown...'}
          className="w-full min-h-[400px] p-4 font-mono text-sm bg-fd-background text-fd-foreground resize-y focus:outline-none placeholder:text-fd-muted-foreground"
          spellCheck
        />
      ) : (
        <div className="w-full min-h-[400px] p-4 prose prose-sm dark:prose-invert max-w-none">
          <MarkdownPreview content={content} />
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown preview — renders basic markdown to HTML.
 * For a hackathon this is sufficient. A production version would use remark/rehype.
 */
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-fd-muted-foreground italic">Nothing to preview</p>;
  }

  // Basic markdown to HTML conversion for preview purposes
  const html = content
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-fd-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-fd-primary underline">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-fd-border pl-4 italic">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-fd-border" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to breaks
    .replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}
