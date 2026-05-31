import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMyReferralCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_or_create_my_referral_code');
      if (error) throw error;
      return (data as string) ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMyReferralCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc('get_my_referral_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
