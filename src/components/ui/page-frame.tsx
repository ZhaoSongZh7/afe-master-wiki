import * as React from 'react';
import { cn } from '@/lib/cn';

export type PageFrameProps = {
  children: React.ReactNode;
  /** Decorative motif rendered behind content. Always aria-hidden. */
  motif?: 'none' | 'route-map' | 'grid';
  className?: string;
};

/**
 * Owns the page canvas and optional decorative motifs. All decoration is
 * hidden from assistive technology and carries no required information
 * (Requirement 3.2 / 10.8 — CSS/SVG only, no raster assets).
 */
export function PageFrame({ children, motif = 'none', className }: PageFrameProps) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      {motif !== 'none' && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* soft signal glow at top */}
          <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_var(--relay-signal-soft),_transparent_62%)]" />
          {/* fine route grid, masked to fade out */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--relay-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--relay-border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 [mask-image:linear-gradient(to_bottom,black_8%,transparent_70%)]" />
          {motif === 'route-map' && <RouteLines />}
        </div>
      )}
      {children}
    </div>
  );
}

/** A thin relay line with handoff nodes — the signature Field Guide motif. */
function RouteLines() {
  return (
    <svg
      className="absolute right-[-6rem] top-8 hidden h-[26rem] w-[40rem] opacity-70 lg:block"
      viewBox="0 0 640 420"
      fill="none"
    >
      <path
        d="M20 360 C 180 360, 220 120, 360 120 S 560 60, 620 60"
        stroke="var(--relay-border-strong)"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      {[
        [20, 360],
        [360, 120],
        [620, 60],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="10" fill="var(--relay-canvas)" stroke="var(--relay-signal)" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="3.5" fill="var(--relay-signal)" />
        </g>
      ))}
    </svg>
  );
}
