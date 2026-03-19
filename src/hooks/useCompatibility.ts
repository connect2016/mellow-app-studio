import { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';

interface MatchReason {
  emoji: string;
  text: string;
  weight: number;
}

export interface CompatibilityResult {
  score: number; // 0-100
  reasons: MatchReason[];
  topReasons: string[]; // formatted for display
}

interface ProfileLike {
  intent?: string[] | null;
  game_status?: string | null;
  favorite_player?: string | null;
  best_bar?: string | null;
  wrigleyville_bar?: string | null;
  wrigley_section?: string | null;
  superstition?: string | null;
  stretch_song?: string | null;
  age?: number | null;
}

const INTENT_LABELS: Record<string, string> = {
  FriendToWatch: 'watching games together',
  ShareABeer: 'grabbing a beer',
  PostGameMeetup: 'post-game meetups',
  Dating: 'dating',
};

function computeCompatibility(me: ProfileLike, them: ProfileLike): CompatibilityResult {
  const reasons: MatchReason[] = [];

  // 1. Intent overlap (high weight)
  const myIntents = me.intent ?? [];
  const theirIntents = them.intent ?? [];
  const sharedIntents = myIntents.filter(i => theirIntents.includes(i));
  if (sharedIntents.length > 0) {
    const labels = sharedIntents.map(i => INTENT_LABELS[i] || i).slice(0, 2);
    reasons.push({
      emoji: '🎯',
      text: `You're both looking for ${labels.join(' & ')}`,
      weight: sharedIntents.length * 15,
    });
  }

  // 2. Same game-day status (attendance habits)
  const activeStatuses = ['AtWrigley', 'AtBar', 'Tailgating', 'BeerSnake'];
  const bothAtGame = activeStatuses.includes(me.game_status ?? '') && activeStatuses.includes(them.game_status ?? '');
  if (me.game_status && them.game_status && me.game_status === them.game_status && me.game_status !== 'NotSet') {
    const statusTexts: Record<string, string> = {
      AtWrigley: 'You\'re both at the game right now!',
      AtBar: 'You\'re both at the bar!',
      Tailgating: 'You\'re both tailgating!',
      BeerSnake: 'You\'re both doing the Beer Snake!',
      WatchingRemote: 'You\'re both watching from home',
    };
    reasons.push({ emoji: '📍', text: statusTexts[me.game_status] ?? 'Same vibe right now', weight: 20 });
  } else if (bothAtGame) {
    reasons.push({ emoji: '🏟️', text: 'You\'re both at Wrigley today', weight: 12 });
  }

  // 3. Same bar preference (social/drinking)
  const myBar = me.best_bar || me.wrigleyville_bar;
  const theirBar = them.best_bar || them.wrigleyville_bar;
  if (myBar && theirBar && myBar.toLowerCase() === theirBar.toLowerCase()) {
    reasons.push({ emoji: '🍺', text: `You both love ${myBar}`, weight: 15 });
  }

  // 4. Same favorite player
  if (me.favorite_player && them.favorite_player &&
      me.favorite_player.toLowerCase() === them.favorite_player.toLowerCase()) {
    reasons.push({ emoji: '⭐', text: `Both ${them.favorite_player} fans!`, weight: 12 });
  }

  // 5. Nearby sections (group behavior proxy)
  if (me.wrigley_section && them.wrigley_section) {
    const diff = Math.abs(parseInt(me.wrigley_section) - parseInt(them.wrigley_section));
    if (diff === 0) {
      reasons.push({ emoji: '🪑', text: 'You\'re in the same section!', weight: 18 });
    } else if (diff <= 3) {
      reasons.push({ emoji: '👋', text: `Only ${diff} sections apart`, weight: 10 });
    }
  }

  // 6. Same superstition or stretch song (personality match)
  if (me.superstition && them.superstition &&
      me.superstition.toLowerCase().includes(them.superstition.toLowerCase().slice(0, 8))) {
    reasons.push({ emoji: '🧢', text: 'Similar Cubs superstitions!', weight: 8 });
  }
  if (me.stretch_song && them.stretch_song &&
      me.stretch_song.toLowerCase() === them.stretch_song.toLowerCase()) {
    reasons.push({ emoji: '🎵', text: `Both sing "${them.stretch_song}" at the stretch`, weight: 8 });
  }

  // 7. Similar age (social compatibility)
  if (me.age && them.age) {
    const ageDiff = Math.abs(me.age - them.age);
    if (ageDiff <= 3) {
      reasons.push({ emoji: '👥', text: 'Similar age range', weight: 6 });
    }
  }

  // 8. Solo vs group: if both have only 1 intent → solo vibes
  if (myIntents.length === 1 && theirIntents.length === 1 && sharedIntents.length === 1) {
    reasons.push({ emoji: '🤝', text: 'Focused on the same thing', weight: 5 });
  }
  // If both have 3+ intents → social butterflies
  if (myIntents.length >= 3 && theirIntents.length >= 3) {
    reasons.push({ emoji: '🦋', text: 'Both social butterflies — down for anything!', weight: 5 });
  }

  // Calculate score
  const totalWeight = reasons.reduce((sum, r) => sum + r.weight, 0);
  const score = Math.min(99, Math.max(reasons.length > 0 ? 25 : 0, totalWeight));

  // Sort by weight descending
  reasons.sort((a, b) => b.weight - a.weight);

  return {
    score,
    reasons,
    topReasons: reasons.slice(0, 3).map(r => `${r.emoji} ${r.text}`),
  };
}

export function useCompatibility(profiles: ProfileLike[]): Map<string, CompatibilityResult> {
  const { data: myProfile } = useProfile();

  return useMemo(() => {
    const map = new Map<string, CompatibilityResult>();
    if (!myProfile) return map;

    const me: ProfileLike = {
      intent: myProfile.intent as string[],
      game_status: myProfile.game_status,
      favorite_player: myProfile.favorite_player,
      best_bar: myProfile.best_bar,
      wrigleyville_bar: myProfile.wrigleyville_bar,
      wrigley_section: myProfile.wrigley_section,
      superstition: myProfile.superstition,
      stretch_song: myProfile.stretch_song,
      age: myProfile.age,
    };

    for (const p of profiles) {
      const result = computeCompatibility(me, p);
      // Use a key we can look up — cast to any to get user_id
      const uid = (p as any).user_id ?? (p as any).id ?? '';
      if (uid) map.set(uid, result);
    }

    return map;
  }, [myProfile, profiles]);
}
