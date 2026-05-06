import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Beer, CalendarPlus, Edit3, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { trackBuyBeer } from '@/lib/beer-experiments';

// Routes where the FAB should be hidden
const HIDDEN_ROUTES = ['/', '/auth', '/onboarding', '/quick-start', '/verify'];

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

type DialItem = {
  key: string;
  label: string;
  icon: typeof Plus;
  bg: string;            // background color class for icon button
  onSelect: () => void;
};

export function CreateMeetupFab() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open, isOpen } = useCreateMeetup();
  const scrollDir = useScrollDirection();
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<number | null>(null);

  // Re-trigger entrance on route change
  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  // Hide during swipe route transitions, reveal after
  useEffect(() => {
    const onStart = () => setRouteTransitioning(true);
    const onEnd   = () => setRouteTransitioning(false);
    window.addEventListener('swipe-route-start', onStart);
    window.addEventListener('swipe-route-end',   onEnd);
    return () => {
      window.removeEventListener('swipe-route-start', onStart);
      window.removeEventListener('swipe-route-end',   onEnd);
    };
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setExiting(false); }, [location.pathname]);

  // Detect nearby activity → adds attention pulse
  const { data: activity } = useQuery({
    queryKey: ['fab-nearby-activity'],
    enabled: !!user,
    refetchInterval: 25000,
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('game_status')
        .eq('is_banned', false)
        .eq('onboarding_completed', true)
        .gte('location_last_set_at', sixHoursAgo);
      const active = (data ?? []).filter(p => p.game_status === 'AtBar' || p.game_status === 'AtWrigley').length;
      return { active };
    },
  });

  const hidden = HIDDEN_ROUTES.includes(location.pathname) || isOpen || !user;
  if (hidden) return null;

  const isHot = (activity?.active ?? 0) >= 3;
  const isHidden = scrollDir === 'down' || routeTransitioning;

  const closeMenu = () => {
    if (!menuOpen) return;
    setExiting(true);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => {
      setMenuOpen(false);
      setExiting(false);
    }, 130);
  };

  const openMenu = () => {
    haptic('light');
    try { navigator.vibrate?.(10); } catch { /* noop */ }
    setExiting(false);
    setMenuOpen(true);
  };

  const handleFabClick = () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Bottom-to-top order in spec: Post Vibe (bottom) → Invite Buddy (top).
  // We render top→bottom in DOM, so reverse for stagger index.
  const items: DialItem[] = [
    {
      key: 'invite-buddy',
      label: 'Invite Buddy',
      icon: UserPlus,
      bg: 'bg-emerald-600',
      onSelect: () => { haptic('selection'); closeMenu(); navigate('/dugout'); },
    },
    {
      key: 'buy-beer',
      label: 'Buy a Beer',
      icon: Beer,
      bg: 'bg-amber-500',
      onSelect: () => {
        haptic('selection');
        closeMenu();
        trackBuyBeer('buy_beer_cta_clicked', { context: 'general', surface: 'fab' });
        navigate('/beer-money');
      },
    },
    {
      key: 'meetup',
      label: 'Meetup',
      icon: CalendarPlus,
      bg: 'bg-teal-600',
      onSelect: () => { haptic('selection'); closeMenu(); open(); },
    },
    {
      key: 'post-vibe',
      label: 'Post Vibe',
      icon: Edit3,
      bg: 'bg-[#0E3386]', // Cubs blue
      onSelect: () => { haptic('selection'); closeMenu(); navigate('/vibe'); },
    },
  ];

  // Stagger from bottom (Post Vibe) → top (Invite Buddy). DOM order is top→bottom.
  const lastIdx = items.length - 1;

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={closeMenu}
          className={cn(
            'fixed inset-0 z-[39]',
            'bg-black/40 backdrop-blur-[2px]',
            'transition-opacity duration-150',
            exiting ? 'opacity-0' : 'opacity-100',
          )}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* Speed-dial items */}
      {menuOpen && (
        <div
          role="menu"
          aria-label="Quick actions"
          className="fixed left-1/2 -translate-x-1/2 z-[61] flex flex-col items-end gap-3 pointer-events-none"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 210px)',
          }}
        >
          {items.map((item, domIdx) => {
            // bottom item (last in DOM) is index 0 of stagger
            const staggerIdx = lastIdx - domIdx;
            const enterDelay = exiting ? 0 : staggerIdx * 30;
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 pointer-events-auto"
                style={{
                  opacity: exiting ? 0 : 1,
                  transform: exiting
                    ? 'scale(0.8) translateY(8px)'
                    : entered
                      ? 'scale(1) translateY(0)'
                      : 'scale(0.8) translateY(8px)',
                  transition: exiting
                    ? 'opacity 120ms ease-in, transform 120ms ease-in'
                    : `opacity 180ms ${SPRING} ${enterDelay}ms, transform 180ms ${SPRING} ${enterDelay}ms`,
                  animation: exiting ? undefined : `fab-dial-in 180ms ${SPRING} ${enterDelay}ms both`,
                }}
              >
                <span
                  className="text-[13px] font-medium text-white select-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {item.label}
                </span>
                <button
                  type="button"
                  role="menuitem"
                  onClick={item.onSelect}
                  aria-label={item.label}
                  className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center',
                    'shadow-lg text-white',
                    'active:scale-95 transition-transform',
                    item.bg,
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-label={menuOpen ? 'Close quick actions' : 'Open quick actions'}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={handleFabClick}
        data-no-swipe-nav
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-[60]',
          'bottom-[136px]',
          'h-14 w-14 rounded-full flex items-center justify-center',
          'bg-[#C8102E] text-white',
          'shadow-[0_8px_20px_rgba(200,16,46,0.20),0_4px_8px_rgba(0,0,0,0.18)]',
          'ring-4 ring-background',
          'fab-base',
          entered && 'fab-enter',
          isHot && !isHidden && !menuOpen && 'fab-attention',
          isHidden && !menuOpen ? 'fab-hidden' : 'fab-revealed'
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus
          className="h-7 w-7"
          strokeWidth={3}
          style={{
            transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: `transform 200ms ${SPRING}`,
          }}
        />
        {isHot && !isHidden && !menuOpen && (
          <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#C8102E]/55 animate-ping" />
        )}
      </button>
    </>
  );
}
