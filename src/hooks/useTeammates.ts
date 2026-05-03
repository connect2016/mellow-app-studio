import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type TeammateStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface TeammateRequestRow {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: TeammateStatus;
  created_at: string;
  responded_at: string | null;
}

export interface TeammateProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  game_status: string | null;
  wrigley_section: string | null;
  wrigleyville_bar: string | null;
  vibe_state: string | null;
  vibe_emoji: string | null;
  gameday_persona: string | null;
  intent: string[] | null;
  gameday_intents: string[] | null;
  fan_tier: string | null;
  bio: string | null;
  since: string;
}

/** All confirmed teammates with their public profile fields, joined locally. */
export function useTeammates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teammates', user?.id],
    queryFn: async (): Promise<TeammateProfile[]> => {
      if (!user) return [];
      const { data: ids, error } = await supabase.rpc('get_teammate_ids', { _user_id: user.id });
      if (error) throw error;
      const rows = (ids ?? []) as { teammate_id: string; since: string }[];
      if (rows.length === 0) return [];
      const sinceMap = new Map(rows.map(r => [r.teammate_id, r.since]));
      const { data: profiles, error: pErr } = await supabase.rpc('get_public_profiles', {
        p_user_ids: rows.map(r => r.teammate_id),
        p_limit: rows.length,
      });
      if (pErr) throw pErr;
      return (profiles ?? []).map((p: any) => ({
        ...p,
        since: sinceMap.get(p.user_id) ?? new Date().toISOString(),
      }));
    },
    enabled: !!user,
  });
}

/** All pending requests where the current user is recipient (incoming). */
export function useIncomingRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teammate-incoming', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('teammate_requests')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeammateRequestRow[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Get the current relationship state between viewer and another user. */
export function useTeammateState(otherUserId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teammate-state', user?.id, otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId || user.id === otherUserId) return null;
      const { data, error } = await supabase
        .from('teammate_requests')
        .select('*')
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${user.id})`
        )
        .in('status', ['pending', 'accepted'])
        .maybeSingle();
      if (error) throw error;
      return (data as TeammateRequestRow | null) ?? null;
    },
    enabled: !!user && !!otherUserId && user.id !== otherUserId,
  });
}

export function useSendTeammateRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (recipientId: string) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('teammate_requests')
        .insert({ requester_id: user.id, recipient_id: recipientId, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data as TeammateRequestRow;
    },
    onMutate: async (recipientId) => {
      const key = ['teammate-state', user?.id, recipientId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TeammateRequestRow | null>(key);
      const optimistic: TeammateRequestRow = {
        id: `optimistic-${Date.now()}`,
        requester_id: user?.id ?? '',
        recipient_id: recipientId,
        status: 'pending',
        created_at: new Date().toISOString(),
        responded_at: null,
      };
      qc.setQueryData(key, optimistic);
      return { previous, key };
    },
    onSuccess: (_data, recipientId) => {
      qc.invalidateQueries({ queryKey: ['teammate-state', user?.id, recipientId] });
      toast({ title: 'Request sent', description: 'They\'ll see your invite to join your team.' });
    },
    onError: (e: any, _recipientId, context) => {
      if (context) qc.setQueryData(context.key, context.previous);
      toast({ title: "Couldn't recruit — tap to retry", description: e?.message ?? 'Try again', variant: 'destructive' });
    },
  });
}

export function useRespondToRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase
        .from('teammate_requests')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', id);
      if (error) throw error;
      return accept;
    },
    onMutate: async ({ id, accept }) => {
      // Find the matching state query (we don't know the otherUserId from args alone)
      const matches = qc.getQueriesData<TeammateRequestRow | null>({ queryKey: ['teammate-state', user?.id] });
      const snapshots: Array<{ key: readonly unknown[]; data: TeammateRequestRow | null | undefined }> = [];
      for (const [key, data] of matches) {
        if (data && data.id === id) {
          snapshots.push({ key, data });
          qc.setQueryData(key, {
            ...data,
            status: accept ? 'accepted' : 'declined',
            responded_at: new Date().toISOString(),
          });
        }
      }
      // Optimistically remove from incoming list
      const incomingKey = ['teammate-incoming', user?.id];
      const prevIncoming = qc.getQueryData<TeammateRequestRow[]>(incomingKey);
      if (prevIncoming) {
        qc.setQueryData(incomingKey, prevIncoming.filter((r) => r.id !== id));
      }
      return { snapshots, prevIncoming, incomingKey };
    },
    onSuccess: (accepted) => {
      qc.invalidateQueries({ queryKey: ['teammates', user?.id] });
      qc.invalidateQueries({ queryKey: ['teammate-incoming', user?.id] });
      qc.invalidateQueries({ queryKey: ['teammate-state'] });
      toast({
        title: accepted ? 'New Teammate added' : 'Request declined',
        description: accepted ? 'They\'re now in your Dugout.' : '',
      });
    },
    onError: (e: any, _vars, context) => {
      if (context) {
        for (const s of context.snapshots) qc.setQueryData(s.key, s.data);
        if (context.prevIncoming !== undefined) qc.setQueryData(context.incomingKey, context.prevIncoming);
      }
      toast({ title: "Couldn't update — tap to retry", description: e?.message ?? 'Try again', variant: 'destructive' });
    },
  });
}

export function useRemoveTeammate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('teammate_requests')
        .delete()
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${user.id})`
        );
      if (error) throw error;
    },
    onMutate: async (otherUserId) => {
      const stateKey = ['teammate-state', user?.id, otherUserId];
      await qc.cancelQueries({ queryKey: stateKey });
      const prevState = qc.getQueryData<TeammateRequestRow | null>(stateKey);
      qc.setQueryData(stateKey, null);
      return { stateKey, prevState };
    },
    onSuccess: (_d, otherUserId) => {
      qc.invalidateQueries({ queryKey: ['teammates', user?.id] });
      qc.invalidateQueries({ queryKey: ['teammate-state', user?.id, otherUserId] });
      toast({ title: 'Removed from your team' });
    },
    onError: (e: any, _otherUserId, context) => {
      if (context) qc.setQueryData(context.stateKey, context.prevState);
      toast({ title: "Couldn't remove — tap to retry", description: e?.message ?? 'Try again', variant: 'destructive' });
    },
  });
}

