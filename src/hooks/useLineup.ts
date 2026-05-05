import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export interface LineupMeetup {
  id: string;
  creator_id: string;
  location_name: string;
  meeting_time: string;
  description: string;
  max_members: number;
  status: string;
  created_at: string;
  expires_at: string;
  creator_name?: string;
  creator_photo?: string;
  member_count?: number;
  is_member?: boolean;
}

export interface LineupMessage {
  id: string;
  meetup_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

export function useLineupMeetups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lineup-meetups'],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Get active meetups
      const { data: meetups, error } = await supabase
        .from('lineup_meetups')
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', now)
        .order('meeting_time', { ascending: true });

      if (error) throw error;
      if (!meetups?.length) return [];

      // Get creator profiles
      const creatorIds = [...new Set(meetups.map(m => m.creator_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Get member counts
      const meetupIds = meetups.map(m => m.id);
      const { data: members } = await supabase
        .from('lineup_members')
        .select('meetup_id, user_id')
        .in('meetup_id', meetupIds);

      const countMap = new Map<string, number>();
      const userMeetups = new Set<string>();
      members?.forEach(m => {
        countMap.set(m.meetup_id, (countMap.get(m.meetup_id) ?? 0) + 1);
        if (m.user_id === user?.id) userMeetups.add(m.meetup_id);
      });

      return meetups.map(m => {
        const creator = profileMap.get(m.creator_id);
        return {
          ...m,
          creator_name: creator?.display_name ?? 'A fan',
          creator_photo: creator?.profile_photo ?? '',
          member_count: (countMap.get(m.id) ?? 0) + 1, // +1 for creator
          is_member: userMeetups.has(m.id) || m.creator_id === user?.id,
        } as LineupMeetup;
      });
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useCreateMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { location_name: string; meeting_time: string; description?: string; max_members?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('lineup_meetups')
        .insert({
          creator_id: user.id,
          location_name: data.location_name,
          meeting_time: data.meeting_time,
          description: data.description ?? '',
          max_members: data.max_members ?? 10,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      track('meetup_created', {
        max_members: vars.max_members ?? 10,
        has_description: !!vars.description,
      });
      queryClient.invalidateQueries({ queryKey: ['lineup-meetups'] });
    },
  });
}

export function useJoinMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('lineup_members')
        .insert({ meetup_id: meetupId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_, meetupId) => {
      track('meetup_joined', { meetup_id: meetupId, source: 'lineup' });
      queryClient.invalidateQueries({ queryKey: ['lineup-meetups'] });
    },
  });
}

export function useLeaveMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('lineup_members')
        .delete()
        .eq('meetup_id', meetupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineup-meetups'] });
    },
  });
}

export function useLineupMessages(meetupId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!meetupId) return;
    const channel = supabase
      .channel(`lineup-chat-${meetupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lineup_messages', filter: `meetup_id=eq.${meetupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lineup-messages', meetupId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [meetupId, queryClient]);

  return useQuery({
    queryKey: ['lineup-messages', meetupId],
    queryFn: async () => {
      if (!meetupId) return [];
      const { data: messages, error } = await supabase
        .from('lineup_messages')
        .select('*')
        .eq('meetup_id', meetupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messages?.length) return [];

      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return messages.map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id)?.display_name ?? 'Fan',
        sender_photo: profileMap.get(m.sender_id)?.profile_photo ?? '',
      })) as LineupMessage[];
    },
    enabled: !!meetupId && !!user,
    refetchInterval: 10000,
  });
}

export function useSendLineupMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetupId, body }: { meetupId: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('lineup_messages')
        .insert({ meetup_id: meetupId, sender_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lineup-messages', vars.meetupId] });
    },
  });
}
