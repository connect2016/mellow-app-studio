import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Users, Beer } from 'lucide-react';

interface BarGroup {
  name: string;
  count: number;
}

export function HappeningNow() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['happening-now'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const [
        { data: wrigleyFans },
        { data: barFans },
        { data: activeMeetups },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, wrigley_section')
          .eq('game_status', 'AtWrigley')
          .eq('is_banned', false)
          .gte('location_last_set_at', sixHoursAgo)
          .limit(20),
        supabase
          .from('profiles')
          .select('user_id, display_name, profile_photo, wrigleyville_bar')
          .eq('game_status', 'AtBar')
          .eq('is_banned', false)
          .gte('location_last_set_at', sixHoursAgo)
          .not('wrigleyville_bar', 'is', null)
          .limit(50),
        supabase
          .from('game_time_matches')
          .select('id, user_a, user_b, meeting_spot, created_at, expires_at')
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Group bar fans by bar
      const barGroups: Record<string, BarGroup> = {};
      barFans?.forEach((f) => {
        const bar = f.wrigleyville_bar as string;
        if (!barGroups[bar]) barGroups[bar] = { name: bar, count: 0 };
        barGroups[bar].count++;
      });
      const sortedBars = Object.values(barGroups).sort((a, b) => b.count - a.count).slice(0, 4);

      return {
        wrigleyCount: wrigleyFans?.length ?? 0,
        wrigleyAvatars: (wrigleyFans ?? []).slice(0, 5),
        bars: sortedBars,
        meetupCount: activeMeetups?.length ?? 0,
      };
    },
    refetchInterval: 20000,
    enabled: !!user,
  });

  if (!data || (data.wrigleyCount === 0 && data.bars.length === 0 && data.meetupCount === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <h3 className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Happening Now
        </h3>
      </div>

      <div className="grid gap-2">
        {/* Fans at Wrigley */}
        {data.wrigleyCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-card border border-border px-3 py-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-lg">
              🏟️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {data.wrigleyCount} fan{data.wrigleyCount !== 1 ? 's' : ''} at Wrigley
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex -space-x-1.5">
                  {data.wrigleyAvatars.map((f, i) => (
                    <div
                      key={f.user_id}
                      className="h-5 w-5 rounded-full border border-background bg-muted overflow-hidden"
                    >
                      {f.profile_photo ? (
                        <img src={f.profile_photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {f.display_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {data.wrigleyCount > 5 && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    +{data.wrigleyCount - 5} more
                  </span>
                )}
              </div>
            </div>
            <MapPin className="h-4 w-4 text-primary/50 shrink-0" />
          </motion.div>
        )}

        {/* Active meetups */}
        {data.meetupCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 rounded-xl bg-card border border-border px-3 py-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/20 text-lg">
              ⚡
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {data.meetupCount} active meetup{data.meetupCount !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-muted-foreground">Game-time matches happening now</p>
            </div>
            <Users className="h-4 w-4 text-secondary/50 shrink-0" />
          </motion.div>
        )}

        {/* Bars with groups */}
        {data.bars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card border border-border px-3 py-2.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Beer className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bars</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.bars.map((bar) => (
                <span
                  key={bar.name}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  🍻 {bar.name}
                  <span className="text-[10px] font-bold text-accent ml-0.5">{bar.count}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
