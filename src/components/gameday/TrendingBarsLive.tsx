import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Users, ChevronRight } from 'lucide-react';
import { useVenueActivity } from '@/hooks/useVenueActivity';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function TrendingBarsLive() {
  const { data: venues, isLoading } = useVenueActivity();

  const trending = useMemo(() => {
    if (!venues) return [];
    return [...venues]
      .filter((v) => v.totalUsers > 0 || v.meetups.length > 0)
      .sort((a, b) => {
        const score = (v: typeof a) => v.totalUsers * 1.5 + v.meetups.length * 3;
        return score(b) - score(a);
      })
      .slice(0, 5);
  }, [venues]);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          <h3 className="font-bold text-sm text-foreground">Trending now</h3>
        </div>
        <Link to="/bar-map" className="text-[11px] font-semibold text-primary hover:underline">
          All bars →
        </Link>
      </div>

      {trending.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <div className="text-2xl mb-1"></div>
          <p className="text-[12px] text-muted-foreground">
            Quiet right now. Be the first to check in.
          </p>
          <Link
            to="/check-in"
            className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
          >
            Check in at a bar
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {trending.map((v, idx) => {
            const heat = Math.min(100, v.totalUsers * 12 + v.meetups.length * 18);
            return (
              <motion.li
                key={v.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  to={`/check-in?bar=${encodeURIComponent(v.name)}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-xs font-bold text-foreground">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground truncate">{v.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-semibold text-foreground tabular-nums">{v.totalUsers}</span>
                      </span>
                      {v.meetups.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-primary font-semibold">
                           {v.meetups.length} meetup{v.meetups.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {/* Density bar */}
                    <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${heat}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
