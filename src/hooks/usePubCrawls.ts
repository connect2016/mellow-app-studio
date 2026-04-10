import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PubCrawl {
  id: string;
  creator_id: string;
  title: string;
  start_bar: string;
  start_time: string;
  status: 'planning' | 'live' | 'completed';
  invite_code: string | null;
  is_public: boolean;
  created_at: string;
}

export interface PubCrawlStop {
  id: string;
  crawl_id: string;
  bar_name: string;
  stop_order: number;
  arrived_at: string | null;
}

export interface PubCrawlMember {
  id: string;
  crawl_id: string;
  user_id: string;
  joined_at: string;
}

export function usePubCrawls() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const crawlsQuery = useQuery({
    queryKey: ['pub-crawls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pub_crawls')
        .select('*')
        .in('status', ['planning', 'live'])
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []) as PubCrawl[];
    },
    refetchInterval: 20000,
    enabled: !!user,
  });

  const stopsQuery = useQuery({
    queryKey: ['pub-crawl-stops'],
    queryFn: async () => {
      const crawlIds = crawlsQuery.data?.map(c => c.id) || [];
      if (!crawlIds.length) return [];
      const { data, error } = await supabase
        .from('pub_crawl_stops')
        .select('*')
        .in('crawl_id', crawlIds)
        .order('stop_order', { ascending: true });
      if (error) throw error;
      return (data || []) as PubCrawlStop[];
    },
    enabled: !!crawlsQuery.data?.length,
  });

  const membersQuery = useQuery({
    queryKey: ['pub-crawl-members'],
    queryFn: async () => {
      const crawlIds = crawlsQuery.data?.map(c => c.id) || [];
      if (!crawlIds.length) return [];
      const { data, error } = await supabase
        .from('pub_crawl_members')
        .select('*')
        .in('crawl_id', crawlIds);
      if (error) throw error;
      return (data || []) as PubCrawlMember[];
    },
    enabled: !!crawlsQuery.data?.length,
    refetchInterval: 15000,
  });

  const createCrawl = useMutation({
    mutationFn: async (params: { title: string; start_bar: string; start_time: string; stops: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: crawl, error } = await supabase
        .from('pub_crawls')
        .insert({
          creator_id: user.id,
          title: params.title,
          start_bar: params.start_bar,
          start_time: params.start_time,
        })
        .select()
        .single();
      if (error) throw error;

      // Add stops
      const stopInserts = params.stops.map((bar, i) => ({
        crawl_id: crawl.id,
        bar_name: bar,
        stop_order: i + 1,
      }));
      if (stopInserts.length) {
        await supabase.from('pub_crawl_stops').insert(stopInserts);
      }

      // Auto-join creator
      await supabase.from('pub_crawl_members').insert({
        crawl_id: crawl.id,
        user_id: user.id,
      });

      return crawl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pub-crawls'] });
      toast.success('Pub crawl created! 🍻');
    },
    onError: () => toast.error('Failed to create pub crawl'),
  });

  const joinCrawl = useMutation({
    mutationFn: async (crawlId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('pub_crawl_members')
        .insert({ crawl_id: crawlId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pub-crawl-members'] });
      toast.success('Joined the crawl! 🎉');
    },
    onError: () => toast.error('Failed to join'),
  });

  const leaveCrawl = useMutation({
    mutationFn: async (crawlId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('pub_crawl_members')
        .delete()
        .eq('crawl_id', crawlId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pub-crawl-members'] });
      toast.success('Left the crawl');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ crawlId, status }: { crawlId: string; status: string }) => {
      const { error } = await supabase
        .from('pub_crawls')
        .update({ status })
        .eq('id', crawlId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pub-crawls'] }),
  });

  const getStopsForCrawl = (crawlId: string) =>
    (stopsQuery.data || []).filter(s => s.crawl_id === crawlId);

  const getMembersForCrawl = (crawlId: string) =>
    (membersQuery.data || []).filter(m => m.crawl_id === crawlId);

  const isUserInCrawl = (crawlId: string) =>
    (membersQuery.data || []).some(m => m.crawl_id === crawlId && m.user_id === user?.id);

  return {
    crawls: crawlsQuery.data || [],
    isLoading: crawlsQuery.isLoading,
    getStopsForCrawl,
    getMembersForCrawl,
    isUserInCrawl,
    createCrawl,
    joinCrawl,
    leaveCrawl,
    updateStatus,
  };
}
