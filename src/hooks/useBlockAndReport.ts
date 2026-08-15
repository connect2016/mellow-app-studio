import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function invalidateBlockQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
  queryClient.invalidateQueries({ queryKey: ['section-messages'] });
  queryClient.invalidateQueries({ queryKey: ['blocked-pair-ids'] });
  queryClient.invalidateQueries({ queryKey: ['blocked-users-list'] });
}

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
    },
    onSuccess: () => {
      toast.success('User blocked', { description: 'You won\'t see each other anymore.' });
      invalidateBlockQueries(queryClient);
    },
  });
}

export function useUnblockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('user_id', user.id)
        .single();
      if (fetchErr) throw fetchErr;

      const current: string[] = (profile?.blocked_users as string[]) ?? [];
      const updated = current.filter((id) => id !== blockedUserId);
      if (updated.length === current.length) return;

      const { error } = await supabase
        .from('profiles')
        .update({ blocked_users: updated })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User unblocked');
      invalidateBlockQueries(queryClient);
    },
  });
}

/**
 * Mutual blocked-pair ids: everyone the current user has blocked, plus
 * everyone who has blocked the current user. This is the set every
 * enforcement site (messages, chat feeds, profile views) should filter
 * against — a plain "who I blocked" list isn't mutual.
 */
export function useBlockedUserIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-pair-ids', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc('get_blocked_pair_ids' as any, {
        _user_id: user!.id,
      });
      if (error) throw error;
      return (data as string[]) ?? [];
    },
    staleTime: 30_000,
  });
}

export interface BlockedUserProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

/**
 * Users the current user has explicitly blocked (one-directional — for
 * rendering a "Blocked Users" settings list with an Unblock action).
 */
export function useMyBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users-list', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BlockedUserProfile[]> => {
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('user_id', user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      const blockedIds: string[] = (profile?.blocked_users as string[]) ?? [];
      if (blockedIds.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', blockedIds);
      if (error) throw error;

      return (profiles ?? []) as BlockedUserProfile[];
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
