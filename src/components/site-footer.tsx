import Link from 'next/link';
import { RelayLogo } from '@/components/logo';

/**
 * SiteFooter — a standard, non-sticky company-style footer.
 *
 * Sits in normal page flow (not fixed/sticky). Multi-column link groups + a
 * bottom bar carrying the team credits. Uses Field Guide semantic tokens.
 */

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Get started',
    links: [
      { label: 'Day-One Checklist', href: '/docs/day-one-checklist' },
      { label: 'Before Day One', href: '/docs/before-day-one' },
      { label: 'Glossary & Acronyms', href: '/docs/glossary-acronyms' },
      { label: "Who's Who", href: '/docs/whos-who' },
    ],
  },
  {
    heading: 'Handbook',
    links: [
      { label: 'Pay & Benefits', href: '/docs/benefits-insurance' },
      { label: 'Tools & Software', href: '/docs/dev-environment-setup' },
      { label: 'Career & Growth', href: '/docs/career-development' },
      { label: 'The Program', href: '/docs/program-overview' },
    ],
  },
  {
    heading: 'Life in Seattle',
    links: [
      { label: 'Seattle Hikes', href: '/docs/seattle-hikes' },
      { label: 'Bucket List', href: '/docs/seattle-bucket-list' },
      { label: 'Weekend Guide', href: '/docs/weekend-guide' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Ask Relay', href: '/ask-ai' },
      { label: 'FAQ', href: '/docs/faq' },
      { label: 'Canonical Sources', href: '/docs/canonical-sources' },
      { label: 'Contribute a page', href: '/docs/new' },
    ],
  },
];

const team = ['Zhao Song Zhou', 'Chikaosolu Nnadozie', 'Larry Le', 'Robin Lin'];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-relay-border bg-relay-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand column */}
          <div className="max-w-xs">
            <RelayLogo className="h-9" />
            <p className="mt-4 text-sm leading-6 text-relay-ink-muted">
              Your field guide to the Amazon Future Engineers program — onboarding,
              benefits, development, and community, all in one place.
            </p>
            <p className="mt-4 text-xs text-relay-ink-muted">
              A friendly starting point. Official HR, AFE, and AUTA systems remain
              authoritative.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-relay-ink">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-relay-ink-muted transition-colors hover:text-relay-signal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-relay-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-relay-ink-muted">
            © 2026 Relay. Built for the Amazon Future Engineers program.
          </p>
          <p className="text-xs text-relay-ink-muted">
            <span className="font-medium text-relay-ink">Made by</span>{' '}
            {team.join(' · ')}
          </p>
        </div>
      </div>
    </footer>
  );
}
