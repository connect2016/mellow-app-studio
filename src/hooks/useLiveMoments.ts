import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface LiveMoment {
  id: string;
  creator_id: string;
  moment_type: string;
  title: string;
  emoji: string;
  location_context: string;
  duration_seconds: number;
  expires_at: string;
  participant_count: number;
  peak_participants: number;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const MOMENT_PRESETS = [
  { type: 'chant', title: 'Go Cubs Go!', emoji: '', duration: 60 },
  { type: 'wave', title: 'Start the Wave!', emoji: '', duration: 45 },
  { type: 'celebration', title: 'Home Run Celebration!', emoji: '', duration: 30 },
  { type: 'rally', title: 'Rally Time!', emoji: '', duration: 90 },
  { type: 'standing_o', title: 'Standing Ovation!', emoji: '', duration: 30 },
  { type: 'seventh_stretch', title: '7th Inning Stretch', emoji: '', duration: 120 },
] as const;

export { MOMENT_PRESETS };

export function useLiveMoments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['live-moments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_moments')
        .select('*')
        .eq('status', 'live')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as LiveMoment[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Realtime for instant sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('live-moments-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_moments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-moments'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_moment_participants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-moments'] });
        queryClient.invalidateQueries({ queryKey: ['my-moment-joins'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useMyMomentJoins() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-moment-joins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('live_moment_participants')
        .select('moment_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map(d => d.moment_id);
    },
    enabled: !!user,
  });
}

export function useCreateMoment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preset: { type: string; title: string; emoji: string; duration: number }) => {
      if (!user) throw new Error('Not authenticated');
      const expiresAt = new Date(Date.now() + preset.duration * 1000).toISOString();
      const { data, error } = await supabase
        .from('live_moments')
        .insert({
          creator_id: user.id,
          moment_type: preset.type,
          title: preset.title,
          emoji: preset.emoji,
          duration_seconds: preset.duration,
          expires_at: expiresAt,
          participant_count: 1,
          peak_participants: 1,
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-join creator
      await supabase.from('live_moment_participants').insert({
        moment_id: data.id,
        user_id: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-moments'] });
      queryClient.invalidateQueries({ queryKey: ['my-moment-joins'] });
    },
  });
}

export function useJoinMoment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (momentId: string) => {
      if (!user) throw new Error('Not authenticated');
      // Join
      const { error: joinError } = await supabase
        .from('live_moment_participants')
        .insert({ moment_id: momentId, user_id: user.id });
      if (joinError) throw joinError;

      // Increment count
      const { data: moment } = await supabase
        .from('live_moments')
        .select('participant_count, peak_participants')
        .eq('id', momentId)
        .single();

      if (moment) {
        const newCount = (moment.participant_count ?? 0) + 1;
        await supabase
          .from('live_moments')
          .update({
            participant_count: newCount,
            peak_participants: Math.max(newCount, moment.peak_participants ?? 0),
          })
          .eq('id', momentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-moments'] });
      queryClient.invalidateQueries({ queryKey: ['my-moment-joins'] });
    },
  });
}

export function useLeaveMoment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (momentId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('live_moment_participants')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', user.id);
      if (error) throw error;

      // Decrement count
      const { data: moment } = await supabase
        .from('live_moments')
        .select('participant_count')
        .eq('id', momentId)
        .single();

      if (moment) {
        await supabase
          .from('live_moments')
          .update({ participant_count: Math.max(0, (moment.participant_count ?? 1) - 1) })
          .eq('id', momentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-moments'] });
      queryClient.invalidateQueries({ queryKey: ['my-moment-joins'] });
    },
  });
}
