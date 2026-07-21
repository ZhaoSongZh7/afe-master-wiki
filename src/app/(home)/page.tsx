import Link from 'next/link';
import {
  ArrowRight,
  Rocket,
  Wallet,
  Car,
  Building2,
  SquareTerminal,
  TrendingUp,
  Map,
  Users,
} from 'lucide-react';

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
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-4xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          style={{ backgroundColor: 'rgba(245,92,56,0.12)', color: '#d94726' }}
        >
          Amazon Future Engineers
        </span>
        <h1
          className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ color: '#0d2d7d' }}
        >
          <span className="dark:text-white">Relay</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fd-muted-foreground">
          Your handbook for the Amazon Future Engineers program — onboarding,
          benefits, logistics, development, and community, all in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f55c38' }}
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/faq"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            Read the FAQ
          </Link>
        </div>
      </div>

      <div className="mt-16 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ title, description, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-xl border border-fd-border bg-fd-card p-5 text-left transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
          >
            <span
              className="inline-flex size-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(245,92,56,0.12)', color: '#f55c38' }}
            >
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-fd-foreground">{title}</h2>
            <p className="mt-1 text-sm text-fd-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
