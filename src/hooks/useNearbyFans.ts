import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NearbyFan = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  zip_code: string | null;
  vibe_tags: string[] | null;
  watch_locations: string[] | null;
  distance_meters: number | null;
};

type Args = {
  lat: number | null;
  lng: number | null;
  zip?: string | null;
  radiusMiles?: number;
  enabled?: boolean;
};

/**
 * Proximity-based fan discovery.
 * - Primary: PostGIS RPC `nearby_fans` (radius in miles).
 * - Fallback: same-zip query when caller has no GPS or the RPC errors.
 *
 * The RPC is SECURITY DEFINER and gated on auth.uid(); unauthenticated calls
 * return zero rows. Current user is excluded server-side.
 */
export function useNearbyFans({
  lat,
  lng,
  zip,
  radiusMiles = 2,
  enabled = true,
}: Args) {
  const { user } = useAuth();
  const hasCoords = lat !== null && lng !== null;
  const hasZip = !!zip && /^\d{5}$/.test(zip);

  return useQuery<NearbyFan[]>({
    queryKey: ['nearby-fans', user?.id, lat, lng, zip, radiusMiles],
    enabled: !!user && enabled && (hasCoords || hasZip),
    queryFn: async () => {
      if (hasCoords) {
        const { data, error } = await supabase.rpc('nearby_fans', {
          user_lat: lat as number,
          user_lng: lng as number,
          radius_miles: radiusMiles,
        });
        if (!error && data) return data as NearbyFan[];
        // fall through to zip fallback if RPC errored
        console.warn('nearby_fans RPC failed, falling back to zip:', error);
      }

      if (hasZip) {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'user_id, display_name, profile_photo, zip_code, vibe_tags, watch_locations',
          )
          .eq('zip_code', zip as string)
          .eq('onboarding_completed', true)
          .eq('is_banned', false)
          .neq('user_id', user!.id)
          .limit(50);
        if (error) throw error;
        return (data ?? []).map(
          (p): NearbyFan => ({
            id: p.user_id as string,
            display_name: p.display_name,
            avatar_url: p.profile_photo,
            zip_code: p.zip_code,
            vibe_tags: p.vibe_tags,
            watch_locations: p.watch_locations,
            distance_meters: null,
          }),
        );
      }

      return [];
    },
    staleTime: 30_000,
  });
}
