'use client';

import { useState } from 'react';
import { ExternalLink, Check, FilePlus } from 'lucide-react';
import { WikiEditor } from './wiki-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { StatusBanner } from '@/components/ui/status-banner';

export function CreatePageForm() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Only auto-generate if user hasn't manually edited the slug
    if (!slug || slug === titleToSlug(title)) {
      setSlug(titleToSlug(value));
    }
  };

  const handleSubmit = async () => {
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          description: description || undefined,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create page');
      }

      setPrUrl(data.pr.url);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  const inputClass =
    'w-full rounded-[var(--relay-radius-control)] border border-relay-border bg-relay-surface px-3 py-2 text-sm text-relay-ink placeholder:text-relay-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

  if (status === 'success' && prUrl) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--relay-radius-feature)] border border-relay-border bg-relay-surface-raised py-12">
        <div className="flex items-center gap-2 text-relay-positive">
          <Check size={24} aria-hidden />
          <span className="font-display text-lg font-semibold">Page submitted!</span>
        </div>
        <p className="max-w-md text-center text-sm text-relay-ink-muted">
          Your new page has been submitted as a pull request. A maintainer will review and merge it
          into the wiki.
        </p>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'signal', size: 'md' })}
        >
          View Pull Request
          <ExternalLink size={14} aria-hidden />
        </a>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setPrUrl(null);
            setTitle('');
            setSlug('');
            setDescription('');
            setContent('');
          }}
          className="text-sm text-relay-ink-muted transition-colors hover:text-relay-ink"
        >
          Create another page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Field id="create-title" label="Page Title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Intern Onboarding Checklist"
          className={inputClass}
        />
      </Field>

      <Field id="create-slug" label="URL Slug" required hint="Lowercase letters, numbers, and hyphens only">
        <div className="flex items-center gap-2">
          <span className="text-sm text-relay-ink-muted">/docs/</span>
          <input
            id="create-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="intern-onboarding-checklist"
            className={`${inputClass} font-mono`}
          />
        </div>
      </Field>

      <Field id="create-description" label="Description">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief summary of what this page covers"
          className={inputClass}
        />
      </Field>

      <div>
        <p className="mb-1 text-sm font-medium font-display text-relay-ink">
          Content <span className="text-relay-signal-strong" aria-hidden>*</span>
        </p>
        <WikiEditor
          initialContent={content}
          onChange={setContent}
          placeholder="Write the page content here..."
        />
      </div>

      {status === 'error' && (
        <StatusBanner tone="error" title="Couldn’t submit the page">
          {errorMessage}
        </StatusBanner>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="button"
          variant="signal"
          size="lg"
          onClick={handleSubmit}
          loading={status === 'submitting'}
          disabled={!title.trim() || !slug.trim() || !content.trim()}
        >
          {status === 'submitting' ? (
            'Creating…'
          ) : (
            <>
              <FilePlus size={16} aria-hidden />
              Submit New Page as PR
            </>
          )}
        </Button>
        <span className="text-xs text-relay-ink-muted">
          A maintainer will review before publishing
        </span>
      </div>
    </div>
  );
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
