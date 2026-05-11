import { useAuth } from '@/contexts/AuthContext';
import { DynamicBackground } from '@/components/DynamicBackground';
import { AppHeader } from '@/components/AppHeader';
import { TrendingNow } from '@/components/TrendingNow';
import { HallOfFameLeaderboard } from '@/components/HallOfFameLeaderboard';
import { GameDayCountdown } from '@/components/GameDayCountdown';
import { NearbyFansOnline } from '@/components/NearbyFansOnline';
import { MissionStreak } from '@/components/MissionStreak';
import { CrewAtBarNotification } from '@/components/CrewAtBarNotification';
import { CubsGameTracker } from '@/components/CubsGameTracker';
import { FindFansBanner } from '@/components/home/FindFansBanner';
import { HomeQuickCarousel } from '@/components/home/HomeQuickCarousel';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/landing');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <DynamicBackground>
      <AppHeader />
      <div className="mx-auto max-w-lg pt-20">
        <FindFansBanner />
        <HomeQuickCarousel />
      </div>
      <main className="mx-auto max-w-lg px-4 pt-20 space-y-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Montserrat, sans-serif', color: 'hsl(222, 82%, 29%)', WebkitTextStroke: '2px white', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))', letterSpacing: '0.03em' }}>
            Welcome back 
          </h1>
          <p className="text-base font-semibold mt-1" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Here's what's happening in Wrigleyville</p>
        </div>

        {/* Retention Hooks */}
        <CubsGameTracker />
        <GameDayCountdown />
        <CrewAtBarNotification />
        <NearbyFansOnline />
        <MissionStreak />

        <TrendingNow />
        <HallOfFameLeaderboard />
      </main>
    </DynamicBackground>
  );
};

export default Index;
