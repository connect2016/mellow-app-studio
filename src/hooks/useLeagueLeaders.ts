import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardCategory =
  | 'beersToday'
  | 'beersThisWeek'
  | 'barsVisitedToday'
  | 'barsVisitedThisWeek'
  | 'meetupsFinished'
  | 'fansConnected'
  | 'shotsTakenSeason'
  | 'appetizersHadSeason';

export interface LeagueLeaderRow {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  favorite_food_spot: string | null;
  stat_value: number;
  rank: number;
}

export function useLeagueLeaders(category: LeaderboardCategory, limit = 100) {
  return useQuery({
    queryKey: ['league-leaders', category, limit],
    queryFn: async (): Promise<LeagueLeaderRow[]> => {
      const { data, error } = await supabase.rpc('get_league_leaders' as any, {
        p_category: category,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as LeagueLeaderRow[];
    },
    // Real-time-ish: refetch on focus + every 30s while open
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}
