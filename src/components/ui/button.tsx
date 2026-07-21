import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--relay-radius-control)] text-sm font-medium font-display transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
  {
    variants: {
      variant: {
        // Field Guide roles
        signal:
          'bg-relay-signal text-white shadow-[var(--relay-shadow-rest)] hover:bg-relay-signal-strong hover:shadow-[var(--relay-shadow-raised)] active:translate-y-px',
        ink:
          'bg-relay-brand-ink text-white shadow-[var(--relay-shadow-rest)] hover:brightness-110 active:translate-y-px',
        outline:
          'border border-relay-border bg-relay-surface text-relay-ink shadow-[var(--relay-shadow-rest)] hover:bg-fd-accent hover:text-fd-accent-foreground',
        ghost: 'text-relay-ink hover:bg-fd-accent hover:text-fd-accent-foreground',
        danger:
          'bg-relay-danger text-white shadow-[var(--relay-shadow-rest)] hover:brightness-110 active:translate-y-px',
        // Back-compat alias — existing call sites use `default` (signal action)
        default:
          'bg-relay-signal text-white shadow-[var(--relay-shadow-rest)] hover:bg-relay-signal-strong hover:shadow-[var(--relay-shadow-raised)] active:translate-y-px',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-[var(--relay-radius-control)] px-6 text-[0.95rem]',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      aria-busy={loading || undefined}
      disabled={disabled || loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
