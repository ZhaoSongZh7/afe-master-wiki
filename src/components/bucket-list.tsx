'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { fireConfetti } from '@/lib/confetti';

/**
 * Generic, reusable checklist / bucket list.
 *
 * - Items and storage key are passed in, so it works for any list (Seattle
 *   bucket list, first-month goals, etc.).
 * - Persists to localStorage; confetti (shared util) fires at 100%.
 *
 * Usage in MDX:
 *   <BucketList storageKey="relay:seattle-bucket" items={["Ride the ferry", ...]} />
 */

const ORANGE = 'var(--relay-signal)';

function subscribe(key: string, onChange: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === key) onChange();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function parse(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function BucketList({
  storageKey,
  items,
  title,
}: {
  storageKey: string;
  items: string[];
  title?: string;
}) {
  // Persisted state via useSyncExternalStore — no setState-in-effect, no
  // read-during-render ref (both flagged by the React Compiler).
  const raw = useSyncExternalStore(
    (onChange) => subscribe(storageKey, onChange),
    () => (typeof window === 'undefined' ? '{}' : window.localStorage.getItem(storageKey) ?? '{}'),
    () => '{}',
  );
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const checked = useMemo(() => parse(raw), [raw]);
  const prevDone = useRef(0);

  const done = useMemo(() => items.filter((it) => checked[it]).length, [checked, items]);

  useEffect(() => {
    if (mounted && prevDone.current < items.length && done === items.length) {
      fireConfetti();
    }
    prevDone.current = done;
  }, [done, mounted, items.length]);

  const toggle = useCallback(
    (item: string) => {
      const current = parse(
        typeof window === 'undefined' ? '{}' : window.localStorage.getItem(storageKey) ?? '{}',
      );
      const next = { ...current, [item]: !current[item] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const displayDone = mounted ? done : 0;
  const pct = items.length ? Math.round((displayDone / items.length) * 100) : 0;

  return (
    <div className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-semibold text-fd-foreground">
          {title ?? 'Bucket list'}{' '}
          <span className="font-normal text-fd-muted-foreground">
            · {displayDone}/{items.length}
          </span>
        </p>
        <span className="text-sm font-medium" style={{ color: ORANGE }}>
          {pct === 100 ? '🎉 Complete!' : `${pct}%`}
        </span>
      </div>

      {/* progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-fd-border/50">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: ORANGE }}
        />
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const on = !!checked[item];
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(item)}
                aria-pressed={on}
                className="flex w-full items-center gap-3 rounded-xl border border-fd-border/60 bg-fd-background px-3 py-2.5 text-left transition-colors hover:bg-fd-accent"
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors"
                  style={on ? { backgroundColor: ORANGE, borderColor: ORANGE } : { borderColor: 'var(--color-fd-border)' }}
                >
                  {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
                </span>
                <span className={on ? 'text-fd-muted-foreground line-through' : 'text-fd-foreground'}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
