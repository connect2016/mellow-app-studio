import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';

interface VentPost {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name?: string;
}

export function VentingRoom() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Use vibe_posts with a special location_tag for vents
  const { data: vents = [] } = useQuery({
    queryKey: ['venting-room'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vibe_posts')
        .select('id, user_id, caption, created_at')
        .eq('location_tag', 'venting-room')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map(v => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.display_name]));

      return data.map(v => ({
        id: v.id,
        user_id: v.user_id,
        body: v.caption ?? '',
        created_at: v.created_at,
        display_name: profileMap[v.user_id] ?? 'Anonymous Fan',
      }));
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  const postVent = useMutation({
    mutationFn: async (body: string) => {
      if (!user) return;
      const { error } = await supabase.from('vibe_posts').insert({
        user_id: user.id,
        caption: body,
        location_tag: 'venting-room',
        media_url: 'vent',
        media_type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venting-room'] });
      setMessage('');
    },
  });

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  return (
    <div className="rounded-2xl border border-destructive/30 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-destructive/10 hover:bg-destructive/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Tough Ninth? Leave it all here.</p>
            <p className="text-[10px] text-muted-foreground">A safe place to vent. No judgement.</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Dark high-contrast feed */}
            <div className="bg-[hsl(0,0%,8%)] p-3 space-y-2 max-h-64 overflow-y-auto">
              {vents.length === 0 ? (
                <p className="text-xs text-[hsl(0,0%,45%)] text-center py-6">
                  The pen is empty. Be the first to sound off.
                </p>
              ) : (
                vents.map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg bg-[hsl(0,0%,13%)] border border-[hsl(0,0%,18%)] px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold text-destructive/80">
                        {v.user_id === user?.id ? 'You' : v.display_name}
                      </span>
                      <span className="text-[9px] text-[hsl(0,0%,40%)]">{timeAgo(v.created_at)}</span>
                    </div>
                    <p className="text-xs text-[hsl(0,0%,80%)] leading-relaxed">{v.body}</p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            {user && (
              <div className="flex gap-2 p-3 bg-[hsl(0,0%,10%)] border-t border-[hsl(0,0%,15%)]">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && message.trim() && postVent.mutate(message.trim())}
                  placeholder="Let it out..."
                  className="flex-1 h-9 rounded-lg bg-[hsl(0,0%,15%)] border border-[hsl(0,0%,22%)] px-3 text-xs text-[hsl(0,0%,85%)] placeholder:text-[hsl(0,0%,35%)] focus:outline-none focus:ring-1 focus:ring-destructive/50"
                />
                <button
                  onClick={() => message.trim() && postVent.mutate(message.trim())}
                  disabled={!message.trim()}
                  className="h-9 w-9 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center disabled:opacity-30 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
