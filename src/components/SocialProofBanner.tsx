import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, TrendingUp, Users, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface PopularFan {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  like_count: number;
}

interface TrendingMeetup {
  bar: string;
  count: number;
}

export function SocialProofBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['social-proof'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [
        { data: activeProfiles },
        { data: activeMeetups },
        { data: crewEvents },
        { data: recentLikes },
      ] = await Promise.all([
        // Total active fans
        supabase.rpc('get_public_profiles', {
          p_only_onboarded: true,
          p_active_since: sixHoursAgo,
          p_limit: 200,
        }),
        // Active game-time matches
        supabase
          .from('game_time_matches')
          .select('id, meeting_spot')
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString()),
        // Recent crew events (last 24h)
        supabase
          .from('crew_events')
          .select('id, title, status')
          .gte('created_at', oneDayAgo)
          .eq('status', 'voting')
          .limit(20),
        // Most liked fans (popular users)
        supabase
          .from('likes')
          .select('to_user')
          .gte('created_at', oneDayAgo)
          .eq('is_hi_five', false),
      ]);

      const totalActive = activeProfiles?.length ?? 0;
      const meetupCount = (activeMeetups?.length ?? 0) + (crewEvents?.length ?? 0);

      // Find trending bar/meetup spot
      const barCounts: Record<string, number> = {};
      activeProfiles?.forEach((p) => {
        if (p.game_status === 'AtBar' && p.wrigleyville_bar) {
          const bar = p.wrigleyville_bar as string;
          barCounts[bar] = (barCounts[bar] || 0) + 1;
        }
      });
      const trending: TrendingMeetup | null = Object.entries(barCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([bar, count]) => ({ bar, count }))[0] ?? null;

      // Find popular fans by like count
      const likeCounts: Record<string, number> = {};
      recentLikes?.forEach((l) => {
        likeCounts[l.to_user] = (likeCounts[l.to_user] || 0) + 1;
      });
      const topUserIds = Object.entries(likeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);

      let popularFans: PopularFan[] = [];
      if (topUserIds.length > 0) {
        const { data: topProfiles } = await supabase.rpc('get_public_profiles', {
          p_user_ids: topUserIds,
        });
        popularFans = (topProfiles ?? []).map((p) => ({
          ...p,
          like_count: likeCounts[p.user_id] ?? 0,
        })).sort((a, b) => b.like_count - a.like_count);
      }

      return { totalActive, meetupCount, trending, popularFans };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  if (!data || data.totalActive === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Main stats ticker */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {/* Active fans */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-bold text-foreground whitespace-nowrap">
            {data.totalActive} fans active
          </span>
          <Flame className="h-3.5 w-3.5 text-secondary shrink-0" />
        </motion.div>

        {/* Meetups happening */}
        {data.meetupCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 shrink-0 rounded-full border border-secondary/20 bg-secondary/5 px-3.5 py-2"
          >
            <Zap className="h-3.5 w-3.5 text-secondary shrink-0" />
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {data.meetupCount} meetup{data.meetupCount !== 1 ? 's' : ''} happening
            </span>
          </motion.div>
        )}

        {/* Trending spot */}
        {data.trending && data.trending.count >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 shrink-0 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-2"
          >
            <TrendingUp className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {data.trending.count} at {data.trending.bar}
            </span>
          </motion.div>
        )}
      </div>

      {/* Popular fans row */}
      {data.popularFans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
        >
          <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Popular today</span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {data.popularFans.map((fan, i) => (
              <motion.button
                key={fan.user_id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                onClick={() => navigate(`/profile/${fan.user_id}`)}
                className="flex items-center gap-1.5 shrink-0 rounded-full bg-muted/60 border border-border px-2 py-1 hover:bg-muted transition-colors"
              >
                <div className="h-5 w-5 rounded-full overflow-hidden bg-muted border border-background ring-1 ring-yellow-400/40">
                  {fan.profile_photo ? (
                    <img src={fan.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {fan.display_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-foreground whitespace-nowrap max-w-[72px] truncate">
                  {fan.display_name}
                </span>
                <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400">
                  <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />{fan.like_count}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
