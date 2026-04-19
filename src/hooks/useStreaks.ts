import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StreakData {
  key: 'gameday' | 'daily_app' | 'weekly_social' | 'bar_checkin';
  label: string;
  emoji: string;
  current: number;
  best: number;
  unit: 'days' | 'weeks' | 'games';
  description: string;
  /** ms remaining until streak resets if no action is taken */
  expiresInMs: number | null;
}

function dayKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

/** ISO week key: YYYY-Wxx, week starts Monday */
function weekKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // Move to Monday
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - (day - 1));
  return x.toISOString();
}

/** Count consecutive days in `daySet` ending today (or yesterday if today empty). Grace: today missing OK. */
function computeDayStreak(daySet: Set<string>): { current: number; best: number; expiresInMs: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // current
  let current = 0;
  const cursor = new Date(today);
  if (!daySet.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best (scan all days in set)
  const sorted = Array.from(daySet).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const d = new Date(iso);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  best = Math.max(best, current);

  // Expires when "tomorrow" ends (must act by end of tomorrow to keep streak)
  const tomorrowEnd = new Date(today);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
  const expiresInMs = current > 0 ? tomorrowEnd.getTime() - Date.now() : null;

  return { current, best, expiresInMs };
}

function computeWeekStreak(weekSet: Set<string>): { current: number; best: number; expiresInMs: number | null } {
  const now = new Date();
  const thisWeek = weekKey(now);

  let current = 0;
  const cursor = new Date(now);
  if (!weekSet.has(weekKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }
  while (weekSet.has(weekKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 7);
  }

  const sorted = Array.from(weekSet).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const d = new Date(iso);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / (7 * 86400000));
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  best = Math.max(best, current);

  // Expires at end of next week if user hasn't acted this week
  const acted = weekSet.has(thisWeek);
  let expiresInMs: number | null = null;
  if (current > 0) {
    const endOfWeek = new Date(thisWeek);
    endOfWeek.setDate(endOfWeek.getDate() + (acted ? 14 : 7));
    expiresInMs = endOfWeek.getTime() - Date.now();
  }

  return { current, best, expiresInMs };
}

export function useStreaks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['streaks', user?.id],
    queryFn: async (): Promise<StreakData[]> => {
      if (!user) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sinceIso = sixMonthsAgo.toISOString();

      const [
        barCheckinsRes,
        passportRes,
        missionProgressRes,
        likesRes,
        meetupMembersRes,
        memoriesRes,
      ] = await Promise.all([
        supabase
          .from('bar_checkins')
          .select('checked_in_at')
          .eq('user_id', user.id)
          .gte('checked_in_at', sinceIso),
        supabase
          .from('passport_checkins')
          .select('verified_at')
          .eq('user_id', user.id)
          .gte('verified_at', sinceIso),
        supabase
          .from('mission_progress')
          .select('updated_at, completed_at')
          .eq('user_id', user.id)
          .gte('updated_at', sinceIso),
        supabase
          .from('likes')
          .select('created_at')
          .eq('from_user', user.id)
          .gte('created_at', sinceIso),
        supabase
          .from('lineup_members')
          .select('joined_at')
          .eq('user_id', user.id)
          .gte('joined_at', sinceIso),
        supabase
          .from('game_memories')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sinceIso),
      ]);

      // 1. Game day attendance — counts days with bar check-in OR passport check-in OR game memory
      const gamedayDays = new Set<string>();
      barCheckinsRes.data?.forEach((r) => gamedayDays.add(dayKey(new Date(r.checked_in_at))));
      passportRes.data?.forEach((r) => gamedayDays.add(dayKey(new Date(r.verified_at))));
      memoriesRes.data?.forEach((r) => gamedayDays.add(dayKey(new Date(r.created_at))));
      const gameday = computeDayStreak(gamedayDays);

      // 2. Daily app activity — any mission progress update OR like sent OR check-in
      const appDays = new Set<string>(gamedayDays);
      missionProgressRes.data?.forEach((r) => appDays.add(dayKey(new Date(r.updated_at))));
      likesRes.data?.forEach((r) => appDays.add(dayKey(new Date(r.created_at))));
      const dailyApp = computeDayStreak(appDays);

      // 3. Weekly social — weeks with a like sent or meetup joined
      const socialWeeks = new Set<string>();
      likesRes.data?.forEach((r) => socialWeeks.add(weekKey(new Date(r.created_at))));
      meetupMembersRes.data?.forEach((r) => socialWeeks.add(weekKey(new Date(r.joined_at))));
      const weeklySocial = computeWeekStreak(socialWeeks);

      // 4. Bar check-in weeks
      const barWeeks = new Set<string>();
      barCheckinsRes.data?.forEach((r) => barWeeks.add(weekKey(new Date(r.checked_in_at))));
      const barCheckin = computeWeekStreak(barWeeks);

      return [
        {
          key: 'gameday',
          label: 'Game Day',
          emoji: '🏟️',
          current: gameday.current,
          best: gameday.best,
          unit: 'days',
          description: 'Consecutive days you showed up to the ballpark or a Wrigleyville bar',
          expiresInMs: gameday.expiresInMs,
        },
        {
          key: 'daily_app',
          label: 'Daily',
          emoji: '🔥',
          current: dailyApp.current,
          best: dailyApp.best,
          unit: 'days',
          description: 'Consecutive days you were active in the app',
          expiresInMs: dailyApp.expiresInMs,
        },
        {
          key: 'weekly_social',
          label: 'Social',
          emoji: '🤝',
          current: weeklySocial.current,
          best: weeklySocial.best,
          unit: 'weeks',
          description: 'Consecutive weeks you joined a meetup or sent a hi-five',
          expiresInMs: weeklySocial.expiresInMs,
        },
        {
          key: 'bar_checkin',
          label: 'Bar Crawl',
          emoji: '🍺',
          current: barCheckin.current,
          best: barCheckin.best,
          unit: 'weeks',
          description: 'Consecutive weeks with a bar check-in',
          expiresInMs: barCheckin.expiresInMs,
        },
      ];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
