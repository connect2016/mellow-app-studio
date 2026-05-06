import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { MapFan } from '@/components/map/useMapClusters';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

/**
 * Derive a "gate" zone from a wrigley_section string.
 * Returns one of: Bleachers, Sheffield, Waveland, Field, Upper, Club, or null.
 */
export function deriveGate(section: string | null | undefined): string | null {
  if (!section) return null;
  const s = section.toLowerCase();
  if (s.includes('bleacher')) return 'Bleachers';
  if (s.includes('sheffield')) return 'Sheffield';
  if (s.includes('waveland')) return 'Waveland';
  if (s.includes('club')) return 'Club';
  if (s.includes('upper') || /\b[45]\d{2}\b/.test(s)) return 'Upper';
  if (s.includes('field') || /\b1\d{2}\b/.test(s)) return 'Field';
  return null;
}

export const GATE_OPTIONS = ['Bleachers', 'Sheffield', 'Waveland', 'Field', 'Upper', 'Club'] as const;
export type GateFilter = typeof GATE_OPTIONS[number];

/**
 * Fan pins for the Map page. Tries `nearby_fans` RPC first (real users with
 * shared GPS, server-side fuzzed). Falls back to `get_map_fans` mock dataset
 * if the user has no GPS or the RPC returns zero rows.
 */
export function useFanMapPins() {
  const { user } = useAuth();
  const { position } = useGeolocation();

  const query = useQuery({
    queryKey: ['fan-map-pins', user?.id, position?.coords.latitude, position?.coords.longitude],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async (): Promise<MapFan[]> => {
      const lat = position?.coords.latitude ?? null;
      const lng = position?.coords.longitude ?? null;

      // Real users (radius 2mi) when GPS is available
      if (lat !== null && lng !== null) {
        const { data } = await supabase.rpc('nearby_fans', {
          user_lat: lat,
          user_lng: lng,
          radius_miles: 2,
        });
        if (data && data.length > 0) {
          // No coords come back from this RPC — scatter near Wrigley as a stand-in.
          return (data as any[]).map((f, i): MapFan => ({
            id: f.id,
            name: f.display_name ?? 'Fan',
            photo: f.avatar_url,
            lat: WRIGLEY_CENTER[0] + Math.cos(i) * 0.004,
            lng: WRIGLEY_CENTER[1] + Math.sin(i) * 0.004,
            vibe: 'chill',
            movement: 'settled',
            locationLabel: (f.watch_locations?.[0] as string) ?? 'Nearby',
            gameStatus: 'NotSet',
            persona: null,
            isRecentlyActive: true,
            intent: [],
          }));
        }
      }

      // Fallback: mock map fans with real-ish coords
      const { data: mock } = await supabase.rpc('get_map_fans');
      if (!mock) return [];
      return (mock as any[])
        .map((f) => {
          let pinLat = f.fan_latitude;
          let pinLng = f.fan_longitude;
          if (!pinLat || !pinLng) {
            pinLat = WRIGLEY_CENTER[0] + (Math.random() - 0.5) * 0.006;
            pinLng = WRIGLEY_CENTER[1] + (Math.random() - 0.5) * 0.006;
          }
          return {
            id: f.fan_user_id,
            name: f.fan_display_name ?? 'Fan',
            photo: f.fan_profile_photo,
            lat: pinLat,
            lng: pinLng,
            vibe: 'chill',
            movement: 'settled',
            locationLabel: f.fan_wrigley_section
              ? `Sec ${f.fan_wrigley_section}`
              : f.fan_wrigleyville_bar ?? 'Wrigleyville',
            gameStatus: f.fan_game_status ?? 'NotSet',
            persona: f.fan_gameday_persona ?? null,
            isRecentlyActive: f.fan_location_last_set_at
              ? Date.now() - new Date(f.fan_location_last_set_at).getTime() < 30 * 60_000
              : false,
            intent: (f.fan_intent as string[]) ?? [],
            // Carry the raw section string so we can derive gate later
            _section: f.fan_wrigley_section,
          } as MapFan & { _section: string | null };
        });
    },
  });

  // Refetch on tab visibility change (covers the "or on tab focus" rule)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') query.refetch();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [query]);

  return {
    fans: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
  };
}
