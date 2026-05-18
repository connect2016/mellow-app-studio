import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: string;
  context_text: string | null;
  location_zone: string | null;
  w_flag_count: number;
  created_at: string;
  display_name: string;
  profile_photo: string | null;
  fan_tier_emoji: string | null;
}

export function useActivityFeed(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: async (): Promise<ActivityFeedItem[]> => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('id, user_id, activity_type, context_text, location_zone, w_flag_count, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      if (!data?.length) return [];
      const ids = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: ids,
        p_limit: ids.length,
      });
      const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      return data.map(r => {
        const p: any = pMap.get(r.user_id) ?? {};
        return {
          ...r,
          display_name: p.display_name ?? 'A fan',
          profile_photo: p.profile_photo ?? null,
          fan_tier_emoji: p.fan_tier_emoji ?? null,
        };
      });
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useReactWFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { data, error } = await supabase.rpc('react_w_flag', { p_activity_id: activityId });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-feed'] }),
  });
}
