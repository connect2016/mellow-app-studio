import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { VibeFilter, SizeFilter, MovementFilter } from './MapFilters';
import type { MapCluster } from './ClusterMarker';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

const BAR_COORDS: Record<string, [number, number]> = {
  "Murphy's Bleachers": [41.9498, -87.6556],
  'Sluggers': [41.9478, -87.6559],
  "Casey Moran's": [41.9501, -87.6559],
  'Cubby Bear': [41.9474, -87.6565],
  "Bernie's Tap & Grill": [41.9503, -87.6559],
  'Sports Corner': [41.9473, -87.6578],
  'Old Crow Smokehouse': [41.9465, -87.6558],
  'Nisei Lounge': [41.9450, -87.6556],
};

function inferVibe(intents: string[] | null, fanStyle: string[] | null): VibeFilter {
  const all = [...(intents ?? []), ...(fanStyle ?? [])].map((s) => s.toLowerCase());
  if (all.some((i) => i.includes('pre-game') || i.includes('post-game') || i.includes('celebration') || i.includes('old style')))
    return 'party';
  if (all.some((i) => i.includes('scoring') || i.includes('scorecard') || i.includes('hardcore') || i.includes('stay until') || i.includes('bp')))
    return 'hardcore';
  return 'chill';
}

function inferMovement(locationSetAt: string | null): MovementFilter {
  if (!locationSetAt) return 'settled';
  const age = Date.now() - new Date(locationSetAt).getTime();
  const mins = age / 60000;
  if (mins < 20) return 'arriving';
  if (mins > 180) return 'leaving';
  return 'settled';
}

export interface MapFan {
  id: string;
  name: string;
  photo: string | null;
  lat: number;
  lng: number;
  vibe: VibeFilter;
  movement: MovementFilter;
  locationLabel: string;
  gameStatus: string;
  persona: string | null;
  isRecentlyActive: boolean;
  intent: string[];
}

function clusterFans(fans: MapFan[]): MapCluster[] {
  const gridSize = 0.0015;
  const cells = new Map<string, typeof fans>();

  fans.forEach((f) => {
    const cellKey = `${Math.round(f.lat / gridSize)}_${Math.round(f.lng / gridSize)}`;
    if (!cells.has(cellKey)) cells.set(cellKey, []);
    cells.get(cellKey)!.push(f);
  });

  return Array.from(cells.values()).map((group) => {
    const avgLat = group.reduce((s, f) => s + f.lat, 0) / group.length;
    const avgLng = group.reduce((s, f) => s + f.lng, 0) / group.length;

    const vibeCounts: Record<VibeFilter, number> = { party: 0, chill: 0, hardcore: 0 };
    group.forEach((f) => vibeCounts[f.vibe]++);
    const dominantVibe = (Object.entries(vibeCounts).sort((a, b) => b[1] - a[1])[0][0]) as VibeFilter;

    const moveCounts: Record<MovementFilter, number> = { arriving: 0, settled: 0, leaving: 0 };
    group.forEach((f) => moveCounts[f.movement]++);
    const dominantMove = (Object.entries(moveCounts).sort((a, b) => b[1] - a[1])[0][0]) as MovementFilter;

    const labelCounts: Record<string, number> = {};
    group.forEach((f) => { labelCounts[f.locationLabel] = (labelCounts[f.locationLabel] || 0) + 1; });
    const label = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      id: `cluster-${Math.round(avgLat * 10000)}-${Math.round(avgLng * 10000)}`,
      lat: avgLat,
      lng: avgLng,
      count: group.length,
      vibe: dominantVibe,
      movement: dominantMove,
      label,
      members: group.map((f) => ({ name: f.name, photo: f.photo })),
    };
  });
}

export function useMapClusters(
  vibeFilters: VibeFilter[],
  sizeFilters: SizeFilter[],
  movementFilters: MovementFilter[]
) {
  const { user } = useAuth();

  const { data: rawFans = [] } = useQuery({
    queryKey: ['clustered-map-fans'],
    queryFn: async () => {
      // Use secure server function that returns fuzzied locations
      // and excludes users near their home/work (server-side privacy)
      const { data: fans, error } = await supabase.rpc('get_map_fans');
      if (error) throw error;
      if (!fans) return [];

      return (fans as any[]).map((f) => {
        let lat = f.fan_latitude;
        let lng = f.fan_longitude;
        let locationLabel = 'Wrigleyville';

        if (!lat || !lng) {
          if (f.fan_game_status === 'AtWrigley') {
            lat = WRIGLEY_CENTER[0] + (Math.random() - 0.5) * 0.002;
            lng = WRIGLEY_CENTER[1] + (Math.random() - 0.5) * 0.002;
            locationLabel = f.fan_wrigley_section ? `Section ${f.fan_wrigley_section}` : 'Wrigley Field';
          } else if (f.fan_game_status === 'AtBar' && f.fan_wrigleyville_bar) {
            const barCoord = BAR_COORDS[f.fan_wrigleyville_bar];
            if (barCoord) {
              lat = barCoord[0] + (Math.random() - 0.5) * 0.0005;
              lng = barCoord[1] + (Math.random() - 0.5) * 0.0005;
              locationLabel = f.fan_wrigleyville_bar;
            }
          }
        }
        if (!lat || !lng) return null;

        const vibe = inferVibe(f.fan_gameday_intents, f.fan_fan_style);
        const movement = inferMovement(f.fan_location_last_set_at);
        const isRecentlyActive = f.fan_location_last_set_at
          ? (Date.now() - new Date(f.fan_location_last_set_at).getTime()) < 30 * 60 * 1000
          : false;

        return {
          id: f.fan_user_id,
          name: f.fan_display_name,
          photo: f.fan_profile_photo,
          lat,
          lng,
          vibe,
          movement,
          locationLabel,
          gameStatus: f.fan_game_status ?? 'NotSet',
          persona: f.fan_gameday_persona ?? null,
          isRecentlyActive,
          intent: (f.fan_intent as string[]) ?? [],
        };
      }).filter(Boolean) as MapFan[];
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  const clusters = useMemo(() => {
    let filtered = rawFans;

    if (vibeFilters.length > 0) {
      filtered = filtered.filter((f) => vibeFilters.includes(f.vibe));
    }

    if (movementFilters.length > 0) {
      filtered = filtered.filter((f) => movementFilters.includes(f.movement));
    }

    const allClusters = clusterFans(filtered);

    if (sizeFilters.length > 0) {
      return allClusters.filter((c) => {
        if (sizeFilters.includes('solo') && c.count <= 2) return true;
        if (sizeFilters.includes('small') && c.count >= 3 && c.count <= 5) return true;
        if (sizeFilters.includes('large') && c.count >= 6) return true;
        return false;
      });
    }

    return allClusters;
  }, [rawFans, vibeFilters, sizeFilters, movementFilters]);

  return { clusters, totalFans: rawFans.length, fans: rawFans };
}
