import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <span
            className="inline-flex size-6 items-center justify-center rounded-md text-[13px] font-bold text-white"
            style={{ backgroundColor: '#f55c38' }}
            aria-hidden
          >
            R
          </span>
          <span style={{ color: '#0d2d7d' }} className="dark:text-white">
            {appName}
          </span>
        </span>
      ),
    },
    // "Ask AI" entry point (top bar) — wired to the Bedrock chatbot later.
    // Uses a `custom` item so we render a single-root element (no unkeyed
    // [icon, text] array, which triggers React's missing-key warning).
    links: [
      {
        type: 'custom',
        secondary: true,
        children: (
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f55c38' }}
          >
            <Sparkles className="size-4" />
            Ask AI
          </Link>
        ),
      },
    ],
  };
}
