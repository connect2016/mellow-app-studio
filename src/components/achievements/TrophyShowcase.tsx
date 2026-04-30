import { useMemo, useState } from 'react';
import {
  useTrophies,
  type TrophyCategory,
  type TrophyWithProgress,
} from '@/hooks/useTrophies';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrophyIcon, type TrophyKey } from '@/components/trophies/TrophyIcon';

/** Map our hook's legacy `key` strings to the canonical TrophyKey set. */
const KEY_MAP: Record<string, TrophyKey> = {
  first_hi_five: 'first_hi_five',
  fans_10: 'fans_10',
  fans_50: 'fans_50',
  first_meetup: 'first_meetup',
  hosted_5: 'meetups_hosted_5',
  joined_10: 'meetups_joined_10',
  first_carb_up: 'first_appetizer',
  apps_5: 'appetizers_5',
  fav_spot: 'first_appetizer',
  first_beer: 'first_beer',
  beers_10_week: 'beers_10_week',
  beers_100: 'beers_100_season',
  first_shot: 'first_shot',
  shots_10: 'shots_10_season',
  bars_5: 'wrigleyville_marathoner',
  bars_10: 'wrigleyville_marathoner',
  opening_day: 'opening_day',
  night_game: 'night_game',
  marathoner: 'wrigleyville_marathoner',
};


const CATEGORY_LABEL: Record<TrophyCategory, string> = {
  social: 'Social',
  meetup: 'Meetups',
  food: 'Food',
  drinking: 'Drinking',
  shots: 'Shots',
  bars: 'Bars',
  special: 'Special',
};

const CATEGORY_ORDER: TrophyCategory[] = [
  'social',
  'meetup',
  'food',
  'drinking',
  'shots',
  'bars',
  'special',
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function TrophyTile({ t }: { t: TrophyWithProgress }) {
  const trophyKey = KEY_MAP[t.key] ?? 'top10';
  const earnedAt = formatDate(t.earnedAt);

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 flex flex-col items-center text-center transition-colors min-h-[148px]',
        t.earned
          ? 'border-border/60 bg-card shadow-sm'
          : 'border-dashed border-border/40 bg-muted/30',
      )}
    >
      <div className="mb-2">
        <TrophyIcon trophy={trophyKey} earned={t.earned} size="lg" />
      </div>

      <p
        className={cn(
          'text-xs font-extrabold leading-tight line-clamp-2',
          t.earned ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {t.title}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
        {t.description}
      </p>

      {t.earned ? (
        earnedAt ? (
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            Earned {earnedAt}
          </p>
        ) : (
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            Earned
          </p>
        )
      ) : (
        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
          {t.current}/{t.threshold}
        </p>
      )}
    </div>
  );
}

interface Props {
  compact?: boolean;
}

export function TrophyShowcase({ compact = false }: Props) {
  const { data: trophies = [], isLoading } = useTrophies();
  const [activeCat, setActiveCat] = useState<TrophyCategory | 'all'>('all');

  const earnedCount = useMemo(() => trophies.filter((t) => t.earned).length, [trophies]);
  const totalCount = trophies.length;

  const visible = useMemo(() => {
    const sorted = [...trophies].sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      return b.pct - a.pct;
    });
    const filtered =
      activeCat === 'all' ? sorted : sorted.filter((t) => t.category === activeCat);
    return compact ? filtered.slice(0, 6) : filtered;
  }, [trophies, activeCat, compact]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[148px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {earnedCount} of {totalCount} earned
        </p>
        {!compact && (
          <span className="text-[10px] text-muted-foreground">Tap to filter</span>
        )}
      </div>

      {!compact && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          role="tablist"
          aria-label="Trophy categories"
        >
          {(['all', ...CATEGORY_ORDER] as const).map((c) => {
            const isActive = activeCat === c;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCat(c)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider min-h-[36px]',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/50 bg-card/70 text-foreground/80 hover:bg-muted/60',
                )}
              >
                {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {visible.map((t) => (
          <TrophyTile key={t.key} t={t} />
        ))}
      </div>
    </div>
  );
}
