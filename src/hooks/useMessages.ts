import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect } from 'react';
import { track } from '@/lib/analytics';
import { useBlockedUserIds } from '@/hooks/useBlockAndReport';

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: string;
  body: string;
  is_read: boolean;
  created_at: string;
  _status?: 'sending' | 'sent' | 'failed';
  _clientId?: string;
};

export function useConversations() {
  const { user } = useAuth();
  const { data: blockedIds = [] } = useBlockedUserIds();

  return useQuery({
    queryKey: ['conversations', user?.id, blockedIds.slice().sort().join(',')],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      const blockedSet = new Set(blockedIds);
      return (data ?? []).filter((c) => {
        const other = c.participant_a === user.id ? c.participant_b : c.participant_a;
        return !blockedSet.has(other);
      });
    },
    enabled: !!user,
  });
}

export function useConversationProfiles(conversations: { participant_a: string; participant_b: string }[]) {
  const { user } = useAuth();
  const otherIds = conversations
    .map(c => c.participant_a === user?.id ? c.participant_b : c.participant_a)
    .filter(Boolean);

  return useQuery({
    queryKey: ['conversation-profiles', otherIds.sort().join(',')],
    queryFn: async () => {
      if (!otherIds.length) return {};
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_user_ids: otherIds,
      });
      if (error) throw error;
      const map: Record<string, { display_name: string; profile_photo: string | null; is_season_ticket_holder?: boolean }> = {};
      data?.forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: otherIds.length > 0,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<ChatMessage[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Preserve any in-flight optimistic temps when refetching.
      const current = queryClient.getQueryData<ChatMessage[]>(['messages', conversationId]) ?? [];
      const temps = current.filter(m => m._status === 'sending' || m._status === 'failed');
      const real = (data ?? []) as ChatMessage[];
      const realKeys = new Set(real.map(r => `${r.sender}::${r.body}`));
      const keepTemps = temps.filter(t => !realKeys.has(`${t.sender}::${t.body}`));
      return [...real, ...keepTemps].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    },
    enabled: !!conversationId,
  });

  // Realtime subscription — merge into cache without dropping optimistic temps.
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const row = payload.new as ChatMessage;
        queryClient.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) => {
          if (old.some(m => m.id === row.id)) return old;
          // Dedupe matching optimistic temp (same sender + body).
          const filtered = old.filter(
            m => !(m._status && m.sender === row.sender && m.body === row.body)
          );
          return [...filtered, row].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return query;
}

const SEND_TIMEOUT_MS = 10_000;

export function useSendMessage(conversationId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const performInsert = useCallback(async (clientId: string, body: string) => {
    if (!conversationId || !user) return;

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) =>
        old.map(m =>
          m._clientId === clientId && m._status === 'sending'
            ? { ...m, _status: 'failed' }
            : m
        )
      );
    }, SEND_TIMEOUT_MS);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender: user.id, body })
        .select()
        .single();
      clearTimeout(timeoutId);
      if (timedOut) return; // already marked failed; user will retry
      if (error) throw error;

      qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) => {
        const filtered = old.filter(m => m._clientId !== clientId && m.id !== data.id);
        return [...filtered, { ...(data as ChatMessage), _status: 'sent' as const }].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 100),
      }).eq('id', conversationId);

      track('message_sent', { length: body.length, surface: 'dm' });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch (_err) {
      clearTimeout(timeoutId);
      qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) =>
        old.map(m => (m._clientId === clientId ? { ...m, _status: 'failed' } : m))
      );
    }
  }, [conversationId, user, qc]);

  const send = useCallback((rawBody: string) => {
    const body = rawBody.trim();
    if (!body || !conversationId || !user) return false;
    const clientId = `temp-${(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)}`;
    const temp: ChatMessage = {
      id: clientId,
      conversation_id: conversationId,
      sender: user.id,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
      _status: 'sending',
      _clientId: clientId,
    };
    qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) => [...old, temp]);
    void performInsert(clientId, body);
    return true;
  }, [conversationId, user, qc, performInsert]);

  const retry = useCallback((clientId: string) => {
    if (!conversationId) return;
    const cache = qc.getQueryData<ChatMessage[]>(['messages', conversationId]) ?? [];
    const failed = cache.find(m => m._clientId === clientId);
    if (!failed) return;
    qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old = []) =>
      old.map(m => (m._clientId === clientId ? { ...m, _status: 'sending' } : m))
    );
    void performInsert(clientId, failed.body);
  }, [conversationId, qc, performInsert]);

  return { send, retry };
}

export function useCanChat() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-chat-users', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      // Matched users
      const { data: matches } = await supabase
        .from('matches')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      
      const ids = new Set<string>();
      matches?.forEach(m => {
        ids.add(m.user_a === user.id ? m.user_b : m.user_a);
      });

      // Hi-fives received (optional chat unlock)
      const { data: hiFives } = await supabase
        .from('likes')
        .select('from_user')
        .eq('to_user', user.id)
        .eq('is_hi_five', true);
      
      hiFives?.forEach(h => ids.add(h.from_user));
      return ids;
    },
    enabled: !!user,
  });
}

// ─── Unread message tracking ───
export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender', user.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime: refresh on any new message addressed to the user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-message-count', user.id] });
        queryClient.invalidateQueries({ queryKey: ['unread-by-conversation', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useUnreadByConversation() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread-by-conversation', user?.id],
    queryFn: async () => {
      if (!user) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('is_read', false)
        .neq('sender', user.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((m: { conversation_id: string }) => {
        map[m.conversation_id] = (map[m.conversation_id] ?? 0) + 1;
      });
      return map;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkConversationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-message-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-by-conversation', user?.id] });
    },
  });
}
