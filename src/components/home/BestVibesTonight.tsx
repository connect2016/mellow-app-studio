import { Link } from 'react-router-dom';
import { Flame, Users, ChevronRight } from 'lucide-react';
import { useVenueActivity } from '@/hooks/useVenueActivity';

const CROWD_META: Record<string, { emoji: string; label: string; color: string }> = {
  packed: { emoji: '🔥', label: 'Packed', color: 'text-red-600 bg-red-500/10' },
  busy: { emoji: '⚡', label: 'Buzzing', color: 'text-amber-600 bg-amber-500/10' },
  chill: { emoji: '😎', label: 'Chill', color: 'text-blue-600 bg-blue-500/10' },
  empty: { emoji: '💤', label: 'Quiet', color: 'text-slate-500 bg-slate-500/10' },
};

export function BestVibesTonight() {
  const { data: venues = [], isLoading } = useVenueActivity();

  const top = venues
    .filter((v) => v.totalUsers > 0 || v.meetups.length > 0)
    .slice(0, 3);

  return (
    <section aria-labelledby="best-vibes-heading" className="mb-5">
      <div className="flex items-baseline justify-between mb-2.5 px-1">
        <h2 id="best-vibes-heading" className="text-base font-extrabold flex items-center gap-1.5 text-on-image">
          <Flame className="h-4 w-4 text-orange-400" /> Best Vibes Tonight
        </h2>
        <Link
          to="/bar-map"
          className="text-xs font-semibold text-on-image hover:underline flex items-center gap-0.5"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 text-center text-sm text-destructive-foreground">
          Loading bars…
        </div>
      ) : top.length === 0 ? (
        <Link
          to="/bar-map"
          className="block rounded-2xl border border-dashed border-border bg-card/90 backdrop-blur-sm p-5 text-center"
        >
          <p className="text-2xl mb-1">🍻</p>
          <p className="text-sm font-semibold">No live activity yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Be the first to check in at a bar</p>
        </Link>
      ) : (
        <div className="space-y-2">
          {top.map((v) => {
            const meta = CROWD_META[v.crowdLevel] ?? CROWD_META.chill;
            return (
              <Link
                key={v.name}
                to="/bar-map"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-sm transition active:scale-[0.98] hover:shadow-md"
                aria-label={`${v.name} — ${meta.label}, ${v.totalUsers} fans here`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${meta.color}`}>
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-tight truncate mt-2 text-destructive-foreground">{v.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-destructive-foreground">
                    <span className="font-semibold" style={{ color: 'inherit' }}>{meta.label}</span>
                    {v.totalUsers > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {v.totalUsers} here
                        </span>
                      </>
                    )}
                    {v.meetups.length > 0 && (
                      <>
                        <span>·</span>
                        <span>📋 {v.meetups.length} meetup{v.meetups.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
