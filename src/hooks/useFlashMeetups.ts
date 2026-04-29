import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface FlashMeetup {
  id: string;
  creator_id: string;
  title: string;
  emoji: string;
  location_name: string;
  description: string;
  max_members: number;
  created_at: string;
  expires_at: string;
  status: string;
  vibe: string;
  is_system_generated: boolean;
  member_count?: number;
  members?: { user_id: string; display_name: string; profile_photo: string | null }[];
  is_joined?: boolean;
  creator?: { display_name: string; profile_photo: string | null };
}

export function useFlashMeetups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: meetups, isLoading } = useQuery({
    queryKey: ['flash-meetups'],
    queryFn: async (): Promise<FlashMeetup[]> => {
      // Get live flash meetups that haven't expired
      const { data: raw, error } = await supabase
        .from('flash_meetups')
        .select('*')
        .eq('status', 'live')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!raw || raw.length === 0) return [];

      const ids = raw.map(m => m.id);

      // Get members + creator profiles in parallel
      const [membersRes, creatorsRes] = await Promise.all([
        supabase.from('flash_meetup_members')
          .select('meetup_id, user_id')
          .in('meetup_id', ids),
        supabase.from('profiles')
          .select('user_id, display_name, profile_photo')
          .in('user_id', [...new Set(raw.map(m => m.creator_id))]),
      ]);

      const membersByMeetup: Record<string, string[]> = {};
      (membersRes.data ?? []).forEach(m => {
        if (!membersByMeetup[m.meetup_id]) membersByMeetup[m.meetup_id] = [];
        membersByMeetup[m.meetup_id].push(m.user_id);
      });

      const creatorMap: Record<string, { display_name: string; profile_photo: string | null }> = {};
      (creatorsRes.data ?? []).forEach(p => {
        creatorMap[p.user_id] = { display_name: p.display_name, profile_photo: p.profile_photo };
      });

      // Get member profiles
      const allMemberIds = [...new Set((membersRes.data ?? []).map(m => m.user_id))];
      let memberProfileMap: Record<string, { display_name: string; profile_photo: string | null }> = {};
      if (allMemberIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles')
          .select('user_id, display_name, profile_photo')
          .in('user_id', allMemberIds);
        (profiles ?? []).forEach(p => {
          memberProfileMap[p.user_id] = { display_name: p.display_name, profile_photo: p.profile_photo };
        });
      }

      return raw.map(m => ({
        ...m,
        member_count: (membersByMeetup[m.id] ?? []).length,
        members: (membersByMeetup[m.id] ?? []).map(uid => ({
          user_id: uid,
          display_name: memberProfileMap[uid]?.display_name ?? '?',
          profile_photo: memberProfileMap[uid]?.profile_photo ?? null,
        })),
        is_joined: user ? (membersByMeetup[m.id] ?? []).includes(user.id) : false,
        creator: creatorMap[m.creator_id] ?? { display_name: 'Unknown', profile_photo: null },
      }));
    },
    enabled: !!user,
    refetchInterval: 15_000, // Refresh every 15s for live countdowns
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('flash-meetups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_meetups' }, () => {
        queryClient.invalidateQueries({ queryKey: ['flash-meetups'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_meetup_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['flash-meetups'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const joinMeetup = useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('flash_meetup_members').insert({
        meetup_id: meetupId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-meetups'] }),
  });

  const leaveMeetup = useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('flash_meetup_members')
        .delete()
        .eq('meetup_id', meetupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-meetups'] }),
  });

  const createMeetup = useMutation({
    mutationFn: async (input: {
      title: string;
      location_name: string;
      description?: string;
      emoji?: string;
      vibe?: string;
      duration_minutes?: number;
      max_members?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const duration = Math.max(15, Math.min(60, input.duration_minutes ?? 45));
      const expires_at = new Date(Date.now() + duration * 60 * 1000).toISOString();

      const { data, error } = await supabase.from('flash_meetups').insert({
        creator_id: user.id,
        title: input.title,
        location_name: input.location_name,
        description: input.description ?? '',
        emoji: input.emoji ?? '',
        vibe: input.vibe ?? 'hype',
        max_members: input.max_members ?? 6,
        expires_at,
      }).select('id').single();

      if (error) throw error;

      // Auto-join creator
      await supabase.from('flash_meetup_members').insert({
        meetup_id: data.id,
        user_id: user.id,
      });

      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-meetups'] }),
  });

  return { meetups: meetups ?? [], isLoading, joinMeetup, leaveMeetup, createMeetup };
}
