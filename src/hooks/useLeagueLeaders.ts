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

export type LeaderboardPeriod = 'week' | 'month' | 'season';

export interface LeagueLeaderRow {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  favorite_food_spot: string | null;
  stat_value: number;
  rank: number;
}

export function useLeagueLeaders(
  category: LeaderboardCategory,
  limit = 100,
  period: LeaderboardPeriod = 'season',
) {
  return useQuery({
    queryKey: ['league-leaders', category, limit, period],
    queryFn: async (): Promise<LeagueLeaderRow[]> => {
      const { data, error } = await supabase.rpc('get_league_leaders' as any, {
        p_category: category,
        p_limit: limit,
        p_period: period,
      });
      if (error) throw error;
      return (data ?? []) as LeagueLeaderRow[];
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export interface LeaderboardExtraRow {
  user_id: string;
  rank_delta: number;
  weeks_active_recent: number;
}

export function useLeaderboardExtras(
  category: LeaderboardCategory,
  period: LeaderboardPeriod = 'season',
) {
  return useQuery({
    queryKey: ['league-leaders-extras', category, period],
    queryFn: async (): Promise<LeaderboardExtraRow[]> => {
      const { data, error } = await supabase.rpc('get_leaderboard_extras' as any, {
        p_category: category,
        p_period: period,
      });
      if (error) throw error;
      return (data ?? []) as LeaderboardExtraRow[];
    },
    staleTime: 60_000,
  });
}
