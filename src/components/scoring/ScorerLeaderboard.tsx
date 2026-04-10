import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Award } from 'lucide-react';

const TIER_BADGES = [
  { min: 0, label: 'Rookie Scorer', emoji: '🌱', color: 'text-muted-foreground' },
  { min: 5, label: 'Seasoned Scorer', emoji: '⚾', color: 'text-primary' },
  { min: 15, label: 'Pro Scorer', emoji: '🏆', color: 'text-secondary' },
  { min: 30, label: 'MVP Scorer', emoji: '👑', color: 'text-accent' },
  { min: 50, label: 'Hall of Famer', emoji: '🎖️', color: 'text-secondary' },
];

function getBadge(gamesScored: number) {
  return [...TIER_BADGES].reverse().find(t => gamesScored >= t.min) ?? TIER_BADGES[0];
}

export function ScorerLeaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['scorer-leaderboard'],
    queryFn: async () => {
      const { data: stats } = await supabase
        .from('scorer_stats')
        .select('*')
        .order('prediction_points', { ascending: false })
        .limit(20);
      if (!stats || stats.length === 0) return [];
      const userIds = stats.map(s => s.user_id);
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });
      return stats.map(s => ({
        ...s,
        profile: profiles?.find(p => p.user_id === s.user_id),
      }));
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex justify-center">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">The standings are blank</p>
        <p className="text-xs text-muted-foreground mt-1">Score a game and put your name on the board!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Scorer Leaderboard</span>
      </div>
      <div className="divide-y divide-border">
        {leaderboard.map((scorer, i) => {
          const badge = getBadge(scorer.games_scored);
          const accuracy = scorer.total_predictions > 0
            ? Math.round((scorer.correct_predictions / scorer.total_predictions) * 100)
            : 0;
          return (
            <motion.div
              key={scorer.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              {/* Rank */}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i === 0 ? 'bg-secondary/20 text-secondary' :
                i === 1 ? 'bg-muted text-foreground' :
                i === 2 ? 'bg-accent/20 text-accent' :
                'bg-muted/50 text-muted-foreground'
              }`}>
                {i + 1}
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {scorer.profile?.profile_photo ? (
                  <img src={scorer.profile.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {scorer.profile?.display_name?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">{scorer.profile?.display_name ?? 'Fan'}</span>
                  <span className="text-xs" title={badge.label}>{badge.emoji}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Award className="h-2.5 w-2.5" /> {scorer.games_scored} games</span>
                  <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5" /> {accuracy}%</span>
                  {scorer.best_streak > 0 && (
                    <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5" /> {scorer.best_streak}🔥</span>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary">{scorer.prediction_points}</p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
