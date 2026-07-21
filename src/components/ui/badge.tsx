import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold font-display tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-fd-accent text-fd-accent-foreground',
        outline: 'border-relay-border bg-relay-surface text-relay-ink-muted',
        signal: 'border-transparent bg-relay-signal-soft text-relay-signal-strong',
        info: 'border-transparent bg-[var(--relay-info-soft)] text-relay-info',
        positive: 'border-transparent bg-[var(--relay-positive-soft)] text-relay-positive',
        highlight: 'border-transparent bg-[var(--relay-highlight-soft)] text-relay-highlight',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
