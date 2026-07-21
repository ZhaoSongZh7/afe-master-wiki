import * as React from 'react';
import { cn } from '@/lib/cn';

export type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Large editorial index like "01" — decorative, hidden from AT. */
  index?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
};

/** Standardizes heading hierarchy across Home, Ask AI, and contribution pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  index,
  className,
  as: Title = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-relay-signal-strong">
            {eyebrow}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          {index && (
            <span
              aria-hidden
              className="font-display text-2xl font-extrabold text-relay-border-strong tabular-nums"
            >
              {index}
            </span>
          )}
          <Title className="font-display text-2xl font-bold tracking-tight text-relay-ink sm:text-3xl">
            {title}
          </Title>
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-relay-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </div>
  );
}
