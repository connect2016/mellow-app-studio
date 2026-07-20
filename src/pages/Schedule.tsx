import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, MapPin, Clock, Plus, Radio } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { SEOMeta } from '@/components/SEOMeta';
import { CUBS_SCHEDULE_2026 } from '@/data/cubsSchedule2026';
import { useCountdown } from '@/hooks/useCountdown';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import { useCubsRecentResults } from '@/hooks/useCubsRecentResults';
import { Switch } from '@/components/ui/switch';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { cn } from '@/lib/utils';

const UPCOMING_COUNT = 8;

function parseGameDateTime(game: typeof CUBS_SCHEDULE_2026[0]): Date {
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

function formatResultDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Schedule() {
  const navigate = useNavigate();
  const { open } = useCreateMeetup();
  const [homeOnly, setHomeOnly] = useState(false);

  const now = Date.now();
  const { data: liveGame } = useMlbCubsGame();
  const { data: recentResults = [] } = useCubsRecentResults(3);

  const { nextGame, upcomingGames } = useMemo(() => {
    const all = CUBS_SCHEDULE_2026.map((g) => ({
      ...g,
      gameDateTime: parseGameDateTime(g),
    }));
    const upcoming = all.filter((g) => g.gameDateTime.getTime() > now);
    return { nextGame: upcoming[0] ?? null, upcomingGames: upcoming };
  }, [now]);

  const displayedUpcoming = useMemo(() => {
    const pool = homeOnly ? upcomingGames.filter((g) => g.isHome) : upcomingGames;
    return pool.slice(0, UPCOMING_COUNT);
  }, [upcomingGames, homeOnly]);

  const nextHomeId = useMemo(
    () => upcomingGames.find((g) => g.isHome)?.id ?? null,
    [upcomingGames],
  );

  const countdown = useCountdown(nextGame?.gameDateTime ?? null);

  // Hero mode: show live scoreboard when there is a Cubs game today
  const showScoreboard =
    liveGame &&
    (liveGame.status === 'live' || liveGame.status === 'final' || liveGame.status === 'pre-game');

  const cubsWinning =
    (liveGame?.cubsScore ?? 0) > (liveGame?.opponentScore ?? 0);

  const handlePlanMeetup = (game: typeof upcomingGames[0]) => {
    open('Wrigley Field', {
      opponent: game.opponent,
      gameDate: game.date,
      gameTime: game.time,
      gameDateTime: game.gameDateTime.toISOString(),
      isHome: game.isHome,
    });
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <SEOMeta
        title="Cubs 2026 Schedule — Wrigleyville Buddies"
        description="Cubs scoreboard, recent results, and upcoming games. Plan meetups for home games at Wrigley Field."
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
              Cubs Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              Plan your Wrigley days
            </p>
          </div>
        </div>

        {/* Hero: live scoreboard when there is a game today, countdown otherwise */}
        {showScoreboard ? (
          <div className="mb-5 overflow-hidden rounded-2xl border-l-4 border-secondary bg-primary text-primary-foreground shadow-elevated">
            <div className="flex items-center justify-between px-4 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                {liveGame.status === 'live' && (
                  <span className="inline-flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-secondary" />
                    Live · {liveGame.inningHalf} {liveGame.inning}
                    {typeof liveGame.outs === 'number' ? ` · ${liveGame.outs} out${liveGame.outs === 1 ? '' : 's'}` : ''}
                  </span>
                )}
                {liveGame.status === 'final' && (cubsWinning ? 'Final · Cubs Win' : 'Final')}
                {liveGame.status === 'pre-game' && 'Warming Up at ' + (liveGame.venue ?? 'Wrigley')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 px-4 py-4">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-white/80">Cubs</p>
                <p className="text-4xl font-extrabold tabular-nums" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {liveGame.cubsScore ?? 0}
                </p>
              </div>
              <span className="text-lg font-bold text-white/50">—</span>
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-white/80">
                  {liveGame.opponentAbbr ?? liveGame.opponent ?? 'OPP'}
                </p>
                <p className="text-4xl font-extrabold tabular-nums" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {liveGame.opponentScore ?? 0}
                </p>
              </div>
            </div>
            {liveGame.status === 'live' && liveGame.lastPlay && (
              <p className="border-t border-white/15 px-4 py-2 text-xs text-white/85">
                {liveGame.lastPlay}
              </p>
            )}
          </div>
        ) : (
          nextGame && !countdown.isExpired && (
            <div className="mb-5 rounded-2xl border-l-4 border-secondary bg-primary p-4 text-primary-foreground shadow-elevated">
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
                  <p className="text-2xl font-extrabold tabular-nums">
                    {countdown.formatted}
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Recent results */}
        {recentResults.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Last {recentResults.length} Game{recentResults.length === 1 ? '' : 's'}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {recentResults.map((r, i) => (
                <div
                  key={r.gamePk}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    i > 0 && 'border-t border-border',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white',
                      r.won ? 'bg-accent' : 'bg-secondary',
                    )}
                  >
                    {r.won ? 'W' : 'L'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {r.homeAway === 'home' ? 'vs' : '@'} {r.opponent}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatResultDate(r.date)}</p>
                  </div>
                  <p className="text-base font-extrabold tabular-nums text-foreground">
                    {r.cubsScore}–{r.opponentScore}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter toggle for upcoming games */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
            Coming Up
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Home only</span>
            <Switch checked={homeOnly} onCheckedChange={setHomeOnly} />
          </div>
        </div>

        {/* Upcoming games */}
        <div className="space-y-3">
          {displayedUpcoming.map((game) => {
            const isNextHome = game.id === nextHomeId;

            return (
              <div
                key={game.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border bg-card shadow-card transition-all',
                  isNextHome ? 'border-secondary/50 ring-1 ring-secondary/20' : 'border-border'
                )}
              >
                {isNextHome && (
                  <div className="bg-secondary px-3 py-1 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-secondary-foreground">
                      Next Home Game
                    </span>
                  </div>
                )}

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
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider',
                            game.isHome
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {game.isHome ? 'Home' : 'Away'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          {game.weekday}, {formatGameDate(game.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {game.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="inline h-3 w-3 mr-0.5 text-primary" />
                        {game.location}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlanMeetup(game)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-sm font-bold text-secondary-foreground shadow-sm transition-all hover:bg-secondary/90 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Plan Meetup
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {displayedUpcoming.length === 0 && (
          <div className="py-12 text-center">
            <ConceptIcon name="calendar" className="mx-auto h-10 w-10 text-muted-foreground" size={40} />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {homeOnly ? 'No upcoming home games' : 'Season complete — see you next spring'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
