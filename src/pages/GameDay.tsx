import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import { LiveGameHeader } from '@/components/gameday/LiveGameHeader';
import { WeatherCard } from '@/components/gameday/WeatherCard';
import { TrendingBarsLive } from '@/components/gameday/TrendingBarsLive';
import { HotMeetupsLive } from '@/components/gameday/HotMeetupsLive';
import { ScoreWithFriendCTA } from '@/components/gameday/ScoreWithFriendCTA';
import { OffDayState } from '@/components/gameday/OffDayState';
import { SafetyTimerBanner } from '@/components/SafetyTimerBanner';
import { CrowdEnergyMap } from '@/components/CrowdEnergyMap';
import { GamePhaseTimeline } from '@/components/GamePhaseTimeline';
import { LiveMomentsPanel } from '@/components/LiveMomentsPanel';
import { FlashMeetupsPanel } from '@/components/FlashMeetupsPanel';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import gamedayBg from '@/assets/gameday-bg.webp';
import { PageBackground } from '@/components/PageBackground';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function GameDay() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: cubsGame, isLoading: gameLoading } = useMlbCubsGame();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Live fan counts
  const { data: fanCounts } = useQuery({
    queryKey: ['gameday-fan-counts'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_active_since: sixHoursAgo,
        p_limit: 500,
      });
      const wrigley = data?.filter((p: any) => p.game_status === 'AtWrigley').length ?? 0;
      const bars = data?.filter((p: any) => p.game_status === 'AtBar').length ?? 0;
      return { wrigley, bars, total: wrigley + bars };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const isOffDay = !gameLoading && cubsGame?.status === 'no-game';
  const isLive = cubsGame?.status === 'live';

  return (
    <PageBackground image={gamedayBg}>
      <div className="min-h-screen pb-24">
        <AppHeader />


        {/* Sticky live pulse strip */}
        <div className={`sticky top-14 z-30 border-b backdrop-blur-md transition-colors ${
          isLive ? 'bg-red-500/20 border-red-500/40' : 'bg-black/50 border-white/20'
        }`}>
          <div className="mx-auto max-w-lg px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isLive ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLive ? 'bg-red-400' : 'bg-emerald-400'}`} />
              </span>
              <span className="text-[12px] font-bold text-white drop-shadow-md">
                {isLive ? 'Game Day · LIVE' : isOffDay ? 'Off-day mode' : 'Game Day mode'}
              </span>
            </div>
            {fanCounts && (
              <div className="flex items-center gap-3 text-[11px] text-white/85 drop-shadow">
                <span className="inline-flex items-center gap-1">
                  <ConceptIcon name="baseball" className="h-3 w-3" />
                  <strong className="text-white tabular-nums">{fanCounts.wrigley}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <ConceptIcon name="beer" className="h-3 w-3" />
                  <strong className="text-white tabular-nums">{fanCounts.bars}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <ConceptIcon name="people" className="h-3 w-3" />
                  <strong className="text-white tabular-nums">{fanCounts.total}</strong> live
                </span>
              </div>
            )}
          </div>
        </div>

        <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
          <SafetyTimerBanner />

          {/* Editorial header */}
          <motion.header
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-1"
          >
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300 drop-shadow-md">
              <ConceptIcon name={isLive ? 'fire' : isOffDay ? 'moon' : 'baseball'} className="h-3 w-3" />
              {isLive ? 'Live · The Friendly Confines' : isOffDay ? 'Off-day' : 'Game Day'}
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-none tracking-tight text-white page-title-outline">
              Game Day Mode
            </h1>
          </motion.header>

          {isOffDay ? (
            <OffDayState />
          ) : (
            <>
              <LiveGameHeader />
              <WeatherCard />
              <ScoreWithFriendCTA />
              <HotMeetupsLive />
              <TrendingBarsLive />

              {/* Game phase + crowd energy still useful */}
              <GamePhaseTimeline />
              <LiveMomentsPanel />
              <FlashMeetupsPanel />
              <CrowdEnergyMap />
            </>
          )}
        </main>
      </div>
    </PageBackground>
  );
}
