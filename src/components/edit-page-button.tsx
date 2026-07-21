'use client';

import { useState } from 'react';
import { Pencil, X, Loader2, ExternalLink, Check } from 'lucide-react';
import { WikiEditor } from './wiki-editor';

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

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={handleOpenEditor}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-fd-border text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Pencil size={14} />
            Edit this page
          </>
        )}
      </button>
    );
  }

  return (
    <div className="mt-6 border border-fd-border rounded-lg p-4 bg-fd-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-fd-foreground">Edit Page</h3>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setStatus('idle');
            setPrUrl(null);
          }}
          className="p-1.5 rounded hover:bg-fd-accent text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          aria-label="Close editor"
        >
          <X size={18} />
        </button>
      </div>

      {status === 'success' && prUrl ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check size={20} />
            <span className="font-medium">Pull request created!</span>
          </div>
          <p className="text-sm text-fd-muted-foreground text-center">
            Your edit has been submitted for review. A maintainer will review and merge it.
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
        </div>
      ) : (
        <>
          {/* Title field */}
          <div className="mb-3">
            <label htmlFor="edit-title" className="block text-sm font-medium text-fd-foreground mb-1">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary"
            />
          </div>

          {/* Description field */}
          <div className="mb-3">
            <label htmlFor="edit-description" className="block text-sm font-medium text-fd-foreground mb-1">
              Description
            </label>
            <input
              id="edit-description"
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Brief description of this page"
              className="w-full px-3 py-2 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary"
            />
          </div>

          {/* Content editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-fd-foreground mb-1">
              Content
            </label>
            <WikiEditor initialContent={editContent} onChange={setEditContent} />
          </div>

          {/* Error message */}
          {status === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{errorMessage}</p>
          )}

          {/* Submit button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'submitting' || !editTitle.trim() || !editContent.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-fd-primary text-fd-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Edit as PR'
              )}
            </button>
            <span className="text-xs text-fd-muted-foreground">
              Your edit will be reviewed before publishing
            </span>
          </div>
        </>
      )}
    </div>
  );
}
