'use client';

import { useState } from 'react';
import { Loader2, ExternalLink, Check, FilePlus } from 'lucide-react';
import { WikiEditor } from './wiki-editor';

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

  if (status === 'success' && prUrl) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 border border-fd-border rounded-lg bg-fd-card">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Check size={24} />
          <span className="text-lg font-semibold">Page submitted!</span>
        </div>
        <p className="text-sm text-fd-muted-foreground text-center max-w-md">
          Your new page has been submitted as a pull request. A maintainer will review and merge it
          into the wiki.
        </p>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-fd-primary text-fd-primary-foreground hover:opacity-90 transition-opacity"
        >
          View Pull Request
          <ExternalLink size={14} />
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
          className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
        >
          Create another page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="create-title" className="block text-sm font-medium text-fd-foreground mb-1">
          Page Title <span className="text-red-500">*</span>
        </label>
        <input
          id="create-title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Intern Onboarding Checklist"
          className="w-full px-3 py-2 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="create-slug" className="block text-sm font-medium text-fd-foreground mb-1">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-fd-muted-foreground">/docs/</span>
          <input
            id="create-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="intern-onboarding-checklist"
            className="flex-1 px-3 py-2 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary font-mono"
          />
        </div>
        <p className="text-xs text-fd-muted-foreground mt-1">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="create-description" className="block text-sm font-medium text-fd-foreground mb-1">
          Description
        </label>
        <input
          id="create-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief summary of what this page covers"
          className="w-full px-3 py-2 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-fd-foreground mb-1">
          Content <span className="text-red-500">*</span>
        </label>
        <WikiEditor
          initialContent={content}
          onChange={setContent}
          placeholder="Write the page content here..."
        />
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'submitting' || !title.trim() || !slug.trim() || !content.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md bg-fd-primary text-fd-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FilePlus size={16} />
              Submit New Page as PR
            </>
          )}
        </button>
        <span className="text-xs text-fd-muted-foreground">
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
