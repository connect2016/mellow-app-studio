import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FIELDS = [
  'profile_photo',
  'bio',
  'favorite_gate',
  'wrigley_section',
  'gameday_persona',
  'favorite_player',
  'fan_style',
] as const;

export function useProfileCompletion() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['profile-completion', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select(FIELDS.join(','))
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!profile || (profile as { error?: boolean }).error) {
        return { filled: 0, total: FIELDS.length, percent: 0 };
      }
      const p = profile as unknown as Record<string, unknown>;

      const filled = FIELDS.reduce((acc, field) => {
        const v = p[field];
        if (v === null || v === undefined) return acc;
        if (typeof v === 'string' && v.trim() === '') return acc;
        if (Array.isArray(v) && v.length === 0) return acc;
        return acc + 1;
      }, 0);

      return {
        filled,
        total: FIELDS.length,
        percent: Math.round((filled / FIELDS.length) * 100),
      };
    },
  });

  return data ?? { filled: 0, total: FIELDS.length, percent: 0 };
}
