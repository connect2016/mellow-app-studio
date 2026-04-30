import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ArrivalStatus = 'on_my_way' | 'almost_there' | 'arrived' | 'running_late';

export interface CoordinationRow {
  id: string;
  meetup_id: string;
  user_id: string;
  arrival_status: ArrivalStatus;
  eta_minutes: number | null;
  shared_lat: number | null;
  shared_lng: number | null;
  shared_label: string | null;
  note: string | null;
  updated_at: string;
}

export const ARRIVAL_META: Record<ArrivalStatus, { label: string; emoji: string; color: string }> = {
  on_my_way:     { label: 'On my way',    emoji: '', color: 'hsl(var(--primary))' },
  almost_there:  { label: 'Almost there', emoji: 'timer', color: 'hsl(var(--lineup-teal, 173 80% 40%))' },
  arrived:       { label: 'Arrived',      emoji: '', color: 'hsl(142 71% 45%)' },
  running_late:  { label: 'Running late', emoji: '', color: 'hsl(38 92% 50%)' },
};

export const ETA_CHIPS = [5, 10, 15, 30] as const;

export function useMeetupCoordination(meetupId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['meetup-coordination', meetupId],
    enabled: !!meetupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetup_coordination')
        .select('*')
        .eq('meetup_id', meetupId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CoordinationRow[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!meetupId) return;
    const channel = supabase
      .channel(`meetup-coord-${meetupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetup_coordination', filter: `meetup_id=eq.${meetupId}` },
        () => qc.invalidateQueries({ queryKey: ['meetup-coordination', meetupId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [meetupId, qc]);

  const myRow = query.data?.find(r => r.user_id === user?.id) ?? null;

  const upsert = useMutation({
    mutationFn: async (patch: Partial<Omit<CoordinationRow, 'id' | 'meetup_id' | 'user_id' | 'updated_at'>> & {
      arrival_status?: ArrivalStatus;
    }) => {
      if (!user?.id || !meetupId) throw new Error('Not signed in');
      const payload = {
        meetup_id: meetupId,
        user_id: user.id,
        arrival_status: patch.arrival_status ?? myRow?.arrival_status ?? 'on_my_way',
        eta_minutes: patch.eta_minutes !== undefined ? patch.eta_minutes : myRow?.eta_minutes ?? null,
        shared_lat: patch.shared_lat !== undefined ? patch.shared_lat : myRow?.shared_lat ?? null,
        shared_lng: patch.shared_lng !== undefined ? patch.shared_lng : myRow?.shared_lng ?? null,
        shared_label: patch.shared_label !== undefined ? patch.shared_label : myRow?.shared_label ?? null,
        note: patch.note !== undefined ? patch.note : myRow?.note ?? null,
      };
      const { error } = await supabase
        .from('meetup_coordination')
        .upsert(payload, { onConflict: 'meetup_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetup-coordination', meetupId] }),
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!user?.id || !meetupId) return;
      const { error } = await supabase
        .from('meetup_coordination')
        .delete()
        .eq('meetup_id', meetupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetup-coordination', meetupId] }),
  });

  return {
    rows: query.data ?? [],
    myRow,
    isLoading: query.isLoading,
    upsert,
    clear,
  };
}

// Quick "ping everyone" — drops a system-style message into the meetup chat
export function usePingMeetup(meetupId: string | undefined) {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user?.id || !meetupId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('lineup_messages')
        .insert({ meetup_id: meetupId, sender_id: user.id, body });
      if (error) throw error;
    },
  });
}
