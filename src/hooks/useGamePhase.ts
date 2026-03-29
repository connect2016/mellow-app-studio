import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GamePhase = 'no-game' | 'pre-game' | 'mid-game' | 'post-game';

export interface GamePhaseData {
  phase: GamePhase;
  game: {
    id: string;
    opponent: string;
    venue: string;
    game_start: string;
    game_end: string;
  } | null;
  minutesToStart: number | null;
  minutesSinceEnd: number | null;
  inningEstimate: number | null;
}

export function useGamePhase() {
  const { user } = useAuth();

  return useQuery<GamePhaseData>({
    queryKey: ['game-phase'],
    queryFn: async () => {
      const now = new Date();
      const twoHoursBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const threeHoursAfter = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

      // Look for games within a wide window: 3h future to 2h past
      const { data: games } = await supabase
        .from('games')
        .select('id, opponent, venue, game_start, game_end')
        .eq('is_home', true)
        .lte('game_start', threeHoursAfter)
        .gte('game_end', twoHoursBefore)
        .order('game_start', { ascending: true })
        .limit(1);

      const game = games?.[0] ?? null;
      if (!game) {
        return { phase: 'no-game' as const, game: null, minutesToStart: null, minutesSinceEnd: null, inningEstimate: null };
      }

      const start = new Date(game.game_start);
      const end = new Date(game.game_end);
      const msToStart = start.getTime() - now.getTime();
      const msSinceEnd = now.getTime() - end.getTime();

      // Pre-game: up to 3 hours before first pitch
      if (msToStart > 0) {
        return {
          phase: 'pre-game' as const,
          game,
          minutesToStart: Math.round(msToStart / 60000),
          minutesSinceEnd: null,
          inningEstimate: null,
        };
      }

      // Post-game: after game_end
      if (msSinceEnd > 0) {
        return {
          phase: 'post-game' as const,
          game,
          minutesToStart: null,
          minutesSinceEnd: Math.round(msSinceEnd / 60000),
          inningEstimate: null,
        };
      }

      // Mid-game: between start and end
      const elapsedMins = (now.getTime() - start.getTime()) / 60000;
      const inningEstimate = Math.min(Math.ceil(elapsedMins / 20), 9); // ~20min per inning rough estimate

      return {
        phase: 'mid-game' as const,
        game,
        minutesToStart: null,
        minutesSinceEnd: null,
        inningEstimate,
      };
    },
    refetchInterval: 60000, // check phase every minute
    enabled: !!user,
  });
}
