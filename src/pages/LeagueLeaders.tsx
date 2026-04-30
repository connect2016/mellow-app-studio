import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Beer,
  Building2,
  CheckCircle2,
  Users,
  Wine,
  UtensilsCrossed,
  Pizza,
  Trophy,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLeagueLeaders,
  useLeaderboardExtras,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeagueLeaderRow,
  LeaderboardExtraRow,
} from '@/hooks/useLeagueLeaders';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  RankBadge,
} from '@/components/league/RankBadge';
import { TrophyIcon, rankToTrophy } from '@/components/trophies/TrophyIcon';

interface CategoryDef {
  key: LeaderboardCategory;
  label: string;
  shortLabel: string;
  Icon: typeof Beer;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'beersToday',          label: 'Beers Today',          shortLabel: 'Beers',      Icon: Beer },
  { key: 'beersThisWeek',       label: 'Beers This Week',      shortLabel: 'Beers/Wk',   Icon: Beer },
  { key: 'barsVisitedToday',    label: 'Bars Today',           shortLabel: 'Bars',       Icon: Building2 },
  { key: 'barsVisitedThisWeek', label: 'Bars This Week',       shortLabel: 'Bars/Wk',    Icon: Building2 },
  { key: 'meetupsFinished',     label: 'Meetups Done',         shortLabel: 'Meetups',    Icon: CheckCircle2 },
  { key: 'fansConnected',       label: 'Fans Connected',       shortLabel: 'Fans',       Icon: Users },
  { key: 'shotsTakenSeason',    label: 'Shots Taken (Season)', shortLabel: 'Shots',      Icon: Wine },
  { key: 'appetizersHadSeason', label: 'Appetizers (Season)',  shortLabel: 'Appetizers', Icon: UtensilsCrossed },
];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'week',   label: 'Weekly' },
  { key: 'month',  label: 'Monthly' },
  { key: 'season', label: 'Season' },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

interface LeaderRowProps {
  row: LeagueLeaderRow;
  isMe: boolean;
  onClick: () => void;
  Icon: typeof Beer;
  extra?: LeaderboardExtraRow;
  isRisingStar: boolean;
  isIronFan: boolean;
}

function LeaderRow({
  row,
  isMe,
  onClick,
  Icon,
  extra,
  isRisingStar,
  isIronFan,
}: LeaderRowProps) {
  const badgeKind: RankBadgeKind | null = rankToBadgeKind(row.rank);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 min-h-[68px] rounded-2xl border text-left transition-colors',
        'active:scale-[0.99] hover:bg-muted/50 shadow-sm',
        isMe
          ? 'border-primary/60 bg-primary/10'
          : 'border-border/40 bg-card/80',
      )}
      aria-label={`Rank ${row.rank}: ${row.display_name}, ${row.stat_value}`}
    >
      {/* Rank cell */}
      <div className="flex flex-col items-center justify-center w-10 shrink-0">
        {badgeKind ? (
          <RankBadge kind={badgeKind} size="md" />
        ) : (
          <span className="text-base font-extrabold text-muted-foreground tabular-nums">
            {row.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="shrink-0">
        {row.profile_photo ? (
          <img
            src={row.profile_photo}
            alt=""
            className="h-11 w-11 rounded-full object-cover border border-border/60"
            loading="lazy"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-muted border border-border/60 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">
              {initials(row.display_name || 'Fan')}
            </span>
          </div>
        )}
      </div>

      {/* Name + favorite spot + extras */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight truncate">
          {row.display_name || 'Anonymous Fan'}
          {isMe && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary">
              You
            </span>
          )}
        </p>

        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          {row.favorite_food_spot ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground max-w-[140px]">
              <Pizza className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{row.favorite_food_spot}</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">No favorite spot</span>
          )}

          {isRisingStar && <RankBadge kind="rising" size="sm" />}
          {isIronFan && <RankBadge kind="iron" size="sm" />}

          {extra && extra.rank_delta !== 0 && (
            <span
              className={cn(
                'text-[10px] font-bold tabular-nums',
                extra.rank_delta > 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {extra.rank_delta > 0 ? '▲' : '▼'} {Math.abs(extra.rank_delta)}
            </span>
          )}
        </div>
      </div>

      {/* Stat value */}
      <div className="flex flex-col items-end shrink-0 pl-2">
        <span className="text-2xl font-extrabold text-foreground leading-none tabular-nums">
          {row.stat_value}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </button>
  );
}

export default function LeagueLeaders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<LeaderboardCategory>('beersToday');
  const [period, setPeriod] = useState<LeaderboardPeriod>('season');

  const activeCat = CATEGORIES.find((c) => c.key === activeKey)!;
  const { data, isLoading, isError, refetch } = useLeagueLeaders(activeKey, 100, period);
  const { data: extras } = useLeaderboardExtras(activeKey, period);

  // Real-time invalidation
  useEffect(() => {
    const channel = supabase
      .channel('league-leaders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-leaders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_checkins' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-leaders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-leaders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lineup_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-leaders'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const rows = data ?? [];
  const myRow = useMemo(
    () => (user ? rows.find((r) => r.user_id === user.id) : undefined),
    [rows, user],
  );

  // Derived: Rising Star = max positive rank_delta; Iron Fan = active 4+ of last 6 weeks
  const extrasMap = useMemo(() => {
    const m = new Map<string, LeaderboardExtraRow>();
    (extras ?? []).forEach((e) => m.set(e.user_id, e));
    return m;
  }, [extras]);

  const risingStarUserId = useMemo(() => {
    if (!extras || extras.length === 0) return null;
    const top = [...extras]
      .filter((e) => e.rank_delta > 0)
      .sort((a, b) => b.rank_delta - a.rank_delta)[0];
    return top?.user_id ?? null;
  }, [extras]);

  return (
    <div className="relative min-h-screen bg-background pb-32">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 mb-3 text-sm text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <header className="mb-4">
          <h1
            className="text-3xl font-extrabold tracking-wide text-foreground"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            League Leaders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            See how you stack up this season.
          </p>
        </header>

        {/* Period toggle */}
        <div
          className="mb-4 inline-flex w-full items-center rounded-2xl border border-border/50 bg-card/70 p-1"
          role="tablist"
          aria-label="Leaderboard period"
        >
          {PERIODS.map((p) => {
            const isActive = period === p.key;
            return (
              <button
                key={p.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'flex-1 rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wider min-h-[40px] transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Category selector */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
          role="tablist"
          aria-label="Leaderboard categories"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            const isActive = activeKey === cat.key;
            return (
              <button
                key={cat.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(cat.key)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-wide min-h-[40px]',
                  'transition-colors active:scale-[0.97]',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/50 bg-card/70 text-foreground/80 hover:bg-muted/60',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {cat.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Active category header */}
        <div className="mt-4 mb-3 flex items-center gap-2">
          <activeCat.Icon className="h-5 w-5 text-primary" aria-hidden />
          <h2
            className="text-lg font-extrabold tracking-wide text-foreground"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            {activeCat.label}
          </h2>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {PERIODS.find((p) => p.key === period)?.label}
          </span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] rounded-2xl bg-muted/40 border border-border/30 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-sm font-semibold text-destructive">
              Couldn’t load the leaderboard.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-card/60 p-8 text-center">
            <p className="text-base font-bold text-foreground">No leaders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first fan on the board for {activeCat.label}.
            </p>
          </div>
        ) : (
          <ol className="space-y-2" aria-label={`${activeCat.label} rankings`}>
            {rows.map((row) => {
              const ex = extrasMap.get(row.user_id);
              const isRisingStar = !!risingStarUserId && row.user_id === risingStarUserId;
              const isIronFan = (ex?.weeks_active_recent ?? 0) >= 4;
              return (
                <li key={row.user_id}>
                  <LeaderRow
                    row={row}
                    isMe={!!user && row.user_id === user.id}
                    Icon={activeCat.Icon}
                    onClick={() => navigate(`/profile/${row.user_id}`)}
                    extra={ex}
                    isRisingStar={isRisingStar}
                    isIronFan={isIronFan}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Sticky "Your Rank" footer */}
      {user && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md"
          role="status"
          aria-label="Your current rank"
        >
          <div className="mx-auto max-w-lg px-4 py-3">
            {myRow ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                  <span className="text-sm font-extrabold text-primary tabular-nums">
                    #{myRow.rank}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Your Rank — {activeCat.label}
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {myRow.display_name || 'You'} · {myRow.stat_value}{' '}
                    {activeCat.shortLabel.toLowerCase()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl min-h-[40px]"
                  onClick={() => navigate('/profile')}
                >
                  My Card
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                  <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Your Rank
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Not on the board yet — log some {activeCat.shortLabel.toLowerCase()} to climb.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl min-h-[40px]"
                  onClick={() => navigate('/profile')}
                >
                  Update
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
