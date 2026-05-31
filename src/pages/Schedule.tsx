import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, MapPin, Clock, Plus, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { SEOMeta } from '@/components/SEOMeta';
import { CUBS_SCHEDULE_2025 } from '@/data/cubsSchedule2025';
import { useCountdown } from '@/hooks/useCountdown';
import { Switch } from '@/components/ui/switch';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { cn } from '@/lib/utils';

function parseGameDateTime(game: typeof CUBS_SCHEDULE_2025[0]): Date {
  const [timeStr, period] = game.time.split(' ');
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const [year, month, day] = game.date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, parseInt(minuteStr, 10), 0);
}

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Schedule() {
  const navigate = useNavigate();
  const { open } = useCreateMeetup();
  const [homeOnly, setHomeOnly] = useState(false);

  const now = Date.now();

  const { allGames, nextGame, nextHomeGame } = useMemo(() => {
    const all = CUBS_SCHEDULE_2025.map((g) => ({
      ...g,
      gameDateTime: parseGameDateTime(g),
    }));

    const upcoming = all.filter((g) => g.gameDateTime.getTime() > now);
    const next = upcoming[0] ?? null;
    const nextHome = upcoming.find((g) => g.isHome) ?? null;

    return { allGames: all, nextGame: next, nextHomeGame: nextHome };
  }, [now]);

  const displayedGames = useMemo(() => {
    if (homeOnly) return allGames.filter((g) => g.isHome);
    return allGames;
  }, [allGames, homeOnly]);

  const nextUpcomingId = nextGame?.id ?? null;
  const nextHomeId = nextHomeGame?.id ?? null;

  const countdownTarget = nextGame?.gameDateTime ?? null;
  const countdown = useCountdown(countdownTarget);

  const handlePlanMeetup = (game: typeof allGames[0]) => {
    const gameDateTime = parseGameDateTime(game);
    open('Wrigley Field', {
      opponent: game.opponent,
      gameDate: game.date,
      gameTime: game.time,
      gameDateTime: gameDateTime.toISOString(),
      isHome: game.isHome,
    });
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <SEOMeta
        title="Cubs 2025 Schedule — Wrigleyville Buddies"
        description="Full Chicago Cubs 2025 schedule. Plan meetups for home games at Wrigley Field."
        url="/schedule"
      />
      <AppHeader />

      <main className="mx-auto max-w-lg px-4 pt-4 pb-8">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate('/discover')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80 active:scale-95"
            aria-label="Back to Discover"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              2025 Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              Plan your Wrigley days
            </p>
          </div>
        </div>

        {/* Toggle Filter */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              {homeOnly ? 'Home Games Only' : 'All Games'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Home only</span>
            <Switch checked={homeOnly} onCheckedChange={setHomeOnly} />
          </div>
        </div>

        {/* Countdown for next game */}
        {nextGame && !countdown.isExpired && (
          <div className="mb-5 rounded-xl border-l-4 border-secondary bg-accent p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Next Game Countdown</p>
                <p className="mt-1 text-lg font-extrabold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Cubs vs {nextGame.opponent}
                </p>
                <p className="text-sm text-white/90">
                  {nextGame.weekday}, {formatGameDate(nextGame.date)} · {nextGame.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                  {countdown.formatted}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Game List */}
        <div className="space-y-3">
          {displayedGames.map((game) => {
            const isNextUpcoming = game.id === nextUpcomingId;
            const isNextHome = game.id === nextHomeId;
            const isPast = game.gameDateTime.getTime() <= now;

            return (
              <div
                key={game.id}
                className={cn(
                  'relative overflow-hidden rounded-xl border bg-card shadow-card transition-all',
                  isNextHome ? 'border-secondary/50 ring-1 ring-secondary/20' : 'border-border'
                )}
              >
                {/* NEXT GAME banner */}
                {isNextHome && (
                  <div className="bg-secondary px-3 py-1 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-secondary-foreground">
                      Next Home Game
                    </span>
                  </div>
                )}

                {/* Red left accent border for home games */}
                {game.isHome && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground truncate" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                          vs {game.opponent}
                        </h3>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                            game.isHome
                              ? 'bg-accent text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {game.isHome ? 'Home' : 'Away'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-accent" />
                          {game.weekday}, {formatGameDate(game.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {game.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="inline h-3 w-3 mr-0.5 text-accent" />
                        {game.location}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlanMeetup(game)}
                    className={cn(
                      'mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold transition-all active:scale-[0.98]',
                      isPast
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                        : 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90'
                    )}
                    disabled={isPast}
                  >
                    {isPast ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Game Completed
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Plan Meetup
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {displayedGames.length === 0 && (
          <div className="py-12 text-center">
            <ConceptIcon name="calendar" className="mx-auto h-10 w-10 text-muted-foreground" size={40} />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">No games found</p>
          </div>
        )}
      </main>
    </div>
  );
}
