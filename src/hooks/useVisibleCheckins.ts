import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VisibleCheckin {
  user_id: string;
  checkin_bar: string | null;
  checkin_section: string | null;
  checkin_expires_at: string | null;
}

export function useVisibleCheckins(userIds: string[]) {
  const { user } = useAuth();
  const key = [...userIds].sort().join(',');

  return useQuery({
    queryKey: ['visible-checkins', user?.id, key],
    queryFn: async (): Promise<Record<string, VisibleCheckin>> => {
      if (!user || userIds.length === 0) return {};
      const { data, error } = await (supabase.rpc as any)('get_visible_checkins', {
        p_user_ids: userIds,
      });
      if (error) {
        console.warn('get_visible_checkins failed', error);
        return {};
      }
      const map: Record<string, VisibleCheckin> = {};
      for (const row of (data ?? []) as VisibleCheckin[]) {
        map[row.user_id] = row;
      }
      return map;
    },
    enabled: !!user && userIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
