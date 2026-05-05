import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { geocodeZip } from '@/lib/geocode';
import { toast } from 'sonner';

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

      // Best-effort: when zip_code changes, forward-geocode and persist a
      // PostGIS point so proximity discovery (nearby_fans) works. Failures
      // never block the profile save.
      if (typeof updates.zip_code === 'string' && /^\d{5}$/.test(updates.zip_code)) {
        try {
          const point = await geocodeZip(updates.zip_code);
          if (point) {
            await supabase.rpc('set_profile_location', {
              p_lat: point.lat,
              p_lng: point.lng,
            });
          }
        } catch (e) {
          console.warn('Forward-geocode failed:', e);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated!', { id: 'profile-update' });
    },
    onError: (err) => {
      console.error('Profile update failed:', err);
      toast.error('Could not save profile — try again', { id: 'profile-update-error' });
    },
  });
}


export function useDiscoverProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get current user's profile for blocked_users list (owner-only RLS)
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

      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_exclude_ids: excludeIds,
        p_only_onboarded: true,
        p_limit: 200,
      });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
