import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MeetupAttendee {
  user_id: string;
  display_name: string;
  profile_photo: string;
  is_verified: boolean;
  fan_tier_emoji: string;
  fan_title: string;
  fan_xp: number;
  is_host: boolean;
  joined_at: string;
}

export interface MeetupDetail {
  id: string;
  creator_id: string;
  location_name: string;
  meeting_time: string;
  description: string;
  max_members: number;
  status: string;
  created_at: string;
  expires_at: string;
  host: MeetupAttendee | null;
  attendees: MeetupAttendee[];
  member_count: number;
  is_member: boolean;
  is_host: boolean;
  mutual_count: number;
}

/**
 * Derive lightweight vibe tags from description + meeting time.
 * Keeps zero DB changes while giving cards more personality.
 */
export function deriveVibeTags(meetup: { description?: string | null; meeting_time: string; location_name: string }): string[] {
  const tags: string[] = [];
  const desc = (meetup.description || '').toLowerCase();
  const loc = meetup.location_name.toLowerCase();
  const minsUntil = (new Date(meetup.meeting_time).getTime() - Date.now()) / 60000;

  if (minsUntil >= 0 && minsUntil <= 60) tags.push('Starts soon');
  if (/pre.?game|warm.?up|tailgate/i.test(desc)) tags.push('Pre-Game');
  if (/post.?game|after.?party|nightcap/i.test(desc)) tags.push('Post-Game');
  if (/chill|low.?key|relaxed|quiet/i.test(desc)) tags.push('Chill');
  if (/rally|hype|loud|let.?s go|lfg/i.test(desc)) tags.push('Rally Mode');
  if (/first.?timer|new|welcome/i.test(desc)) tags.push('Newcomer-friendly');
  if (loc.includes('bleacher')) tags.push('Bleachers');
  if (loc.includes('rooftop')) tags.push('Rooftop');
  return tags.slice(0, 3);
}

export function useMeetupDetail(meetupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meetup-detail', meetupId, user?.id],
    enabled: !!meetupId,
    refetchInterval: 20000,
    queryFn: async (): Promise<MeetupDetail | null> => {
      if (!meetupId) return null;

      const { data: meetup, error } = await supabase
        .from('lineup_meetups')
        .select('*')
        .eq('id', meetupId)
        .maybeSingle();
      if (error) throw error;
      if (!meetup) return null;

      // Members
      const { data: memberRows } = await supabase
        .from('lineup_members')
        .select('user_id, joined_at')
        .eq('meetup_id', meetupId);

      const memberIds = (memberRows || []).map(m => m.user_id);
      const allIds = Array.from(new Set([meetup.creator_id, ...memberIds]));

      // Profiles via SECURITY DEFINER RPC (returns public-safe fields)
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: allIds,
        p_limit: 100,
      });

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );
      const joinedMap = new Map<string, string>();
      (memberRows || []).forEach(m => joinedMap.set(m.user_id, m.joined_at));

      const buildAttendee = (uid: string, isHost: boolean): MeetupAttendee => {
        const p: any = profileMap.get(uid) || {};
        return {
          user_id: uid,
          display_name: p.display_name || 'A fan',
          profile_photo: p.profile_photo || '',
          is_verified: !!p.is_verified,
          fan_tier_emoji: p.fan_tier_emoji || '🌱',
          fan_title: p.fan_title || 'Rookie Fan',
          fan_xp: p.fan_xp || 0,
          is_host: isHost,
          joined_at: isHost ? meetup.created_at : (joinedMap.get(uid) || meetup.created_at),
        };
      };

      const host = buildAttendee(meetup.creator_id, true);
      const attendees: MeetupAttendee[] = [
        host,
        ...memberIds.filter(id => id !== meetup.creator_id).map(id => buildAttendee(id, false)),
      ];

      // Mutual count: how many attendees has the current user matched with before?
      let mutual_count = 0;
      if (user && allIds.length > 0) {
        const otherIds = allIds.filter(id => id !== user.id);
        if (otherIds.length > 0) {
          const { data: matchedRows } = await supabase
            .from('matches')
            .select('user_a, user_b')
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
          const matchedSet = new Set<string>();
          (matchedRows || []).forEach(m => {
            const other = m.user_a === user.id ? m.user_b : m.user_a;
            matchedSet.add(other);
          });
          mutual_count = otherIds.filter(id => matchedSet.has(id)).length;
        }
      }

      const is_member = !!user && allIds.includes(user.id);
      const is_host = !!user && meetup.creator_id === user.id;

      return {
        ...meetup,
        host,
        attendees,
        member_count: attendees.length,
        is_member,
        is_host,
        mutual_count,
      };
    },
  });
}

/** Returns matched users + crew co-members the current user can invite. */
export function useInvitableConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invitable-connections', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data: matched } = await supabase
        .from('matches')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const matchedIds = new Set<string>();
      (matched || []).forEach(m => {
        matchedIds.add(m.user_a === user.id ? m.user_b : m.user_a);
      });

      // Crew co-members
      const { data: myCrews } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id);
      const crewIds = (myCrews || []).map(c => c.crew_id);
      if (crewIds.length > 0) {
        const { data: peers } = await supabase
          .from('crew_members')
          .select('user_id')
          .in('crew_id', crewIds);
        (peers || []).forEach(p => {
          if (p.user_id !== user.id) matchedIds.add(p.user_id);
        });
      }

      const ids = Array.from(matchedIds);
      if (ids.length === 0) return [];

      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: ids,
        p_limit: 100,
      });
      return (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name || 'Fan',
        profile_photo: p.profile_photo || '',
        fan_title: p.fan_title || '',
      }));
    },
  });
}

export function useSendMeetupInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { meetupId: string; meetupTitle: string; userIds: string[] }) => {
      if (!user || params.userIds.length === 0) return;
      const rows = params.userIds.map(uid => ({
        user_id: uid,
        type: 'meetup_invite',
        title: 'You got an invite!',
        body: `Join "${params.meetupTitle}" — tap to RSVP`,
        emoji: '⚾',
        action_url: `/meetups/${params.meetupId}`,
        metadata: { meetup_id: params.meetupId, from_user: user.id },
      }));
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
