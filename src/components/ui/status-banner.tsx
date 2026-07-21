import * as React from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatusBannerProps = {
  tone: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const toneConfig = {
  info: { Icon: Info, cls: 'bg-[var(--relay-info-soft)] text-relay-info border-relay-info/30', role: 'status' as const },
  success: { Icon: CircleCheck, cls: 'bg-[var(--relay-positive-soft)] text-relay-positive border-relay-positive/30', role: 'status' as const },
  warning: { Icon: TriangleAlert, cls: 'bg-[var(--relay-highlight-soft)] text-relay-highlight border-relay-highlight/30', role: 'status' as const },
  error: { Icon: CircleAlert, cls: 'bg-[var(--relay-danger-soft)] text-relay-danger border-relay-danger/30', role: 'alert' as const },
};

/**
 * Replaces ad hoc green/red status text. Conveys state via icon + text +
 * semantic role, never color alone (Requirement 8.7).
 */
export function StatusBanner({ tone, title, children, className }: StatusBannerProps) {
  const { Icon, cls, role } = toneConfig[tone];
  return (
    <div
      role={role}
      className={cn('relay-bordered flex gap-3 rounded-[var(--relay-radius-control)] border p-3.5 text-sm', cls, className)}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
      <div className="min-w-0 text-relay-ink">
        {title && <p className="font-semibold font-display">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'text-relay-ink-muted')}>{children}</div>
      </div>
    </div>
  );
}
