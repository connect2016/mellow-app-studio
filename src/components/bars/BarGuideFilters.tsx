import { motion } from 'framer-motion';
import { VIBE_LABELS, GROUP_LABELS, TIMING_LABELS, DISTANCE_BUCKETS, type BarVibe, type BarGroupFit, type BarGameTiming, type DistanceBucket } from '@/lib/wrigleyville-bar-guide';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  vibes: BarVibe[];
  groups: BarGroupFit[];
  timings: BarGameTiming[];
  distance: DistanceBucket;
  onToggleVibe: (v: BarVibe) => void;
  onToggleGroup: (g: BarGroupFit) => void;
  onToggleTiming: (t: BarGameTiming) => void;
  onSetDistance: (d: DistanceBucket) => void;
  onClear: () => void;
  totalShown: number;
  totalAll: number;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-foreground text-background shadow-sm'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </motion.button>
  );
}

export function BarGuideFilters({
  vibes, groups, timings, distance,
  onToggleVibe, onToggleGroup, onToggleTiming, onSetDistance,
  onClear, totalShown, totalAll,
}: Props) {
  const hasFilters = vibes.length || groups.length || timings.length || distance !== 'all';

  return (
    <div className="space-y-2.5 px-4 py-3 bg-muted/40 border-y border-border">
      {/* Vibe */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase w-14 shrink-0">Vibe</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(VIBE_LABELS) as BarVibe[]).map((v) => (
            <Chip key={v} active={vibes.includes(v)} onClick={() => onToggleVibe(v)}>
              <span><ConceptIcon name={VIBE_LABELS[v].emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span> {VIBE_LABELS[v].label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase w-14 shrink-0">Walk</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {DISTANCE_BUCKETS.map((d) => (
            <Chip key={d.key} active={distance === d.key} onClick={() => onSetDistance(d.key)}>
               {d.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Group */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase w-14 shrink-0">Group</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(GROUP_LABELS) as BarGroupFit[]).map((g) => (
            <Chip key={g} active={groups.includes(g)} onClick={() => onToggleGroup(g)}>
              <span><ConceptIcon name={GROUP_LABELS[g].emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span> {GROUP_LABELS[g].label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase w-14 shrink-0">Time</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(TIMING_LABELS) as BarGameTiming[]).map((t) => (
            <Chip key={t} active={timings.includes(t)} onClick={() => onToggleTiming(t)}>
              <span><ConceptIcon name={TIMING_LABELS[t].emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span> {TIMING_LABELS[t].label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Footer count */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{totalShown}</span> of {totalAll} bars
        </span>
        {hasFilters ? (
          <button
            onClick={onClear}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
