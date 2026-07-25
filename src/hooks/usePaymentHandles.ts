import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentHandles {
  venmo_handle: string | null;
  cashapp_cashtag: string | null;
  paypal_handle: string | null;
}

/** Fetches a fan's P2P payment handles. Requires an authenticated viewer — the
 * underlying RPC is revoked from anon. */
export function usePaymentHandles(userId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-handles', userId],
    queryFn: async (): Promise<PaymentHandles | null> => {
      const { data, error } = await supabase.rpc('get_payment_handles', { p_user_id: userId! });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!userId && !!user,
    staleTime: 60_000,
  });
}
