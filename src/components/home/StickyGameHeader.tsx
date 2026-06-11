import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const CUBS_BLUE = 'hsl(var(--brand-navy))';
const CUBS_RED = 'hsl(var(--brand-red))';

interface MlbGame {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string; detailedState: string };
  teams: {
    away: { team: { name: string; locationName?: string }; score?: number };
    home: { team: { name: string; locationName?: string }; score?: number };
  };
  linescore?: {
    currentInning?: number;
    inningHalf?: 'Top' | 'Bottom';
    currentInningOrdinal?: string;
  };
}

async function fetchNextCubsGame(): Promise<MlbGame | null> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&teamId=112&hydrate=linescore&startDate=${fmt(start)}&endDate=${fmt(end)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const games: MlbGame[] = (data.dates ?? []).flatMap((d: { games: MlbGame[] }) => d.games);
  const live = games.find((g) => g.status.abstractGameState === 'Live');
  if (live) return live;
  const upcoming = games
    .filter((g) => g.status.abstractGameState === 'Preview')
    .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime())[0];
  if (upcoming) return upcoming;
  return (
    games
      .filter((g) => g.status.abstractGameState === 'Final')
      .sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())[0] ?? null
  );
}

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

export function StickyGameHeader() {
  const { data: game, isLoading } = useQuery({
    queryKey: ['cubs-next-game'],
    queryFn: fetchNextCubsGame,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const isLive = game?.status.abstractGameState === 'Live';
  const isPre = game?.status.abstractGameState === 'Preview';
  const countdown = useCountdown(isPre ? game?.gameDate : undefined);

  const away = (game?.teams.away.team.locationName ?? game?.teams.away.team.name ?? '').toUpperCase();
  const home = (game?.teams.home.team.locationName ?? game?.teams.home.team.name ?? '').toUpperCase();

  const inningLabel =
    isLive && game?.linescore?.currentInningOrdinal
      ? `${game.linescore.inningHalf ?? ''} ${game.linescore.currentInningOrdinal}`.trim()
      : null;

  return (
    <Link
      to="/game-day"
      aria-label="Game day details"
      className="sticky top-0 z-30 block w-full -mx-4 px-4 mb-4 active:scale-[0.99] transition"
    >
      <div
        className="rounded-2xl shadow-md overflow-hidden border"
        style={{
          background: `linear-gradient(135deg, ${CUBS_BLUE} 0%, #1a4cb8 100%)`,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3 text-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                {isLive ? 'Now Playing' : isPre ? 'Next Game' : 'Last Game'}
              </span>
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                      style={{ background: CUBS_RED }}
                    />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: CUBS_RED }} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                </span>
              )}
            </div>
            {isLoading ? (
              <p className="text-base font-bold opacity-90">Loading game…</p>
            ) : !game ? (
              <p className="text-base font-bold opacity-90">No upcoming games</p>
            ) : (
              <p className="text-base font-extrabold tracking-tight truncate">
                {away} <span className="opacity-60 font-bold">vs</span> {home}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            {isLive ? (
              <div>
                <p className="text-2xl font-black leading-none tabular-nums">
                  {game?.teams.away.score ?? 0}–{game?.teams.home.score ?? 0}
                </p>
                {inningLabel && (
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
                    {inningLabel}
                  </p>
                )}
              </div>
            ) : isPre && countdown ? (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-70 mb-0.5">
                  First pitch
                </p>
                <p className="text-base font-black tabular-nums leading-none">
                  {countdown.days > 0 ? `${countdown.days}d ` : ''}
                  {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.mins).padStart(2, '0')}
                  {countdown.days === 0 && `:${String(countdown.secs).padStart(2, '0')}`}
                </p>
              </div>
            ) : game?.status.abstractGameState === 'Final' ? (
              <div>
                <p className="text-2xl font-black leading-none tabular-nums">
                  {game.teams.away.score ?? 0}–{game.teams.home.score ?? 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">Final</p>
              </div>
            ) : (
              <Trophy className="h-6 w-6 opacity-70" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
