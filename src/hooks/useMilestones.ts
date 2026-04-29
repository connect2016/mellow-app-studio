import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MilestoneTier {
  count: number;
  label: string;
}

export interface MilestoneDefinition {
  key: string;
  label: string;
  emoji: string;
  description: string;
  tiers: MilestoneTier[];
}

export interface MilestoneWithProgress extends MilestoneDefinition {
  current: number;
  /** Tier index achieved (-1 if none) */
  tierIndex: number;
  nextTier: MilestoneTier | null;
  pct: number;
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    key: 'games_attended',
    label: 'Games Attended',
    emoji: '',
    description: 'Days you checked in on game day',
    tiers: [
      { count: 1, label: 'First Pitch' },
      { count: 5, label: 'Regular' },
      { count: 15, label: 'Diehard' },
      { count: 30, label: 'Bleacher Vet' },
      { count: 81, label: 'Season Ticket' },
    ],
  },
  {
    key: 'bars_visited',
    label: 'Bars Explored',
    emoji: '',
    description: 'Unique Wrigleyville bars you checked into',
    tiers: [
      { count: 1, label: 'First Round' },
      { count: 3, label: 'Wandering' },
      { count: 7, label: 'Connoisseur' },
      { count: 15, label: 'Crawl Captain' },
    ],
  },
  {
    key: 'meetups_joined',
    label: 'Meetups Joined',
    emoji: '',
    description: 'Lineup meetups you joined or hosted',
    tiers: [
      { count: 1, label: 'Lineup' },
      { count: 5, label: 'Regular' },
      { count: 15, label: 'Connector' },
      { count: 30, label: 'Ringleader' },
    ],
  },
  {
    key: 'hi_fives',
    label: 'Hi-Fives Sent',
    emoji: '',
    description: 'Hi-fives sent to fellow fans',
    tiers: [
      { count: 1, label: 'Friendly' },
      { count: 10, label: 'Sociable' },
      { count: 25, label: 'Hi-Five Hero' },
      { count: 50, label: 'Crowd Favorite' },
    ],
  },
  {
    key: 'memories_shared',
    label: 'Memories Shared',
    emoji: '',
    description: 'Game-day photos posted',
    tiers: [
      { count: 1, label: 'Snapshot' },
      { count: 5, label: 'Storyteller' },
      { count: 15, label: 'Archivist' },
    ],
  },
  {
    key: 'passport_stamps',
    label: 'Passport Stamps',
    emoji: '',
    description: 'Wrigley Passport locations verified',
    tiers: [
      { count: 1, label: 'Tourist' },
      { count: 3, label: 'Explorer' },
      { count: 5, label: 'Wrigley Legend' },
    ],
  },
];

function computeProgress(def: MilestoneDefinition, current: number): MilestoneWithProgress {
  let tierIndex = -1;
  for (let i = 0; i < def.tiers.length; i++) {
    if (current >= def.tiers[i].count) tierIndex = i;
  }
  const nextTier = tierIndex < def.tiers.length - 1 ? def.tiers[tierIndex + 1] : null;
  const prevCount = tierIndex >= 0 ? def.tiers[tierIndex].count : 0;
  const pct = nextTier
    ? Math.min(100, ((current - prevCount) / (nextTier.count - prevCount)) * 100)
    : 100;
  return { ...def, current, tierIndex, nextTier, pct };
}

export function useMilestones() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['milestones', user?.id],
    queryFn: async (): Promise<MilestoneWithProgress[]> => {
      if (!user) return [];

      const [
        barCheckinsRes,
        meetupsRes,
        meetupsCreatorRes,
        likesRes,
        memoriesRes,
        passportRes,
      ] = await Promise.all([
        supabase.from('bar_checkins').select('bar_name, checked_in_at').eq('user_id', user.id),
        supabase.from('lineup_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('lineup_meetups').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('from_user', user.id).eq('is_hi_five', true),
        supabase.from('game_memories').select('created_at').eq('user_id', user.id),
        supabase.from('passport_checkins').select('location_key').eq('user_id', user.id),
      ]);

      // Games attended: unique days with bar check-in OR memory OR passport check-in
      const gameDays = new Set<string>();
      barCheckinsRes.data?.forEach((r) => {
        const d = new Date(r.checked_in_at);
        d.setHours(0, 0, 0, 0);
        gameDays.add(d.toISOString());
      });
      memoriesRes.data?.forEach((r) => {
        const d = new Date(r.created_at);
        d.setHours(0, 0, 0, 0);
        gameDays.add(d.toISOString());
      });

      const uniqueBars = new Set(barCheckinsRes.data?.map((r) => r.bar_name) ?? []);
      const meetupTotal = (meetupsRes.count ?? 0) + (meetupsCreatorRes.count ?? 0);
      const uniquePassport = new Set(passportRes.data?.map((r) => r.location_key) ?? []);

      const stats: Record<string, number> = {
        games_attended: gameDays.size,
        bars_visited: uniqueBars.size,
        meetups_joined: meetupTotal,
        hi_fives: likesRes.count ?? 0,
        memories_shared: memoriesRes.data?.length ?? 0,
        passport_stamps: uniquePassport.size,
      };

      return MILESTONE_DEFINITIONS.map((def) => computeProgress(def, stats[def.key] ?? 0));
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
