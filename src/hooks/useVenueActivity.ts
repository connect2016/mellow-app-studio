import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VenueData {
  name: string;
  crowdLevel: 'empty' | 'chill' | 'busy' | 'packed';
  activeUsers: { user_id: string; display_name: string; profile_photo: string | null }[];
  totalUsers: number;
  dominantVibe: string;
  waitTime: string;
  meetups: { id: string; description: string | null; location_name: string; meeting_time: string; memberCount: number; maxMembers: number }[];
  voteCount: number;
}

const WRIGLEYVILLE_VENUES = [
  'Murphy\'s Bleachers',
  'Sluggers',
  'Cubby Bear',
  'HVAC Pub',
  'Gallagher Way',
  'Old Crow Smokehouse',
  'Casey Moran\'s',
  'Bernie\'s',
  'Deuces & The Diamond Club',
  'Salt & Pepper Diner',
];

function getCrowdLevel(count: number): VenueData['crowdLevel'] {
  if (count === 0) return 'empty';
  if (count <= 3) return 'chill';
  if (count <= 8) return 'busy';
  return 'packed';
}

export function useVenueActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['venue-activity'],
    queryFn: async (): Promise<VenueData[]> => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const [
        { data: barProfiles },
        { data: barVotes },
        { data: meetups },
        { data: meetupMembers },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, wrigleyville_bar')
          .eq('game_status', 'AtBar')
          .eq('is_banned', false)
          .gte('location_last_set_at', sixHoursAgo)
          .not('wrigleyville_bar', 'is', null),
        supabase
          .from('bar_votes')
          .select('bar_name, vibe, wait_time')
          .gte('updated_at', sixHoursAgo),
        supabase
          .from('lineup_meetups')
          .select('id, location_name, description, meeting_time, max_members, status')
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString()),
        supabase
          .from('lineup_members')
          .select('meetup_id'),
      ]);

      // Index meetup member counts
      const meetupCounts: Record<string, number> = {};
      meetupMembers?.forEach((m) => {
        meetupCounts[m.meetup_id] = (meetupCounts[m.meetup_id] || 0) + 1;
      });

      // Build venue map
      const venueMap: Record<string, VenueData> = {};

      WRIGLEYVILLE_VENUES.forEach((name) => {
        venueMap[name] = {
          name,
          crowdLevel: 'empty',
          activeUsers: [],
          totalUsers: 0,
          dominantVibe: 'chill',
          waitTime: 'no_line',
          meetups: [],
          voteCount: 0,
        };
      });

      // Populate users
      barProfiles?.forEach((p) => {
        const bar = p.wrigleyville_bar as string;
        if (!venueMap[bar]) {
          venueMap[bar] = { name: bar, crowdLevel: 'empty', activeUsers: [], totalUsers: 0, dominantVibe: 'chill', waitTime: 'no_line', meetups: [], voteCount: 0 };
        }
        venueMap[bar].activeUsers.push({
          user_id: p.user_id,
          display_name: p.display_name,
          profile_photo: p.profile_photo,
        });
        venueMap[bar].totalUsers++;
      });

      // Populate votes (vibe + wait)
      const vibeVotes: Record<string, Record<string, number>> = {};
      const waitVotes: Record<string, Record<string, number>> = {};
      barVotes?.forEach((v) => {
        if (!vibeVotes[v.bar_name]) vibeVotes[v.bar_name] = {};
        vibeVotes[v.bar_name][v.vibe] = (vibeVotes[v.bar_name][v.vibe] || 0) + 1;
        if (!waitVotes[v.bar_name]) waitVotes[v.bar_name] = {};
        waitVotes[v.bar_name][v.wait_time] = (waitVotes[v.bar_name][v.wait_time] || 0) + 1;
      });

      Object.keys(venueMap).forEach((bar) => {
        if (vibeVotes[bar]) {
          const sorted = Object.entries(vibeVotes[bar]).sort((a, b) => b[1] - a[1]);
          venueMap[bar].dominantVibe = sorted[0]?.[0] || 'chill';
          venueMap[bar].voteCount = Object.values(vibeVotes[bar]).reduce((s, n) => s + n, 0);
        }
        if (waitVotes[bar]) {
          const sorted = Object.entries(waitVotes[bar]).sort((a, b) => b[1] - a[1]);
          venueMap[bar].waitTime = sorted[0]?.[0] || 'no_line';
        }
        venueMap[bar].crowdLevel = getCrowdLevel(venueMap[bar].totalUsers);
      });

      // Populate meetups
      meetups?.forEach((m) => {
        const loc = m.location_name;
        const target = Object.keys(venueMap).find((v) => loc.toLowerCase().includes(v.toLowerCase())) || loc;
        if (!venueMap[target]) {
          venueMap[target] = { name: target, crowdLevel: 'empty', activeUsers: [], totalUsers: 0, dominantVibe: 'chill', waitTime: 'no_line', meetups: [], voteCount: 0 };
        }
        venueMap[target].meetups.push({
          id: m.id,
          description: m.description,
          location_name: m.location_name,
          meeting_time: m.meeting_time,
          memberCount: meetupCounts[m.id] || 0,
          maxMembers: m.max_members,
        });
      });

      // Sort: busiest first, then by meetup count
      return Object.values(venueMap)
        .sort((a, b) => {
          const levelOrder = { packed: 4, busy: 3, chill: 2, empty: 1 };
          const diff = levelOrder[b.crowdLevel] - levelOrder[a.crowdLevel];
          if (diff !== 0) return diff;
          return b.meetups.length - a.meetups.length;
        });
    },
    refetchInterval: 15000,
    enabled: !!user,
  });
}
