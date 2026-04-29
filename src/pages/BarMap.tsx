import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beer, ChevronRight, Map as MapIcon, Sparkles, Flame, Zap, Utensils } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import barMapBg from '@/assets/bar-map-bg.jpg';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const EDITOR_PICKS = new Set(['murphys-bleachers', 'mordecai', 'old-crow']);

export default function BarMap() {
  const { isGuest } = useGuestMode();
  const navigate = useNavigate();
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

  // Beer activity per bar
  const beerCountByBar = useMemo(() => {
    const counts: Record<string, number> = {};
    beerActivities.forEach((a) => {
      counts[a.bar] = (counts[a.bar] || 0) + 1;
    });
    return counts;
  }, [beerActivities]);

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
    <div className={`relative min-h-screen overflow-x-hidden ${isGuest ? 'pb-20' : 'pb-24'}`}>
      <div
        className="fixed inset-0 z-0 swipe-drag-bg"
        data-route-parallax="bg"
        style={{ backgroundImage: `url(${barMapBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      />
      <div className="fixed inset-0 z-0 bg-black/35 pointer-events-none" />
      <div className="relative z-10 swipe-drag" data-route-parallax="fg">
      <AppHeader />

      {/* Editorial hero */}
      <header className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 drop-shadow">
          <Sparkles className="h-3 w-3" /> Curated · Wrigleyville
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight leading-none text-white drop-shadow-lg">
          The Wrigleyville
          <br />
          <span className="text-amber-300">Bar Guide</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/90 max-w-prose drop-shadow">
          Hand-picked bars near the Friendly Confines, ranked by what fans actually do
          — pre-game pours, in-game hangs, and the postgame celebrations that spill
          onto Clark. Live crowd signals included.
        </p>

        {/* Mode switch strip */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link
            to="/beer-money"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 backdrop-blur px-2.5 py-2.5 transition active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Beer className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold leading-tight text-white">Beer Money</div>
              <div className="text-[9px] text-white/75 truncate">Buy a round</div>
            </div>
          </Link>
          <Link
            to="/eats"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 backdrop-blur px-2.5 py-2.5 transition active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
              <Utensils className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold leading-tight text-white">Eats</div>
              <div className="text-[9px] text-white/75 truncate">Food & drink</div>
            </div>
          </Link>
          <Link
            to="/check-in"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 backdrop-blur px-2.5 py-2.5 transition active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <MapIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold leading-tight text-white">Check in</div>
              <div className="text-[9px] text-white/75 truncate">Show fans</div>
            </div>
          </Link>
        </div>

        {/* Live beer activity ticker */}
        <div className="mt-3">
          <LiveBeerProof activities={beerActivities} stats={beerStats} variant="ticker" />
        </div>

        {/* Hottest bar banner */}
        {beerStats.hottestBar && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-amber-500/40 bg-black/60 backdrop-blur p-3 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg shrink-0">
              
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Hottest bar right now</p>
              <p className="text-sm font-bold text-white truncate">{beerStats.hottestBar}</p>
              <p className="text-[10px] text-white/75">{beerStats.totalRoundsToday} rounds bought today</p>
            </div>
            <button
              onClick={() => navigate(`/beer-money?bar=${encodeURIComponent(beerStats.hottestBar!)}`)}
              className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-amber-950 active:scale-95 transition-transform"
            >
              <Beer className="h-3 w-3" /> Send
            </button>
          </motion.div>
        )}
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
          <div className="rounded-2xl border border-dashed border-white/30 bg-black/50 backdrop-blur p-8 text-center">
            <div className="text-3xl mb-2"></div>
            <h3 className="font-bold text-white mb-1">No bars match those filters</h3>
            <p className="text-xs text-white/80">Try clearing a chip — Wrigleyville's bigger than you think.</p>
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
                  liveBeerCount={beerCountByBar[bar.name] || 0}
                  onSendBeer={(name) => navigate(`/beer-money?bar=${encodeURIComponent(name)}`)}
                />
                {/* Beer activity badge inline */}
                <div className="mt-1 ml-2">
                  <BarBeerBadge barName={bar.name} activities={beerActivities} />
                </div>
              </div>
            );
          })
        )}

        <div className="pt-4 text-center text-[10px] text-white/80 italic drop-shadow">
          Editorially curated by Cubbies Buddies · Want your bar listed?{' '}
          <Link to="/settings" className="text-amber-300 hover:underline not-italic font-semibold">Get in touch</Link>
        </div>
      </section>

      {/* Floating beer CTA */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)]">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/beer-money')}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 px-6 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-transform"
        >
          <Beer className="h-4 w-4" />
          Buy a Fan a Beer — {beerStats.totalRoundsToday} sent today
          <Zap className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {isGuest && <GuestBanner />}
      <BeerFomoToast activities={beerActivities} />
      </div>
    </div>
  );
}
