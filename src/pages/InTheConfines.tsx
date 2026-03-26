import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GameClockHeader } from '@/components/GameClockHeader';
import { MainNavBar } from '@/components/MainNavBar';
import { GoingTodayFAB } from '@/components/GoingTodayFAB';
import { CubsScoreboard } from '@/components/CubsScoreboard';
import { LiveScoringBanner } from '@/components/scoring/LiveScoringBanner';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { GameTimeMatchBanner } from '@/components/GameTimeMatchBanner';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default function InTheConfines() {
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
          <h1 className="text-2xl font-bold">In the Confines</h1>
          <p className="text-sm text-muted-foreground">You're at the ballpark — connect live</p>
        </div>

        <CubsScoreboard />
        <GameTimeMatchBanner />
        <LiveScoringBanner />

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/score')}>
            <Zap className="h-4 w-4 text-secondary" />
            Score the Game
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/game-day')}>
            🏟️ Wrigley Live Map
          </Button>
        </div>

        {/* Missions */}
        <button
          onClick={() => navigate('/missions')}
          className="w-full flex items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-3 text-left transition-all hover:bg-secondary/10"
        >
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Game Day Missions</p>
            <p className="text-[11px] text-muted-foreground">Complete challenges, earn badges</p>
          </div>
          <span className="text-xs font-semibold text-secondary">View →</span>
        </button>

        <div className="rounded-2xl border border-border bg-card p-3">
          <LiveActivityFeed maxItems={6} />
        </div>
      </div>
      <GoingTodayFAB />
      <MainNavBar />
    </div>
  );
}
