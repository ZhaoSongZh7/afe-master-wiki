import Link from 'next/link';
import { ArrowRight, Rocket, Wallet, Building2, Briefcase, Users } from 'lucide-react';

const categories = [
  {
    title: 'Getting Started',
    description: "Before Day One, glossary & acronyms, who's who.",
    href: '/docs/getting-started',
    Icon: Rocket,
  },
  {
    title: 'Money & Benefits',
    description: 'Insurance, expenses, PTO, and relocation.',
    href: '/docs/money-benefits',
    Icon: Wallet,
  },
  {
    title: 'Logistics & Facilities',
    description: 'Commute, parking, badge access, and equipment.',
    href: '/docs/logistics-facilities',
    Icon: Building2,
  },
  {
    title: 'Work & Development',
    description: 'Tools & software setup, and career growth.',
    href: '/docs/work-development',
    Icon: Briefcase,
  },
  {
    title: 'Community & Support',
    description: 'Timeline, culture, wellness, events, and FAQ.',
    href: '/docs/community-support',
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
          <span className="dark:text-white">The AFE Handbook</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fd-muted-foreground">
          Everything you need for the program — onboarding, benefits, logistics,
          development, and community. All in one place.
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
            href="/docs/community-support/faq"
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
