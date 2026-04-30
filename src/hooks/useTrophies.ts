import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type TrophyCategory =
  | 'social'
  | 'meetup'
  | 'food'
  | 'drinking'
  | 'shots'
  | 'bars'
  | 'special';

export interface TrophyDefinition {
  key: string;
  category: TrophyCategory;
  title: string;
  description: string;
  // Concept icon name (mapped via ConceptIcon registry)
  icon: string;
  /** Threshold to unlock against the matching stat key. */
  threshold: number;
  /** Which computed stat unlocks this trophy. */
  statKey: string;
}

const CAT_COLORS: Record<TrophyCategory, { from: string; to: string; ring: string; iconBg: string }> = {
  social:   { from: '#1E3A8A', to: '#3B82F6', ring: 'ring-blue-300/40',     iconBg: 'bg-blue-500/15' },
  meetup:   { from: '#7C3AED', to: '#A855F7', ring: 'ring-purple-300/40',   iconBg: 'bg-purple-500/15' },
  food:     { from: '#F97316', to: '#FBBF24', ring: 'ring-orange-300/40',   iconBg: 'bg-orange-500/15' },
  drinking: { from: '#B45309', to: '#FBBF24', ring: 'ring-amber-300/40',    iconBg: 'bg-amber-500/15' },
  shots:    { from: '#9F1239', to: '#F43F5E', ring: 'ring-rose-300/40',     iconBg: 'bg-rose-500/15' },
  bars:     { from: '#0F766E', to: '#14B8A6', ring: 'ring-teal-300/40',     iconBg: 'bg-teal-500/15' },
  special:  { from: '#A16207', to: '#F59E0B', ring: 'ring-yellow-300/50',   iconBg: 'bg-yellow-500/15' },
};

export function trophyColors(category: TrophyCategory) {
  return CAT_COLORS[category];
}

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  // Social
  { key: 'first_hi_five',  category: 'social', title: 'First Hi-Five',     description: 'Sent your very first hi-five.',          icon: 'hi-five',      threshold: 1,  statKey: 'hi_fives' },
  { key: 'fans_10',        category: 'social', title: '10 Fans Connected', description: 'Matched with 10 fellow fans.',           icon: 'fans',         threshold: 10, statKey: 'fans_connected' },
  { key: 'fans_50',        category: 'social', title: '50 Fans Connected', description: 'A true Wrigley social butterfly.',        icon: 'fans',         threshold: 50, statKey: 'fans_connected' },

  // Meetup
  { key: 'first_meetup',   category: 'meetup', title: 'First Meetup',      description: 'Joined or hosted your first meetup.',     icon: 'meetup',       threshold: 1,  statKey: 'meetups_total' },
  { key: 'hosted_5',       category: 'meetup', title: '5 Meetups Hosted',  description: 'Created 5 meetups for the community.',    icon: 'meetup',       threshold: 5,  statKey: 'meetups_hosted' },
  { key: 'joined_10',      category: 'meetup', title: '10 Meetups Joined', description: 'Showed up 10 times for the lineup.',      icon: 'meetup',       threshold: 10, statKey: 'meetups_joined' },

  // Food
  { key: 'first_carb_up',  category: 'food',   title: 'First Carb-Up',     description: 'Logged your first appetizer.',            icon: 'food',         threshold: 1,  statKey: 'appetizers' },
  { key: 'apps_5',         category: 'food',   title: '5 Appetizers Had',  description: 'Five rounds of carbs in the books.',      icon: 'food',         threshold: 5,  statKey: 'appetizers' },
  { key: 'fav_spot',       category: 'food',   title: 'Favorite Spot Set', description: 'Picked your go-to Wrigleyville eats.',    icon: 'food',         threshold: 1,  statKey: 'favorite_spot' },

  // Drinking
  { key: 'first_beer',     category: 'drinking', title: 'First Beer Logged', description: 'Cracked open your first cold one.',     icon: 'beer',        threshold: 1,   statKey: 'beers_season' },
  { key: 'beers_10_week',  category: 'drinking', title: '10 Beers This Week', description: 'A solid 10-pack week.',                icon: 'beer',        threshold: 10,  statKey: 'beers_week' },
  { key: 'beers_100',      category: 'drinking', title: '100 Beers Season', description: 'Triple-digit season — legendary.',       icon: 'beer',        threshold: 100, statKey: 'beers_season' },

  // Shots
  { key: 'first_shot',     category: 'shots', title: 'First Shot',         description: 'Took your first season shot.',           icon: 'shot',         threshold: 1,  statKey: 'shots_season' },
  { key: 'shots_10',       category: 'shots', title: '10 Shots Season',    description: 'Ten shots strong this season.',          icon: 'shot',         threshold: 10, statKey: 'shots_season' },

  // Bars
  { key: 'bars_5',         category: 'bars', title: 'Visited 5 Bars',      description: 'Five unique Wrigleyville bars.',         icon: 'bar',          threshold: 5,  statKey: 'unique_bars' },
  { key: 'bars_10',        category: 'bars', title: 'Visited 10 Bars',     description: 'A proper Wrigleyville tour complete.',   icon: 'bar',          threshold: 10, statKey: 'unique_bars' },

  // Special
  { key: 'opening_day',    category: 'special', title: 'Opening Day Warrior', description: 'Showed up on Opening Day.',           icon: 'star',         threshold: 1,  statKey: 'opening_day' },
  { key: 'night_game',     category: 'special', title: 'Night Game Legend',   description: 'Closed down a Wrigley night game.',   icon: 'moon',         threshold: 1,  statKey: 'night_games' },
  { key: 'marathoner',     category: 'special', title: 'Wrigleyville Marathoner', description: 'Hit 5+ bars in a single day.',    icon: 'star',         threshold: 1,  statKey: 'marathoner' },
];

export interface TrophyWithProgress extends TrophyDefinition {
  current: number;
  earned: boolean;
  earnedAt: string | null;
  pct: number;
}

interface RawStats {
  hi_fives: number;
  fans_connected: number;
  meetups_joined: number;
  meetups_hosted: number;
  meetups_total: number;
  appetizers: number;
  favorite_spot: number;
  beers_season: number;
  beers_week: number;
  shots_season: number;
  unique_bars: number;
  opening_day: number;
  night_games: number;
  marathoner: number;
  // earnedAt sources
  firstHiFiveAt: string | null;
  firstMeetupAt: string | null;
  firstBeerAt: string | null;
  firstBarAt: string | null;
}

export function useTrophies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trophies', user?.id],
    queryFn: async (): Promise<TrophyWithProgress[]> => {
      if (!user) return [];

      const [
        likesRes,
        matchesRes,
        meetupsJoinedRes,
        meetupsHostedRes,
        meetupsJoinedFirst,
        likesFirst,
        barCheckinsRes,
        profileRes,
      ] = await Promise.all([
        supabase.from('likes').select('id', { count: 'exact', head: true })
          .eq('from_user', user.id).eq('is_hi_five', true),
        supabase.from('matches').select('id', { count: 'exact', head: true })
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`).eq('status', 'matched'),
        supabase.from('lineup_members').select('id, joined_at', { count: 'exact' })
          .eq('user_id', user.id).order('joined_at', { ascending: true }).limit(1),
        supabase.from('lineup_meetups').select('id', { count: 'exact', head: true })
          .eq('creator_id', user.id),
        supabase.from('lineup_members').select('joined_at')
          .eq('user_id', user.id).order('joined_at', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('likes').select('created_at')
          .eq('from_user', user.id).eq('is_hi_five', true)
          .order('created_at', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('bar_checkins').select('bar_name, checked_in_at')
          .eq('user_id', user.id),
        supabase.from('profiles')
          .select('beers_today_count, beers_week_count, shots_taken_season, appetizers_had_season, favorite_food_spot')
          .eq('user_id', user.id).maybeSingle(),
      ]);

      const checkins = barCheckinsRes.data ?? [];
      const uniqueBars = new Set(checkins.map((c) => c.bar_name));

      // Bars-in-a-day for marathoner
      const dayMap = new Map<string, Set<string>>();
      checkins.forEach((c) => {
        const d = new Date(c.checked_in_at);
        const key = d.toISOString().slice(0, 10);
        if (!dayMap.has(key)) dayMap.set(key, new Set());
        dayMap.get(key)!.add(c.bar_name);
      });
      const marathoner = Array.from(dayMap.values()).some((s) => s.size >= 5) ? 1 : 0;

      // Night games — checkins after 19:00 local
      const nightGames = checkins.filter((c) => {
        const h = new Date(c.checked_in_at).getHours();
        return h >= 19 || h < 2;
      }).length;

      const profile = profileRes.data as any | null;

      const stats: RawStats = {
        hi_fives: likesRes.count ?? 0,
        fans_connected: matchesRes.count ?? 0,
        meetups_joined: meetupsJoinedRes.count ?? 0,
        meetups_hosted: meetupsHostedRes.count ?? 0,
        meetups_total: (meetupsJoinedRes.count ?? 0) + (meetupsHostedRes.count ?? 0),
        appetizers: profile?.appetizers_had_season ?? 0,
        favorite_spot: profile?.favorite_food_spot ? 1 : 0,
        beers_season: (profile?.beers_today_count ?? 0) + (profile?.beers_week_count ?? 0),
        beers_week: profile?.beers_week_count ?? 0,
        shots_season: profile?.shots_taken_season ?? 0,
        unique_bars: uniqueBars.size,
        opening_day: 0, // requires game-day calendar; left at 0 unless surfaced elsewhere
        night_games: nightGames > 0 ? 1 : 0,
        marathoner,
        firstHiFiveAt: (likesFirst.data as any)?.created_at ?? null,
        firstMeetupAt: (meetupsJoinedFirst.data as any)?.joined_at ?? null,
        firstBeerAt: null,
        firstBarAt: checkins[0]?.checked_in_at ?? null,
      };

      return TROPHY_DEFINITIONS.map((def) => {
        const current = (stats as any)[def.statKey] ?? 0;
        const earned = current >= def.threshold;
        let earnedAt: string | null = null;
        if (earned) {
          if (def.key === 'first_hi_five') earnedAt = stats.firstHiFiveAt;
          else if (def.key === 'first_meetup') earnedAt = stats.firstMeetupAt;
          else if (def.statKey === 'unique_bars') earnedAt = stats.firstBarAt;
        }
        const pct = Math.min(100, Math.round((current / def.threshold) * 100));
        return { ...def, current, earned, earnedAt, pct };
      });
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
