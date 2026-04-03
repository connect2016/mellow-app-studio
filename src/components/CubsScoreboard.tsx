import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function CubsScoreboard() {
  const { user } = useAuth();

  const { data: scoreData } = useQuery({
    queryKey: ['cubs-scoreboard'],
    queryFn: async () => {
      // Check for an active scoring session (most recent live one)
      const { data: session } = await supabase
        .from('scoring_sessions')
        .select('id, home_team, away_team, status, title')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return null;

      // Get scoring entries for this session
      const { data: entries } = await supabase
        .from('scoring_entries')
        .select('inning, half, runs')
        .eq('session_id', session.id)
        .order('inning', { ascending: true });

      // Calculate totals
      let homeRuns = 0;
      let awayRuns = 0;
      let currentInning = 1;
      let currentHalf: 'top' | 'bottom' = 'top';

      entries?.forEach((e) => {
        if (e.half === 'top') awayRuns += e.runs;
        else homeRuns += e.runs;
        if (e.inning > currentInning || (e.inning === currentInning && e.half === 'bottom')) {
          currentInning = e.inning;
          currentHalf = e.half as 'top' | 'bottom';
        }
      });

      return {
        homeTeam: session.home_team || 'Cubs',
        awayTeam: session.away_team || 'Visitor',
        homeRuns,
        awayRuns,
        inning: currentInning,
        half: currentHalf,
        title: session.title,
      };
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  if (!scoreData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-3 text-center"
      >
        <p className="text-xs text-muted-foreground">No live game right now</p>
      </motion.div>
    );
  }

  const inningLabel = `${scoreData.half === 'top' ? '▲' : '▼'} ${scoreData.inning}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/25 bg-card/85 backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <div className="bg-primary/10 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Live
          </span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {scoreData.title}
        </span>
      </div>

      {/* Score */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Away */}
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {scoreData.awayTeam}
            </p>
            <p className="text-2xl font-black text-foreground font-scoreboard">
              {scoreData.awayRuns}
            </p>
          </div>

          {/* Inning */}
          <div className="text-center px-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
              <p className="text-xs font-bold text-primary">
                {inningLabel}
              </p>
            </div>
          </div>

          {/* Home */}
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {scoreData.homeTeam}
            </p>
            <p className="text-2xl font-black text-foreground">
              {scoreData.homeRuns}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
