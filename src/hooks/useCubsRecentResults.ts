import { useQuery } from '@tanstack/react-query';

// Recent Cubs results via MLB Stats API (free, no auth). Cubs team ID = 112.
const CUBS_TEAM_ID = 112;

export interface CubsRecentResult {
  gamePk: number;
  date: string; // YYYY-MM-DD (Chicago)
  opponent: string;
  homeAway: 'home' | 'away';
  cubsScore: number;
  opponentScore: number;
  won: boolean;
}

function chicagoDateParts(offsetDays: number): { mdY: string; ymd: string } {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  return { mdY: `${m}/${day}/${y}`, ymd: `${y}-${m}-${day}` };
}

export function useCubsRecentResults(limit = 3) {
  return useQuery<CubsRecentResult[]>({
    queryKey: ['mlb-cubs-recent-results', limit],
    queryFn: async () => {
      try {
        const start = chicagoDateParts(-12);
        const today = chicagoDateParts(0);
        const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${CUBS_TEAM_ID}&startDate=${encodeURIComponent(start.mdY)}&endDate=${encodeURIComponent(today.mdY)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`MLB schedule failed: ${res.status}`);
        const json = await res.json();

        const results: CubsRecentResult[] = [];
        for (const dateEntry of json?.dates ?? []) {
          for (const g of dateEntry?.games ?? []) {
            const state: string = (g?.status?.detailedState ?? '').toLowerCase();
            const isFinal =
              state.includes('final') || state.includes('completed') || state.includes('game over');
            if (!isFinal) continue;
            // Exclude today's game — the hero scoreboard owns it
            if (dateEntry?.date === today.ymd) continue;

            const cubsAreHome = g?.teams?.home?.team?.id === CUBS_TEAM_ID;
            const cubsSide = cubsAreHome ? g?.teams?.home : g?.teams?.away;
            const oppSide = cubsAreHome ? g?.teams?.away : g?.teams?.home;
            if (cubsSide?.score == null || oppSide?.score == null) continue;

            results.push({
              gamePk: g?.gamePk,
              date: dateEntry?.date ?? '',
              opponent: oppSide?.team?.teamName || oppSide?.team?.name || 'Opponent',
              homeAway: cubsAreHome ? 'home' : 'away',
              cubsScore: cubsSide.score,
              opponentScore: oppSide.score,
              won: cubsSide.score > oppSide.score,
            });
          }
        }

        // Most recent first, cap at limit
        results.sort((a, b) => (a.date < b.date ? 1 : -1));
        return results.slice(0, limit);
      } catch (err) {
        console.error('[useCubsRecentResults] failed', err);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}
