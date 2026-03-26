import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GameClockHeader } from '@/components/GameClockHeader';
import { MainNavBar } from '@/components/MainNavBar';
import { GoingTodayFAB } from '@/components/GoingTodayFAB';
import { HappeningNow } from '@/components/HappeningNow';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { SmartMeetupSuggestions } from '@/components/SmartMeetupSuggestions';
import { SocialProofBanner } from '@/components/SocialProofBanner';
import { VentingRoom } from '@/components/VentingRoom';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export default function Pregame() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <GameClockHeader />
      <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">The Pregame</h1>
          <p className="text-sm text-muted-foreground">Rally the crew before first pitch</p>
        </div>

        <SocialProofBanner />
        <HappeningNow />

        {/* Clark Street Heat Map shortcut */}
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl border-primary/30 hover:bg-primary/5"
          onClick={() => navigate('/bar-map')}
        >
          <MapPin className="h-4 w-4 text-primary" />
          Clark Street Heat Map
        </Button>

        <div className="rounded-2xl border border-border bg-card p-3">
          <LiveActivityFeed maxItems={5} />
        </div>

        <SmartMeetupSuggestions />
        <VentingRoom />
      </div>
      <GoingTodayFAB />
      <MainNavBar />
    </div>
  );
}
