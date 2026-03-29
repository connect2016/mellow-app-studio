import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SafetyTimer {
  id: string;
  user_id: string;
  meetup_id: string | null;
  emergency_contact_phone: string;
  emergency_contact_name: string;
  location_description: string;
  status: string;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
}

export function useActiveSafetyTimer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['safety-timer-active', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('safety_timers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SafetyTimer | null;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useCreateSafetyTimer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      meetupId?: string;
      emergencyPhone: string;
      emergencyName: string;
      locationDescription: string;
      durationMinutes?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const duration = params.durationMinutes ?? 120;
      const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('safety_timers')
        .insert({
          user_id: user.id,
          meetup_id: params.meetupId ?? null,
          emergency_contact_phone: params.emergencyPhone,
          emergency_contact_name: params.emergencyName,
          location_description: params.locationDescription,
          expires_at: expiresAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-timer-active'] });
    },
  });
}

export function useResolveSafetyTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timerId: string) => {
      const { error } = await supabase
        .from('safety_timers')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', timerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-timer-active'] });
    },
  });
}
