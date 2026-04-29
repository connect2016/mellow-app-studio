import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { cn } from '@/lib/utils';

// Routes where the FAB should be hidden
const HIDDEN_ROUTES = ['/', '/auth', '/onboarding', '/quick-start', '/verify'];

export function CreateMeetupFab() {
  const location = useLocation();
  const { user } = useAuth();
  const { open, isOpen } = useCreateMeetup();

  // Detect nearby activity → adds a subtle pulse to encourage tapping
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
    isOpen || // already in create flow
    !user;

  if (hidden) return null;

  const isHot = (activity?.active ?? 0) >= 3;

  return (
    <button
      type="button"
      aria-label="Create a meetup"
      onClick={() => open()}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        // Sits just above bottom nav (~64px) with safe-area padding
        'bottom-[72px]',
        'h-14 w-14 rounded-full flex items-center justify-center',
        'bg-[#C8102E] text-white',
        'shadow-[0_8px_24px_rgba(200,16,46,0.45),0_2px_6px_rgba(0,0,0,0.25)]',
        'ring-4 ring-background',
        'transition-transform duration-150 active:scale-90 hover:scale-105',
        isHot && 'animate-bounce-soft'
      )}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Plus className="h-7 w-7" strokeWidth={3} />
      {isHot && (
        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#C8102E]/60 animate-ping" />
      )}
    </button>
  );
}
