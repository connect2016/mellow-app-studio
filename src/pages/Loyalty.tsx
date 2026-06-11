import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BADGE_DEFINITIONS,
  useMyPennants,
  useBadgeProgress,
  useIncrementBadge,
  BadgeDefinition,
} from '@/hooks/usePennants';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

function BadgeCard({
  badge,
  currentCount,
  unlocked,
}: {
  badge: BadgeDefinition;
  currentCount: number;
  unlocked: boolean;
}) {
  const pct = Math.min((currentCount / badge.target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <Card
        className={`relative overflow-hidden border p-4 transition-all ${
          unlocked
            ? 'border-accent/40 bg-accent/5 shadow-sm'
            : 'border-border/60 bg-card'
        }`}
      >
        {unlocked && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
        )}

        <div className="flex items-start gap-3.5">
          {/* Badge icon */}
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
              unlocked
                ? 'bg-accent/15'
                : 'bg-muted'
            }`}
          >
            <ConceptVisual name={badge.emoji} size="sm" />
            {unlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
              >
                <Sparkles className="h-3 w-3" />
              </motion.div>
            )}
            {!unlocked && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${unlocked ? 'text-foreground' : 'text-foreground/80'}`}>
                {badge.name}
              </h3>
              {unlocked && (
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Earned</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {badge.description}
            </p>

            {/* Progress */}
            <div className="mt-2.5 flex items-center gap-2.5">
              <Progress
                value={pct}
                className="h-2 flex-1"
              />
              <span className="text-[11px] font-mono font-semibold text-muted-foreground whitespace-nowrap">
                {Math.min(currentCount, badge.target)}/{badge.target}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Loyalty() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: pennants = [] } = useMyPennants();
  const { data: liveProgress = {} } = useBadgeProgress();
  const incrementBadge = useIncrementBadge();
  const [celebration, setCelebration] = useState<BadgeDefinition | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Sync live progress into pennant rows (auto-bootstrap)
  useEffect(() => {
    if (!user || Object.keys(liveProgress).length === 0) return;

    const syncBadges = async () => {
      for (const [key, count] of Object.entries(liveProgress)) {
        const existing = pennants.find(p => p.badge_key === key);
        if (!existing && count > 0) {
          // Need to initialize — use increment which handles upsert
          const def = BADGE_DEFINITIONS.find(b => b.key === key);
          if (def) {
            // We'll use the raw supabase call to set the correct count directly
            const { supabase } = await import('@/integrations/supabase/client');
            const unlocked = count >= def.target;
            await supabase
              .from('user_pennants')
              .upsert(
                {
                  user_id: user.id,
                  badge_key: key,
                  current_count: Math.min(count, def.target),
                  target_count: def.target,
                  unlocked,
                  unlocked_at: unlocked ? new Date().toISOString() : null,
                },
                { onConflict: 'user_id,badge_key' }
              );
          }
        } else if (existing && !existing.unlocked && count > existing.current_count) {
          const def = BADGE_DEFINITIONS.find(b => b.key === key);
          if (def) {
            const newCount = Math.min(count, def.target);
            const unlocked = newCount >= def.target;
            const { supabase } = await import('@/integrations/supabase/client');
            await supabase
              .from('user_pennants')
              .update({
                current_count: newCount,
                unlocked,
                unlocked_at: unlocked ? new Date().toISOString() : null,
              })
              .eq('id', existing.id);

            if (unlocked && !existing.unlocked) {
              setCelebration(def);
            }
          }
        }
      }
    };

    syncBadges();
  }, [user, liveProgress, pennants]);

  const getCount = (key: string) => {
    const pennant = pennants.find(p => p.badge_key === key);
    const live = liveProgress[key] ?? 0;
    return Math.max(pennant?.current_count ?? 0, live);
  };

  const isUnlocked = (key: string) => {
    const pennant = pennants.find(p => p.badge_key === key);
    return pennant?.unlocked ?? false;
  };

  const unlockedCount = BADGE_DEFINITIONS.filter(b => isUnlocked(b.key)).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setCelebration(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-card rounded-3xl p-8 mx-6 text-center max-w-sm shadow-lg border border-accent/30"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-6xl mb-4"
              >
                <ConceptVisual name={celebration.emoji} size="sm" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Pennant Unlocked! 
              </h2>
              <p className="text-lg font-semibold text-accent mb-1">{celebration.name}</p>
              <p className="text-sm text-muted-foreground mb-5">{celebration.description}</p>
              <button
                onClick={() => setCelebration(null)}
                className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
              >
                Awesome!
              </button>

              {/* Sparkle particles */}
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 6 + Math.random() * 8,
                    height: 6 + Math.random() * 8,
                    backgroundColor: i % 2 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    y: [0, -60 - Math.random() * 60],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 0.8,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-lg px-4 pt-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Fan Loyalty
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Earn Pennant badges by being an active Cubs fan
          </p>
        </div>

        {/* Stats summary */}
        <Card className="p-4 mb-6 border-border/60">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unlockedCount}</p>
              <p className="text-xs text-muted-foreground">
                of {BADGE_DEFINITIONS.length} Pennants earned
              </p>
            </div>
            <div className="ml-auto">
              <Progress
                value={(unlockedCount / BADGE_DEFINITIONS.length) * 100}
                className="h-2.5 w-24"
              />
            </div>
          </div>
        </Card>

        {/* Badge grid */}
        <div className="space-y-3">
          {/* Unlocked first */}
          {BADGE_DEFINITIONS
            .sort((a, b) => {
              const aUnlocked = isUnlocked(a.key) ? 1 : 0;
              const bUnlocked = isUnlocked(b.key) ? 1 : 0;
              if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;
              // Then by progress %
              const aPct = getCount(a.key) / a.target;
              const bPct = getCount(b.key) / b.target;
              return bPct - aPct;
            })
            .map((badge, i) => (
              <motion.div
                key={badge.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BadgeCard
                  badge={badge}
                  currentCount={getCount(badge.key)}
                  unlocked={isUnlocked(badge.key)}
                />
              </motion.div>
            ))}
        </div>
      </main>
    </div>
  );
}
