import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NotifFrequency = 'instant' | 'hourly' | 'daily' | 'off';

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  meetup_freq: NotifFrequency;
  bar_freq: NotifFrequency;
  friend_freq: NotifFrequency;
  gameday_freq: NotifFrequency;
  quiet_hours_enabled: boolean;
  quiet_start: string; // 'HH:MM'
  quiet_end: string;
  timezone: string;
}

const DEFAULTS: NotificationPreferences = {
  meetup_freq: 'instant',
  bar_freq: 'instant',
  friend_freq: 'instant',
  gameday_freq: 'instant',
  quiet_hours_enabled: false,
  quiet_start: '22:00',
  quiet_end: '08:00',
  timezone: 'America/Chicago',
};

function normalizeTime(t: string | null | undefined, fallback: string) {
  if (!t) return fallback;
  // Postgres returns 'HH:MM:SS'; we want 'HH:MM'
  return t.length >= 5 ? t.substring(0, 5) : t;
}

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!user) return DEFAULTS;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULTS;
      return {
        ...DEFAULTS,
        ...data,
        quiet_start: normalizeTime((data as any).quiet_start, DEFAULTS.quiet_start),
        quiet_end: normalizeTime((data as any).quiet_end, DEFAULTS.quiet_end),
      } as NotificationPreferences;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const tz =
        updates.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        'America/Chicago';
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: user.id, timezone: tz, ...updates },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
  });
}
