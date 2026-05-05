import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMissionTracker } from '@/hooks/useMissionTracker';
import { track } from '@/lib/analytics';

export function useSendLike() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tracker = useMissionTracker();

  return useMutation({
    mutationFn: async ({ toUser, isHiFive, message }: { toUser: string; isHiFive: boolean; message?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('likes')
        .insert({ from_user: user.id, to_user: toUser, is_hi_five: isHiFive, message: message || null })
        .select()
        .single();
      if (error) throw error;

      // Check if mutual match was created (for likes)
      if (!isHiFive) {
        const userA = user.id < toUser ? user.id : toUser;
        const userB = user.id < toUser ? toUser : user.id;
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .eq('user_a', userA)
          .eq('user_b', userB)
          .maybeSingle();

        if (match) {
          return { ...data, isMatch: true, isMutualHiFive: false };
        }
      }

      // Check if mutual hi-five
      if (isHiFive) {
        const { data: reciprocal } = await supabase
          .from('likes')
          .select('id')
          .eq('from_user', toUser)
          .eq('to_user', user.id)
          .eq('is_hi_five', true)
          .maybeSingle();

        if (reciprocal) {
          return { ...data, isMatch: false, isMutualHiFive: true };
        }
      }

      return { ...data, isMatch: false, isMutualHiFive: false };
    },
    onSuccess: (data, variables) => {
      // Analytics: like vs hi-five
      if (variables.isHiFive) {
        track('hi_five_sent', { has_message: !!variables.message });
      } else {
        track('like_sent');
      }
      if (data.isMatch || data.isMutualHiFive) {
        track('match_made', { kind: data.isMatch ? 'like' : 'hi_five' });
      }

      if (data.isMatch) {
        toast({ title: 'It\'s a Match!', description: 'Nice! You just made a new Buddy.' });
        tracker.trackMatch();
      } else if (data.isMutualHiFive) {
        toast({
          title: 'Mutual Hi-Five!',
          description: 'Nice! You just made a new Buddy — send them a message.',
        });
      } else if (variables.isHiFive && variables.message?.includes('')) {
        toast({
          title: 'Hot Dog sent!',
          description: 'You tossed them a dog — classic Wrigley icebreaker!',
        });
        tracker.trackHiFive();
      } else if (variables.isHiFive) {
        toast({
          title: 'Hi-Five sent — vibes delivered.',
          description: 'Let\'s see if they Hi-Five back!',
        });
        tracker.trackHiFive();
      } else {
        toast({ title: 'Liked!' });
      }
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate')) {
        toast({ title: 'Already done!', description: 'You already interacted with this person.' });
      }
    },
  });
}

export function usePass() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passedUser: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('passes')
        .insert({ from_user: user.id, passed_user: passedUser });
      if (error) throw error;
    },
    onSuccess: () => {
      track('pass_sent');
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
    },
  });
}
