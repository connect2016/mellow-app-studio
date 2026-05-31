import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
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
      const map: Record<string, { display_name: string; profile_photo: string | null }> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: otherIds.length > 0,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: user.id,
        body,
      });
      if (error) throw error;

      // Update conversation preview
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 100),
      }).eq('id', conversationId);
    },
    onSuccess: (_, vars) => {
      track('message_sent', { length: vars.body.length, surface: 'dm' });
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
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
