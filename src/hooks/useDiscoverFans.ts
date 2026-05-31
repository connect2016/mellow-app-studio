import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DiscoverFilter =
  | 'all'
  | 'near_me'
  | 'bleachers'
  | 'my_gate'
  | 'same_vibe'
  | 'new_week'
  | 'sth';

export interface DiscoverFan {
  user_id: string;
  display_name: string | null;
  profile_photo: string | null;
  zip_code: string | null;
  favorite_gate: string | null;
  vibe_tags: string[] | null;
  watch_locations: string[] | null;
  is_season_ticket_holder?: boolean | null;
  created_at: string;
  distance_meters?: number | null;
}

interface UseDiscoverFansArgs {
  filter: DiscoverFilter;
  currentUserGate?: string | null;
  currentUserVibeTags?: string[];
  geo?: { lat: number; lng: number } | null;
}

export function useDiscoverFans({ filter, currentUserGate, currentUserVibeTags, geo }: UseDiscoverFansArgs) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['discover-fans', filter, currentUserGate, currentUserVibeTags?.join(','), geo?.lat, geo?.lng, user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<DiscoverFan[]> => {
      // Near Me uses RPC
      if (filter === 'near_me') {
        if (!geo) return [];
        const { data, error } = await supabase.rpc('nearby_fans', {
          user_lat: geo.lat,
          user_lng: geo.lng,
          radius_miles: 5,
        });
        if (error) throw error;
        const ids = (data ?? []).map((r: any) => r.id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, zip_code, favorite_gate, vibe_tags, watch_locations, is_season_ticket_holder, created_at')
          .in('user_id', ids);
        const byId = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
        return (data ?? [])
          .map((row: any) => {
            const p: any = byId.get(row.id);
            if (!p) return null;
            return { ...p, distance_meters: row.distance_meters } as DiscoverFan;
          })
          .filter(Boolean) as DiscoverFan[];
      }

      let q = supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, zip_code, favorite_gate, vibe_tags, watch_locations, is_season_ticket_holder, created_at')
        .eq('is_banned', false)
        .eq('onboarding_completed', true)
        .neq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'bleachers') {
        q = q.contains('watch_locations', ['Bleachers']);
      } else if (filter === 'my_gate') {
        if (!currentUserGate) return [];
        q = q.eq('favorite_gate', currentUserGate);
      } else if (filter === 'same_vibe') {
        if (!currentUserVibeTags || currentUserVibeTags.length === 0) return [];
        q = q.overlaps('vibe_tags', currentUserVibeTags);
      } else if (filter === 'new_week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte('created_at', weekAgo);
      } else if (filter === 'sth') {
        q = q.eq('is_season_ticket_holder', true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DiscoverFan[];
    },
  });
}

export async function sayHiToBuddy(recipientId: string) {
  const { data, error } = await supabase.rpc('say_hi_to_buddy', { p_recipient_id: recipientId });
  if (error) throw error;
  return data as { result: 'sent' | 'accepted' | 'already_connected' | 'already_sent'; conversation_id?: string; request_id?: string };
}
