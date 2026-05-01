import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Beer, CalendarPlus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { beerExperiments, trackBuyBeer } from '@/lib/beer-experiments';

// Routes where the FAB should be hidden
const HIDDEN_ROUTES = ['/', '/auth', '/onboarding', '/quick-start', '/verify'];
const LONG_PRESS_MS = 450;

export function CreateMeetupFab() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open, isOpen } = useCreateMeetup();
  const scrollDir = useScrollDirection();
  const [tapping, setTapping] = useState(false);
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

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
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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

  const hidden =
    HIDDEN_ROUTES.includes(location.pathname) ||
    isOpen ||
    !user;

  if (hidden) return null;

  const isHot = (activity?.active ?? 0) >= 3;
  const isHidden = scrollDir === 'down' || routeTransitioning;

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = () => {
    longPressFired.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      haptic('medium');
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    if (longPressFired.current) {
      // Long-press already opened the menu — swallow the click
      longPressFired.current = false;
      return;
    }
    haptic('selection');
    setTapping(true);
    setTimeout(() => setTapping(false), 320);
    open();
  };

  const handleBuyBeer = () => {
    haptic('selection');
    setMenuOpen(false);
    navigate('/beer-money');
  };

  const handleCreateMeetup = () => {
    haptic('selection');
    setMenuOpen(false);
    open();
  };

  return (
    <>
      {/* Action menu overlay */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[59] bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            aria-label="Quick actions"
            className="fixed left-1/2 -translate-x-1/2 z-[61] flex flex-col items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 210px)',
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleBuyBeer}
              className="flex items-center gap-3 rounded-full bg-card border-2 border-border shadow-xl px-5 py-3 min-h-[52px] active:scale-[0.97] transition-transform"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Beer className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground leading-tight">Buy a Beer</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Send a fan or bar a round</p>
              </div>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleCreateMeetup}
              className="flex items-center gap-3 rounded-full bg-card border-2 border-border shadow-xl px-5 py-3 min-h-[52px] active:scale-[0.97] transition-transform"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <CalendarPlus className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground leading-tight">Create a Meetup</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Plan a hangout for fans</p>
              </div>
            </button>
          </div>
        </>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-label={menuOpen ? 'Close quick actions' : 'Quick actions: tap to create a meetup, long-press for more'}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={menuOpen ? () => setMenuOpen(false) : handleClick}
        onPointerDown={startLongPress}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
        data-no-swipe-nav
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-[60]',
          'bottom-[136px]',
          'h-14 w-14 rounded-full flex items-center justify-center',
          'bg-[#C8102E] text-white',
          'shadow-[0_8px_20px_rgba(200,16,46,0.20),0_4px_8px_rgba(0,0,0,0.18)]',
          'ring-4 ring-background',
          'fab-base',
          entered && !tapping && 'fab-enter',
          // Attention pulse only when not tapping and not hidden, and there's nearby activity
          isHot && !tapping && !isHidden && !menuOpen && 'fab-attention',
          tapping && 'fab-tap',
          isHidden && !menuOpen ? 'fab-hidden' : 'fab-revealed'
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {menuOpen ? (
          <X className="h-7 w-7" strokeWidth={3} />
        ) : (
          <Plus className="h-7 w-7" strokeWidth={3} />
        )}
        {isHot && !isHidden && !menuOpen && (
          <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#C8102E]/55 animate-ping" />
        )}
      </button>
    </>
  );
}
