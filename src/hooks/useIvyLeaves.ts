import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCurrentHomestand() {
  return useQuery({
    queryKey: ['current-homestand'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('homestands')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIvyLeafCount(userId?: string) {
  const { data: homestand } = useCurrentHomestand();

  return useQuery({
    queryKey: ['ivy-leaf-count', userId, homestand?.id],
    queryFn: async () => {
      if (!userId) return 0;
      let query = supabase
        .from('ivy_leaves')
        .select('amount', { count: 'exact' })
        .eq('user_id', userId);

      if (homestand?.id) {
        query = query.eq('homestand_id', homestand.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 1), 0);
    },
    enabled: !!userId,
  });
}

export function useIvyLeafAllTimeCount(userId?: string) {
  return useQuery({
    queryKey: ['ivy-leaf-all-time', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from('ivy_leaves')
        .select('amount')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 1), 0);
    },
    enabled: !!userId,
  });
}

export function useLeaderboard() {
  const { data: homestand } = useCurrentHomestand();

  return useQuery({
    queryKey: ['ivy-leaderboard', homestand?.id],
    queryFn: async () => {
      if (!homestand) return [];

      const { data, error } = await supabase
        .from('ivy_leaves')
        .select('user_id, amount')
        .eq('homestand_id', homestand.id);
      if (error) throw error;

      // Aggregate by user
      const userTotals = new Map<string, number>();
      for (const row of data ?? []) {
        userTotals.set(row.user_id, (userTotals.get(row.user_id) ?? 0) + (row.amount ?? 1));
      }

      const sorted = [...userTotals.entries()]
        .map(([user_id, total]) => ({ user_id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (sorted.length === 0) return [];

      // Fetch profiles
      const userIds = sorted.map(s => s.user_id);
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return sorted.map((entry, i) => ({
        rank: i + 1,
        userId: entry.user_id,
        total: entry.total,
        displayName: profileMap.get(entry.user_id)?.display_name ?? 'Fan',
        photo: profileMap.get(entry.user_id)?.profile_photo ?? '',
      }));
    },
    enabled: !!homestand,
    refetchInterval: 60000,
  });
}

export function useEarnIvyLeaf() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: homestand } = useCurrentHomestand();

  return useMutation({
    mutationFn: async ({ source, sourceId, amount = 1 }: { source: string; sourceId?: string; amount?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('award_ivy_leaf', {
        _source: source,
        _source_id: sourceId ?? null,
        _amount: Math.min(Math.max(amount, 1), 10),
        _homestand_id: homestand?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivy-leaf-count'] });
      queryClient.invalidateQueries({ queryKey: ['ivy-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['ivy-leaf-all-time'] });
    },
  });
}
