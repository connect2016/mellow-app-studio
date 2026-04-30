/**
 * Watches a user's trophies + per-category leaderboard rank. When something
 * changes in a "celebratable" way we insert a notification row so the bell
 * tab + push channel both pick it up.
 *
 * Snapshot state lives in localStorage so we don't spam users on every refetch
 * and so the very first session quietly seeds baselines (no spam on install).
 *
 * The weekly / monthly reset banners are also handled here based on the
 * locally cached "last seen" period boundary.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrophies } from '@/hooks/useTrophies';
import {
  useLeagueLeaders,
  type LeaderboardCategory,
} from '@/hooks/useLeagueLeaders';
import {
  trophyLabel,
  type TrophyKey,
} from '@/components/trophies/TrophyIcon';

const TRACKED_CATEGORIES: { key: LeaderboardCategory; label: string }[] = [
  { key: 'beersToday',          label: 'Beers Today' },
  { key: 'beersThisWeek',       label: 'Beers This Week' },
  { key: 'barsVisitedToday',    label: 'Bars Today' },
  { key: 'barsVisitedThisWeek', label: 'Bars This Week' },
  { key: 'meetupsFinished',     label: 'Meetups Done' },
  { key: 'fansConnected',       label: 'Fans Connected' },
  { key: 'shotsTakenSeason',    label: 'Shots Taken' },
  { key: 'appetizersHadSeason', label: 'Appetizers' },
];

// Map our hook's legacy trophy keys to canonical TrophyKey for nice labels.
const TROPHY_KEY_MAP: Record<string, TrophyKey> = {
  first_hi_five: 'first_hi_five',
  fans_10: 'fans_10',
  fans_50: 'fans_50',
  first_meetup: 'first_meetup',
  hosted_5: 'meetups_hosted_5',
  joined_10: 'meetups_joined_10',
  first_carb_up: 'first_appetizer',
  apps_5: 'appetizers_5',
  fav_spot: 'first_appetizer',
  first_beer: 'first_beer',
  beers_10_week: 'beers_10_week',
  beers_100: 'beers_100_season',
  first_shot: 'first_shot',
  shots_10: 'shots_10_season',
  bars_5: 'wrigleyville_marathoner',
  bars_10: 'wrigleyville_marathoner',
  opening_day: 'opening_day',
  night_game: 'night_game',
  marathoner: 'wrigleyville_marathoner',
};

interface RankSnapshot { [category: string]: number }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled — best-effort */
  }
}

function isoWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

function monthStart(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

interface PendingNotification {
  type: string;
  title: string;
  body: string;
  emoji: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

async function insertNotifications(userId: string, notes: PendingNotification[]) {
  if (notes.length === 0) return;
  await supabase.from('notifications').insert(
    notes.map((n) => ({
      user_id: userId,
      type: n.type,
      title: n.title,
      body: n.body,
      emoji: n.emoji,
      action_url: n.action_url ?? null,
      metadata: (n.metadata ?? {}) as any,
    })),
  );
}

/**
 * Mount once near the top of the authenticated app. Re-evaluates whenever the
 * underlying trophy / leaderboard queries refetch.
 */
export function useAchievementNotifications() {
  const { user } = useAuth();

  // Pull current trophy state. The hook already polls via React Query.
  const { data: trophies = [] } = useTrophies();

  // Per-category rank watcher — one query each. They all hit the same RPC and
  // benefit from React Query caching, so this is cheap.
  const ranks = TRACKED_CATEGORIES.map((c) => useLeagueLeaders(c.key, 100, 'season'));

  // Ref so a single "first run" pass per session seeds baselines silently.
  const seededRef = useRef(false);

  // ---- Trophies -----------------------------------------------------------
  useEffect(() => {
    if (!user || trophies.length === 0) return;

    const storageKey = `cb-trophies-earned:${user.id}`;
    const earnedNow = trophies.filter((t) => t.earned).map((t) => t.key).sort();
    const seenBefore = readJson<string[]>(storageKey, []);

    if (seenBefore.length === 0 && earnedNow.length > 0 && !seededRef.current) {
      // First sync — just record current state, don't spam.
      writeJson(storageKey, earnedNow);
      return;
    }

    const newlyEarned = earnedNow.filter((k) => !seenBefore.includes(k));
    if (newlyEarned.length === 0) return;

    const notes: PendingNotification[] = newlyEarned.map((legacyKey) => {
      const trophy = trophies.find((t) => t.key === legacyKey)!;
      const canonical = TROPHY_KEY_MAP[legacyKey] ?? null;
      const niceTitle = canonical ? trophyLabel(canonical) : trophy.title;
      return {
        type: 'achievement_earned',
        title: 'New Trophy Unlocked',
        body: `You earned: ${niceTitle}`,
        emoji: '🏆',
        action_url: '/profile',
        metadata: { trophy_key: legacyKey, canonical_key: canonical },
      };
    });

    insertNotifications(user.id, notes).finally(() => {
      writeJson(storageKey, earnedNow);
    });
  }, [user, trophies]);

  // ---- Leaderboard movement ----------------------------------------------
  useEffect(() => {
    if (!user) return;
    if (ranks.some((r) => r.isLoading)) return;

    const storageKey = `cb-rank-snapshot:${user.id}`;
    const previous = readJson<RankSnapshot>(storageKey, {});
    const current: RankSnapshot = {};
    const notes: PendingNotification[] = [];

    TRACKED_CATEGORIES.forEach((cat, i) => {
      const rows = ranks[i].data ?? [];
      const me = rows.find((r) => r.user_id === user.id);
      if (!me) return; // not on the board; nothing to compare
      current[cat.key] = me.rank;

      const prev = previous[cat.key];
      if (prev == null) return; // first time we see them ranked — silent

      // Climbed
      if (me.rank < prev) {
        if (me.rank === 1) {
          notes.push({
            type: 'rank_first',
            title: `You're now #1 in ${cat.label}!`,
            body: `Top of the league — keep stacking ${cat.label.toLowerCase()}.`,
            emoji: '🥇',
            action_url: '/league-leaders',
            metadata: { category: cat.key, rank: me.rank, previous_rank: prev },
          });
        } else if (prev > 10 && me.rank <= 10) {
          notes.push({
            type: 'rank_top10',
            title: `Top 10 — ${cat.label}`,
            body: `You just entered the Top 10 at #${me.rank}.`,
            emoji: '⭐',
            action_url: '/league-leaders',
            metadata: { category: cat.key, rank: me.rank, previous_rank: prev },
          });
        } else {
          notes.push({
            type: 'rank_up',
            title: `Climbed to #${me.rank} in ${cat.label}`,
            body: `Up from #${prev}. Don't slow down.`,
            emoji: '📈',
            action_url: '/league-leaders',
            metadata: { category: cat.key, rank: me.rank, previous_rank: prev },
          });
        }
      }
      // Passed
      else if (me.rank > prev) {
        notes.push({
          type: 'rank_passed',
          title: `A fan passed you in ${cat.label}`,
          body: `You slipped to #${me.rank}. Time to catch up.`,
          emoji: '⚾',
          action_url: '/league-leaders',
          metadata: { category: cat.key, rank: me.rank, previous_rank: prev },
        });
      }
    });

    if (notes.length > 0) {
      insertNotifications(user.id, notes).finally(() => {
        writeJson(storageKey, { ...previous, ...current });
      });
    } else if (Object.keys(current).length > 0) {
      writeJson(storageKey, { ...previous, ...current });
    }
  }, [user, ...ranks.map((r) => r.dataUpdatedAt)]); // eslint-disable-line

  // ---- Weekly / monthly reset banners ------------------------------------
  useEffect(() => {
    if (!user) return;
    const storageKey = `cb-period-seen:${user.id}`;
    const seen = readJson<{ week?: string; month?: string }>(storageKey, {});
    const week = isoWeekStart();
    const month = monthStart();
    const notes: PendingNotification[] = [];

    if (seen.week && seen.week !== week) {
      notes.push({
        type: 'weekly_reset',
        title: 'Weekly leaderboard has reset',
        body: 'Fresh week, fresh ranks — climb the board.',
        emoji: '🔄',
        action_url: '/league-leaders',
        metadata: { period: 'week', period_start: week },
      });
    }
    if (seen.month && seen.month !== month) {
      notes.push({
        type: 'monthly_reset',
        title: 'New month, new leaderboard',
        body: 'Fresh start — every fan back to zero.',
        emoji: '🗓️',
        action_url: '/league-leaders',
        metadata: { period: 'month', period_start: month },
      });
    }

    if (notes.length > 0) {
      insertNotifications(user.id, notes);
    }
    writeJson(storageKey, { week, month });
  }, [user]);
}
