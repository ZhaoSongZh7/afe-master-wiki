import * as React from 'react';
import { cn } from '@/lib/cn';

export type IconActionProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required non-empty accessible label (Requirement 6.4). */
  label: string;
  size?: 'sm' | 'md';
};

/**
 * An icon-only button that always carries an accessible name and meets the
 * compact desktop target guidance (≥24px, comfortably spaced).
 */
export const IconAction = React.forwardRef<HTMLButtonElement, IconActionProps>(
  ({ label, size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-relay-ink-muted transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:ring-2 focus-visible:ring-fd-ring disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'size-7' : 'size-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
IconAction.displayName = 'IconAction';
