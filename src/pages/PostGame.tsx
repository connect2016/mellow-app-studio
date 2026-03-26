import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GameClockHeader } from '@/components/GameClockHeader';
import { MainNavBar } from '@/components/MainNavBar';
import { PostGameExperience } from '@/components/PostGameExperience';
import MemoriesContent from '@/components/MemoriesContent';
import { Button } from '@/components/ui/button';
import { Camera, Trophy } from 'lucide-react';

export default function PostGame() {
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
          <h1 className="text-2xl font-bold">Post-Game</h1>
          <p className="text-sm text-muted-foreground">Relive the moments, keep the memories</p>
        </div>

        <PostGameExperience />

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/memories')}>
            <Camera className="h-4 w-4" />
            Memories
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate('/wrigley-passport')}>
            <Trophy className="h-4 w-4 text-secondary" />
            Wrigley Passport
          </Button>
        </div>

        <MemoriesContent />
      </div>
      <MainNavBar />
    </div>
  );
}
