import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions, useTotalPoints, useClaimReward, type MissionWithProgress } from '@/hooks/useMissions';
import { Trophy, Star, Zap, Gift, CheckCircle2, Lock, Flame } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  gameday: { label: 'Game Day', emoji: '🏟️' },
  social: { label: 'Social', emoji: '🤝' },
  milestone: { label: 'Milestones', emoji: '🏆' },
};

export default function Missions() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: missions = [], isLoading } = useMissions();
  const { data: totalPoints = 0 } = useTotalPoints();
  const claimReward = useClaimReward();
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleClaim = async (m: MissionWithProgress) => {
    if (!m.progress?.id) return;
    try {
      await claimReward.mutateAsync({
        progressId: m.progress.id,
        missionId: m.id,
        points: m.points,
        badgeKey: m.badge_key,
      });
      setCelebrating(m.id);
      setTimeout(() => setCelebrating(null), 2500);
      toast.success(`+${m.points} points! ${m.badge_key ? '🏅 Badge unlocked!' : ''}`);
    } catch {
      toast.error('Failed to claim reward');
    }
  };

  const categories = ['all', ...Object.keys(CATEGORY_CONFIG)];
  const filtered = filter === 'all' ? missions : missions.filter(m => m.category === filter);

  const completedCount = missions.filter(m => m.progress?.completed).length;
  const claimableCount = missions.filter(m => m.progress?.completed && !m.progress?.reward_claimed).length;

  // Points tier
  const tier = totalPoints >= 500 ? { name: 'Legend', emoji: '🏆', color: 'text-yellow-500' }
    : totalPoints >= 200 ? { name: 'All-Star', emoji: '⭐', color: 'text-primary' }
    : totalPoints >= 50 ? { name: 'Rookie', emoji: '⚾', color: 'text-accent' }
    : { name: 'Newcomer', emoji: '👋', color: 'text-muted-foreground' };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 backdrop-blur-sm"
            onClick={() => setCelebrating(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-7xl mb-4"
              >
                🎖️
              </motion.div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                Mission Complete!
              </h2>
              <p className="text-primary-foreground/80 text-lg">Reward claimed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Points header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 mb-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Points</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                  {totalPoints}
                </span>
                <span className={`text-sm font-semibold ${tier.color}`}>
                  {tier.emoji} {tier.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{missions.length} done
              </div>
              {claimableCount > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary mt-1"
                >
                  <Gift className="h-3 w-3" /> {claimableCount} to claim
                </motion.span>
              )}
            </div>
          </div>

          {/* Points progress bar to next tier */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{tier.name}</span>
              <span>
                {totalPoints >= 500 ? 'Max tier!' : `${totalPoints >= 200 ? 500 - totalPoints : totalPoints >= 50 ? 200 - totalPoints : 50 - totalPoints} pts to next`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{
                  width: `${totalPoints >= 500 ? 100 : totalPoints >= 200
                    ? ((totalPoints - 200) / 300) * 100
                    : totalPoints >= 50
                      ? ((totalPoints - 50) / 150) * 100
                      : (totalPoints / 50) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Category filters */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'all' ? '🎯 All' : `${CATEGORY_CONFIG[cat]?.emoji} ${CATEGORY_CONFIG[cat]?.label}`}
            </button>
          ))}
        </div>

        {/* Missions list */}
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-3xl animate-pulse">🎯</p>
            <p className="mt-2 text-sm text-muted-foreground">Loading missions...</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((m, i) => {
              const progress = m.progress;
              const pct = progress ? Math.min((progress.current_count / m.target_count) * 100, 100) : 0;
              const isComplete = progress?.completed ?? false;
              const isClaimed = progress?.reward_claimed ?? false;
              const canClaim = isComplete && !isClaimed;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl border p-4 transition-all ${
                    canClaim
                      ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                      : isComplete
                        ? 'border-border bg-muted/30'
                        : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji badge */}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl shrink-0 ${
                      isComplete ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {isClaimed ? '✅' : m.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${isClaimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {m.title}
                        </p>
                        {m.is_daily && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                            <Flame className="h-2.5 w-2.5" /> Daily
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{progress?.current_count ?? 0} / {m.target_count}</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5" /> {m.points} pts
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              isComplete
                                ? 'bg-gradient-to-r from-primary to-secondary'
                                : 'bg-primary/60'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                          />
                        </div>
                      </div>

                      {/* Reward info */}
                      {(m.perk_description || m.badge_key) && !isClaimed && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                          {m.badge_key && <span className="flex items-center gap-0.5"><Trophy className="h-3 w-3" /> Badge</span>}
                          {m.perk_description && <span>• {m.perk_description}</span>}
                        </div>
                      )}
                    </div>

                    {/* Claim button */}
                    {canClaim && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Button
                          size="sm"
                          className="rounded-full gap-1 text-xs shrink-0"
                          disabled={claimReward.isPending}
                          onClick={() => handleClaim(m)}
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Claim
                        </Button>
                      </motion.div>
                    )}

                    {isClaimed && (
                      <CheckCircle2 className="h-5 w-5 text-primary/50 shrink-0 mt-1" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
