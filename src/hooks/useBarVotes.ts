import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export type WaitTime = 'no_line' | '15_min' | '30_plus';
export type VibeType = 'chill' | 'rowdy' | 'packed';

export const WAIT_LABELS: Record<WaitTime, string> = {
  no_line: 'No Line',
  '15_min': '15 min',
  '30_plus': '30+ min',
};

export const VIBE_LABELS: Record<VibeType, string> = {
  chill: '😌 Chill',
  rowdy: '🔥 Rowdy',
  packed: '🎉 Packed',
};

export interface BarVoteSummary {
  topWait: WaitTime | null;
  topVibe: VibeType | null;
  totalVotes: number;
}

export function useBarVotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('bar-votes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_votes' }, () => {
        qc.invalidateQueries({ queryKey: ['bar-votes'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const { data: allVotes = [] } = useQuery({
    queryKey: ['bar-votes'],
    queryFn: async () => {
      const { data } = await supabase.from('bar_votes').select('*');
      return data ?? [];
    },
    enabled: !!user,
  });

  const myVotes = allVotes.filter((v) => v.user_id === user?.id);

  const getSummary = (barName: string): BarVoteSummary => {
    const votes = allVotes.filter((v) => v.bar_name === barName);
    if (votes.length === 0) return { topWait: null, topVibe: null, totalVotes: 0 };

    const waitCounts: Record<string, number> = {};
    const vibeCounts: Record<string, number> = {};
    votes.forEach((v) => {
      waitCounts[v.wait_time] = (waitCounts[v.wait_time] || 0) + 1;
      vibeCounts[v.vibe] = (vibeCounts[v.vibe] || 0) + 1;
    });

    const topWait = Object.entries(waitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as WaitTime;
    const topVibe = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as VibeType;

    return { topWait, topVibe, totalVotes: votes.length };
  };

  const getMyVote = (barName: string) => myVotes.find((v) => v.bar_name === barName);

  const voteMutation = useMutation({
    mutationFn: async ({ barName, waitTime, vibe }: { barName: string; waitTime: WaitTime; vibe: VibeType }) => {
      if (!user) throw new Error('Not logged in');
      const existing = getMyVote(barName);
      if (existing) {
        await supabase
          .from('bar_votes')
          .update({ wait_time: waitTime, vibe, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('bar_votes')
          .insert({ user_id: user.id, bar_name: barName, wait_time: waitTime, vibe });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bar-votes'] }),
  });

  return { getSummary, getMyVote, vote: voteMutation.mutate, isVoting: voteMutation.isPending };
}
