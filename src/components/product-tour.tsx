'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';

/** Fire this event from anywhere to (re)start the tour. */
export function startTour() {
  window.dispatchEvent(new Event('relay:start-tour'));
}

/** A ready-made "Take a tour" trigger button (client). */
export function TourButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={startTour}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent'
      }
    >
      <Compass className="size-4" />
      Take a tour
    </button>
  );
}

/**
 * ProductTour — a guided, step-by-step spotlight tour of the home page.
 *
 * Dependency-free (no driver.js / shepherd / react-joyride): a full-screen
 * dim overlay with a "spotlight" cutout over each target, plus a positioned
 * tooltip. Auto-starts on first visit (localStorage), and replays when any
 * element dispatches the `relay:start-tour` event (e.g. the hero button).
 *
 * Steps are skip-safe: if a target selector isn't on the page, that step is
 * skipped so the tour never points at nothing.
 */

const SEEN_KEY = 'relay:tour-seen';
const ORANGE = 'var(--relay-signal)';

type Step = {
  selector?: string; // CSS selector of the target; omit for a centered card
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

const STEPS: Step[] = [
  {
    title: 'Welcome to Relay 👋',
    body: "A 30-second tour of your AFE handbook. Use ← → or the buttons, and press Esc anytime to exit.",
  },
  {
    // Prefer the full search bar (visible on desktop); fall back to the compact
    // icon trigger. findVisible() skips whichever variant is hidden at this width.
    selector: '[data-search-full], [data-search], [aria-label="Open Search"], [data-tour="search"]',
    title: 'Search everything',
    body: 'Jump to any page instantly — search across the whole handbook by keyword.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="ask-ai"]',
    title: 'Ask AI',
    body: 'Open the full assistant to ask questions in plain English — it answers from the handbook.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="checklist"]',
    title: 'Your day-one checklist',
    body: 'Track onboarding tasks. Progress saves automatically — finish all of them for a little surprise 🎉',
    placement: 'top',
  },
  {
    selector: '[data-tour="categories"]',
    title: 'Browse by topic',
    body: 'Nine sections cover everything: benefits, tools, career, Seattle life, and more.',
    placement: 'top',
  },
  {
    selector: '[data-tour="chat-bubble"]',
    title: 'Ask while you read',
    body: 'This bubble follows you on every page — pop it open to ask a quick question without leaving the doc.',
    placement: 'left',
  },
  {
    title: "You're all set! 🚀",
    body: 'Explore the handbook, and use Ask Relay anytime you get stuck. Welcome aboard!',
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function ProductTour() {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [steps, setSteps] = useState<Step[]>(STEPS);

  // Resolve which steps have a present target (welcome/end steps have none).
  const resolveVisibleSteps = useCallback(() => {
    return STEPS.filter((s) => !s.selector || findVisible(s.selector));
  }, []);

  const start = useCallback(() => {
    setSteps(resolveVisibleSteps());
    setI(0);
    setActive(true);
  }, [resolveVisibleSteps]);

  // auto-start once, on first visit
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (!seen) {
      // small delay so the page (and floating bubble) has mounted
      const t = setTimeout(start, 900);
      return () => clearTimeout(t);
    }
  }, [start]);

  // replay trigger
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener('relay:start-tour', onStart);
    return () => window.removeEventListener('relay:start-tour', onStart);
  }, [start]);

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const step = steps[i];

  // measure the current target and scroll it into view
  useLayoutEffect(() => {
    if (!active || !step) return;
    // Route every setRect through `measure` (no direct synchronous setState in
    // the effect body). Centered/absent-target steps resolve to a null rect.
    const el = step.selector ? findVisible(step.selector) : null;
    const measure = () => {
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = setTimeout(measure, 320); // re-measure after smooth scroll settles
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, i, step]);

  const next = useCallback(() => {
    setI((v) => {
      if (v >= steps.length - 1) {
        finish();
        return v;
      }
      return v + 1;
    });
  }, [finish, steps.length]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, next, prev]);

  // Lock background scroll while the tour is active (the tour scrolls targets
  // into view itself via scrollIntoView).
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);

  if (!active || !step) return null;

  const total = steps.length;
  const pad = 8;
  const spotlight: Rect | null = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // tooltip position
  const tipStyle = computeTipStyle(spotlight, step.placement);

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dim overlay with spotlight cutout (box-shadow trick), or full dim for centered steps */}
      {spotlight ? (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(10,16,36,0.68)',
            outline: `2px solid ${ORANGE}`,
            outlineOffset: '2px',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(10,16,36,0.68)]" onClick={finish} />
      )}

      {/* Tooltip card */}
      <div
        className="absolute w-[min(92vw,20rem)] rounded-2xl border border-fd-border bg-fd-popover p-5 shadow-2xl transition-all duration-300"
        style={tipStyle}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
            Step {i + 1} of {total}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label="Close tour"
            className="flex size-6 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent"
          >
            <X className="size-4" />
          </button>
        </div>
        <h3 className="text-base font-bold text-fd-foreground">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-fd-muted-foreground">{step.body}</p>

        {/* progress dots */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className="size-1.5 rounded-full transition-colors"
                style={{ backgroundColor: idx === i ? ORANGE : 'var(--color-fd-border)' }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-1 rounded-lg border border-fd-border px-2.5 py-1.5 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: ORANGE }}
            >
              {i >= total - 1 ? 'Done' : 'Next'}
              {i < total - 1 && <ArrowRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Position the tooltip relative to the spotlight; center it when there's no target. */
function computeTipStyle(spot: Rect | null, placement?: Step['placement']): React.CSSProperties {
  if (!spot) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  const gap = 16;
  const margin = 12;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardW = Math.min(vw * 0.92, 320);
  const cardH = 200; // approximate; used only for fit checks

  // available space on each side of the target
  const spaceBelow = vh - (spot.top + spot.height);
  const spaceAbove = spot.top;
  const spaceRight = vw - (spot.left + spot.width);
  const spaceLeft = spot.left;

  // Choose a side that actually has room. Fall back through preferences so a
  // tall/wide target (e.g. the category grid) never pushes the card offscreen.
  const need = cardH + gap + margin;
  let place = placement ?? 'bottom';
  const fits: Record<string, boolean> = {
    bottom: spaceBelow >= need,
    top: spaceAbove >= need,
    right: spaceRight >= cardW + gap + margin,
    left: spaceLeft >= cardW + gap + margin,
  };
  if (!fits[place]) {
    place =
      (['bottom', 'top', 'right', 'left'] as const).find((p) => fits[p]) ?? place;
  }

  const style: React.CSSProperties = {};
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

  if (place === 'bottom' || place === 'top') {
    style.left = clamp(spot.left + spot.width / 2 - cardW / 2, margin, vw - cardW - margin);
    const rawTop = place === 'bottom' ? spot.top + spot.height + gap : spot.top - gap - cardH;
    // clamp vertically so the whole card stays on screen regardless of target size
    style.top = clamp(rawTop, margin, vh - cardH - margin);
  } else {
    style.top = clamp(spot.top + spot.height / 2 - cardH / 2, margin, vh - cardH - margin);
    const rawLeft = place === 'left' ? spot.left - cardW - gap : spot.left + spot.width + gap;
    style.left = clamp(rawLeft, margin, vw - cardW - margin);
  }
  // never let the card exceed the viewport height
  style.maxHeight = `${vh - margin * 2}px`;
  return style;
}

/**
 * Return the first *visible* element matching the selector (non-zero size and
 * on-screen-ish), so we don't spotlight a hidden/mobile duplicate.
 */
function findVisible(selector: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
      return el;
    }
  }
  return els[0] ?? null;
}
