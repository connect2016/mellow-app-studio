import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReconnectionSuggestion {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  game_status: string | null;
  vibe_emoji: string | null;
  fan_tier_emoji: string | null;
  wrigleyville_bar: string | null;
  is_active_now: boolean;
  connection_score: number;
  days_since_interaction: number;
  reasons: string[];
  suggested_action: 'say_hi' | 'send_hifive';
}

export function useReconnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reconnections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('reconnections', {
        method: 'POST',
      });
      if (error) throw error;
      return (data?.suggestions ?? []) as ReconnectionSuggestion[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
