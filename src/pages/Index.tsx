import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { TrendingNow } from '@/components/TrendingNow';
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
    <DynamicBackground>
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 pt-4 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            Welcome back 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening in Wrigleyville</p>
        </div>

        <TrendingNow />
      </main>
    </DynamicBackground>
  );
};

export default Index;
