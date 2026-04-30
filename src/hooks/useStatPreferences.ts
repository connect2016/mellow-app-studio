import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type StatKey =
  | 'beersToday'
  | 'beersThisWeek'
  | 'barsVisitedToday'
  | 'barsVisitedThisWeek'
  | 'meetupsFinished'
  | 'fansConnected'
  | 'shotsTakenSeason'
  | 'appetizersHadSeason'
  | 'favoriteFoodSpot';
export type TimeRange = 'today' | 'this_week' | 'all_time';
export type StatVisibility = 'everyone' | 'matches_only' | 'hidden';

export interface StatPreference {
  stat_key: StatKey;
  enabled: boolean;
  sort_order: number;
  time_range: TimeRange;
  visibility: StatVisibility;
}

export const DEFAULT_STAT_PREFS: StatPreference[] = [
  { stat_key: 'beersToday', enabled: true, sort_order: 0, time_range: 'today', visibility: 'everyone' },
  { stat_key: 'beersThisWeek', enabled: true, sort_order: 1, time_range: 'this_week', visibility: 'everyone' },
  { stat_key: 'barsVisitedToday', enabled: true, sort_order: 2, time_range: 'today', visibility: 'everyone' },
  { stat_key: 'barsVisitedThisWeek', enabled: true, sort_order: 3, time_range: 'this_week', visibility: 'everyone' },
  { stat_key: 'meetupsFinished', enabled: true, sort_order: 4, time_range: 'all_time', visibility: 'everyone' },
  { stat_key: 'fansConnected', enabled: true, sort_order: 5, time_range: 'all_time', visibility: 'everyone' },
];

export const STAT_LABELS: Record<StatKey, string> = {
  beersToday: 'Beers Today',
  beersThisWeek: 'Beers This Week',
  barsVisitedToday: 'Bars Visited Today',
  barsVisitedThisWeek: 'Bars Visited This Week',
  meetupsFinished: 'Meetups Finished',
  fansConnected: 'Fans Connected',
};

export function useStatPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['stat-preferences', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_STAT_PREFS;
      const { data, error } = await supabase
        .from('stat_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      if (!data || (data as any[]).length === 0) return DEFAULT_STAT_PREFS;
      return (data as any[]).map((d: any) => ({
        stat_key: d.stat_key as StatKey,
        enabled: d.enabled as boolean,
        sort_order: d.sort_order as number,
        time_range: d.time_range as TimeRange,
        visibility: d.visibility as StatVisibility,
      }));
    },
    enabled: !!user,
  });

  const savePrefs = useMutation({
    mutationFn: async (newPrefs: StatPreference[]) => {
      if (!user) throw new Error('Not authenticated');
      // Delete existing, then insert fresh
      await supabase.from('stat_preferences' as any).delete().eq('user_id', user.id);
      const rows = newPrefs.map((p, i) => ({
        user_id: user.id,
        stat_key: p.stat_key,
        enabled: p.enabled,
        sort_order: i,
        time_range: p.time_range,
        visibility: p.visibility,
      }));
      const { error } = await supabase.from('stat_preferences' as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-preferences'] });
    },
  });

  return {
    preferences: prefs ?? DEFAULT_STAT_PREFS,
    isLoading,
    savePreferences: savePrefs.mutateAsync,
    isSaving: savePrefs.isPending,
  };
}
