import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { MoveTonightSheet } from '@/components/MoveTonightSheet';

// Routes where the FAB should be hidden entirely
const HIDDEN_ROUTES = ['/', '/auth', '/onboarding', '/quick-start', '/verify'];

export function CreateMeetupFab() {
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen } = useCreateMeetup();
  const scrollDir = useScrollDirection();
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [entered, setEntered] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  // Close sheet on route change
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

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

  // On Meetups page: hide FAB when there are no meetups (empty state already has CTA)
  const isMeetupsPage = location.pathname === '/meetups';
  const { data: meetupCount = 0 } = useQuery({
    queryKey: ['fab-meetup-count'],
    enabled: isMeetupsPage && !!user,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { count, error } = await supabase
        .from('lineup_meetups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', now);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Extended FAB on Messages and Discover pages
  const isExtended = ['/messages', '/discover', '/discover-fans'].includes(location.pathname);

  // Profile pages: hide entirely (FAB overlaps fan card)
  const isProfilePage = location.pathname === '/profile'
    || location.pathname.startsWith('/profile/')
    || location.pathname.startsWith('/u/');

  const hidden =
    HIDDEN_ROUTES.includes(location.pathname) ||
    isOpen ||
    !user ||
    isProfilePage ||
    (isMeetupsPage && meetupCount === 0);

  if (hidden) return null;

  const isHot = (activity?.active ?? 0) >= 3;
  const isHidden = scrollDir === 'down' || routeTransitioning;

  const handleFabClick = () => {
    haptic('light');
    try { navigator.vibrate?.(10); } catch { /* noop */ }
    setSheetOpen((v) => !v);
  };

  return (
    <>
      <button
        type="button"
        aria-label={sheetOpen ? 'Close move menu' : "Open tonight's move menu"}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={handleFabClick}
        data-no-swipe-nav
        className={cn(
          'fixed right-4 z-[60]',
          'bottom-[calc(72px+env(safe-area-inset-bottom))]',
          'flex items-center justify-center',
          'bg-[hsl(var(--brand-red))] text-white',
          'shadow-[0_8px_20px_rgba(200,16,46,0.20),0_4px_8px_rgba(0,0,0,0.18)]',
          'ring-4 ring-background',
          'fab-base',
          entered && 'fab-enter',
          isHot && !isHidden && !sheetOpen && 'fab-attention',
          (isHidden || sheetOpen) ? 'fab-hidden' : 'fab-revealed',
          isExtended
            ? 'h-12 px-5 rounded-full gap-2'
            : 'h-14 w-14 rounded-full'
        )}
      >
        <Plus
          className={cn(isExtended ? 'h-5 w-5' : 'h-7 w-7')}
          strokeWidth={3}
          style={{
            transform: sheetOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        {isExtended && (
          <span className="text-sm font-bold tracking-tight">Meetup</span>
        )}
        {isHot && !isHidden && !sheetOpen && (
          <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[hsl(var(--brand-red))]/55 animate-ping" />
        )}
      </button>

      <MoveTonightSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
