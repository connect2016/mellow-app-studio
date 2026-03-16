import { Link, useLocation } from 'react-router-dom';
import { Compass, Zap, MessageCircle, User, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/game-day', icon: CalendarDays, label: 'Game Day' },
  { to: '/hi-fives', icon: Zap, label: 'Hi-Fives' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
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

  const getBadge = (path: string): number => {
    if (!badges) return 0;
    if (path === '/hi-fives') return badges.hiFives;
    if (path === '/messages') return badges.messages;
    return 0;
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/discover">
            <img alt="Cubbies Buddies" className="h-10" src="/lovable-uploads/0f9703ae-330e-481b-b9d8-1f6cc6a16e18.png" />
          </Link>
          <Link to="/settings" className="rounded-full p-2 hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-pb">
        <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to === '/profile' && location.pathname.startsWith('/profile'));
            const badge = getBadge(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] transition-colors rounded-xl min-w-[56px]',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-6 w-6', active && 'stroke-[2.5]')} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-bold text-secondary-foreground">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={cn('font-medium', active && 'font-semibold')}>{label}</span>
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
