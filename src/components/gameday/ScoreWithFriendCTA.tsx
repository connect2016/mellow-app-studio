import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardEdit, Sparkles } from 'lucide-react';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

export function ScoreWithFriendCTA() {
  const { data: game } = useMlbCubsGame();
  const isLive = game?.status === 'live';
  const isPre = game?.status === 'scheduled' || game?.status === 'pre-game';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent"
    >
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <ClipboardEdit className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-sm font-bold text-foreground">
              Score the game with a friend
            </h3>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            {isLive
              ? 'Game is on. Open a co-op scorecard, predict plays, and rack up points.'
              : isPre
              ? 'Spin up a scorecard before first pitch — invite a friend with a code.'
              : 'Set up a scorecard for the next game and pull friends into the booth.'}
          </p>
          <Link
            to="/score"
            className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            <Sparkles className="h-3 w-3" /> Open Scorecard
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
