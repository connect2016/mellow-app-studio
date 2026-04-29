import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface ActivityItem {
  id: string;
  text: string;
  emoji: string;
  timestamp: string;
}

const STATUS_LABELS: Record<string, { emoji: string; action: string }> = {
  AtWrigley: { emoji: '', action: 'checked in at Wrigley' },
  AtBar: { emoji: '', action: 'is at a bar in Wrigleyville' },
  Tailgating: { emoji: '', action: 'is tailgating' },
  BeerSnake: { emoji: '', action: 'joined a beer snake' },
  WatchingRemote: { emoji: '', action: 'is watching from home' },
};

export function LiveActivityFeed({ maxItems = 5 }: { maxItems?: number }) {
  const { user } = useAuth();
  const [visibleItems, setVisibleItems] = useState<ActivityItem[]>([]);

  // Recent check-ins (profiles that changed status recently)
  const { data: recentActivity } = useQuery({
    queryKey: ['live-activity-feed'],
    queryFn: async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const [{ data: recentCheckIns }, { data: recentMatches }] = await Promise.all([
        supabase.rpc('get_public_profiles', {
          p_active_since: thirtyMinAgo,
          p_limit: 10,
        }).then(r => ({ data: (r.data ?? []).filter((p: any) => p.game_status !== 'NotSet') })),
        supabase
          .from('game_time_matches')
          .select('id, meeting_spot, created_at')
          .eq('status', 'active')
          .gte('created_at', thirtyMinAgo)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const items: ActivityItem[] = [];

      // Group bar check-ins by bar
      const barCounts: Record<string, { count: number; latest: string }> = {};
      recentCheckIns?.forEach((p) => {
        if (p.game_status === 'AtBar' && p.wrigleyville_bar) {
          const bar = p.wrigleyville_bar as string;
          if (!barCounts[bar]) barCounts[bar] = { count: 0, latest: p.location_last_set_at! };
          barCounts[bar].count++;
        }
      });

      // Individual check-ins (non-bar or unique actions)
      recentCheckIns?.forEach((p) => {
        if (p.user_id === user?.id) return;
        const meta = STATUS_LABELS[p.game_status as string];
        if (!meta) return;

        // Skip bar check-ins — we'll show them grouped
        if (p.game_status === 'AtBar') return;

        items.push({
          id: `checkin-${p.user_id}`,
          text: `${p.display_name} ${meta.action}`,
          emoji: meta.emoji,
          timestamp: p.location_last_set_at!,
        });
      });

      // Bar group items
      Object.entries(barCounts).forEach(([bar, info]) => {
        items.push({
          id: `bar-${bar}`,
          text: info.count === 1
            ? `A fan just arrived at ${bar}`
            : `${info.count} fans are at ${bar}`,
          emoji: '',
          timestamp: info.latest,
        });
      });

      // Meetup items
      recentMatches?.forEach((m) => {
        items.push({
          id: `meetup-${m.id}`,
          text: `New meetup at ${m.meeting_spot}`,
          emoji: '',
          timestamp: m.created_at,
        });
      });

      // Sort by recency
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return items.slice(0, maxItems);
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  // Animate items in one-by-one
  useEffect(() => {
    if (!recentActivity?.length) {
      setVisibleItems([]);
      return;
    }
    setVisibleItems([]);
    const timers: NodeJS.Timeout[] = [];
    recentActivity.forEach((item, i) => {
      timers.push(setTimeout(() => {
        setVisibleItems((prev) => [...prev, item]);
      }, i * 200));
    });
    return () => timers.forEach(clearTimeout);
  }, [recentActivity]);

  if (!visibleItems.length) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Live Activity</span>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -12, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 12, height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 py-1.5">
              <span className="text-base shrink-0"><ConceptIcon name={item.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
              <p className="text-xs text-foreground flex-1 min-w-0 truncate">
                {item.text}
              </p>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                {formatDistanceToNowStrict(new Date(item.timestamp), { addSuffix: false })} ago
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
