import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useBlockedUserIds } from '@/hooks/useBlockAndReport';

export function useScoringSession(sessionId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: blockedIds = [] } = useBlockedUserIds();

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
    queryKey: ['scoring-members', sessionId, blockedIds.slice().sort().join(',')],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_session_members')
        .select('*')
        .eq('session_id', sessionId!);
      if (!data) return [];
      const blockedSet = new Set(blockedIds);
      const visible = data.filter(m => !blockedSet.has(m.user_id));
      const userIds = visible.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar')
        .in('user_id', userIds);
      return visible.map(m => ({
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
    queryKey: ['scoring-reactions', sessionId, blockedIds.slice().sort().join(',')],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_reactions')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      const blockedSet = new Set(blockedIds);
      return (data ?? []).filter(r => !blockedSet.has(r.user_id));
    },
    enabled: !!sessionId,
  });

  const predictions = useQuery({
    queryKey: ['scoring-predictions', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scoring_predictions')
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_predictions', filter: `session_id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-predictions', sessionId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_sessions', filter: `id=eq.${sessionId}` }, () => qc.invalidateQueries({ queryKey: ['scoring-session', sessionId] }))
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
        scored_by: user.id,
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

  // Pass the Pencil
  const passPencil = useMutation({
    mutationFn: async (toUserId: string) => {
      if (!sessionId) throw new Error('No session');
      const { error } = await supabase
        .from('scoring_sessions')
        .update({ active_scorer_id: toUserId } as any)
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-session', sessionId] }),
  });

  // Finalize game
  const finalizeGame = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session');
      const { error } = await supabase
        .from('scoring_sessions')
        .update({ status: 'final', finalized_at: new Date().toISOString() } as any)
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-session', sessionId] }),
  });

  // Advance batter
  const advanceBatter = useMutation({
    mutationFn: async () => {
      if (!sessionId || !session.data) throw new Error('No session');
      const current = (session.data as any).active_batter ?? 1;
      const next = current >= 9 ? 1 : current + 1;
      const { error } = await supabase
        .from('scoring_sessions')
        .update({ active_batter: next } as any)
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-session', sessionId] }),
  });

  const PREDICTION_POINTS: Record<string, number> = {
    hr: 25, strikeout: 10, double_play: 20, hit: 8, walk: 5, flyout: 5, groundout: 5, steal: 15,
  };

  const makePrediction = useMutation({
    mutationFn: async (prediction: { inning: number; half: string; predicted_play: string }) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const { error } = await supabase.from('scoring_predictions').insert({
        session_id: sessionId,
        user_id: user.id,
        ...prediction,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scoring-predictions', sessionId] }),
  });

  const resolvePrediction = useMutation({
    mutationFn: async ({ predictionId, isCorrect }: { predictionId: string; isCorrect: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: pred } = await supabase.from('scoring_predictions').select('*').eq('id', predictionId).single();
      if (!pred) throw new Error('Prediction not found');

      const points = isCorrect ? (PREDICTION_POINTS[pred.predicted_play] ?? 5) : 0;
      await supabase.from('scoring_predictions').update({
        is_correct: isCorrect,
        resolved_at: new Date().toISOString(),
        points_awarded: points,
      }).eq('id', predictionId);

      if (isCorrect && points > 0) {
        await supabase.from('user_points').insert({
          user_id: pred.user_id,
          points,
          source: 'prediction',
          source_id: predictionId,
        });
      }

      const { data: existingStats } = await supabase.from('scorer_stats').select('*').eq('user_id', pred.user_id).single();
      if (existingStats) {
        const newStreak = isCorrect ? existingStats.streak + 1 : 0;
        await supabase.from('scorer_stats').update({
          total_predictions: existingStats.total_predictions + 1,
          correct_predictions: existingStats.correct_predictions + (isCorrect ? 1 : 0),
          prediction_points: existingStats.prediction_points + points,
          streak: newStreak,
          best_streak: Math.max(existingStats.best_streak, newStreak),
          updated_at: new Date().toISOString(),
        }).eq('user_id', pred.user_id);
      } else {
        await supabase.from('scorer_stats').insert({
          user_id: pred.user_id,
          total_predictions: 1,
          correct_predictions: isCorrect ? 1 : 0,
          prediction_points: points,
          streak: isCorrect ? 1 : 0,
          best_streak: isCorrect ? 1 : 0,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scoring-predictions', sessionId] });
      qc.invalidateQueries({ queryKey: ['scorer-leaderboard'] });
    },
  });

  return {
    session, members, entries, timeline, reactions, predictions,
    joinSession, addEntry, confirmEntry, addTimelineEvent, sendReaction,
    makePrediction, resolvePrediction, passPencil, finalizeGame, advanceBatter,
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
      await supabase.from('scoring_session_members').insert({
        session_id: data.id,
        user_id: user.id,
        location_label: 'Session Creator',
      });
      // Set creator as active scorer
      await supabase.from('scoring_sessions').update({ active_scorer_id: user.id } as any).eq('id', data.id);
      return data;
    },
  });

  return { liveSessions, createSession };
}
