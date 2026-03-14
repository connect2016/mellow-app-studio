import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSendLike() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toUser, isHiFive }: { toUser: string; isHiFive: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('likes')
        .insert({ from_user: user.id, to_user: toUser, is_hi_five: isHiFive })
        .select()
        .single();
      if (error) throw error;

      // Check if mutual match was created
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
          return { ...data, isMatch: true };
        }
      }
      return { ...data, isMatch: false };
    },
    onSuccess: (data, variables) => {
      if (data.isMatch) {
        toast({ title: '🎉 It\'s a Match!', description: 'You can now message each other!' });
      } else if (variables.isHiFive) {
        toast({ title: '🖐️ Hi-Five sent!' });
      } else {
        toast({ title: '❤️ Liked!' });
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
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
    },
  });
}
