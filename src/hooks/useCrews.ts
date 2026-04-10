import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───
export interface Crew {
  id: string;
  name: string;
  description: string;
  badge_emoji: string;
  badge_color: string;
  creator_id: string;
  max_members: number;
  is_public: boolean;
  invite_code: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface CrewMember {
  id: string;
  crew_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { display_name: string; profile_photo: string | null };
}

export interface CrewMessage {
  id: string;
  crew_id: string;
  sender_id: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  sender_profile?: { display_name: string; profile_photo: string | null };
}

export interface CrewEvent {
  id: string;
  crew_id: string;
  creator_id: string;
  title: string;
  description: string;
  status: string;
  finalized_option_id: string | null;
  created_at: string;
  options?: CrewEventOption[];
}

export interface CrewEventOption {
  id: string;
  event_id: string;
  label: string;
  date_time: string | null;
  location: string | null;
  vote_count?: number;
  user_voted?: boolean;
}

// ─── List all crews (public + user's) ───
export function useCrews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['crews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get member counts
      const crewIds = (data ?? []).map(c => c.id);
      const { data: members } = await supabase
        .from('crew_members')
        .select('crew_id, user_id')
        .in('crew_id', crewIds);

      return (data ?? []).map(c => ({
        ...c,
        member_count: members?.filter(m => m.crew_id === c.id).length ?? 0,
        is_member: members?.some(m => m.crew_id === c.id && m.user_id === user?.id) ?? false,
      })) as Crew[];
    },
    enabled: !!user,
  });
}

// ─── Single crew detail ───
export function useCrew(crewId: string | undefined) {
  return useQuery({
    queryKey: ['crew', crewId],
    queryFn: async () => {
      if (!crewId) return null;
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .eq('id', crewId)
        .single();
      if (error) throw error;
      return data as Crew;
    },
    enabled: !!crewId,
  });
}

// ─── Crew members with profiles ───
export function useCrewMembers(crewId: string | undefined) {
  return useQuery({
    queryKey: ['crew-members', crewId],
    queryFn: async () => {
      if (!crewId) return [];
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('crew_id', crewId)
        .order('joined_at', { ascending: true });
      if (error) throw error;

      // Fetch profiles for members
      const userIds = (data ?? []).map(m => m.user_id);
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });

      return (data ?? []).map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) ?? { display_name: 'Unknown', profile_photo: null },
      })) as CrewMember[];
    },
    enabled: !!crewId,
  });
}

// ─── Crew messages (group chat) ───
export function useCrewMessages(crewId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['crew-messages', crewId],
    queryFn: async () => {
      if (!crewId) return [];
      const { data, error } = await supabase
        .from('crew_messages')
        .select('*')
        .eq('crew_id', crewId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;

      const senderIds = [...new Set((data ?? []).map(m => m.sender_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: senderIds,
      });

      return (data ?? []).map(m => ({
        ...m,
        sender_profile: profiles?.find(p => p.user_id === m.sender_id),
      })) as CrewMessage[];
    },
    enabled: !!crewId,
  });

  // Realtime subscription
  useQuery({
    queryKey: ['crew-messages-realtime', crewId],
    queryFn: () => {
      if (!crewId) return null;
      const channel = supabase
        .channel(`crew-chat-${crewId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crew_messages', filter: `crew_id=eq.${crewId}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['crew-messages', crewId] });
        })
        .subscribe();
      return { channel };
    },
    enabled: !!crewId,
    staleTime: Infinity,
  });

  return query;
}

// ─── Crew events with options and votes ───
export function useCrewEvents(crewId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['crew-events', crewId],
    queryFn: async () => {
      if (!crewId) return [];
      const { data: events, error } = await supabase
        .from('crew_events')
        .select('*')
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const eventIds = (events ?? []).map(e => e.id);
      const { data: options } = await supabase
        .from('crew_event_options')
        .select('*')
        .in('event_id', eventIds);

      const optionIds = (options ?? []).map(o => o.id);
      const { data: votes } = await supabase
        .from('crew_event_votes')
        .select('*')
        .in('option_id', optionIds);

      return (events ?? []).map(e => ({
        ...e,
        options: (options ?? [])
          .filter(o => o.event_id === e.id)
          .map(o => ({
            ...o,
            vote_count: votes?.filter(v => v.option_id === o.id).length ?? 0,
            user_voted: votes?.some(v => v.option_id === o.id && v.user_id === user?.id) ?? false,
          })),
      })) as CrewEvent[];
    },
    enabled: !!crewId,
  });
}

// ─── Mutations ───

export function useCreateCrew() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string; badge_emoji: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('crews')
        .insert({ ...input, creator_id: user.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-add creator as captain
      await supabase.from('crew_members').insert({ crew_id: data.id, user_id: user.id, role: 'captain' });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crews'] }),
  });
}

export function useJoinCrew() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('crew_members')
        .insert({ crew_id: crewId, user_id: user.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crews'] });
      qc.invalidateQueries({ queryKey: ['crew-members'] });
    },
  });
}

export function useLeaveCrew() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crews'] });
      qc.invalidateQueries({ queryKey: ['crew-members'] });
    },
  });
}

export function useSendCrewMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ crewId, body }: { crewId: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('crew_messages')
        .insert({ crew_id: crewId, sender_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['crew-messages', vars.crewId] }),
  });
}

export function useCreateCrewEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ crewId, title, description, options }: {
      crewId: string;
      title: string;
      description: string;
      options: { label: string; date_time?: string; location?: string }[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: event, error } = await supabase
        .from('crew_events')
        .insert({ crew_id: crewId, creator_id: user.id, title, description })
        .select()
        .single();
      if (error) throw error;

      if (options.length > 0) {
        await supabase
          .from('crew_event_options')
          .insert(options.map(o => ({ event_id: event.id, ...o })));
      }
      return event;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['crew-events', vars.crewId] }),
  });
}

export function useVoteCrewEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ optionId, crewId }: { optionId: string; crewId: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Toggle vote
      const { data: existing } = await supabase
        .from('crew_event_votes')
        .select('id')
        .eq('option_id', optionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('crew_event_votes').delete().eq('id', existing.id);
      } else {
        const { error } = await supabase
          .from('crew_event_votes')
          .insert({ option_id: optionId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['crew-events', vars.crewId] }),
  });
}
