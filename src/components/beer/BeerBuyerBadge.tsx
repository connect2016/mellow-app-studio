import { Trophy, Beer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBeerBuyerBadge, type BuyerBadgeTier } from '@/hooks/useBeerShoutouts';

const TIER_STYLES: Record<Exclude<BuyerBadgeTier, null>, { ring: string; bg: string; fg: string; icon: typeof Trophy }> = {
  legend: {
    ring: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-400/20 to-yellow-500/10',
    fg: 'text-amber-700 dark:text-amber-300',
    icon: Trophy,
  },
  regular: {
    ring: 'border-zinc-300 dark:border-zinc-500',
    bg: 'bg-gradient-to-br from-zinc-200/40 to-zinc-300/20 dark:from-zinc-700/30 dark:to-zinc-600/20',
    fg: 'text-zinc-800 dark:text-zinc-200',
    icon: Beer,
  },
  first: {
    ring: 'border-orange-300 dark:border-orange-500',
    bg: 'bg-gradient-to-br from-orange-200/40 to-amber-200/20 dark:from-orange-900/20 dark:to-amber-900/10',
    fg: 'text-orange-800 dark:text-orange-300',
    icon: Beer,
  },
};

interface Props {
  userId: string | null | undefined;
  variant?: 'tile' | 'chip';
  className?: string;
}

/**
 * Beer-buyer badge tier indicator.
 * - `tile`: full panel for the card-back stats side.
 * - `chip`: small inline pill for shoutouts/profile headers.
 */
export function BeerBuyerBadge({ userId, variant = 'tile', className }: Props) {
  const { data: badge } = useBeerBuyerBadge(userId);
  if (!badge || !badge.tier) return null;
  const style = TIER_STYLES[badge.tier];
  const Icon = style.icon;

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
          style.ring,
          style.bg,
          style.fg,
          className,
        )}
        aria-label={`${badge.label} — ${badge.count} beers bought`}
        title={`${badge.label} · ${badge.count} beer${badge.count === 1 ? '' : 's'} bought`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        <span className="truncate max-w-[120px]">{badge.label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border-2 p-3',
        style.ring,
        style.bg,
        className,
      )}
      role="img"
      aria-label={`${badge.label} — ${badge.count} beers bought`}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/60 border',
          style.ring,
        )}
      >
        <Icon className={cn('h-5 w-5', style.fg)} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-extrabold leading-tight', style.fg)}>{badge.label}</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {badge.count} beer{badge.count === 1 ? '' : 's'} bought
        </p>
      </div>
    </div>
  );
}
