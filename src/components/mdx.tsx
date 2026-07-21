import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { DayOneChecklist } from '@/components/day-one-checklist';
import { SeattleHikes } from '@/components/seattle-hikes';
import { BucketList } from '@/components/bucket-list';
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
  Mountain,
  MountainSnow,
  Trees,
  Compass,
  MapPinned,
  Coffee,
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
  Mountain,
  MountainSnow,
  Trees,
  Compass,
  MapPinned,
  Coffee,
};

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...icons,
    DayOneChecklist,
    SeattleHikes,
    BucketList,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
