import { useQuery } from '@tanstack/react-query';

// MLB Stats API — free, no auth needed.
// Cubs team ID = 112
// Docs: https://statsapi.mlb.com/docs/
const CUBS_TEAM_ID = 112;

export type CubsGameStatus =
  | 'scheduled'    // game today, hasn't started
  | 'pre-game'     // warmup window
  | 'live'         // in progress
  | 'final'        // ended today
  | 'postponed'
  | 'no-game';     // no Cubs game today

export interface CubsLiveGame {
  status: CubsGameStatus;
  gamePk?: number;
  opponent?: string;
  opponentAbbr?: string;
  homeAway?: 'home' | 'away';
  venue?: string;
  gameDate?: string;          // ISO
  detailedState?: string;     // raw MLB string for debug
  // Live data (when status === 'live' or 'final')
  cubsScore?: number;
  opponentScore?: number;
  inning?: number;
  inningHalf?: 'Top' | 'Bottom' | 'Middle' | 'End';
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  lastPlay?: string;
  // Pre-game
  probablePitcherCubs?: string;
  probablePitcherOpponent?: string;
}

function todayDateStr(): string {
  // MLB API uses MM/DD/YYYY in Chicago timezone (Wrigley)
  const now = new Date();
  // Convert to America/Chicago via Intl
  const chicago = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const m = chicago.find(p => p.type === 'month')?.value;
  const d = chicago.find(p => p.type === 'day')?.value;
  const y = chicago.find(p => p.type === 'year')?.value;
  return `${m}/${d}/${y}`;
}

async function fetchScheduleToday(): Promise<any> {
  const date = todayDateStr();
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${CUBS_TEAM_ID}&date=${encodeURIComponent(date)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB schedule failed: ${res.status}`);
  return res.json();
}

async function fetchLinescore(gamePk: number): Promise<any> {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function fetchPlays(gamePk: number): Promise<any> {
  // Lightweight feed for last play description
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function mapStatus(detailedState: string): CubsGameStatus {
  const s = detailedState.toLowerCase();
  if (s.includes('postpone') || s.includes('cancel')) return 'postponed';
  if (s === 'final' || s.includes('final') || s.includes('completed') || s.includes('game over')) return 'final';
  if (s.includes('in progress') || s.includes('manager') || s.includes('warmup')) {
    return s.includes('warmup') ? 'pre-game' : 'live';
  }
  if (s.includes('pre-game') || s.includes('preview') || s.includes('scheduled')) return 'scheduled';
  return 'scheduled';
}

export function useMlbCubsGame() {
  return useQuery<CubsLiveGame>({
    queryKey: ['mlb-cubs-game'],
    queryFn: async () => {
      try {
        const schedule = await fetchScheduleToday();
        const dates = schedule?.dates ?? [];
        const games = dates[0]?.games ?? [];
        if (games.length === 0) {
          return { status: 'no-game' };
        }
        const g = games[0];
        const detailedState: string = g?.status?.detailedState ?? 'Scheduled';
        const status = mapStatus(detailedState);
        const cubsAreHome = g?.teams?.home?.team?.id === CUBS_TEAM_ID;
        const opponentTeam = cubsAreHome ? g?.teams?.away?.team : g?.teams?.home?.team;

        const base: CubsLiveGame = {
          status,
          gamePk: g?.gamePk,
          opponent: opponentTeam?.name,
          opponentAbbr: opponentTeam?.abbreviation || opponentTeam?.teamName,
          homeAway: cubsAreHome ? 'home' : 'away',
          venue: g?.venue?.name,
          gameDate: g?.gameDate,
          detailedState,
          probablePitcherCubs: cubsAreHome
            ? g?.teams?.home?.probablePitcher?.fullName
            : g?.teams?.away?.probablePitcher?.fullName,
          probablePitcherOpponent: cubsAreHome
            ? g?.teams?.away?.probablePitcher?.fullName
            : g?.teams?.home?.probablePitcher?.fullName,
        };

        // Pull line score and last play if live or final
        if ((status === 'live' || status === 'final') && g?.gamePk) {
          const [linescore, feed] = await Promise.all([
            fetchLinescore(g.gamePk),
            status === 'live' ? fetchPlays(g.gamePk) : Promise.resolve(null),
          ]);

          if (linescore) {
            const cubsScore = cubsAreHome ? linescore?.teams?.home?.runs : linescore?.teams?.away?.runs;
            const oppScore = cubsAreHome ? linescore?.teams?.away?.runs : linescore?.teams?.home?.runs;
            base.cubsScore = cubsScore ?? 0;
            base.opponentScore = oppScore ?? 0;
            base.inning = linescore?.currentInning;
            base.inningHalf = linescore?.inningHalf;
            base.outs = linescore?.outs;
            base.balls = linescore?.balls;
            base.strikes = linescore?.strikes;
            base.onFirst = !!linescore?.offense?.first;
            base.onSecond = !!linescore?.offense?.second;
            base.onThird = !!linescore?.offense?.third;
          }
          if (feed) {
            const allPlays = feed?.liveData?.plays?.allPlays ?? [];
            const last = allPlays[allPlays.length - 1];
            base.lastPlay = last?.result?.description;
          }
        }

        return base;
      } catch (err) {
        console.error('[useMlbCubsGame] failed', err);
        return { status: 'no-game' };
      }
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'live' || data?.status === 'pre-game') return 20_000; // 20s when live
      if (data?.status === 'scheduled' || data?.status === 'final') return 120_000; // 2 min
      return 600_000; // 10 min for no-game
    },
    staleTime: 15_000,
  });
}
