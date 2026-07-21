import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Link from 'next/link';
import { Sparkles, FilePlus } from 'lucide-react';
import { RelayLogo } from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <RelayLogo className="h-10" />,
    },
    links: [
      {
        type: 'custom',
        secondary: true,
        // Both actions in one row so they sit horizontally adjacent in the top
        // nav AND in the docs sidebar footer (which otherwise stacks links).
        children: (
          <div className="flex items-center gap-2">
            <Link
              href="/docs/new"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1')}
            >
              <FilePlus className="size-4" />
              New Page
            </Link>
            <Link
              href="/ask-ai"
              data-tour="ask-ai"
              className={cn(buttonVariants({ variant: 'signal', size: 'sm' }), 'flex-1')}
            >
              <Sparkles className="size-3.5" />
              Ask AI
            </Link>
          </div>
        ),
      },
    ],
  };
}
