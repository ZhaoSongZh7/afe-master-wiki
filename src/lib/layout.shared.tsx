import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
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
            A
          </span>
          <span style={{ color: '#0d2d7d' }} className="dark:text-white">
            {appName}
          </span>
        </span>
      ),
    },
    // "Ask AI" entry point (top bar) — wired to the Bedrock chatbot later.
    links: [
      {
        type: 'button',
        text: (
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4" />
            Ask AI
          </span>
        ),
        url: '/docs',
        secondary: true,
      },
    ],
  };
}
