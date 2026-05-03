import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNowStrict, differenceInMinutes } from 'date-fns';
import { MessageSquare, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

const STATUS_DISPLAY: Record<string, { emoji: string; label: string }> = {
  looking_for_buddy: { emoji: '', label: 'Looking for a Buddy' },
  splitting_app: { emoji: '', label: 'Appetizer Wingman' },
  carbing_up: { emoji: '', label: 'Carb Load' },
  victory_round: { emoji: '', label: 'Victory Round' },
  checkin: { emoji: '', label: 'Checked in' },
};

/** Returns today's 4:00 AM CST cutoff. If it's before 4 AM, use yesterday's. */
function getTodayCutoff(): string {
  const now = new Date();
  // Build "today 10:00 UTC" which is 4:00 AM CST (UTC-6)
  const cutoff = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0,
  ));
  // If we haven't passed today's cutoff yet, use yesterday's
  if (now < cutoff) cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  return cutoff.toISOString();
}

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
  const queryClient = useQueryClient();
  const [visibleItems, setVisibleItems] = useState<FeedItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['bleacher-barometer-feed'] });
    // Brief visual delay so user sees the spin
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  // Touch-based pull-to-refresh
  const [touchStart, setTouchStart] = useState(0);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStart;
    if (delta > 80) handleRefresh();
  };

  const { data: feedItems } = useQuery({
    queryKey: ['bleacher-barometer-feed'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const cutoff = getTodayCutoff();
      // Use the later of: 12h ago or today's 4 AM CST
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const effectiveCutoff = cutoff > twelveHoursAgo ? cutoff : twelveHoursAgo;

      const { data: checkins, error } = await supabase
        .from('bar_checkins')
        .select('id, user_id, bar_name, status, custom_message, checked_in_at, visibility')
        .eq('visibility', 'visible')
        .gt('expires_at', now)
        .gt('checked_in_at', effectiveCutoff)
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

  const isLive = (checkedInAt: string) => differenceInMinutes(new Date(), new Date(checkedInAt)) < 60;

  if (!user) return null;

  return (
    <section
      className="space-y-3"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[hsl(142,71%,45%)]" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(142,71%,45%)]" />
          </span>
          <h2 className="text-sm font-bold text-foreground tracking-tight">The Bleacher Barometer</h2>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              <Users className="h-3 w-3" />
              {activeCount} active
            </div>
          )}
          <IconButton
            onClick={handleRefresh}
            aria-label="Refresh feed"
            className="rounded-full hover:bg-muted/60"
            icon={<RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        See what fans are doing around Wrigleyville right now. Resets every morning at 4 AM.
      </p>

      {/* Pull indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 32, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            <span className="text-[11px] text-muted-foreground ml-1.5">Updating…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Banner */}
      {activeCount === 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-2xl mb-1"></p>
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
            const live = isLive(item.checked_in_at);

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
                    <div className="relative h-8 w-8 shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {item.profile_photo ? (
                          <img src={item.profile_photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm"></span>
                        )}
                      </div>
                      {live && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[hsl(142,71%,45%)]" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[hsl(142,71%,45%)] border-2 border-card" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-foreground leading-snug truncate">
                          <span className="font-bold">{isMe ? 'You' : item.display_name}</span>
                          {' '}at{' '}
                          <span className="font-bold text-primary">{item.bar_name}</span>
                        </p>
                        {live && (
                          <Badge variant="outline" className="shrink-0 h-4 px-1.5 text-[9px] font-bold border-[hsl(142,71%,45%)]/40 text-[hsl(142,71%,45%)] bg-[hsl(142,71%,45%)]/10">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs"><ConceptVisual name={statusMeta.emoji} size="sm" /></span>
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

      {/* Contextual CTAs */}
      {activeCount > 0 && activeCount < 5 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-xs font-bold text-foreground">Don't fly solo. Find a Buddy at the bar. </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Check in above to join the Barometer.</p>
        </div>
      )}
    </section>
  );
}
