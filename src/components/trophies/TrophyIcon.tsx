/**
 * TrophyIcon — single component covering both placement trophies
 * (Gold/Silver/Bronze/Top10) and achievement trophies.
 *
 * Earned trophies render filled with metallic / brand gradient.
 * Unearned trophies render outline-only on a muted disc with a Lock badge.
 *
 * Underlying glyphs come from Lucide so they stay tree-shakable and
 * follow the app's clean rounded-outline icon library.
 */

import {
  Award,
  Beer,
  Building2,
  Calendar,
  Hand,
  Lock,
  Medal,
  Moon,
  Pizza,
  Star,
  Sun,
  Trophy,
  Users,
  UtensilsCrossed,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------

export type TrophyKey =
  // Placement
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'top10'
  // Meetups
  | 'first_meetup'
  | 'meetups_hosted_5'
  | 'meetups_joined_10'
  // Social
  | 'first_hi_five'
  | 'fans_10'
  | 'fans_50'
  // Drinking
  | 'first_beer'
  | 'beers_10_week'
  | 'beers_100_season'
  // Shots
  | 'first_shot'
  | 'shots_10_season'
  // Food
  | 'first_appetizer'
  | 'appetizers_5'
  // Special
  | 'opening_day'
  | 'night_game'
  | 'wrigleyville_marathoner';

interface TrophyDescriptor {
  Icon: LucideIcon;
  /** A label suitable for a11y / tooltip. */
  label: string;
  /** Tailwind gradient classes for the earned (filled) state. */
  earnedGradient: string;
  /** Optional ring + shadow for the earned state. */
  earnedRing: string;
  /** Stroke / fill color for the icon when earned. */
  earnedIconColor: string;
}

const TROPHIES: Record<TrophyKey, TrophyDescriptor> = {
  // Placement — metallic
  gold: {
    Icon: Trophy,
    label: 'Gold Trophy',
    earnedGradient:
      'bg-[linear-gradient(135deg,#FFE082_0%,#FFC107_45%,#B8860B_100%)]',
    earnedRing: 'ring-2 ring-amber-300/70 shadow-[0_2px_10px_-2px_rgba(255,193,7,0.55)]',
    earnedIconColor: 'text-amber-950',
  },
  silver: {
    Icon: Medal,
    label: 'Silver Trophy',
    earnedGradient:
      'bg-[linear-gradient(135deg,#F4F6FA_0%,#C4CAD3_50%,#7C8593_100%)]',
    earnedRing: 'ring-2 ring-zinc-300/70 shadow-[0_2px_10px_-2px_rgba(180,190,205,0.55)]',
    earnedIconColor: 'text-zinc-800',
  },
  bronze: {
    Icon: Award,
    label: 'Bronze Trophy',
    earnedGradient:
      'bg-[linear-gradient(135deg,#F2B68C_0%,#CD7F32_50%,#7A4218_100%)]',
    earnedRing: 'ring-2 ring-orange-400/70 shadow-[0_2px_10px_-2px_rgba(205,127,50,0.55)]',
    earnedIconColor: 'text-orange-950',
  },
  top10: {
    Icon: Star,
    label: 'Top 10 Badge',
    earnedGradient: 'bg-[linear-gradient(135deg,#1E3A8A_0%,#3B82F6_100%)]',
    earnedRing: 'ring-1 ring-blue-300/40',
    earnedIconColor: 'text-blue-50',
  },

  // Meetups — purple
  first_meetup: {
    Icon: Calendar,
    label: 'First Meetup',
    earnedGradient: 'bg-[linear-gradient(135deg,#7C3AED_0%,#A855F7_100%)]',
    earnedRing: 'ring-1 ring-purple-300/40',
    earnedIconColor: 'text-purple-50',
  },
  meetups_hosted_5: {
    Icon: Calendar,
    label: '5 Meetups Hosted',
    earnedGradient: 'bg-[linear-gradient(135deg,#6D28D9_0%,#8B5CF6_100%)]',
    earnedRing: 'ring-1 ring-purple-300/40',
    earnedIconColor: 'text-purple-50',
  },
  meetups_joined_10: {
    Icon: Calendar,
    label: '10 Meetups Joined',
    earnedGradient: 'bg-[linear-gradient(135deg,#4C1D95_0%,#7C3AED_100%)]',
    earnedRing: 'ring-1 ring-purple-300/40',
    earnedIconColor: 'text-purple-50',
  },

  // Social — blue
  first_hi_five: {
    Icon: Hand,
    label: 'First Hi-Five',
    earnedGradient: 'bg-[linear-gradient(135deg,#2563EB_0%,#60A5FA_100%)]',
    earnedRing: 'ring-1 ring-blue-300/40',
    earnedIconColor: 'text-blue-50',
  },
  fans_10: {
    Icon: Users,
    label: '10 Fans Connected',
    earnedGradient: 'bg-[linear-gradient(135deg,#1D4ED8_0%,#3B82F6_100%)]',
    earnedRing: 'ring-1 ring-blue-300/40',
    earnedIconColor: 'text-blue-50',
  },
  fans_50: {
    Icon: Users,
    label: '50 Fans Connected',
    earnedGradient: 'bg-[linear-gradient(135deg,#1E3A8A_0%,#2563EB_100%)]',
    earnedRing: 'ring-1 ring-blue-300/40',
    earnedIconColor: 'text-blue-50',
  },

  // Drinking — amber
  first_beer: {
    Icon: Beer,
    label: 'First Beer Logged',
    earnedGradient: 'bg-[linear-gradient(135deg,#F59E0B_0%,#FBBF24_100%)]',
    earnedRing: 'ring-1 ring-amber-300/50',
    earnedIconColor: 'text-amber-950',
  },
  beers_10_week: {
    Icon: Beer,
    label: '10 Beers This Week',
    earnedGradient: 'bg-[linear-gradient(135deg,#D97706_0%,#F59E0B_100%)]',
    earnedRing: 'ring-1 ring-amber-300/50',
    earnedIconColor: 'text-amber-950',
  },
  beers_100_season: {
    Icon: Beer,
    label: '100 Beers This Season',
    earnedGradient: 'bg-[linear-gradient(135deg,#92400E_0%,#F59E0B_100%)]',
    earnedRing: 'ring-1 ring-amber-300/50',
    earnedIconColor: 'text-amber-50',
  },

  // Shots — rose
  first_shot: {
    Icon: Wine,
    label: 'First Shot',
    earnedGradient: 'bg-[linear-gradient(135deg,hsl(var(--brand-red))_0%,#FB7185_100%)]',
    earnedRing: 'ring-1 ring-rose-300/50',
    earnedIconColor: 'text-rose-50',
  },
  shots_10_season: {
    Icon: Wine,
    label: '10 Shots This Season',
    earnedGradient: 'bg-[linear-gradient(135deg,#9F1239_0%,#F43F5E_100%)]',
    earnedRing: 'ring-1 ring-rose-300/50',
    earnedIconColor: 'text-rose-50',
  },

  // Food — orange
  first_appetizer: {
    Icon: Pizza,
    label: 'First Appetizer',
    earnedGradient: 'bg-[linear-gradient(135deg,#F97316_0%,#FBBF24_100%)]',
    earnedRing: 'ring-1 ring-orange-300/50',
    earnedIconColor: 'text-orange-950',
  },
  appetizers_5: {
    Icon: UtensilsCrossed,
    label: '5 Appetizers',
    earnedGradient: 'bg-[linear-gradient(135deg,#C2410C_0%,#F97316_100%)]',
    earnedRing: 'ring-1 ring-orange-300/50',
    earnedIconColor: 'text-orange-50',
  },

  // Special
  opening_day: {
    Icon: Sun,
    label: 'Opening Day Warrior',
    earnedGradient: 'bg-[linear-gradient(135deg,#EAB308_0%,#FDE047_100%)]',
    earnedRing: 'ring-1 ring-yellow-300/60',
    earnedIconColor: 'text-yellow-950',
  },
  night_game: {
    Icon: Moon,
    label: 'Night Game Legend',
    earnedGradient: 'bg-[linear-gradient(135deg,#1E1B4B_0%,#4338CA_100%)]',
    earnedRing: 'ring-1 ring-indigo-300/40',
    earnedIconColor: 'text-indigo-50',
  },
  wrigleyville_marathoner: {
    Icon: Zap,
    label: 'Wrigleyville Marathoner',
    earnedGradient: 'bg-[linear-gradient(135deg,#0F766E_0%,#14B8A6_100%)]',
    earnedRing: 'ring-1 ring-teal-300/40',
    earnedIconColor: 'text-teal-50',
  },
};

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

const SIZE_MAP = {
  xs: { wrap: 'h-5 w-5',  icon: 'h-2.5 w-2.5', lock: 'h-2.5 w-2.5' },
  sm: { wrap: 'h-7 w-7',  icon: 'h-3.5 w-3.5', lock: 'h-3 w-3' },
  md: { wrap: 'h-10 w-10', icon: 'h-5 w-5',    lock: 'h-3.5 w-3.5' },
  lg: { wrap: 'h-14 w-14', icon: 'h-7 w-7',    lock: 'h-4 w-4' },
} as const;

export type TrophySize = keyof typeof SIZE_MAP;

export interface TrophyIconProps {
  trophy: TrophyKey;
  /** Earned = filled metallic / brand gradient. Unearned = outline on muted disc. */
  earned?: boolean;
  size?: TrophySize;
  className?: string;
  /** Show the trophy label as a chip next to the medallion. */
  withLabel?: boolean;
}

export function TrophyIcon({
  trophy,
  earned = true,
  size = 'md',
  className,
  withLabel = false,
}: TrophyIconProps) {
  const desc = TROPHIES[trophy];
  const dims = SIZE_MAP[size];
  const Icon = desc.Icon;

  const medallion = (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl',
        dims.wrap,
        earned
          ? cn(desc.earnedGradient, desc.earnedRing)
          : 'bg-muted/50 ring-1 ring-border/60',
        className,
      )}
      role="img"
      aria-label={`${desc.label}${earned ? '' : ' (locked)'}`}
      title={desc.label}
    >
      <Icon
        className={cn(dims.icon, earned ? desc.earnedIconColor : 'text-muted-foreground')}
        // 2px stroke weight per design spec
        strokeWidth={2}
        // Outline style for unearned, filled-color metallic for earned
        fill={earned ? 'currentColor' : 'none'}
        fillOpacity={earned ? 0.15 : 0}
      />
      {!earned && (
        <Lock
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 text-muted-foreground',
            dims.lock,
          )}
          aria-hidden
        />
      )}
    </span>
  );

  if (!withLabel) return medallion;

  return (
    <span className="inline-flex items-center gap-2">
      {medallion}
      <span
        className={cn(
          'text-xs font-extrabold uppercase tracking-wider',
          earned ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {desc.label}
      </span>
    </span>
  );
}

/** Map a leaderboard rank to a placement trophy (or null). */
export function rankToTrophy(rank: number): TrophyKey | null {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  if (rank <= 10) return 'top10';
  return null;
}

export function trophyLabel(trophy: TrophyKey): string {
  return TROPHIES[trophy].label;
}
