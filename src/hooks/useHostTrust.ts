import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HostTrust {
  hosted_count: number;
  recent_reports: number;
  is_verified: boolean;
  is_trusted: boolean;
  is_first_time: boolean;
}

export function useHostTrust(hostId: string | undefined) {
  return useQuery({
    queryKey: ['host-trust', hostId],
    enabled: !!hostId,
    queryFn: async (): Promise<HostTrust | null> => {
      const { data, error } = await supabase.rpc('get_host_trust', { _host_id: hostId! });
      if (error) throw error;
      return (data?.[0] as HostTrust) ?? null;
    },
  });
}
