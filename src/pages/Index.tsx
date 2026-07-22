import { useAuth } from '@/contexts/AuthContext';
import { WrigleyRainbowBackground } from '@/components/WrigleyRainbowBackground';
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
import { TeammatesSummary } from '@/components/teammates/TeammatesSummary';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/landing');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <WrigleyRainbowBackground>
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 pt-20 space-y-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <div className="-mx-4">
          <FindFansBanner />
          <HomeQuickCarousel />
        </div>
        {(() => {
          const rawName = (user.user_metadata?.full_name as string | undefined) || user.email || '';
          const firstName = rawName.split(/[\s@]/)[0] || '';
          return (
            <div>
              <h1 className="home-heading text-3xl font-extrabold">
                {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
              </h1>
              <p className="home-subheading text-base font-semibold mt-1">Here's what's happening in Wrigleyville</p>
            </div>
          );
        })()}

        {/* Retention Hooks */}
        <CubsGameTracker />
        <GameDayCountdown />
        <CrewAtBarNotification />
        <TeammatesSummary />
        <NearbyFansOnline />
        <MissionStreak />

        <TrendingNow />
        <HallOfFameLeaderboard />
      </main>
    </WrigleyRainbowBackground>
  );
};

export default Index;
