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
        children: (
          <Link
            href="/docs/new"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mb-2')}
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
            data-tour="ask-ai"
            className={buttonVariants({ variant: 'signal', size: 'sm' })}
          >
            <Sparkles className="size-3.5" />
            Ask AI
          </Link>
        ),
      },
    ],
  };
}
