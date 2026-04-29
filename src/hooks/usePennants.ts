import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  target: number;
  color: string; // tailwind token name
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'bleacher_creature',
    name: 'Bleacher Creature',
    description: 'Check in 5 times in the bleachers',
    emoji: '',
    target: 5,
    color: 'primary',
  },
  {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Post a tailgate photo 2 hours before first pitch',
    emoji: '',
    target: 3,
    color: 'warning',
  },
  {
    key: 'wrigley_legend',
    name: 'Wrigley Legend',
    description: 'Check in at 5 Wrigley Passport locations',
    emoji: '',
    target: 5,
    color: 'accent',
  },
  {
    key: 'hi_five_hero',
    name: 'Hi-Five Hero',
    description: 'Send 10 Hi-Fives to fellow fans',
    emoji: '',
    target: 10,
    color: 'secondary',
  },
  {
    key: 'beer_baron',
    name: 'Beer Baron',
    description: 'Send beer money to 5 different fans',
    emoji: '',
    target: 5,
    color: 'warning',
  },
  {
    key: 'vibe_master',
    name: 'Vibe Master',
    description: 'Post 10 times to the Vibe Feed',
    emoji: '',
    target: 10,
    color: 'info',
  },
  {
    key: 'game_day_regular',
    name: 'Game Day Regular',
    description: 'Set your status during 10 different games',
    emoji: '',
    target: 10,
    color: 'primary',
  },
  {
    key: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Start conversations with 5 different fans',
    emoji: '',
    target: 5,
    color: 'accent',
  },
];

export function useMyPennants() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-pennants', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_pennants')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useUserPennants(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-pennants', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_pennants')
        .select('*')
        .eq('user_id', userId)
        .eq('unlocked', true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useIncrementBadge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeKey: string) => {
      if (!user) throw new Error('Not authenticated');
      const def = BADGE_DEFINITIONS.find(b => b.key === badgeKey);
      if (!def) throw new Error('Unknown badge');

      // Get or create the pennant row
      const { data: existing } = await supabase
        .from('user_pennants')
        .select('*')
        .eq('user_id', user.id)
        .eq('badge_key', badgeKey)
        .maybeSingle();

      if (!existing) {
        // Create with count 1
        const newCount = 1;
        const unlocked = newCount >= def.target;
        const { data, error } = await supabase
          .from('user_pennants')
          .insert({
            user_id: user.id,
            badge_key: badgeKey,
            current_count: newCount,
            target_count: def.target,
            unlocked,
            unlocked_at: unlocked ? new Date().toISOString() : null,
          })
          .select()
          .single();
        if (error) throw error;
        return { pennant: data, justUnlocked: unlocked, badge: def };
      }

      if (existing.unlocked) {
        return { pennant: existing, justUnlocked: false, badge: def };
      }

      const newCount = (existing.current_count ?? 0) + 1;
      const unlocked = newCount >= def.target;
      const { data, error } = await supabase
        .from('user_pennants')
        .update({
          current_count: newCount,
          unlocked,
          unlocked_at: unlocked ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { pennant: data, justUnlocked: unlocked, badge: def };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pennants'] });
    },
  });
}

/** Calculate badge progress from existing user activity */
export function useBadgeProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badge-progress', user?.id],
    queryFn: async () => {
      if (!user) return {};

      // Hi-Fives sent
      const { count: hiFiveCount } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('from_user', user.id)
        .eq('is_hi_five', true);

      // Matches (buddies met)
      const { count: matchCount } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('status', 'matched');

      // Vibe posts
      const { count: vibeCount } = await supabase
        .from('vibe_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Conversations started
      const { count: convCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

      return {
        hi_five_hero: hiFiveCount ?? 0,
        wrigley_legend: matchCount ?? 0,
        vibe_master: vibeCount ?? 0,
        social_butterfly: convCount ?? 0,
      } as Record<string, number>;
    },
    enabled: !!user,
  });
}
