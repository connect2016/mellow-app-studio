import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Beer, MapPin, TrendingUp, Flame } from 'lucide-react';
import type { BeerActivity } from '@/hooks/useLiveBeerFeed';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  activities: BeerActivity[];
  stats: {
    totalRoundsToday: number;
    activeBarCount: number;
    hottestBar: string;
    fansActive: number;
  };
  variant?: 'full' | 'compact' | 'ticker';
}

export function LiveBeerProof({ activities, stats, variant = 'full' }: Props) {
  // Rotating single-line ticker
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    if (variant !== 'ticker') return;
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % Math.max(activities.length, 1)), 4000);
    return () => clearInterval(t);
  }, [activities.length, variant]);

  if (variant === 'ticker') {
    const item = activities[tickerIdx % activities.length];
    if (!item) return null;
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card/60 px-3 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + tickerIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm"><ConceptIcon name={item.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
            <p className="flex-1 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-foreground">{item.from}</span> bought{' '}
              <span className="font-semibold text-foreground">{item.to}</span> a beer at{' '}
              <span className="font-semibold text-foreground">{item.bar}</span>
            </p>
            <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live</span>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-bold text-primary">{stats.totalRoundsToday}</span> rounds today
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="font-semibold text-foreground">{stats.hottestBar}</span>
            </span>
          </div>
        </div>
        {/* Latest activity */}
        <AnimatePresence>
          {activities.slice(0, 2).map((a, i) => (
            <motion.div
              key={a.id}
              initial={a.isNew ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 py-1 ${i > 0 ? 'border-t border-border/30' : ''}`}
            >
              <span className="text-sm"><ConceptIcon name={a.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
              <p className="flex-1 text-[11px] text-muted-foreground truncate">
                <span className="font-semibold text-foreground">{a.from}</span> → <span className="font-semibold text-foreground">{a.to}</span>
                <span className="ml-1 text-[10px]">@ {a.bar}</span>
              </p>
              <span className="text-[10px] text-muted-foreground">{a.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="text-[11px] font-semibold text-foreground flex-1">Happening now in Wrigleyville</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            <span className="font-bold text-primary">{stats.totalRoundsToday}</span> rounds
          </span>
          <span className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">{stats.activeBarCount}</span> bars
          </span>
        </div>
      </div>

      {/* Hottest bar callout */}
      <div className="px-3 py-1.5 bg-orange-500/5 border-b border-border/30 flex items-center gap-1.5">
        <Flame className="h-3 w-3 text-orange-500" />
        <p className="text-[10px] text-muted-foreground">
          <span className="font-bold text-foreground">{stats.hottestBar}</span> is the hottest bar right now
        </p>
      </div>

      <div className="divide-y divide-border/30">
        <AnimatePresence>
          {activities.slice(0, 5).map((a) => (
            <motion.div
              key={a.id}
              initial={a.isNew ? { opacity: 0, x: -12, backgroundColor: 'hsl(var(--primary) / 0.08)' } : false}
              animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <span className="text-sm"><ConceptIcon name={a.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">{a.from}</span> bought{' '}
                  <span className="font-semibold text-foreground">{a.to}</span> a beer
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-2.5 w-2.5" /> {a.bar}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-primary">${a.amount}</p>
                <p className="text-[9px] text-muted-foreground">{a.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Floating FOMO toast that appears periodically ─── */
export function BeerFomoToast({ activities }: { activities: BeerActivity[] }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<BeerActivity | null>(null);

  useEffect(() => {
    const newest = activities.find((a) => a.isNew);
    if (newest) {
      setCurrent(newest);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
  }, [activities]);

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-primary/20 bg-card shadow-xl px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl"><ConceptIcon name={current.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {current.from} just bought {current.to} a beer!
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> {current.bar}
              </p>
            </div>
            <span className="text-sm font-bold text-primary">${current.amount}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Bar-level beer badge for bar cards ─── */
export function BarBeerBadge({ barName, activities }: { barName: string; activities: BeerActivity[] }) {
  const count = activities.filter((a) => a.bar === barName).length;
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
      <Beer className="h-2.5 w-2.5" />
      {count} beer{count !== 1 ? 's' : ''} sent
    </span>
  );
}
