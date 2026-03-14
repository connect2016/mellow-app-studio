import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useDiscoverProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get current user's profile for blocked_users list
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('user_id', user.id)
        .single();

      // Get users this person has already passed
      const { data: passes } = await supabase
        .from('passes')
        .select('passed_user')
        .eq('from_user', user.id);

      const passedIds = passes?.map(p => p.passed_user) ?? [];
      const blockedIds = (myProfile?.blocked_users as string[]) ?? [];
      const excludeIds = [...new Set([...passedIds, ...blockedIds, user.id])];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_banned', false)
        .eq('hidden_from_discover', false)
        .eq('onboarding_completed', true)
        .not('user_id', 'in', `(${excludeIds.join(',')})`);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
