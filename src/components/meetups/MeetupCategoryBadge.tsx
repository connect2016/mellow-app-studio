/**
 * MeetupCategoryBadge — color-coded category pill with a small icon.
 * Replaces emoji prefixes in meetup titles.
 *
 * <MeetupCategoryBadge category="pregame" />
 * <MeetupCategoryBadge category="bar_hang" size="sm" />
 */
import {
  Beer,
  Flame,
  Tv,
  Users,
  UtensilsCrossed,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MeetupCategory =
  | 'pregame'
  | 'postgame'
  | 'drinks'
  | 'food'
  | 'flash'
  | 'bar_hang'
  | 'game_watch';

interface CategoryConfig {
  label: string;
  icon: typeof Beer;
  // Tailwind tokens. Subtle bg + saturated text/icon. Border 1px.
  bg: string;
  text: string;
  border: string;
}

const CATEGORY: Record<MeetupCategory, CategoryConfig> = {
  pregame: {
    label: 'Pregame',
    icon: Sun,
    bg: 'bg-amber-500/12',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  postgame: {
    label: 'Postgame',
    icon: Moon,
    bg: 'bg-violet-500/12',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-500/30',
  },
  drinks: {
    label: 'Drinks',
    icon: Beer,
    bg: 'bg-orange-500/12',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/30',
  },
  food: {
    label: 'Food',
    icon: UtensilsCrossed,
    bg: 'bg-rose-500/12',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
  },
  flash: {
    label: 'Flash Meetup',
    icon: Zap,
    bg: 'bg-yellow-400/15',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-400/40',
  },
  bar_hang: {
    label: 'Bar Hang',
    icon: Users,
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  game_watch: {
    label: 'Game Watch',
    icon: Tv,
    bg: 'bg-sky-500/12',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30',
  },
};

const ALIASES: Record<string, MeetupCategory> = {
  pre: 'pregame',
  'pre-game': 'pregame',
  'pre game': 'pregame',
  post: 'postgame',
  'post-game': 'postgame',
  'post game': 'postgame',
  beer: 'drinks',
  beers: 'drinks',
  drink: 'drinks',
  cocktails: 'drinks',
  eat: 'food',
  eats: 'food',
  meal: 'food',
  hot: 'flash',
  rally: 'flash',
  bar: 'bar_hang',
  bars: 'bar_hang',
  hang: 'bar_hang',
  watch: 'game_watch',
  game: 'game_watch',
  watchparty: 'game_watch',
  'watch-party': 'game_watch',
};

export function resolveCategory(input: string | null | undefined): MeetupCategory | null {
  if (!input) return null;
  const k = String(input).trim().toLowerCase();
  if (!k) return null;
  if (k in CATEGORY) return k as MeetupCategory;
  if (ALIASES[k]) return ALIASES[k];
  return null;
}

export interface MeetupCategoryBadgeProps {
  category: MeetupCategory | string | null | undefined;
  size?: 'sm' | 'md';
  /** Override displayed label. */
  label?: string;
  className?: string;
}

export function MeetupCategoryBadge({
  category,
  size = 'sm',
  label,
  className,
}: MeetupCategoryBadgeProps) {
  const key = resolveCategory(category);
  if (!key) return null;
  const c = CATEGORY[key];
  const Icon = c.icon;

  const sizing =
    size === 'md'
      ? 'h-7 px-2.5 text-xs gap-1.5'
      : 'h-6 px-2 text-[10px] gap-1';
  const iconSize = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wide leading-none',
        sizing,
        c.bg,
        c.text,
        c.border,
        className
      )}
      aria-label={`${label ?? c.label} meetup`}
    >
      <Icon className={iconSize} strokeWidth={2.2} aria-hidden="true" />
      {label ?? c.label}
    </span>
  );
}
