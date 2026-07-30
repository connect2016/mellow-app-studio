import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CalendarDays, User, Bell, Trophy } from 'lucide-react';
import wrigleyvilleLogo from '@/assets/wrigleyville-logo.webp';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useFanMapPins } from '@/hooks/useFanMapPins';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { useUnreadCount } from '@/hooks/useNotifications';

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
  const { data: profile } = useProfile();
  const { data: badges } = useNotificationCounts();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadNotifs = useUnreadCount();
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

  const isQuickStart = location.pathname.startsWith('/quick-start');

  return (
    <>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          height: 'var(--app-header-h, 64px)',
          minHeight: 'var(--app-header-h, 64px)',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <style>{`
          :root { --app-header-h: 64px; --app-header-pad: 16px; }
          @media (max-width: 640px) {
            :root { --app-header-h: 56px; --app-header-pad: 12px; }
          }
          .app-header-logo {
            height: 52px;
            width: auto;
            max-width: 220px;
            object-fit: contain;
            display: block;
            flex-shrink: 0;
            cursor: pointer;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          @media (max-width: 640px) {
            .app-header-logo { height: 46px; max-width: 190px; }
          }
        `}</style>
        <div
          className="mx-auto flex max-w-lg items-center justify-between"
          style={{
            height: '100%',
            padding: '0 16px',
          }}
        >
          <Link
            to="/"
            aria-label="Wrigleyville Buddies home"
            className="flex min-w-0 items-center"
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <img
              alt="Wrigleyville Buddies"
              className="app-header-logo transition-transform duration-200 hover:scale-105"
              src={wrigleyvilleLogo} loading="lazy" decoding="async" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {!isQuickStart && (
              <>
                <Link
                  to="/schedule"
                  aria-label="Game schedule"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-navy))] text-white shadow-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-[hsl(var(--brand-navy-light))] active:scale-95"
                >
                  <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </Link>
                <Link
                  to="/leaderboard"
                  aria-label="Leaderboard"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-navy))] text-white shadow-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-[hsl(var(--brand-navy-light))] active:scale-95"
                >
                  <Trophy className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </Link>
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  aria-label={unreadNotifs > 0 ? `View notifications (${unreadNotifs} unread)` : 'View notifications'}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-navy))] text-white shadow-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-[hsl(var(--brand-navy-light))] active:scale-95"
                >
                  <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[hsl(var(--brand-red))] px-1 text-[9px] font-bold text-white ring-2 ring-white/30">
                      {unreadNotifs > 99 ? '99+' : unreadNotifs}
                    </span>
                  )}
                </button>
                <Link
                  to="/profile"
                  aria-label="Your profile"
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--brand-navy))] text-white shadow-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-[hsl(var(--brand-navy-light))] active:scale-95"
                >
                  {profile?.profile_photo ? (
                    <img
                      src={profile.profile_photo}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <User className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>



      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} />

    </>
  );
}
