import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type EnergyType = 'celebration' | 'hype' | 'chill';

export interface EnergyZone {
  id: string;
  name: string;
  type: 'bar' | 'stadium' | 'area';
  lat: number;
  lng: number;
  energy: EnergyType;
  intensity: number; // 0-100
  fanCount: number;
  recentInteractions: number;
  topEmoji: string;
  fans: { user_id: string; display_name: string; profile_photo: string | null }[];
}

// Wrigleyville venue coordinates (approximate)
const VENUE_COORDS: Record<string, [number, number]> = {
  "Murphy's Bleachers": [41.9487, -87.6555],
  "Sluggers": [41.9472, -87.6560],
  "Cubby Bear": [41.9476, -87.6564],
  "HVAC Pub": [41.9470, -87.6558],
  "Gallagher Way": [41.9490, -87.6560],
  "Old Crow Smokehouse": [41.9468, -87.6562],
  "Casey Moran's": [41.9478, -87.6572],
  "Bernie's": [41.9465, -87.6555],
  "Deuces & The Diamond Club": [41.9462, -87.6550],
  "Salt & Pepper Diner": [41.9460, -87.6548],
};

const WRIGLEY_COORD: [number, number] = [41.9484, -87.6553];

function classifyEnergy(
  fanCount: number,
  interactions: number,
  vibes: string[],
  hiFiveCount: number
): { energy: EnergyType; intensity: number } {
  const interactionRate = fanCount > 0 ? interactions / fanCount : 0;
  const partySignals = vibes.filter(v => ['party', 'hype', 'rowdy'].includes(v)).length;
  const chillSignals = vibes.filter(v => ['chill', 'relaxed'].includes(v)).length;

  // High interactions + hi-fives = celebration
  if (hiFiveCount >= 3 || (interactionRate > 2 && partySignals > chillSignals)) {
    return { energy: 'celebration', intensity: Math.min(100, 40 + fanCount * 6 + hiFiveCount * 10) };
  }
  // Moderate activity + party vibes = hype
  if (fanCount >= 3 || partySignals > 0) {
    return { energy: 'hype', intensity: Math.min(100, 30 + fanCount * 5 + interactions * 3) };
  }
  // Default = chill
  return { energy: 'chill', intensity: Math.min(100, 20 + fanCount * 4) };
}

export function useCrowdEnergy() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['crowd-energy'],
    queryFn: async (): Promise<{ zones: EnergyZone[]; totalEnergy: number }> => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const [
        { data: barFans },
        { data: wrigleyFans },
        { data: barVotes },
        { data: recentLikes },
        { data: recentHiFives },
        { data: recentMeetups },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, wrigleyville_bar')
          .eq('game_status', 'AtBar')
          .eq('is_banned', false)
          .gte('location_last_set_at', threeHoursAgo)
          .not('wrigleyville_bar', 'is', null),
        supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, wrigley_section')
          .eq('game_status', 'AtWrigley')
          .eq('is_banned', false)
          .gte('location_last_set_at', threeHoursAgo),
        supabase
          .from('bar_votes')
          .select('bar_name, vibe')
          .gte('updated_at', threeHoursAgo),
        supabase
          .from('likes')
          .select('id')
          .gte('created_at', oneHourAgo)
          .eq('is_hi_five', false),
        supabase
          .from('likes')
          .select('id')
          .gte('created_at', oneHourAgo)
          .eq('is_hi_five', true),
        supabase
          .from('lineup_meetups')
          .select('id, location_name')
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString()),
      ]);

      // Build per-bar data
      const barData: Record<string, {
        fans: { user_id: string; display_name: string; profile_photo: string | null }[];
        vibes: string[];
        meetupCount: number;
      }> = {};

      barFans?.forEach(f => {
        const bar = f.wrigleyville_bar as string;
        if (!barData[bar]) barData[bar] = { fans: [], vibes: [], meetupCount: 0 };
        barData[bar].fans.push({ user_id: f.user_id, display_name: f.display_name, profile_photo: f.profile_photo });
      });

      barVotes?.forEach(v => {
        if (barData[v.bar_name]) barData[v.bar_name].vibes.push(v.vibe);
      });

      recentMeetups?.forEach(m => {
        const match = Object.keys(barData).find(b => m.location_name.toLowerCase().includes(b.toLowerCase()));
        if (match) barData[match].meetupCount++;
      });

      const totalInteractions = (recentLikes?.length ?? 0) + (recentHiFives?.length ?? 0);
      const hiFiveCount = recentHiFives?.length ?? 0;

      // Create energy zones for bars
      const zones: EnergyZone[] = [];
      let idx = 0;

      Object.entries(barData).forEach(([barName, data]) => {
        if (data.fans.length === 0) return;
        const coords = VENUE_COORDS[barName];
        if (!coords) return;

        const interactionsPerVenue = Math.round(totalInteractions / Math.max(Object.keys(barData).length, 1));
        const hiFivesPerVenue = Math.round(hiFiveCount / Math.max(Object.keys(barData).length, 1));
        const { energy, intensity } = classifyEnergy(data.fans.length, interactionsPerVenue + data.meetupCount * 2, data.vibes, hiFivesPerVenue);

        const emojiMap: Record<EnergyType, string> = { celebration: '🎉', hype: '🔥', chill: '😎' };

        zones.push({
          id: `bar-${idx++}`,
          name: barName,
          type: 'bar',
          lat: coords[0],
          lng: coords[1],
          energy,
          intensity,
          fanCount: data.fans.length,
          recentInteractions: interactionsPerVenue,
          topEmoji: emojiMap[energy],
          fans: data.fans.slice(0, 5),
        });
      });

      // Wrigley Field zone
      if ((wrigleyFans?.length ?? 0) > 0) {
        const wrigleyInteractions = Math.round(totalInteractions * 0.4);
        const wrigleyHiFives = Math.round(hiFiveCount * 0.4);
        const { energy, intensity } = classifyEnergy(wrigleyFans!.length, wrigleyInteractions, [], wrigleyHiFives);

        zones.push({
          id: 'wrigley-field',
          name: 'Wrigley Field',
          type: 'stadium',
          lat: WRIGLEY_COORD[0],
          lng: WRIGLEY_COORD[1],
          energy,
          intensity,
          fanCount: wrigleyFans!.length,
          recentInteractions: wrigleyInteractions,
          topEmoji: '🏟️',
          fans: wrigleyFans!.slice(0, 5).map(f => ({
            user_id: f.user_id,
            display_name: f.display_name,
            profile_photo: f.profile_photo,
          })),
        });
      }

      // Sort by intensity
      zones.sort((a, b) => b.intensity - a.intensity);

      const totalEnergy = zones.reduce((s, z) => s + z.intensity, 0);

      return { zones, totalEnergy };
    },
    refetchInterval: 15000,
    enabled: !!user,
  });
}
