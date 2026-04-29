import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VibeClassification {
  vibe_state: string;
  emoji: string;
  reason: string;
  energy_level: number;
  match_tip: string;
}

export function useVibeState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentVibe, isLoading: vibeLoading } = useQuery({
    queryKey: ['vibe-state', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('vibe_state, vibe_emoji, vibe_state_updated_at')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const classify = useMutation({
    mutationFn: async (): Promise<{ vibe: VibeClassification | null }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-classifier`,
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
        throw new Error(err.error || 'Failed to classify vibe');
      }

      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibe-state'] });
    },
  });

  return { currentVibe, vibeLoading, classify };
}

// Vibe state display config
export const VIBE_STATES: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  lit: { label: 'Lit', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', emoji: '' },
  chill: { label: 'Chill', color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20', emoji: '' },
  hype: { label: 'Hype', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', emoji: '' },
  social_butterfly: { label: 'Social Butterfly', color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', emoji: '' },
  die_hard: { label: 'Die Hard', color: 'text-red-600', bg: 'bg-red-600/10 border-red-600/20', emoji: '' },
  new_in_town: { label: 'New in Town', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', emoji: '' },
  rally_mode: { label: 'Rally Mode', color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', emoji: '' },
  victory_lap: { label: 'Victory Lap', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', emoji: '' },
  unknown: { label: 'Vibing', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border', emoji: '' },
};
