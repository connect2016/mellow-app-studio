import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BarCheckin {
  id: string;
  user_id: string;
  bar_name: string;
  visibility: 'visible' | 'incognito';
  checked_in_at: string;
  expires_at: string;
  status?: string;
  custom_message?: string | null;
}

export function useBarCheckins(barName?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checkinsQuery = useQuery({
    queryKey: ['bar-checkins', barName],
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from('bar_checkins')
        .select('*')
        .gt('expires_at', now);

      if (barName) {
        query = query.eq('bar_name', barName);
      }

      const { data, error } = await query.order('checked_in_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BarCheckin[];
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  const myCheckin = useQuery({
    queryKey: ['my-bar-checkin'],
    queryFn: async () => {
      if (!user) return null;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('bar_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', now)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BarCheckin | null;
    },
    enabled: !!user,
  });

  const checkIn = useMutation({
    mutationFn: async ({ barName, visibility, status, customMessage }: { barName: string; visibility: 'visible' | 'incognito'; status?: string; customMessage?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Delete any existing active check-in first
      const now = new Date().toISOString();
      await supabase
        .from('bar_checkins')
        .delete()
        .eq('user_id', user.id)
        .gt('expires_at', now);

      const insertData: any = {
        user_id: user.id,
        bar_name: barName,
        visibility,
      };
      if (status) insertData.status = status;
      if (customMessage) insertData.custom_message = customMessage;

      const { data, error } = await supabase
        .from('bar_checkins')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Award Ivy Leaf for checking in
      await supabase.rpc('award_ivy_leaf', { _source: 'bar_checkin', _amount: 1 });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['my-bar-checkin'] });
      toast.success('Checked in! 🍺 +1 Ivy Leaf earned');
    },
    onError: () => toast.error('Failed to check in'),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('bar_checkins')
        .delete()
        .eq('user_id', user.id)
        .gt('expires_at', now);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['my-bar-checkin'] });
      toast.success('Checked out');
    },
  });

  // Get user profiles for visible checkins
  const visibleCheckins = checkinsQuery.data?.filter(c => c.visibility === 'visible') || [];

  return {
    checkins: checkinsQuery.data || [],
    visibleCheckins,
    myCheckin: myCheckin.data,
    isLoading: checkinsQuery.isLoading,
    checkIn,
    checkOut,
  };
}
