import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  Rocket,
  Wallet,
  Building2,
  Briefcase,
  Users,
  House,
  BookA,
  Contact,
  HeartPulse,
  Receipt,
  CalendarDays,
  Car,
  Package,
  Wrench,
  TrendingUp,
  Sparkles,
  Map,
  PartyPopper,
  CircleQuestionMark,
  SquareTerminal,
  Bot,
  IdCard,
  Armchair,
  MessagesSquare,
  ClipboardCheck,
} from 'lucide-react';

// Icons referenced as JSX inside MDX (e.g. <Card icon={<Rocket />} />) must be
// provided here — MDX does not auto-import them.
const icons = {
  Rocket,
  Wallet,
  Building2,
  Briefcase,
  Users,
  House,
  BookA,
  Contact,
  HeartPulse,
  Receipt,
  CalendarDays,
  Car,
  Package,
  Wrench,
  TrendingUp,
  Sparkles,
  Map,
  PartyPopper,
  CircleQuestionMark,
  SquareTerminal,
  Bot,
  IdCard,
  Armchair,
  MessagesSquare,
  ClipboardCheck,
};

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...icons,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
