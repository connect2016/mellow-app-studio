import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export function useScoringSession(sessionId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const session = useQuery({
    queryKey: ['scoring-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_sessions')
        .select('*')
        .eq('id', sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const members = useQuery({
    queryKey: ['scoring-members', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_session_members')
        .select('*')
        .eq('session_id', sessionId!);
      if (!data) return [];
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar')
        .in('user_id', userIds);
      return data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id),
      }));
    },
    enabled: !!sessionId,
  });

  const entries = useQuery({
    queryKey: ['scoring-entries', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_entries')
        .select('*')
        .eq('session_id', sessionId!)
        .order('inning', { ascending: true });
      return data ?? [];
    },
    enabled: !!sessionId,
  });

  const timeline = useQuery({
    queryKey: ['scoring-timeline', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_timeline')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    enabled: !!sessionId,
  });

  const reactions = useQuery({
    queryKey: ['scoring-reactions', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_reactions')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    enabled: !!sessionId,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`scoring-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_entries', filter: `session_id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-entries', sessionId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_reactions', filter: `session_id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-reactions', sessionId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_timeline', filter: `session_id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-timeline', sessionId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_session_members', filter: `session_id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-members', sessionId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, qc]);

  const joinSession = useMutation({
    mutationFn: async (locationLabel: string) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const { error } = await supabase.from('scoring_session_members').upsert({
        session_id: sessionId,
        user_id: user.id,
        location_label: locationLabel,
      }, { onConflict: 'session_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-members', sessionId] }),
  });

  const addEntry = useMutation({
    mutationFn: async (entry: { inning: number; half: string; runs: number; hits: number; errors: number }) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const { error } = await supabase.from('scoring_entries').upsert({
        session_id: sessionId,
        user_id: user.id,
        inning: entry.inning,
        half: entry.half,
        runs: entry.runs,
        hits: entry.hits,
        errors: entry.errors,
        confirmed_by: [user.id],
      }, { onConflict: 'session_id,inning,half' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-entries', sessionId] }),
  });

  const confirmEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: entry } = await supabase.from('scoring_entries').select('confirmed_by').eq('id', entryId).single();
      if (!entry) throw new Error('Entry not found');
      const confirmedBy = (entry.confirmed_by as string[]) ?? [];
      if (!confirmedBy.includes(user.id)) {
        confirmedBy.push(user.id);
        await supabase.from('scoring_entries').update({ confirmed_by: confirmedBy }).eq('id', entryId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-entries', sessionId] }),
  });

  const addTimelineEvent = useMutation({
    mutationFn: async (event: { inning: number; half: string; play_type: string; description: string }) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const { error } = await supabase.from('scoring_timeline').insert({
        session_id: sessionId,
        user_id: user.id,
        ...event,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-timeline', sessionId] }),
  });

  const sendReaction = useMutation({
    mutationFn: async (reaction: { type: string; body: string }) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const { error } = await supabase.from('scoring_reactions').insert({
        session_id: sessionId,
        user_id: user.id,
        ...reaction,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-reactions', sessionId] }),
  });

  return {
    session, members, entries, timeline, reactions,
    joinSession, addEntry, confirmEntry, addTimelineEvent, sendReaction,
  };
}

export function useScoringSessions() {
  const { user } = useAuth();

  const liveSessions = useQuery({
    queryKey: ['scoring-sessions-live'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_sessions')
        .select('*, scoring_session_members(count)')
        .eq('status', 'live')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const createSession = useMutation({
    mutationFn: async (params: { title: string; away_team: string; game_id?: string; is_public?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('scoring_sessions').insert({
        creator_id: user.id,
        title: params.title,
        away_team: params.away_team,
        game_id: params.game_id ?? null,
        is_public: params.is_public ?? true,
      }).select().single();
      if (error) throw error;
      // Auto-join as creator
      await supabase.from('scoring_session_members').insert({
        session_id: data.id,
        user_id: user.id,
        location_label: 'Session Creator',
      });
      return data;
    },
  });

  return { liveSessions, createSession };
}
