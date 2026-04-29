import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MapPin, Trophy, User, Bell } from 'lucide-react';
import { useGamedayMode } from '@/contexts/GamedayModeContext';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import wrigleyvilleLogo from '@/assets/wrigleyville-logo.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUnreadCount } from '@/hooks/useNotifications';

const navItems = [
  { to: '/discover', icon: Home, label: 'Home' },
  { to: '/bar-map', icon: MapPin, label: 'Map' },
  { to: '/meetups', icon: Users, label: 'Meetups' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function useNotificationCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nav-badges', user?.id],
    queryFn: async () => {
      if (!user) return { hiFives: 0, messages: 0, matches: 0 };

      // Unread hi-fives: received hi-fives not yet returned
      const { data: receivedHiFives } = await supabase
        .from('likes')
        .select('from_user')
        .eq('to_user', user.id)
        .eq('is_hi_five', true);

      const { data: sentHiFives } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', user.id)
        .eq('is_hi_five', true);

      const sentSet = new Set(sentHiFives?.map(s => s.to_user) ?? []);
      const unrepliedHiFives = receivedHiFives?.filter(h => !sentSet.has(h.from_user)).length ?? 0;

      // Unread messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

      let unreadMessages = 0;
      if (conversations && conversations.length > 0) {
        const convIds = conversations.map(c => c.id);
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .neq('sender', user.id)
          .eq('is_read', false);
        unreadMessages = count ?? 0;
      }

      return { hiFives: unrepliedHiFives, messages: unreadMessages, matches: 0 };
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function AppHeader() {
  const location = useLocation();
  const { data: badges } = useNotificationCounts();
  const unreadNotifs = useUnreadCount();
  const { gamedayMode, toggleGamedayMode } = useGamedayMode();

  const getBadge = (path: string): number => {
    if (!badges) return 0;
    if (path === '/hi-fives') return badges.hiFives;
    if (path === '/messages') return badges.messages;
    return 0;
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-2">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <img
              alt="Wrigleyville 60613 Logo"
              className="h-16 sm:h-20 md:h-24 w-auto shrink-0 object-contain transition-transform duration-200 hover:scale-105 hover:brightness-110"
              src={wrigleyvilleLogo}
            />
            <div className="flex min-w-0 flex-col items-start">
              <span
                className="text-[0.75rem] sm:text-[0.95rem] md:text-[1.2rem] font-bold uppercase leading-[1.05] max-w-full"
                style={{
                  fontFamily: 'Norwester, sans-serif',
                  color: '#3458B5',
                  textShadow:
                    '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0px 1px 2px rgba(0,0,0,0.3)',
                  letterSpacing: '1.25px',
                }}
              >
                The Wrigleyville
                <br />
                Social App
              </span>
              <span
                className="text-[0.55rem] sm:text-[0.7rem] font-bold uppercase leading-tight"
                style={{
                  fontFamily: 'Norwester, sans-serif',
                  color: '#CC3433',
                  textShadow:
                    '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                  letterSpacing: '2px',
                }}
              >
                Where Fans Find Friends
              </span>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2 self-center">
            <button
              type="button"
              onClick={toggleGamedayMode}
              aria-label="Toggle Game Day Mode"
              aria-pressed={gamedayMode}
              title={gamedayMode ? 'Game Day Mode: ON' : 'Game Day Mode: OFF'}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-1 ring-white/20 transition-all duration-200 active:scale-95',
                gamedayMode
                  ? 'bg-[#0E3386] hover:bg-[#0a2766] ring-2 ring-yellow-300'
                  : 'bg-[#C8102E] hover:bg-[#a30d25]'
              )}
            >
              <Trophy className="h-[18px] w-[18px]" strokeWidth={2.25} />
              {gamedayMode && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-yellow-300 ring-2 ring-white animate-pulse" />
              )}
            </button>
            <Link
              to="/beer-money"
              data-tour="beer-money"
              aria-label="Beer Money"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#C8102E] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-1 ring-white/20 transition-all duration-200 hover:bg-[#a30d25] active:scale-95"
            >
              <Beer className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </Link>
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#C8102E] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-1 ring-white/20 transition-all duration-200 hover:bg-[#a30d25] active:scale-95"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[#C8102E] ring-2 ring-[#C8102E]">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8102E] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-1 ring-white/20 transition-all duration-200 hover:bg-[#a30d25] active:scale-95"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl safe-area-pb shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active =
              location.pathname === to ||
              (to === '/profile' && location.pathname.startsWith('/profile')) ||
              (to === '/meetups' && location.pathname.startsWith('/meetups'));
            const badge = getBadge(to);
            const tourAttr = to === '/bar-map' ? 'buddy-map' : to === '/meetups' ? 'friends-tab' : undefined;
            return (
              <Link
                key={to}
                to={to}
                data-tour={tourAttr}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] transition-all duration-200 rounded-xl min-w-[56px]',
                  active
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-6 w-6 transition-all duration-200', active && 'stroke-[2.5] scale-110')} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-bold text-secondary-foreground animate-pulse">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={cn('font-medium transition-all duration-200', active && 'font-bold')}>{label}</span>
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
