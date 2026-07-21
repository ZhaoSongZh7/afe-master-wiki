import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Rocket,
  Wallet,
  Car,
  Building2,
  SquareTerminal,
  TrendingUp,
  Map,
  Users,
  Mountain,
} from 'lucide-react';
import { RelayLogo } from '@/components/logo';
import { DayOneChecklist } from '@/components/day-one-checklist';
import { ProductTour, TourButton } from '@/components/product-tour';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';

const categories = [
  {
    title: 'Getting Started',
    description: "Before Day One, glossary & acronyms, who's who.",
    href: '/docs/before-day-one',
    Icon: Rocket,
  },
  {
    title: 'Pay & Benefits',
    description: 'Insurance, expenses & reimbursement, and time off.',
    href: '/docs/benefits-insurance',
    Icon: Wallet,
  },
  {
    title: 'Logistics & Commute',
    description: 'Transportation, badge access, and relocation.',
    href: '/docs/transportation-commute',
    Icon: Car,
  },
  {
    title: 'Facilities & Equipment',
    description: 'Equipment requests and your physical workspace.',
    href: '/docs/gref',
    Icon: Building2,
  },
  {
    title: 'Tools & Software',
    description: 'Dev environment setup, Claude, and Kiro.',
    href: '/docs/dev-environment-setup',
    Icon: SquareTerminal,
  },
  {
    title: 'Career & Growth',
    description: 'Mentorship, goals & 1:1s, and evaluations.',
    href: '/docs/career-development',
    Icon: TrendingUp,
  },
  {
    title: 'The Program',
    description: 'Timeline, milestones, and culture & values.',
    href: '/docs/program-overview',
    Icon: Map,
  },
  {
    title: 'Community & Wellbeing',
    description: 'Health & wellness, and events & community.',
    href: '/docs/health-wellness',
    Icon: Users,
  },
  {
    title: 'Life in Seattle',
    description: 'Hikes, a bucket list, and a weekend guide.',
    href: '/docs/seattle-hikes',
    Icon: Mountain,
  },
];

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(ellipse_at_top,_rgba(245,92,56,0.13),_transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(245,92,56,0.16),_transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(13,45,125,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,45,125,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black_10%,transparent_72%)] dark:opacity-30" />

      <section className="w-full max-w-5xl text-center">
        <Badge>
          <span className="size-1.5 rounded-full bg-fd-primary" />
          Amazon Future Engineers
        </Badge>
        <h1 className="mt-7 flex justify-center">
          <RelayLogo className="h-20 sm:h-24" />
          <span className="sr-only">Relay</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-fd-muted-foreground sm:text-lg">
          A friendly starting point for your Amazon Future Engineers journey —
          find what you need for onboarding, benefits, development, and community.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/docs" className={buttonVariants({ size: 'lg' })}>
            Explore the handbook <ArrowRight className="size-4" />
          </Link>
          <Link href="/docs/faq" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Read the FAQ
          </Link>
          <TourButton className={buttonVariants({ variant: 'ghost', size: 'lg' })} />
        </div>

        <div className="mx-auto mt-12 max-w-md" data-tour="checklist">
          <DayOneChecklist variant="widget" />
        </div>
      </section>

      <section className="mt-20 w-full max-w-5xl" aria-labelledby="handbook-sections">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-primary">Find your way around</p>
            <h2 id="handbook-sections" className="mt-2 text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
              Everything you need, in one place
            </h2>
          </div>
          <Link href="/docs" className="hidden items-center gap-1 text-sm font-medium text-fd-primary hover:underline sm:inline-flex">
            View all <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="categories">
          {categories.map(({ title, description, href, Icon }) => (
            <Link key={href} href={href} className="group focus-visible:outline-none">
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:border-fd-primary/50 group-hover:shadow-lg group-hover:shadow-fd-primary/10 group-focus-visible:ring-2 group-focus-visible:ring-fd-ring">
                <CardContent className="flex h-full flex-col p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-fd-accent text-fd-primary transition-colors group-hover:bg-fd-primary group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-fd-foreground">{title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-6 text-fd-muted-foreground">{description}</p>
                  <span className={cn('mt-4 inline-flex items-center gap-1 text-sm font-medium text-fd-primary', 'transition-transform group-hover:translate-x-0.5')}>
                    Explore <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <ProductTour />
    </main>
  );
}
