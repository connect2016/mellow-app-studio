import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Beer, ChevronRight, Map as MapIcon, Sparkles, Flame } from 'lucide-react';
import { LiveBeerProof, BarBeerBadge, BeerFomoToast } from '@/components/beer/LiveBeerProof';
import { useLiveBeerFeed } from '@/hooks/useLiveBeerFeed';
import { AppHeader } from '@/components/AppHeader';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestBanner } from '@/components/GuestBanner';
import { useVenueActivity } from '@/hooks/useVenueActivity';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { useBarVotes, WAIT_LABELS } from '@/hooks/useBarVotes';
import {
  CURATED_BARS,
  type BarVibe,
  type BarGroupFit,
  type BarGameTiming,
  type DistanceBucket,
  DISTANCE_BUCKETS,
} from '@/lib/wrigleyville-bar-guide';
import { BarGuideFilters } from '@/components/bars/BarGuideFilters';
import { CuratedBarCard } from '@/components/bars/CuratedBarCard';

const EDITOR_PICKS = new Set(['murphys-bleachers', 'mordecai', 'old-crow']);

export default function BarMap() {
  const { isGuest } = useGuestMode();
  const { data: venues } = useVenueActivity();
  const { checkins } = useBarCheckins();
  const { getSummary } = useBarVotes();
  const { activities: beerActivities, stats: beerStats } = useLiveBeerFeed();

  const [vibes, setVibes] = useState<BarVibe[]>([]);
  const [groups, setGroups] = useState<BarGroupFit[]>([]);
  const [timings, setTimings] = useState<BarGameTiming[]>([]);
  const [distance, setDistance] = useState<DistanceBucket>('all');

  // Live signal indexes
  const checkinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    checkins.forEach((c) => {
      counts[c.bar_name] = (counts[c.bar_name] || 0) + 1;
    });
    return counts;
  }, [checkins]);

  const venueByName = useMemo(() => {
    const map: Record<string, (typeof venues extends (infer T)[] | undefined ? T : never)> = {} as any;
    venues?.forEach((v) => { (map as any)[v.name] = v; });
    return map;
  }, [venues]);

  const filtered = useMemo(() => {
    const distMax = DISTANCE_BUCKETS.find((d) => d.key === distance)?.max ?? 99;
    return CURATED_BARS.filter((bar) => {
      if (vibes.length && !bar.vibe.some((v) => vibes.includes(v))) return false;
      if (groups.length && !bar.groupFit.some((g) => groups.includes(g))) return false;
      if (timings.length && !bar.bestFor.some((t) => timings.includes(t))) return false;
      if (bar.blocksFromWrigley > distMax) return false;
      return true;
    });
  }, [vibes, groups, timings, distance]);

  // Sort: editor picks first, then by live activity, then by distance
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aPick = EDITOR_PICKS.has(a.id) ? 1 : 0;
      const bPick = EDITOR_PICKS.has(b.id) ? 1 : 0;
      if (aPick !== bPick) return bPick - aPick;
      const aLive = (checkinCounts[a.name] || 0) + (((venueByName as any)[a.name]?.meetups?.length) || 0) * 2;
      const bLive = (checkinCounts[b.name] || 0) + (((venueByName as any)[b.name]?.meetups?.length) || 0) * 2;
      if (aLive !== bLive) return bLive - aLive;
      return a.blocksFromWrigley - b.blocksFromWrigley;
    });
  }, [filtered, checkinCounts, venueByName]);

  return (
    <div className={`min-h-screen bg-background ${isGuest ? 'pb-20' : 'pb-24'}`}>
      <AppHeader />

      {/* Editorial hero */}
      <header className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3 w-3" /> Curated · Wrigleyville
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight leading-none text-foreground">
          The Wrigleyville
          <br />
          <span className="text-primary">Bar Guide</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-prose">
          Hand-picked bars near the Friendly Confines, ranked by what fans actually do
          — pre-game pours, in-game hangs, and the postgame celebrations that spill
          onto Clark. Live crowd signals included.
        </p>

        {/* Mode switch + Beer Money strip */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/beer-money"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-orange-500/5 px-3 py-2.5 transition active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Beer className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold leading-tight text-foreground">Send Beer Money</div>
              <div className="text-[10px] text-muted-foreground truncate">Buy a round at any bar</div>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          <Link
            to="/check-in"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-blue-500/5 px-3 py-2.5 transition active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <MapIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold leading-tight text-foreground">Check in</div>
              <div className="text-[10px] text-muted-foreground truncate">Show fans where you are</div>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        </div>
        {/* Live beer activity ticker */}
        <div className="mt-3">
          <LiveBeerProof activities={beerActivities} stats={beerStats} variant="ticker" />
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-3xl mx-auto">
        <BarGuideFilters
          vibes={vibes}
          groups={groups}
          timings={timings}
          distance={distance}
          onToggleVibe={(v) => setVibes((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])}
          onToggleGroup={(g) => setGroups((cur) => cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g])}
          onToggleTiming={(t) => setTimings((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t])}
          onSetDistance={setDistance}
          onClear={() => { setVibes([]); setGroups([]); setTimings([]); setDistance('all'); }}
          totalShown={sorted.length}
          totalAll={CURATED_BARS.length}
        />
      </div>

      {/* Results */}
      <section className="max-w-3xl mx-auto px-4 pt-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <div className="text-3xl mb-2">🍺</div>
            <h3 className="font-bold text-foreground mb-1">No bars match those filters</h3>
            <p className="text-xs text-muted-foreground">Try clearing a chip — Wrigleyville's bigger than you think.</p>
          </div>
        ) : (
          sorted.map((bar, idx) => {
            const venue = (venueByName as any)[bar.name];
            const summary = getSummary(bar.name);
            return (
              <div key={bar.id}>
                <CuratedBarCard
                  bar={bar}
                  index={idx}
                  liveCheckins={checkinCounts[bar.name] || venue?.totalUsers || 0}
                  liveCrowdLevel={venue?.crowdLevel}
                  liveVibe={venue?.dominantVibe}
                  liveWait={summary.topWait ? WAIT_LABELS[summary.topWait] : undefined}
                  meetupCount={venue?.meetups?.length || 0}
                  isEditorPick={EDITOR_PICKS.has(bar.id)}
                />
                {/* Beer activity badge inline */}
                <div className="mt-1 ml-2">
                  <BarBeerBadge barName={bar.name} activities={beerActivities} />
                </div>
              </div>
            );
          })
        )}

        <div className="pt-4 text-center text-[10px] text-muted-foreground italic">
          Editorially curated by Cubbies Buddies · Want your bar listed?{' '}
          <Link to="/settings" className="text-primary hover:underline not-italic font-semibold">Get in touch</Link>
        </div>
      </section>

      {isGuest && <GuestBanner />}
    </div>
  );
}
