import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const STATUS_DISPLAY: Record<string, { emoji: string; label: string }> = {
  looking_for_buddy: { emoji: '🤝', label: 'Looking for a Buddy' },
  splitting_app: { emoji: '🥨', label: 'Splitting an App' },
  carbing_up: { emoji: '🍺', label: 'Carbing Up' },
  checkin: { emoji: '📍', label: 'Checked in' },
};

interface FeedItem {
  id: string;
  user_id: string;
  bar_name: string;
  status: string;
  custom_message: string | null;
  checked_in_at: string;
  display_name: string;
  profile_photo: string | null;
}

export function BleacherBarometer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visibleItems, setVisibleItems] = useState<FeedItem[]>([]);

  const { data: feedItems } = useQuery({
    queryKey: ['bleacher-barometer-feed'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data: checkins, error } = await supabase
        .from('bar_checkins')
        .select('id, user_id, bar_name, status, custom_message, checked_in_at, visibility')
        .eq('visibility', 'visible')
        .gt('expires_at', now)
        .order('checked_in_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!checkins?.length) return [];

      const userIds = [...new Set(checkins.map(c => c.user_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
        p_limit: 50,
      });

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return checkins.map((c): FeedItem => {
        const profile = profileMap.get(c.user_id);
        return {
          id: c.id,
          user_id: c.user_id,
          bar_name: c.bar_name,
          status: c.status || 'checkin',
          custom_message: c.custom_message,
          checked_in_at: c.checked_in_at,
          display_name: profile?.display_name || 'A fan',
          profile_photo: profile?.profile_photo || null,
        };
      });
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  // Animate in one-by-one
  useEffect(() => {
    if (!feedItems?.length) { setVisibleItems([]); return; }
    setVisibleItems([]);
    const timers: NodeJS.Timeout[] = [];
    feedItems.forEach((item, i) => {
      timers.push(setTimeout(() => setVisibleItems(prev => [...prev, item]), i * 150));
    });
    return () => timers.forEach(clearTimeout);
  }, [feedItems]);

  const activeCount = feedItems?.length || 0;

  const handleJoin = (item: FeedItem) => {
    if (item.user_id === user?.id) return;
    navigate(`/messages?to=${item.user_id}`);
  };

  if (!user) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <h2 className="text-sm font-bold text-foreground tracking-tight">The Bleacher Barometer</h2>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
            <Users className="h-3 w-3" />
            {activeCount} active
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        See what fans are doing around Wrigleyville right now.
      </p>

      {/* CTA Banner */}
      {activeCount === 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-2xl mb-1">🏟️</p>
          <p className="text-xs font-bold text-foreground mb-0.5">Where are you rallying?</p>
          <p className="text-[11px] text-muted-foreground">Check in at a spot above to be the first on the board.</p>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item) => {
            const statusMeta = STATUS_DISPLAY[item.status] || STATUS_DISPLAY.checkin;
            const isMe = item.user_id === user?.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  {/* Top row */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {item.profile_photo ? (
                        <img src={item.profile_photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm">⚾</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">
                        <span className="font-bold">{isMe ? 'You' : item.display_name}</span>
                        {' '}is at{' '}
                        <span className="font-bold text-primary">{item.bar_name}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs">{statusMeta.emoji}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">{statusMeta.label}</span>
                        <span className="text-[10px] text-muted-foreground/60">·</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNowStrict(new Date(item.checked_in_at), { addSuffix: false })} ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custom message */}
                  {item.custom_message && (
                    <p className="text-xs text-foreground/80 bg-muted/50 rounded-lg px-3 py-2 italic">
                      "{item.custom_message}"
                    </p>
                  )}

                  {/* Join CTA */}
                  {!isMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 rounded-xl text-[11px] font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => handleJoin(item)}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Join Them
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Contextual CTAs between items */}
      {activeCount > 0 && activeCount < 5 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-xs font-bold text-foreground">Don't fly solo. Find a Buddy at the bar. 🤝</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Check in above to join the Barometer.</p>
        </div>
      )}
    </section>
  );
}
