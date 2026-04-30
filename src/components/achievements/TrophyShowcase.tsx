import { useMemo, useState } from 'react';
import {
  Hand,
  Users,
  Calendar,
  Pizza,
  Beer,
  Wine,
  Building2,
  Star,
  Moon,
  Award as TrophyOutline,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  useTrophies,
  trophyColors,
  type TrophyCategory,
  type TrophyWithProgress,
} from '@/hooks/useTrophies';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  'hi-five': Hand,
  fans: Users,
  meetup: Calendar,
  food: Pizza,
  beer: Beer,
  shot: Wine,
  bar: Building2,
  star: Star,
  moon: Moon,
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
  const Icon = ICON_MAP[t.icon] ?? TrophyOutline;
  const colors = trophyColors(t.category);
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
      <div
        className={cn(
          'relative mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1',
          t.earned ? 'ring-2' : 'opacity-60',
          colors.ring,
        )}
        style={
          t.earned
            ? {
                background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
              }
            : { background: 'hsl(var(--muted))' }
        }
        aria-hidden
      >
        <Icon
          className={cn('h-7 w-7', t.earned ? 'text-white' : 'text-muted-foreground')}
          strokeWidth={2.4}
        />
        {!t.earned && (
          <Lock className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background p-0.5 text-muted-foreground" />
        )}
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
