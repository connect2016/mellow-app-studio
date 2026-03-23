import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';

export function MessageToastListener() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new as { sender: string; body: string; conversation_id: string };
        if (msg.sender === user.id) return;

        // Check if conversation belongs to this user
        const { data: conv } = await supabase
          .from('conversations')
          .select('participant_a, participant_b')
          .eq('id', msg.conversation_id)
          .single();

        if (!conv || (conv.participant_a !== user.id && conv.participant_b !== user.id)) return;

        // Get sender name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, profile_photo')
          .eq('user_id', msg.sender)
          .single();

        const senderName = profile?.display_name || 'Someone';
        const preview = msg.body.length > 60 ? msg.body.slice(0, 60) + '…' : msg.body;

        toast(
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{preview}</p>
            </div>
          </div>,
          {
            duration: 4000,
            action: {
              label: 'Reply',
              onClick: () => {
                window.location.href = `/messages?chat=${msg.conversation_id}`;
              },
            },
          }
        );

        // Refresh badge counts
        queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return null;
}
