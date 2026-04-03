import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fuzzyLocation, isNearHomeOrWork } from '@/lib/location-privacy';
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

// Map gameday_intents to vibe categories
function inferVibe(intents: string[] | null, fanStyle: string[] | null): VibeFilter {
  const all = [...(intents ?? []), ...(fanStyle ?? [])].map((s) => s.toLowerCase());
  if (all.some((i) => i.includes('pre-game') || i.includes('post-game') || i.includes('celebration') || i.includes('old style')))
    return 'party';
  if (all.some((i) => i.includes('scoring') || i.includes('scorecard') || i.includes('hardcore') || i.includes('stay until') || i.includes('bp')))
    return 'hardcore';
  return 'chill';
}

// Simple movement inference from location timestamp age
function inferMovement(locationSetAt: string | null): MovementFilter {
  if (!locationSetAt) return 'settled';
  const age = Date.now() - new Date(locationSetAt).getTime();
  const mins = age / 60000;
  if (mins < 20) return 'arriving';
  if (mins > 180) return 'leaving';
  return 'settled';
}

// Grid-based clustering: snap to ~150m cells
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

function clusterFans(
  fans: MapFan[]
): MapCluster[] {
  const gridSize = 0.0015; // ~165m
  const cells = new Map<string, typeof fans>();

  fans.forEach((f) => {
    const cellKey = `${Math.round(f.lat / gridSize)}_${Math.round(f.lng / gridSize)}`;
    if (!cells.has(cellKey)) cells.set(cellKey, []);
    cells.get(cellKey)!.push(f);
  });

  return Array.from(cells.values()).map((group) => {
    const avgLat = group.reduce((s, f) => s + f.lat, 0) / group.length;
    const avgLng = group.reduce((s, f) => s + f.lng, 0) / group.length;

    // Dominant vibe
    const vibeCounts: Record<VibeFilter, number> = { party: 0, chill: 0, hardcore: 0 };
    group.forEach((f) => vibeCounts[f.vibe]++);
    const dominantVibe = (Object.entries(vibeCounts).sort((a, b) => b[1] - a[1])[0][0]) as VibeFilter;

    // Dominant movement
    const moveCounts: Record<MovementFilter, number> = { arriving: 0, settled: 0, leaving: 0 };
    group.forEach((f) => moveCounts[f.movement]++);
    const dominantMove = (Object.entries(moveCounts).sort((a, b) => b[1] - a[1])[0][0]) as MovementFilter;

    // Label from most common location
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
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: fans } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar, gameday_intents, fan_style, location_last_set_at, home_lat, home_lng, work_lat, work_lng, gameday_persona')
        .eq('is_banned', false)
        .eq('onboarding_completed', true)
        .neq('game_status', 'NotSet')
        .gte('location_last_set_at', sixHoursAgo)
        .limit(200);

      if (!fans) return [];

      const userIds = fans.map((f) => f.user_id);
      const { data: locations } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude')
        .in('user_id', userIds);

      const locMap = new Map(locations?.map((l) => [l.user_id, l]) ?? []);

      return fans.map((f) => {
        const loc = locMap.get(f.user_id);
        let lat = loc?.latitude;
        let lng = loc?.longitude;
        let locationLabel = 'Wrigleyville';

        if (!lat || !lng) {
          if (f.game_status === 'AtWrigley') {
            lat = WRIGLEY_CENTER[0] + (Math.random() - 0.5) * 0.002;
            lng = WRIGLEY_CENTER[1] + (Math.random() - 0.5) * 0.002;
            locationLabel = f.wrigley_section ? `Section ${f.wrigley_section}` : 'Wrigley Field';
          } else if (f.game_status === 'AtBar' && f.wrigleyville_bar) {
            const barCoord = BAR_COORDS[f.wrigleyville_bar];
            if (barCoord) {
              lat = barCoord[0] + (Math.random() - 0.5) * 0.0005;
              lng = barCoord[1] + (Math.random() - 0.5) * 0.0005;
              locationLabel = f.wrigleyville_bar;
            }
          }
        }
        if (!lat || !lng) return null;

        if (isNearHomeOrWork(lat, lng, f.home_lat as number | null, f.home_lng as number | null, f.work_lat as number | null, f.work_lng as number | null))
          return null;

        const fuzzy = fuzzyLocation(lat, lng, 200);
        const vibe = inferVibe(f.gameday_intents, f.fan_style);
        const movement = inferMovement(f.location_last_set_at);

        return {
          id: f.user_id,
          name: f.display_name,
          photo: f.profile_photo,
          lat: fuzzy.lat,
          lng: fuzzy.lng,
          vibe,
          movement,
          locationLabel,
          gameStatus: f.game_status ?? 'NotSet',
          persona: (f as any).gameday_persona ?? null,
        };
      }).filter(Boolean) as MapFan[];
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  const clusters = useMemo(() => {
    let filtered = rawFans;

    // Vibe filter
    if (vibeFilters.length > 0) {
      filtered = filtered.filter((f) => vibeFilters.includes(f.vibe));
    }

    // Movement filter
    if (movementFilters.length > 0) {
      filtered = filtered.filter((f) => movementFilters.includes(f.movement));
    }

    const allClusters = clusterFans(filtered);

    // Size filter
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
