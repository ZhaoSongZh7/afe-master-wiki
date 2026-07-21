'use client';

import { useState } from 'react';
import { Pencil, ExternalLink, Check } from 'lucide-react';
import { WikiEditor } from './wiki-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconAction } from '@/components/ui/icon-action';
import { StatusBanner } from '@/components/ui/status-banner';

type EditPageButtonProps = {
  slug: string;
  title: string;
  description?: string;
};

export function EditPageButton({ slug, title, description }: EditPageButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description || '');
  const [editContent, setEditContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenEditor = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Fetch the raw file content from GitHub (not the processed version)
      const res = await fetch(`/api/content/raw?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load page content');
      }
      setEditContent(data.content);
      setIsEditing(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load content');
      setStatus('error');
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/content/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: editTitle,
          description: editDescription || undefined,
          content: editContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit edit');
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

  if (!isEditing) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={handleOpenEditor} loading={loading}>
        {loading ? (
          'Loading…'
        ) : (
          <>
            <Pencil size={14} aria-hidden />
            Edit this page
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--relay-radius-card)] border border-relay-border bg-relay-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-relay-ink">Edit page</h3>
        <IconAction
          label="Close editor"
          onClick={() => {
            setIsEditing(false);
            setStatus('idle');
            setPrUrl(null);
          }}
        >
          <span aria-hidden className="text-lg leading-none">✕</span>
        </IconAction>
      </div>

      {status === 'success' && prUrl ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex items-center gap-2 text-relay-positive">
            <Check size={20} aria-hidden />
            <span className="font-display font-medium">Pull request created!</span>
          </div>
          <p className="text-center text-sm text-relay-ink-muted">
            Your edit has been submitted for review. A maintainer will review and merge it.
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
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Field id="edit-title" label="Title">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field id="edit-description" label="Description">
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description of this page"
                className={inputClass}
              />
            </Field>

            <div>
              <p className="mb-1 text-sm font-medium font-display text-relay-ink">Content</p>
              <WikiEditor initialContent={editContent} onChange={setEditContent} />
            </div>
          </div>

          {status === 'error' && (
            <div className="mt-3">
              <StatusBanner tone="error" title="Couldn’t submit the edit">
                {errorMessage}
              </StatusBanner>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="signal"
              onClick={handleSubmit}
              loading={status === 'submitting'}
              disabled={!editTitle.trim() || !editContent.trim()}
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit Edit as PR'}
            </Button>
            <span className="text-xs text-relay-ink-muted">
              Your edit will be reviewed before publishing
            </span>
          </div>
        </>
      )}
    </div>
  );
}
