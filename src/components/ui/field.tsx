import * as React from 'react';
import { cn } from '@/lib/cn';

export type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement;
};

/** Compute accessible description wiring for a field (see design spec). */
export function deriveFieldA11y(input: {
  id: string;
  hasHint: boolean;
  error?: string;
}): { 'aria-describedby'?: string; 'aria-invalid': boolean } {
  const ids: string[] = [];
  if (input.hasHint) ids.push(`${input.id}-hint`);
  if (input.error) ids.push(`${input.id}-error`);
  return {
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
    'aria-invalid': Boolean(input.error),
  };
}

/**
 * Associates one visible label with one control and wires hints/errors through
 * aria-describedby + aria-invalid (Requirement 6.5).
 */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  const a11y = deriveFieldA11y({ id, hasHint: Boolean(hint), error });

  const control = React.cloneElement(children, {
    id,
    required,
    'aria-describedby': a11y['aria-describedby'],
    'aria-invalid': a11y['aria-invalid'] || undefined,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium font-display text-relay-ink">
        {label}
        {required && (
          <span className="ml-1 text-relay-signal-strong" aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-relay-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-medium text-relay-danger">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
