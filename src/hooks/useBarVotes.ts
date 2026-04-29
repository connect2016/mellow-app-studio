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
  chill: 'Chill',
  rowdy: 'Rowdy',
  packed: 'Packed',
};

export interface BarVoteSummary {
  topWait: WaitTime | null;
  topVibe: VibeType | null;
  totalVotes: number;
  isDefault: boolean;
}

// Standard Game Day baseline vibes – shown until 5+ live votes exist
export const DEFAULT_BAR_VIBES: Record<string, { vibe: VibeType; wait: WaitTime }> = {
  "Murphy's Bleachers": { vibe: 'rowdy', wait: '30_plus' },
  "The Cubby Bear Lounge Chicago": { vibe: 'packed', wait: '30_plus' },
  "Lucky Dorr": { vibe: 'rowdy', wait: '15_min' },
  "Bernie's": { vibe: 'rowdy', wait: '15_min' },
  "Yak-Zie's Bar & Grill": { vibe: 'rowdy', wait: '15_min' },
  "GMAN Tavern": { vibe: 'chill', wait: 'no_line' },
  "Mordecai": { vibe: 'chill', wait: 'no_line' },
  "Sluggers World Class Sports Bar": { vibe: 'packed', wait: '30_plus' },
  "Trace": { vibe: 'rowdy', wait: 'no_line' },
  "Toons Bar & Grill": { vibe: 'rowdy', wait: '15_min' },
  "Almost Home Tavern & Grill": { vibe: 'rowdy', wait: '15_min' },
  "Moe's Cantina": { vibe: 'packed', wait: '30_plus' },
  "The Sports Corner Bar and Grill": { vibe: 'packed', wait: '30_plus' },
  "The Dugout Sports Bar and Grill": { vibe: 'rowdy', wait: 'no_line' },
  "Smartbar": { vibe: 'rowdy', wait: '30_plus' },
  "Metro Chicago": { vibe: 'rowdy', wait: '30_plus' },
  "Dovetail Brewery": { vibe: 'chill', wait: 'no_line' },
  "Begyle Brewing Company": { vibe: 'chill', wait: 'no_line' },
  "Kit Kat Lounge & Supper Club": { vibe: 'rowdy', wait: '15_min' },
  "The North End": { vibe: 'rowdy', wait: 'no_line' },
  "Wolcott Tap": { vibe: 'chill', wait: 'no_line' },
  "The Ravenswood Tavern": { vibe: 'chill', wait: 'no_line' },
  "Billy Goat Tavern": { vibe: 'rowdy', wait: '15_min' },
  "Kincade's": { vibe: 'rowdy', wait: '15_min' },
  "Stretch Bar & Grill": { vibe: 'rowdy', wait: '15_min' },
  "Stolen Saddle": { vibe: 'rowdy', wait: '15_min' },
  "Graystone Tavern": { vibe: 'rowdy', wait: '15_min' },
  "Output": { vibe: 'rowdy', wait: '15_min' },
  "Cheesie's Wrigleyville": { vibe: 'rowdy', wait: '15_min' },
  "Vines on Clark": { vibe: 'rowdy', wait: '15_min' },
  "Brickhouse Tavern": { vibe: 'rowdy', wait: '15_min' },
  "Old Crow Smokehouse": { vibe: 'rowdy', wait: '15_min' },
  "Smoke Daddy": { vibe: 'rowdy', wait: '15_min' },
  "Clark Street Dog": { vibe: 'chill', wait: 'no_line' },
  "Uncommon Ground": { vibe: 'chill', wait: 'no_line' },
  "Country Club": { vibe: 'rowdy', wait: '15_min' },
  "Roadhouse 66": { vibe: 'rowdy', wait: '15_min' },
  "Merkle's Bar & Grill": { vibe: 'rowdy', wait: '15_min' },
  "Home Away From Home": { vibe: 'rowdy', wait: '15_min' },
};

const LIVE_VOTE_THRESHOLD = 5;

export function useBarVotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

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
      const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('bar_votes')
        .select('*')
        .gte('updated_at', sixtyMinAgo);
      return data ?? [];
    },
    enabled: !!user,
  });

  const myVotes = allVotes.filter((v) => v.user_id === user?.id);

  const getSummary = (barName: string): BarVoteSummary => {
    const votes = allVotes.filter((v) => v.bar_name === barName);

    // If fewer than threshold live votes, fall back to defaults
    if (votes.length < LIVE_VOTE_THRESHOLD) {
      const defaults = DEFAULT_BAR_VIBES[barName];
      if (defaults) {
        return {
          topWait: defaults.wait,
          topVibe: defaults.vibe,
          totalVotes: votes.length,
          isDefault: true,
        };
      }
      if (votes.length === 0) return { topWait: null, topVibe: null, totalVotes: 0, isDefault: false };
    }

    const waitCounts: Record<string, number> = {};
    const vibeCounts: Record<string, number> = {};
    votes.forEach((v) => {
      waitCounts[v.wait_time] = (waitCounts[v.wait_time] || 0) + 1;
      vibeCounts[v.vibe] = (vibeCounts[v.vibe] || 0) + 1;
    });

    const topWait = Object.entries(waitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as WaitTime;
    const topVibe = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as VibeType;

    return { topWait, topVibe, totalVotes: votes.length, isDefault: false };
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
