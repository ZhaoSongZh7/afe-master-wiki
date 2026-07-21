import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Link from 'next/link';
import { Sparkles, FilePlus } from 'lucide-react';
import { RelayLogo } from '@/components/logo';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <RelayLogo className="h-10" />,
    },
    links: [
      {
        type: 'custom',
        secondary: true,
        children: (
          <Link
            href="/docs/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            <FilePlus className="size-4" />
            New Page
          </Link>
        ),
      },
      {
        type: 'custom',
        secondary: true,
        children: (
          <Link
            href="/ask-ai"
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
