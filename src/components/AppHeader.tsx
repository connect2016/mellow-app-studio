import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Map, CalendarDays, User, Bell } from 'lucide-react';
import wrigleyvilleLogo from '@/assets/wrigleyville-logo.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useFanMapPins } from '@/hooks/useFanMapPins';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';

const navItems = [
  { to: '/discover-fans', icon: Compass, label: 'Discover' },
  { to: '/bar-map', icon: Map, label: 'Map' },
  { to: '/meetups', icon: CalendarDays, label: 'Meetups' },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(4);
  const { count: nearbyFanCount } = useFanMapPins();
  const { myCheckin } = useBarCheckins();
  useSwipeNavigation();

  const getBadge = (path: string): number => {
    if (path === '/bar-map') return nearbyFanCount;
    if (!badges) return 0;
    if (path === '/hi-fives') return badges.hiFives;
    if (path === '/messages') return badges.messages;
    return 0;
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2">
          <Link to="/" aria-label="Cubbies Buddies home" className="flex min-w-0 items-center">
            <img
              alt="Cubbies Buddies"
              className="shrink-0 transition-transform duration-200 hover:scale-105 w-12 h-12 sm:w-14 sm:h-14"
              src={wrigleyvilleLogo}
              style={{
                minWidth: '48px',
                borderRadius: '50%',
                objectFit: 'contain',
                cursor: 'pointer',
                display: 'block',
                flexShrink: 0,
              }}
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label={unreadNotifs > 0 ? `View notifications (${unreadNotifs} unread)` : 'View notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#C8102E] text-white shadow-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-[#a30d25] active:scale-95"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[#C8102E] ring-2 ring-[#C8102E]">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} onUnreadChange={setUnreadNotifs} />

    </>
  );
}
