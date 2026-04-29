import { motion } from 'framer-motion';
import { useMilestones, type MilestoneWithProgress } from '@/hooks/useMilestones';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

function MilestoneRow({ m }: { m: MilestoneWithProgress }) {
  const earned = m.tierIndex >= 0;
  const tierLabel = earned ? m.tiers[m.tierIndex].label : 'Locked';
  const tierRoman = earned ? ROMAN[m.tierIndex + 1] : '';
  const nextNeeded = m.nextTier ? m.nextTier.count - m.current : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[hsl(222,82%,29%)]/15 bg-card/95 p-3"
    >
      <div className="flex items-center gap-3">
        {/* Pennant medallion */}
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${
            earned
              ? 'border-[hsl(222,82%,29%)]/70 bg-[#F4ECDB]'
              : 'border-dashed border-muted-foreground/30 bg-muted/30'
          }`}
          style={
            earned
              ? {
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 6px)',
                }
              : undefined
          }
        >
          <span className={`text-2xl ${earned ? '' : 'grayscale opacity-40'}`}>{m.emoji}</span>
          {earned && tierRoman && (
            <span
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-[hsl(222,82%,29%)] bg-[hsl(222,82%,29%)] px-1.5 py-0 text-[8px] font-extrabold leading-tight tracking-wider text-[#F4ECDB]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {tierRoman}
            </span>
          )}
          {!earned && (
            <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-foreground truncate">{m.label}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              {tierLabel}
            </span>
          </div>

          {/* Tier progress bar */}
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(222,82%,29%)] to-[hsl(354,75%,42%)]"
                initial={{ width: 0 }}
                animate={{ width: `${m.pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0 tabular-nums">
              {m.current}
              {m.nextTier && `/${m.nextTier.count}`}
            </span>
          </div>

          {m.nextTier && (
            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
              {nextNeeded} more for <span className="font-semibold">{m.nextTier.label}</span>
            </p>
          )}
          {!m.nextTier && earned && (
            <p className="mt-1 text-[10px] font-semibold text-[hsl(222,82%,29%)]">
              <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Max tier reached
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MilestonesSection({ compact = false }: { compact?: boolean }) {
  const { data: milestones = [], isLoading } = useMilestones();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const sorted = [...milestones].sort((a, b) => b.tierIndex - a.tierIndex);
  const list = compact ? sorted.slice(0, 3) : sorted;

  return (
    <div className="space-y-2">
      {list.map((m) => (
        <MilestoneRow key={m.key} m={m} />
      ))}
    </div>
  );
}
