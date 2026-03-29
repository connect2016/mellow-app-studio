import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useBlockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get current blocked_users array
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('user_id', user.id)
        .single();
      if (fetchErr) throw fetchErr;

      const current: string[] = (profile?.blocked_users as string[]) ?? [];
      if (current.includes(blockedUserId)) return;

      const updated = [...current, blockedUserId];
      const { error } = await supabase
        .from('profiles')
        .update({ blocked_users: updated })
        .eq('user_id', user.id);
      if (error) throw error;

      // Also add us to their blocked list so mutual hiding works
      const { data: otherProfile, error: otherErr } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('user_id', blockedUserId)
        .single();

      if (!otherErr && otherProfile) {
        const otherBlocked: string[] = (otherProfile.blocked_users as string[]) ?? [];
        if (!otherBlocked.includes(user.id)) {
          await supabase
            .from('profiles')
            .update({ blocked_users: [...otherBlocked, user.id] })
            .eq('user_id', blockedUserId);
        }
      }
    },
    onSuccess: () => {
      toast.success('User blocked', { description: 'You won\'t see each other anymore.' });
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['section-messages'] });
    },
  });
}

export function useReportUser() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reportedUserId, reason, details }: {
      reportedUserId: string;
      reason: string;
      details?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          details: details || '',
        });
      if (error) {
        if (error.message?.includes('duplicate')) {
          throw new Error('You have already reported this user.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Report submitted', { description: 'Our moderators will review this.' });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
