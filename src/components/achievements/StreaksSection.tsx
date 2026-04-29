import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStreaks, type StreakData } from '@/hooks/useStreaks';
import { Skeleton } from '@/components/ui/skeleton';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  /** Show only the strongest streak as a compact card */
  compact?: boolean;
}

function formatExpiry(ms: number | null, unit: 'days' | 'weeks' | 'games') {
  if (ms == null) return null;
  const hrs = Math.max(0, Math.floor(ms / 3_600_000));
  if (hrs < 24) return `${hrs}h to keep it`;
  const days = Math.floor(hrs / 24);
  if (unit === 'weeks') return `${days}d to keep it`;
  return `${days}d to keep it`;
}

function StreakPennant({ streak, featured = false }: { streak: StreakData; featured?: boolean }) {
  const isHot = streak.current >= 3;
  const expiry = formatExpiry(streak.expiresInMs, streak.unit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${
        featured ? 'col-span-2' : ''
      }`}
    >
      {/* Pennant — felt cream w/ navy stitched border, triangular flag tail */}
      <div
        className="relative rounded-l-2xl border-2 border-r-0 border-[hsl(222,82%,29%)]/80 bg-[#F4ECDB] px-4 py-3"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.025) 0 2px, transparent 2px 6px)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="text-2xl leading-none">{streak.emoji}</div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(222,82%,29%)]/70 truncate"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {streak.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-extrabold leading-none text-[hsl(222,82%,29%)]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {streak.current}
              </span>
              <span className="text-[10px] font-semibold text-[hsl(222,82%,29%)]/60">
                {streak.unit}
              </span>
              {isHot && <Flame className="h-3 w-3 text-orange-600" />}
            </div>
          </div>
        </div>
        {featured && (
          <p className="mt-1 text-[10px] text-[hsl(222,82%,29%)]/60 line-clamp-1">
            Best: {streak.best} {streak.unit}
            {expiry && ` • ${expiry}`}
          </p>
        )}
      </div>
      {/* Triangular tail */}
      <div
        className="absolute right-0 top-0 h-full w-3"
        style={{
          background:
            'linear-gradient(to right, #F4ECDB 0%, #F4ECDB 50%, transparent 50%)',
          clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
          borderTop: '2px solid hsl(222 82% 29% / 0.8)',
          borderRight: '2px solid hsl(222 82% 29% / 0.8)',
          borderBottom: '2px solid hsl(222 82% 29% / 0.8)',
        }}
      />
    </motion.div>
  );
}

export function StreaksSection({ compact = false }: Props) {
  const { data: streaks = [], isLoading } = useStreaks();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const active = streaks.filter((s) => s.current > 0);
  if (compact) {
    const top = active.sort((a, b) => b.current - a.current)[0] ?? streaks[0];
    if (!top) return null;
    return (
      <div className="grid grid-cols-1 gap-3">
        <StreakPennant streak={top} featured />
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[hsl(222,82%,29%)]/30 bg-[#F4ECDB]/40 p-4 text-center">
        <p className="text-2xl mb-1"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></p>
        <p
          className="text-sm font-semibold text-[hsl(222,82%,29%)]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Start your first streak
        </p>
        <p className="text-xs text-[hsl(222,82%,29%)]/60 mt-0.5">
          Check in at the ballpark, a bar, or join a meetup
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 pr-3">
      {streaks.map((s) => (
        <StreakPennant key={s.key} streak={s} />
      ))}
    </div>
  );
}
