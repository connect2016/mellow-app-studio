import { useBarVotes, VIBE_LABELS, WAIT_LABELS, type BarVoteSummary } from '@/hooks/useBarVotes';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { WRIGLEYVILLE_BARS } from '@/types';

export function TrendingNow() {
  const { getSummary } = useBarVotes();

  // Score bars by rowdy/packed votes
  const scored = WRIGLEYVILLE_BARS.map((bar) => {
    const summary = getSummary(bar.name);
    let score = 0;
    if (summary.topVibe === 'rowdy') score += 3;
    if (summary.topVibe === 'packed') score += 2;
    score += summary.totalVotes;
    return { name: bar.name, summary, score };
  })
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">
          Trending Now
        </h2>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      </div>

      <div className="grid gap-2">
        {scored.map((bar, i) => (
          <motion.div
            key={bar.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-lg font-bold text-primary">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {bar.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {bar.summary.topWait && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ConceptIcon name="timer" className="h-2.5 w-2.5" /> {WAIT_LABELS[bar.summary.topWait]}
                  </span>
                )}
                {bar.summary.topVibe && (
                  <span className="text-[10px] text-muted-foreground">
                    {VIBE_LABELS[bar.summary.topVibe]}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {bar.summary.totalVotes}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
