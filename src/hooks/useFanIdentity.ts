import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FanIdentity {
  tier: string;
  title: string;
  emoji: string;
  archetypes: string[];
  summary: string;
  next_milestone: string;
  match_boost: string;
  xp: number;
}

export const FAN_TIERS: Record<string, { label: string; color: string; bg: string; emoji: string; minXp: number; maxXp: number }> = {
  rookie:       { label: 'Rookie',       color: 'text-emerald-500',  bg: 'bg-emerald-500/10 border-emerald-500/20',  emoji: '🌱', minXp: 0,    maxXp: 99 },
  regular:      { label: 'Regular',      color: 'text-sky-500',      bg: 'bg-sky-500/10 border-sky-500/20',          emoji: '⚾', minXp: 100,  maxXp: 299 },
  superfan:     { label: 'Superfan',     color: 'text-amber-500',    bg: 'bg-amber-500/10 border-amber-500/20',      emoji: '🔥', minXp: 300,  maxXp: 599 },
  legend:       { label: 'Legend',       color: 'text-purple-500',   bg: 'bg-purple-500/10 border-purple-500/20',    emoji: '👑', minXp: 600,  maxXp: 999 },
  hall_of_fame: { label: 'Hall of Fame', color: 'text-yellow-500',   bg: 'bg-yellow-500/10 border-yellow-500/20',    emoji: '🏆', minXp: 1000, maxXp: 9999 },
};

export const ARCHETYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  connector:   { label: 'Connector',   emoji: '🤝' },
  hype_beast:  { label: 'Hype Beast',  emoji: '🎉' },
  analyst:     { label: 'Analyst',     emoji: '📊' },
  historian:   { label: 'Historian',   emoji: '📚' },
  explorer:    { label: 'Explorer',    emoji: '🧭' },
  leader:      { label: 'Leader',      emoji: '🎯' },
  loyalist:    { label: 'Loyalist',    emoji: '💙' },
};

export function useFanIdentity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentIdentity, isLoading } = useQuery({
    queryKey: ['fan-identity', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('fan_tier, fan_xp, fan_title, fan_tier_emoji, fan_identity_updated_at')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const classify = useMutation({
    mutationFn: async (): Promise<{ identity: FanIdentity | null }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fan-identity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error('Rate limited — try again in a moment');
        if (resp.status === 402) throw new Error('AI credits exhausted');
        throw new Error(err.error || 'Failed to classify');
      }

      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-identity'] });
    },
  });

  return { currentIdentity, isLoading, classify };
}
