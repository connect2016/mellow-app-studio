import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NotificationCategory = 'buddies' | 'beers' | 'meetups' | 'vibes' | 'gameday';

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  buddies: true,
  beers: true,
  meetups: true,
  vibes: true,
  gameday: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      const stored = (data?.notification_preferences ?? {}) as Partial<NotificationPreferences>;
      return { ...DEFAULT_PREFERENCES, ...stored };
    },
  });

  const update = useMutation({
    mutationFn: async (next: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not signed in');
      const merged = { ...DEFAULT_PREFERENCES, ...(query.data ?? {}), ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: merged })
        .eq('user_id', user.id);
      if (error) throw error;
      return merged;
    },
    onSuccess: (merged) => {
      queryClient.setQueryData(['notification-preferences', user?.id], merged);
    },
  });

  return {
    preferences: query.data ?? DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
    setPreference: (key: NotificationCategory, value: boolean) =>
      update.mutate({ [key]: value } as Partial<NotificationPreferences>),
    isSaving: update.isPending,
  };
}
