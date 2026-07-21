import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  FilePlus,
  CircleQuestionMark,
  Library,
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
import { PageFrame } from '@/components/ui/page-frame';
import { SectionHeading } from '@/components/ui/section-heading';
import { SiteFooter } from '@/components/site-footer';
import { cn } from '@/lib/cn';

type Accent = 'info' | 'positive' | 'highlight';
type Span = 'standard' | 'wide' | 'tall';

// Visual metadata only — titles, descriptions, and destinations are unchanged.
const categories: {
  title: string;
  description: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  span: Span;
}[] = [
  { title: 'Getting Started', description: "Before Day One, glossary & acronyms, who's who.", href: '/docs/before-day-one', Icon: Rocket, accent: 'info', span: 'wide' },
  { title: 'Pay & Benefits', description: 'Insurance, expenses & reimbursement, and time off.', href: '/docs/benefits-insurance', Icon: Wallet, accent: 'positive', span: 'standard' },
  { title: 'Logistics & Commute', description: 'Transportation, badge access, and relocation.', href: '/docs/transportation-commute', Icon: Car, accent: 'highlight', span: 'standard' },
  { title: 'Facilities & Equipment', description: 'Equipment requests and your physical workspace.', href: '/docs/gref', Icon: Building2, accent: 'info', span: 'standard' },
  { title: 'Tools & Software', description: 'Dev environment setup, Claude, and Kiro.', href: '/docs/dev-environment-setup', Icon: SquareTerminal, accent: 'positive', span: 'standard' },
  { title: 'Career & Growth', description: 'Mentorship, goals & 1:1s, and evaluations.', href: '/docs/career-development', Icon: TrendingUp, accent: 'highlight', span: 'standard' },
  { title: 'The Program', description: 'Timeline, milestones, and culture & values.', href: '/docs/program-overview', Icon: Map, accent: 'info', span: 'standard' },
  { title: 'Community & Wellbeing', description: 'Health & wellness, and events & community.', href: '/docs/health-wellness', Icon: Users, accent: 'positive', span: 'standard' },
  { title: 'Life in Seattle', description: 'Hikes, a bucket list, and a weekend guide.', href: '/docs/seattle-hikes', Icon: Mountain, accent: 'highlight', span: 'wide' },
];

const accentIcon: Record<Accent, string> = {
  info: 'bg-[var(--relay-info-soft)] text-relay-info',
  positive: 'bg-[var(--relay-positive-soft)] text-relay-positive',
  highlight: 'bg-[var(--relay-highlight-soft)] text-relay-highlight',
};

const orientationNodes = [
  { label: 'Get oriented', hint: 'Onboarding & first days' },
  { label: 'Get equipped', hint: 'Tools, benefits, logistics' },
  { label: 'Get connected', hint: 'Culture, growth, community' },
];

export default function HomePage() {
  return (
    <>
    <PageFrame motif="route-map" className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
      {/* ---- Asymmetric hero -------------------------------------------- */}
      <section className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relay-enter">
          <Badge variant="signal">
            <span className="size-1.5 rounded-full bg-relay-signal" />
            Amazon Future Engineers
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-relay-ink sm:text-5xl lg:text-6xl">
            Start here.<br />
            <span className="text-relay-signal">Find your next step.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-relay-ink-muted sm:text-lg">
            Your field guide to the Amazon Future Engineers program — onboarding,
            benefits, development, and community, all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/docs" className={buttonVariants({ variant: 'signal', size: 'lg' })}>
              Explore the handbook <ArrowRight className="size-4" />
            </Link>
            <Link href="/ask-ai" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Ask Relay
            </Link>
            <TourButton className={buttonVariants({ variant: 'outline', size: 'lg' })} />
          </div>
        </div>

        {/* Route-map composition — decorative, hidden from AT */}
        <div className="relative" aria-hidden>
          <Card variant="feature" className="p-6 sm:p-8">
            <div className="flex justify-center">
              <RelayLogo className="h-14 sm:h-16" />
            </div>
            <ol className="mt-8 space-y-0">
              {orientationNodes.map((node, i) => (
                <li key={node.label} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < orientationNodes.length - 1 && (
                    <span className="absolute left-[13px] top-7 h-full w-px bg-relay-border-strong" />
                  )}
                  <span className="relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-relay-signal bg-relay-surface-raised">
                    <span className="size-2 rounded-full bg-relay-signal" />
                  </span>
                  <div>
                    <p className="font-display font-semibold text-relay-ink">{node.label}</p>
                    <p className="text-sm text-relay-ink-muted">{node.hint}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* ---- Day One checklist: feature surface ------------------------- */}
      <section className="mt-16 w-full max-w-6xl" aria-labelledby="first-handoff">
        <SectionHeading
          eyebrow="Your first handoff"
          title="Day-one checklist"
          description="Track what to do in your first week — progress saves on this device."
          index="01"
          className="mb-6"
        />
        <Card variant="feature" data-tour="checklist">
          <CardContent className="p-2 sm:p-4">
            <DayOneChecklist variant="widget" />
          </CardContent>
        </Card>
      </section>

      {/* ---- Bento categories ------------------------------------------- */}
      <section className="mt-16 w-full max-w-6xl" aria-labelledby="handbook-sections">
        <SectionHeading
          eyebrow="Find your way around"
          title="Everything you need, in one place"
          index="02"
          action={
            <Link href="/docs" className="inline-flex items-center gap-1 text-sm font-medium text-relay-signal hover:underline">
              View all <ArrowUpRight className="size-4" />
            </Link>
          }
          className="mb-6"
        />
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="categories">
          {categories.map(({ title, description, href, Icon, accent, span }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'group focus-visible:outline-none',
                span === 'wide' && 'sm:col-span-2 lg:col-span-1',
              )}
            >
              <Card variant="interactive" className="h-full group-focus-visible:ring-2 group-focus-visible:ring-fd-ring">
                <CardContent className="flex h-full flex-col p-5">
                  <span className={cn('flex size-10 items-center justify-center rounded-xl transition-colors', accentIcon[accent])}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-relay-ink">{title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-6 text-relay-ink-muted">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-relay-signal transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none">
                    Explore <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Contribution strip ----------------------------------------- */}
      <section className="mt-16 w-full max-w-6xl">
        <Card variant="inset">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-relay-ink">Help keep Relay useful</h2>
              <p className="mt-1 text-sm text-relay-ink-muted">
                Find an answer, check the authoritative source, or add a page for the next cohort.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/docs/faq" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <CircleQuestionMark className="size-4" /> FAQ
              </Link>
              <Link href="/docs/canonical-sources" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Library className="size-4" /> Canonical Sources
              </Link>
              <Link href="/docs/new" className={buttonVariants({ variant: 'signal', size: 'sm' })}>
                <FilePlus className="size-4" /> New Page
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <ProductTour />
    </PageFrame>
    <SiteFooter />
    </>
  );
}
