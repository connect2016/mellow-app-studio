import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeFlair, FLAIR_DEFINITIONS, type FlairContext } from '@/lib/fan-flair';

/**
 * Fetches data needed to compute a user's Fan Flair tier and returns
 * { current, context, all } for rendering both the active badge and the
 * "Your Badges" progress list on the Profile page.
 */
export function useFanFlair(userId?: string | null) {
  return useQuery({
    queryKey: ['fan-flair', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: profile }, { count: hostedCount }] = await Promise.all([
        supabase
          .from('profiles')
          .select('streak_total_game_days, zip_code')
          .eq('user_id', userId as string)
          .maybeSingle(),
        supabase
          .from('lineup_meetups')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId as string),
      ]);

      const ctx: FlairContext = {
        gamesAttended: (profile as any)?.streak_total_game_days ?? 0,
        hostedMeetups: hostedCount ?? 0,
        zipCode: (profile as any)?.zip_code ?? null,
      };

      return {
        context: ctx,
        current: computeFlair(ctx),
        all: FLAIR_DEFINITIONS,
      };
    },
  });
}
