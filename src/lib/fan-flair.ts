// Feature 4 — Fan Flair Badges
// Auto-derives a single visible "flair tier" from existing profile data.
// Tiers are ordered low → high; the user's flair is the highest tier they qualify for.

export type FlairTier =
  | 'rookie'
  | 'regular'
  | 'bleacher_creature'
  | 'road_warrior'
  | 'wrigley_lifer';

export interface FlairContext {
  /** Proxy for games attended — uses streak_total_game_days from profiles. */
  gamesAttended: number;
  /** Count of meetups hosted (creator_id matches user). */
  hostedMeetups: number;
  /** User's home zip code (5-digit US). */
  zipCode?: string | null;
}

export interface FlairDef {
  key: FlairTier;
  label: string;
  description: string;
  /** Returns true if the user qualifies for this tier. */
  qualifies: (ctx: FlairContext) => boolean;
  /** Returns plain progress hint copy when not yet earned (e.g. "3 more games to unlock"). */
  progress: (ctx: FlairContext) => string | null;
}

// Chicago zip codes start with 606. Anything else = "Road Warrior" out-of-area.
function isOutOfArea(zip?: string | null) {
  if (!zip) return false;
  const z = zip.trim();
  if (z.length < 5) return false;
  return !z.startsWith('606');
}

export const FLAIR_DEFINITIONS: FlairDef[] = [
  {
    key: 'rookie',
    label: 'Rookie',
    description: 'Welcome to the bleachers — start opening on game days.',
    qualifies: () => true,
    progress: () => null,
  },
  {
    key: 'regular',
    label: 'Regular',
    description: '3+ game days under your belt.',
    qualifies: (c) => c.gamesAttended >= 3,
    progress: (c) =>
      c.gamesAttended >= 3
        ? null
        : `${3 - c.gamesAttended} more game day${3 - c.gamesAttended === 1 ? '' : 's'} to unlock Regular`,
  },
  {
    key: 'bleacher_creature',
    label: 'Bleacher Creature',
    description: '10+ games attended OR 3+ meetups hosted.',
    qualifies: (c) => c.gamesAttended >= 10 || c.hostedMeetups >= 3,
    progress: (c) => {
      if (c.gamesAttended >= 10 || c.hostedMeetups >= 3) return null;
      const gameGap = Math.max(0, 10 - c.gamesAttended);
      const hostGap = Math.max(0, 3 - c.hostedMeetups);
      return gameGap <= hostGap * 3
        ? `${gameGap} more games to unlock Bleacher Creature`
        : `Host ${hostGap} more meetup${hostGap === 1 ? '' : 's'} to unlock Bleacher Creature`;
    },
  },
  {
    key: 'road_warrior',
    label: 'Road Warrior',
    description: 'Out-of-area fan repping the Cubs from afar.',
    qualifies: (c) => isOutOfArea(c.zipCode),
    progress: (c) =>
      isOutOfArea(c.zipCode)
        ? null
        : 'Set a home zip code outside the 606 area to unlock Road Warrior',
  },
  {
    key: 'wrigley_lifer',
    label: 'Wrigley Lifer',
    description: '25+ game days. You bleed Cubbie blue.',
    qualifies: (c) => c.gamesAttended >= 25,
    progress: (c) =>
      c.gamesAttended >= 25
        ? null
        : `${25 - c.gamesAttended} more game days to unlock Wrigley Lifer`,
  },
];

/**
 * Returns the highest tier the user qualifies for.
 * Road Warrior is an orthogonal "lifestyle" tier — when both Road Warrior and a
 * games-based tier apply, prefer the higher one (rank by definition order, with
 * Wrigley Lifer > Road Warrior > Bleacher Creature > Regular > Rookie).
 */
export function computeFlair(ctx: FlairContext): FlairDef {
  const qualified = FLAIR_DEFINITIONS.filter((d) => d.qualifies(ctx));
  return qualified[qualified.length - 1] ?? FLAIR_DEFINITIONS[0];
}
