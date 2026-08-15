import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo } from 'react';
import { useBlockedUserIds } from '@/hooks/useBlockAndReport';

export function useActiveGameForChat() {
  return useQuery({
    queryKey: ['active-game-chat'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .gte('game_end', windowStart)
        .lte('game_start', windowEnd)
        .order('game_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });
}

export function useSectionMessages(gameId: string | undefined, section: string | undefined) {
  const queryClient = useQueryClient();
  const { data: blockedIds = [] } = useBlockedUserIds();
  const blockedSet = useMemo(() => new Set(blockedIds), [blockedIds]);

  const query = useQuery({
    queryKey: ['section-chat', gameId, section, blockedIds.slice().sort().join(',')],
    queryFn: async () => {
      if (!gameId || !section) return [];
      const { data, error } = await supabase
        .from('section_chat_messages')
        .select('*')
        .eq('game_id', gameId)
        .eq('section', section)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data ?? []).filter((m: any) => !blockedSet.has(m.sender_id));
    },
    enabled: !!gameId && !!section,
  });

  // Realtime subscription
  useEffect(() => {
    if (!gameId || !section) return;

    const channel = supabase
      .channel(`section-chat-${gameId}-${section}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'section_chat_messages',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.section === section && !blockedSet.has(newMsg.sender_id)) {
            queryClient.setQueryData(
              ['section-chat', gameId, section, blockedIds.slice().sort().join(',')],
              (old: any[] | undefined) => [...(old ?? []), newMsg]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, section, queryClient, blockedSet, blockedIds]);

  return query;
}

export function useSendSectionMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ gameId, section, body }: { gameId: string; section: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');
      const trimmed = body.trim();
      if (!trimmed || trimmed.length > 500) throw new Error('Invalid message');

      const { error } = await supabase
        .from('section_chat_messages')
        .insert({ game_id: gameId, section, sender_id: user.id, body: trimmed });
      if (error) throw error;
    },
  });
}

export function useSectionMembers(gameId: string | undefined, section: string | undefined) {
  const { data: blockedIds = [] } = useBlockedUserIds();

  return useQuery({
    queryKey: ['section-members', gameId, section, blockedIds.slice().sort().join(',')],
    queryFn: async () => {
      if (!section) return [];
      const blockedSet = new Set(blockedIds);
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_game_status: 'AtWrigley',
        p_limit: 50,
      }).then(r => ({
        data: (r.data ?? []).filter((p: any) => p.wrigley_section === section && !blockedSet.has(p.user_id)),
        error: r.error,
      }));

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!section,
    refetchInterval: 30000,
  });
}
