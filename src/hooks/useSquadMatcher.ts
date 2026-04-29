import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SquadMember {
  id: string;
  name: string;
  photo: string | null;
  intents: string[];
  fanStyle: string[];
  isMe: boolean;
}

export interface Squad {
  squad_name: string;
  squad_type: 'party' | 'hardcore' | 'chill';
  member_ids: string[];
  members: SquadMember[];
  meeting_point: string;
  meeting_time: string;
  reason: string;
  icebreaker: string;
  vibe_emoji: string;
}

export function useSquadMatcher() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['squad-matcher'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad-matcher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error('Rate limited — try again in a moment');
        if (resp.status === 402) throw new Error('AI credits exhausted');
        throw new Error(err.error || 'Failed to find squads');
      }

      return resp.json() as Promise<{ squads: Squad[]; totalFans: number }>;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useActivateSquad() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (squad: Squad) => {
      if (!user) throw new Error('Not authenticated');

      // Create a lineup meetup for this squad
      const meetingTime = new Date();
      const timeParts = squad.meeting_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const mins = parseInt(timeParts[2]);
        const ampm = timeParts[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        meetingTime.setHours(hours, mins, 0, 0);
      }

      const { data: meetup, error: meetupError } = await supabase
        .from('lineup_meetups')
        .insert({
          creator_id: user.id,
          location_name: squad.meeting_point,
          meeting_time: meetingTime.toISOString(),
          description: `${squad.vibe_emoji} ${squad.squad_name} — ${squad.reason}`,
          max_members: 6,
        })
        .select('id')
        .single();

      if (meetupError) throw meetupError;

      // Auto-add squad members (except creator)
      const otherMembers = squad.member_ids.filter(id => id !== user.id);
      if (otherMembers.length > 0) {
        const memberInserts = otherMembers.map(uid => ({
          meetup_id: meetup.id,
          user_id: uid,
        }));
        await supabase.from('lineup_members').insert(memberInserts);
      }

      // Send the icebreaker message
      await supabase.from('lineup_messages').insert({
        meetup_id: meetup.id,
        sender_id: user.id,
        body: squad.icebreaker,
      });

      // Send notifications to squad members
      const notifications = otherMembers.map(uid => ({
        user_id: uid,
        type: 'squad_match',
        title: `${squad.vibe_emoji} You're in a Squad!`,
        body: `You've been matched into "${squad.squad_name}" — meet at ${squad.meeting_point} at ${squad.meeting_time}!`,
        emoji: squad.vibe_emoji,
        action_url: `/gameday`,
      }));
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      return meetup.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineup-meetups'] });
      queryClient.invalidateQueries({ queryKey: ['squad-matcher'] });
      toast.success('Squad activated! Chat is live');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to activate squad');
    },
  });
}
