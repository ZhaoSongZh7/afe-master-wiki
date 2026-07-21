import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva('text-fd-card-foreground', {
  variants: {
    variant: {
      // Back-compat default — a plain resting surface.
      default: 'rounded-[var(--relay-radius-card)] border border-relay-border bg-relay-surface shadow-[var(--relay-shadow-rest)]',
      plain: 'rounded-[var(--relay-radius-card)] border border-relay-border bg-relay-surface shadow-[var(--relay-shadow-rest)]',
      interactive:
        'rounded-[var(--relay-radius-card)] border border-relay-border bg-relay-surface shadow-[var(--relay-shadow-rest)] transition-all duration-200 hover:-translate-y-0.5 hover:border-relay-border-strong hover:shadow-[var(--relay-shadow-raised)]',
      feature:
        'rounded-[var(--relay-radius-feature)] border border-relay-border bg-relay-surface-raised shadow-[var(--relay-shadow-raised)]',
      inset:
        'rounded-[var(--relay-radius-card)] border border-relay-border bg-fd-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  ),
);
Card.displayName = 'Card';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

export { Card, CardContent, cardVariants };
