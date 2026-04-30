import { Trophy, Medal, Award, Star, Flame, TrendingUp, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RankBadgeKind =
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'top10'
  | 'rising'
  | 'iron';

export interface RankBadgeProps {
  kind: RankBadgeKind;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

interface BadgeStyle {
  Icon: typeof Trophy;
  label: string;
  // Tailwind utility for the gradient + ring
  gradient: string;
  ring: string;
  iconColor: string;
  textColor: string;
}

const STYLES: Record<RankBadgeKind, BadgeStyle> = {
  gold: {
    Icon: Trophy,
    label: 'Gold',
    gradient:
      'bg-[linear-gradient(135deg,#FFE082_0%,#FFC107_45%,#B8860B_100%)]',
    ring: 'ring-2 ring-amber-300/70 shadow-[0_2px_10px_-2px_rgba(255,193,7,0.55)]',
    iconColor: 'text-amber-950',
    textColor: 'text-amber-100',
  },
  silver: {
    Icon: Medal,
    label: 'Silver',
    gradient:
      'bg-[linear-gradient(135deg,#F4F6FA_0%,#C4CAD3_50%,#7C8593_100%)]',
    ring: 'ring-2 ring-zinc-300/70 shadow-[0_2px_10px_-2px_rgba(180,190,205,0.55)]',
    iconColor: 'text-zinc-800',
    textColor: 'text-zinc-100',
  },
  bronze: {
    Icon: Award,
    label: 'Bronze',
    gradient:
      'bg-[linear-gradient(135deg,#F2B68C_0%,#CD7F32_50%,#7A4218_100%)]',
    ring: 'ring-2 ring-orange-400/70 shadow-[0_2px_10px_-2px_rgba(205,127,50,0.55)]',
    iconColor: 'text-orange-950',
    textColor: 'text-orange-100',
  },
  top10: {
    Icon: Star,
    label: 'Top 10',
    gradient: 'bg-[linear-gradient(135deg,#1E3A8A_0%,#3B82F6_100%)]',
    ring: 'ring-1 ring-blue-300/40',
    iconColor: 'text-blue-50',
    textColor: 'text-blue-100',
  },
  rising: {
    Icon: TrendingUp,
    label: 'Rising Star',
    gradient: 'bg-[linear-gradient(135deg,#10B981_0%,#059669_100%)]',
    ring: 'ring-1 ring-emerald-300/40',
    iconColor: 'text-emerald-50',
    textColor: 'text-emerald-100',
  },
  iron: {
    Icon: ShieldCheck,
    label: 'Iron Fan',
    gradient: 'bg-[linear-gradient(135deg,#475569_0%,#1E293B_100%)]',
    ring: 'ring-1 ring-slate-300/30',
    iconColor: 'text-slate-50',
    textColor: 'text-slate-100',
  },
};

const SIZE_MAP = {
  sm: { wrap: 'h-6 w-6', icon: 'h-3 w-3' },
  md: { wrap: 'h-9 w-9', icon: 'h-4 w-4' },
  lg: { wrap: 'h-12 w-12', icon: 'h-6 w-6' },
};

export function RankBadge({
  kind,
  size = 'md',
  className,
  showLabel = false,
}: RankBadgeProps) {
  const style = STYLES[kind];
  const dims = SIZE_MAP[size];
  const Icon = style.Icon;

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider',
          style.gradient,
          style.ring,
          style.textColor,
          className,
        )}
        aria-label={style.label}
      >
        <Icon className={cn('h-3 w-3', style.iconColor)} strokeWidth={2.5} />
        {style.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        dims.wrap,
        style.gradient,
        style.ring,
        className,
      )}
      aria-label={style.label}
      title={style.label}
    >
      <Icon className={cn(dims.icon, style.iconColor)} strokeWidth={2.5} />
    </span>
  );
}

/** Pick the badge kind for a given rank, or null. */
export function rankToBadgeKind(rank: number): RankBadgeKind | null {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  if (rank <= 10) return 'top10';
  return null;
}
