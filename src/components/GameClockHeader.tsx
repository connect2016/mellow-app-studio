import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInHours, differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';

export function GameClockHeader() {
  const unreadNotifs = useUnreadCount();

  const { data: nextGame } = useQuery({
    queryKey: ['next-game-clock'],
    queryFn: async () => {
      const now = new Date().toISOString();
      // Check for live game first
      const { data: live } = await supabase
        .from('games')
        .select('*')
        .lte('game_start', now)
        .gte('game_end', now)
        .eq('is_home', true)
        .limit(1)
        .single();

      if (live) return { ...live, isLive: true };

      // Next upcoming game
      const { data: upcoming } = await supabase
        .from('games')
        .select('*')
        .gte('game_start', now)
        .order('game_start', { ascending: true })
        .limit(1)
        .single();

      return upcoming ? { ...upcoming, isLive: false } : null;
    },
    refetchInterval: 30000,
  });

  const getCountdown = () => {
    if (!nextGame || nextGame.isLive) return null;
    const start = new Date(nextGame.game_start);
    const now = new Date();
    const hours = differenceInHours(start, now);
    const mins = differenceInMinutes(start, now) % 60;
    if (hours > 48) return format(start, 'EEE, MMM d • h:mm a');
    return `${hours}h ${mins}m`;
  };

  const getInning = () => {
    if (!nextGame?.isLive) return null;
    const start = new Date(nextGame.game_start);
    const elapsed = differenceInMinutes(new Date(), start);
    const inning = Math.min(Math.floor(elapsed / 20) + 1, 9);
    const half = elapsed % 20 < 10 ? 'Top' : 'Bot';
    return `${half} ${inning}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Logo */}
        <Link to="/discover" className="flex items-center gap-2">
          <img
            alt="Cubbies Buddies"
            className="h-10 w-auto"
            src="/lovable-uploads/0f9703ae-330e-481b-b9d8-1f6cc6a16e18.png"
          />
        </Link>

        {/* Game Clock */}
        <div className="flex flex-col items-center">
          {nextGame?.isLive ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Live</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                Cubs vs {nextGame.opponent} • {getInning()}
              </span>
            </>
          ) : nextGame ? (
            <>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Next Game</span>
              <span className="text-xs font-bold text-foreground">
                vs {nextGame.opponent} • {getCountdown()}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No games scheduled</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link to="/notifications" className="relative rounded-full p-2 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadNotifs > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-bold text-secondary-foreground">
                {unreadNotifs > 99 ? '99+' : unreadNotifs}
              </span>
            )}
          </Link>
          <Link to="/settings" className="rounded-full p-2 hover:bg-muted transition-colors">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
