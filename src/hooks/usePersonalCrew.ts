import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PersonalCrewMember {
  id: string;
  crew_member_user_id: string;
  added_at: string;
  display_name: string;
  profile_photo: string | null;
  fan_tier: string | null;
}

export const PERSONAL_CREW_MAX = 8;

/** All members the current user has added to their personal crew. */
export function usePersonalCrew() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['personal-crew', user?.id],
    queryFn: async (): Promise<PersonalCrewMember[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('personal_crew')
        .select('id, crew_member_user_id, added_at')
        .eq('owner_user_id', user.id)
        .order('added_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) return [];
      const ids = data.map(r => r.crew_member_user_id);
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: ids,
        p_limit: ids.length,
      });
      const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      return data.map(r => {
        const p: any = pMap.get(r.crew_member_user_id) ?? {};
        return {
          id: r.id,
          crew_member_user_id: r.crew_member_user_id,
          added_at: r.added_at,
          display_name: p.display_name ?? 'A fan',
          profile_photo: p.profile_photo ?? null,
          fan_tier: p.fan_tier ?? null,
        };
      });
    },
    enabled: !!user,
  });
}

export function useAddToPersonalCrew() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase.rpc('add_to_personal_crew', { p_member_id: memberId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-crew', user?.id] });
      toast.success('Added to your crew');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not add to crew'),
  });
}

export function useRemoveFromPersonalCrew() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('personal_crew')
        .delete()
        .eq('owner_user_id', user.id)
        .eq('crew_member_user_id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-crew', user?.id] });
      toast.success('Removed from crew');
    },
  });
}

/** Quick set of user ids in the current user's personal crew, for filtering. */
export function usePersonalCrewIds() {
  const { data } = usePersonalCrew();
  return new Set((data ?? []).map(m => m.crew_member_user_id));
}
