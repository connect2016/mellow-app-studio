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
    staleTime: 30_000,
    queryFn: async (): Promise<DiscoverFan[]> => {
      // Guests: read via the anon-granted get_public_profiles RPC.
      // Filters that need the viewer's own profile or location return empty.
      if (!user?.id) {
        if (filter === 'near_me' || filter === 'my_gate' || filter === 'same_vibe' || filter === 'bleachers') {
          return [];
        }
        const { data, error } = await supabase.rpc('get_public_profiles', {
          p_only_onboarded: true,
          p_limit: 100,
        });
        if (error) throw error;
        let rows = (data ?? []) as any[];
        if (filter === 'new_week') {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          rows = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo);
        } else if (filter === 'sth') {
          rows = rows.filter((r) => r.is_season_ticket_holder === true);
        }
        rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return rows.map((r) => ({
          user_id: r.user_id,
          display_name: r.display_name,
          profile_photo: r.profile_photo,
          zip_code: null,
          favorite_gate: null,
          vibe_tags: null,
          watch_locations: null,
          is_season_ticket_holder: r.is_season_ticket_holder,
          created_at: r.created_at,
        })) as DiscoverFan[];
      }

      // Near Me: nearby_fans is SECURITY DEFINER and already returns full
      // profile fields + distance directly (it also excludes self via
      // `p.user_id <> auth.uid()` server-side). The old code re-fetched
      // those same rows via a direct .from('profiles') join, which RLS
      // limits to the caller's own row — so every joined row came back
      // undefined and got filtered out. Use nearby_fans' own columns.
      if (filter === 'near_me') {
        if (!geo) return [];
        const { data, error } = await supabase.rpc('nearby_fans', {
          user_lat: geo.lat,
          user_lng: geo.lng,
          radius_miles: 5,
        });
        if (error) throw error;
        return ((data ?? []) as any[]).map((r) => ({
          user_id: r.id,
          display_name: r.display_name,
          profile_photo: r.avatar_url,
          zip_code: r.zip_code,
          favorite_gate: null,
          vibe_tags: r.vibe_tags,
          watch_locations: r.watch_locations,
          distance_meters: r.distance_meters,
        })) as DiscoverFan[];
      }

      // All Fans: RLS only lets an authenticated user SELECT their own
      // profiles row directly, so a plain table query excluding self via
      // .neq() always returns zero rows. Use the same SECURITY DEFINER
      // RPC the guest branch uses, excluding self via p_exclude_ids instead.
      if (filter === 'all') {
        const { data, error } = await supabase.rpc('get_public_profiles', {
          p_exclude_ids: [user!.id],
          p_only_onboarded: true,
          p_limit: 100,
        });
        if (error) throw error;
        return ((data ?? []) as any[]).map((r) => ({
          user_id: r.user_id,
          display_name: r.display_name,
          profile_photo: r.profile_photo,
          zip_code: null,
          favorite_gate: null,
          vibe_tags: null,
          watch_locations: null,
          is_season_ticket_holder: r.is_season_ticket_holder,
          created_at: r.created_at,
        })) as DiscoverFan[];
      }

      // New This Week / Season Ticket Holders: same RLS problem as All Fans.
      // Neither filter needs a column get_public_profiles doesn't expose, so
      // fetch via the RPC and apply the same client-side filter the guest
      // branch already uses.
      if (filter === 'new_week' || filter === 'sth') {
        const { data, error } = await supabase.rpc('get_public_profiles', {
          p_exclude_ids: [user!.id],
          p_only_onboarded: true,
          p_limit: 100,
        });
        if (error) throw error;
        let rows = (data ?? []) as any[];
        if (filter === 'new_week') {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          rows = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo);
        } else {
          rows = rows.filter((r) => r.is_season_ticket_holder === true);
        }
        return rows.map((r) => ({
          user_id: r.user_id,
          display_name: r.display_name,
          profile_photo: r.profile_photo,
          zip_code: null,
          favorite_gate: null,
          vibe_tags: null,
          watch_locations: null,
          is_season_ticket_holder: r.is_season_ticket_holder,
          created_at: r.created_at,
        })) as DiscoverFan[];
      }

      // Bleachers / My Gate / Same Vibe: watch_locations, favorite_gate, and
      // vibe_tags are not columns get_public_profiles selects or returns, so
      // these can't be served through it without changing the RPC itself.
      // Left on the direct table query below, which RLS still limits to the
      // caller's own row for logged-in users — these three tabs stay broken.
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
