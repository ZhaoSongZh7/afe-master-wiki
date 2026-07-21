'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Check, PartyPopper } from 'lucide-react';

/**
 * Day-One Checklist — interactive onboarding tracker.
 *
 * - State persists in localStorage (key `relay:day-one`) and syncs across the
 *   home-page widget and the full docs page (same key, storage event).
 * - Confetti at 100% is a self-contained canvas burst — NO npm dependency, so
 *   it can't break the lockfile / Vercel install.
 *
 * Usage:
 *   <DayOneChecklist />              full interactive list (docs page)
 *   <DayOneChecklist variant="widget" />   compact progress card (home hero)
 */

const STORAGE_KEY = 'relay:day-one';

type Item = { id: string; label: string; href?: string };

const ITEMS: Item[] = [
  { id: 'badge', label: 'Pick up your badge', href: '/docs/badge-building-access' },
  { id: 'laptop', label: 'Collect your laptop & equipment', href: '/docs/before-day-one' },
  { id: 'benefits', label: 'Enroll in benefits', href: '/docs/benefits-insurance' },
  { id: 'tools', label: 'Set up your dev environment', href: '/docs/dev-environment-setup' },
  { id: 'contacts', label: 'Meet your manager & mentor', href: '/docs/whos-who' },
  { id: 'commute', label: 'Plan your commute', href: '/docs/transportation-commute' },
  { id: 'glossary', label: 'Skim the glossary & acronyms', href: '/docs/glossary-acronyms' },
];

// Semantic tokens for inline styles (resolve to the Field Guide palette).
const ORANGE = 'var(--relay-signal)';
const BLUE = 'var(--relay-brand-ink)';

function readStateSnapshot(): string {
  if (typeof window === 'undefined') return '{}';
  return window.localStorage.getItem(STORAGE_KEY) ?? '{}';
}

function parseState(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function subscribeToState(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** Self-contained confetti burst — no dependencies. */
function fireConfetti() {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  // Canvas 2D fillStyle can't consume CSS variables, so the celebration burst
  // uses literal brand colors (the one documented raw-color exception).
  const colors = ['#e94f2d', '#102a68', '#f5a623', '#ffffff', '#2a4bb0'];
  const N = 140;
  const parts = Array.from({ length: N }, (_, i) => ({
    x: canvas.width / 2,
    y: canvas.height / 3,
    // spread outward + up, varied by index (no Math.random dependency concerns)
    vx: Math.cos((i / N) * Math.PI * 2) * (4 + (i % 7)),
    vy: Math.sin((i / N) * Math.PI * 2) * (4 + (i % 5)) - 6,
    size: 5 + (i % 4) * 2,
    color: colors[i % colors.length],
    rot: (i / N) * Math.PI * 2,
    vr: (i % 2 ? 1 : -1) * 0.2,
  }));

  let frame = 0;
  const gravity = 0.22;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 120);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    frame += 1;
    if (frame < 120) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-fd-border" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={ORANGE}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="32" y="37" textAnchor="middle" className="fill-fd-foreground text-[15px] font-bold">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export function DayOneChecklist({ variant = 'full' }: { variant?: 'full' | 'widget' }) {
  const stateSnapshot = useSyncExternalStore(
    subscribeToState,
    readStateSnapshot,
    () => '{}',
  );
  const checked = useMemo(() => parseState(stateSnapshot), [stateSnapshot]);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const prevDone = useRef(0);

  const done = useMemo(() => ITEMS.filter((i) => checked[i.id]).length, [checked]);

  // confetti when we cross into 100%
  useEffect(() => {
    if (mounted && prevDone.current < ITEMS.length && done === ITEMS.length) {
      fireConfetti();
    }
    prevDone.current = done;
  }, [done, mounted]);

  const toggle = useCallback((id: string) => {
    const current = parseState(readStateSnapshot());
    const next = { ...current, [id]: !current[id] };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // notify same-tab listeners (storage event only fires cross-tab)
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    } catch {
      /* ignore */
    }
  }, []);

  // avoid hydration mismatch: render neutral until mounted
  const displayDone = mounted ? done : 0;

  // ---- Widget variant (home page hero) --------------------------------------
  if (variant === 'widget') {
    const preview = ITEMS.slice(0, 3);
    return (
      <div className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-5 text-left shadow-sm">
        <div className="flex items-center gap-4">
          <ProgressRing done={displayDone} total={ITEMS.length} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fd-foreground">Day-one checklist</p>
            <p className="text-sm text-fd-muted-foreground">
              {displayDone === ITEMS.length
                ? "You're all set — welcome aboard! 🎉"
                : `${displayDone} of ${ITEMS.length} done`}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5">
          {preview.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-fd-accent"
              >
                <Box checked={!!checked[item.id]} />
                <span className={checked[item.id] ? 'text-fd-muted-foreground line-through' : 'text-fd-foreground'}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link
          href="/docs/day-one-checklist"
          className="mt-2 inline-block px-2 text-sm font-medium hover:underline"
          style={{ color: ORANGE }}
        >
          See the full checklist →
        </Link>
      </div>
    );
  }

  // ---- Full variant (docs page) ---------------------------------------------
  const complete = displayDone === ITEMS.length;
  return (
    <div className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card p-6">
      <div className="flex items-center gap-4">
        <ProgressRing done={displayDone} total={ITEMS.length} />
        <div className="flex-1">
          <p className="font-semibold text-fd-foreground">
            {complete ? (
              <span className="inline-flex items-center gap-2" style={{ color: BLUE }}>
                <PartyPopper className="size-5" style={{ color: ORANGE }} />
                All done — welcome to Amazon Future Engineers!
              </span>
            ) : (
              'Your first-week checklist'
            )}
          </p>
          <p className="text-sm text-fd-muted-foreground">
            {displayDone} of {ITEMS.length} complete · saved on this device
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {ITEMS.map((item) => {
          const on = !!checked[item.id];
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-fd-border/60 bg-fd-background px-4 py-3"
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={on}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <Box checked={on} />
                <span className={on ? 'text-fd-muted-foreground line-through' : 'text-fd-foreground'}>
                  {item.label}
                </span>
              </button>
              {item.href && (
                <Link href={item.href} className="text-sm font-medium hover:underline" style={{ color: ORANGE }}>
                  Details →
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {displayDone > 0 && (
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
              window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
            } catch {
              /* ignore */
            }
          }}
          className="mt-4 text-sm text-fd-muted-foreground hover:text-fd-foreground hover:underline"
        >
          Reset checklist
        </button>
      )}
    </div>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors"
      style={
        checked
          ? { backgroundColor: ORANGE, borderColor: ORANGE }
          : { borderColor: 'var(--color-fd-border)' }
      }
    >
      {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
    </span>
  );
}
