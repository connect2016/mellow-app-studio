import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function MissionStreak() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['mission-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get all completed mission progress sorted by date
      const { data: progress } = await supabase
        .from('mission_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (!progress || progress.length === 0) return { streak: 0, total: 0 };

      // Calculate streak: consecutive days with at least one completion
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completionDays = new Set<string>();
      progress.forEach(p => {
        if (p.completed_at) {
          const d = new Date(p.completed_at);
          d.setHours(0, 0, 0, 0);
          completionDays.add(d.toISOString());
        }
      });

      let streak = 0;
      const checkDate = new Date(today);

      // Check today first, then go backwards
      for (let i = 0; i < 365; i++) {
        const key = new Date(checkDate).toISOString();
        if (completionDays.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // If no completion today, check if yesterday starts a streak
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        } else {
          break;
        }
      }

      return { streak, total: progress.length };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  if (!data || (data.streak === 0 && data.total === 0)) return null;

  return (
    <button
      onClick={() => navigate('/missions')}
      className="w-full rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-4 text-left transition-all hover:border-secondary/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mission Streak</span>
          </div>
          {data.streak > 0 ? (
            <p className="text-lg font-bold text-foreground">
              {data.streak} day{data.streak !== 1 ? 's' : ''} 
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Complete a mission today to start your streak!</p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3" />
            {data.total} completed
          </div>
        </div>
      </div>
    </button>
  );
}
