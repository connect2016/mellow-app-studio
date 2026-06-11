import { useQuery } from '@tanstack/react-query';

const CUBS_BLUE = 'hsl(var(--brand-navy))';
const CUBS_RED = 'hsl(var(--brand-red))';

type GameState = 'Live' | 'Final' | 'Pre-Game' | 'Postponed' | 'Scheduled';

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

async function fetchCubsGames(): Promise<MlbGame | null> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&teamId=112&hydrate=linescore&startDate=${fmt(start)}&endDate=${fmt(end)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch MLB schedule');
  const data = await res.json();

  const allGames: MlbGame[] = (data.dates ?? []).flatMap((d: { games: MlbGame[] }) => d.games);
  if (allGames.length === 0) return null;

  // Prefer live, then next upcoming, then most recent final
  const live = allGames.find((g) => g.status.abstractGameState === 'Live');
  if (live) return live;
  const upcoming = allGames
    .filter((g) => g.status.abstractGameState === 'Preview')
    .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime())[0];
  if (upcoming) return upcoming;
  return allGames
    .filter((g) => g.status.abstractGameState === 'Final')
    .sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())[0] ?? null;
}

function getState(game: MlbGame): GameState {
  const s = game.status.abstractGameState;
  if (s === 'Live') return 'Live';
  if (s === 'Final') return 'Final';
  if (game.status.detailedState?.toLowerCase().includes('postpone')) return 'Postponed';
  return 'Pre-Game';
}

export function CubsGameTracker() {
  const { data: game, isLoading, error } = useQuery({
    queryKey: ['mlb-cubs-schedule'],
    queryFn: fetchCubsGames,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return (
    <div
      className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg"
      style={{ background: 'white', border: `1px solid ${CUBS_BLUE}22`, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      role="region"
      aria-label="Chicago Cubs game tracker"
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: CUBS_BLUE, color: 'white' }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Cubs Game Tracker</span>
        {game && getState(game) === 'Live' && (
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: CUBS_RED }}
              />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: CUBS_RED }} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Live</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-5 min-h-[140px]">
        {isLoading && (
          <p className="text-sm text-center" style={{ color: '#666' }}>Loading game…</p>
        )}
        {error && (
          <p className="text-sm text-center" style={{ color: CUBS_RED }}>
            Could not load game data.
          </p>
        )}
        {!isLoading && !error && !game && (
          <p className="text-sm text-center" style={{ color: '#666' }}>No games scheduled in the next week.</p>
        )}
        {game && <GameBody game={game} />}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 text-[10px] leading-snug text-center"
        style={{ background: '#F5F6F8', color: '#555' }}
      >
        Data provided for informational purposes. This independent fan tool is not affiliated with MLB.
      </div>
    </div>
  );
}

function GameBody({ game }: { game: MlbGame }) {
  const state = getState(game);
  const away = (game.teams.away.team.locationName ?? game.teams.away.team.name).toUpperCase();
  const home = (game.teams.home.team.locationName ?? game.teams.home.team.name).toUpperCase();
  const awayScore = game.teams.away.score ?? 0;
  const homeScore = game.teams.home.score ?? 0;

  const startTime = new Date(game.gameDate).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const inningLabel =
    state === 'Live' && game.linescore?.currentInningOrdinal
      ? `${game.linescore.inningHalf ?? ''} ${game.linescore.currentInningOrdinal}`.trim()
      : state;

  return (
    <div className="flex flex-col gap-4">
      {/* Matchup */}
      <div className="flex items-center justify-between gap-3">
        <TeamBlock name={away} score={state !== 'Pre-Game' ? awayScore : undefined} accent={CUBS_BLUE} />
        <div className="text-center px-2">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: CUBS_RED }}
          >
            vs
          </div>
        </div>
        <TeamBlock name={home} score={state !== 'Pre-Game' ? homeScore : undefined} accent={CUBS_BLUE} align="right" />
      </div>

      {/* Status pill */}
      <div className="flex justify-center">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            background: state === 'Live' ? CUBS_RED : `${CUBS_BLUE}10`,
            color: state === 'Live' ? 'white' : CUBS_BLUE,
            border: state === 'Live' ? 'none' : `1px solid ${CUBS_BLUE}33`,
          }}
        >
          {inningLabel}
        </span>
      </div>

      {/* Time */}
      {state === 'Pre-Game' && (
        <p className="text-center text-sm" style={{ color: '#444' }}>
          First pitch: <span className="font-semibold">{startTime}</span>
        </p>
      )}
    </div>
  );
}

function TeamBlock({
  name,
  score,
  accent,
  align = 'left',
}: {
  name: string;
  score?: number;
  accent: string;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: accent }}>
        {name}
      </p>
      {score !== undefined && (
        <p className="text-4xl font-black leading-none mt-1" style={{ color: '#111' }}>
          {score}
        </p>
      )}
    </div>
  );
}
