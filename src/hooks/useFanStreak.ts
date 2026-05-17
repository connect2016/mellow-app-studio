import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

/** Cubs-time (America/Chicago) game date as ISO 'YYYY-MM-DD'. */
function chicagoDateISO(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
}

/**
 * Silently records a "streak day" the first time a signed-in user opens
 * the app on a Cubs home game day. Fires a one-time reset toast if their
 * streak broke. Designed to be mounted once at the app root.
 */
export function useFanStreak() {
  const { user } = useAuth();
  const { data: cubsGame } = useMlbCubsGame();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!user || !cubsGame || !profile) return;

    // Only count Cubs HOME game days. Skip away games & off-days.
    if (cubsGame.status === 'no-game' || cubsGame.homeAway !== 'home') return;

    const today = chicagoDateISO();
    // Already counted today
    if (profile.last_streak_date === today) {
      firedRef.current = true;
      return;
    }

    firedRef.current = true;
    (async () => {
      const { data, error } = await supabase.rpc('record_fan_streak_open', {
        p_game_date: today,
      });
      if (error) {
        console.warn('[useFanStreak] failed', error);
        return;
      }
      const res = data as {
        fan_streak: number;
        streak_freezes: number;
        reset: boolean;
        used_freeze: boolean;
        earned_freeze: boolean;
      };

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      if (res.reset && (profile.fan_streak ?? 0) > 0) {
        toast("Streak reset — but the season isn't over. Start a new one!");
      } else if (res.used_freeze) {
        toast('Streak Freeze used — your streak is safe ❄️');
      } else if (res.earned_freeze) {
        toast(`You earned a Streak Freeze! (${res.streak_freezes} banked)`);
      }
    })();
  }, [user, cubsGame, profile, queryClient]);
}

/** Mount once at app root. */
export function FanStreakTracker() {
  useFanStreak();
  return null;
}
