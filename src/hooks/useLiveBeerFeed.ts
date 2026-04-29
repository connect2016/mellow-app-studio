import { useState, useEffect, useCallback, useMemo } from 'react';

/* ─── Mock real-time beer activity feed ───
   In production, this would subscribe to a Supabase realtime channel
   on a `beer_transactions` table. For now we simulate a live stream. */

export interface BeerActivity {
  id: string;
  from: string;
  to: string;
  bar: string;
  amount: number;
  emoji: string;
  time: string;
  message?: string;
  isNew?: boolean;
}

const NAMES = [
  'Jake M.', 'Sarah K.', 'Alex T.', 'Mia J.', 'Tyler B.', 'Sam W.',
  'Chris P.', 'Devon L.', 'Morgan H.', 'Riley N.', 'Casey F.', 'Jordan D.',
  'Quinn A.', 'Avery G.', 'Drew R.', 'Hayden C.', 'Peyton S.', 'Blake T.',
];

const BARS = [
  "Murphy's Bleachers", 'Sluggers', 'Cubby Bear', 'Old Crow Smokehouse',
  "Casey Moran's", 'The Stretch', 'Mordecai', 'Deuces', 'Sports Corner',
  "Bernie's Tap & Grill",
];

const MESSAGES = [
  'Go Cubs!', 'Great game!', "First round's on me!", 'Cheers!',
  'Nice meeting you!', 'Cubs win!', '', '', '', '',
];

const EMOJIS = ['', '', '', '', ''];

let nextId = 1;

function randomActivity(): BeerActivity {
  const from = NAMES[Math.floor(Math.random() * NAMES.length)];
  let to = NAMES[Math.floor(Math.random() * NAMES.length)];
  while (to === from) to = NAMES[Math.floor(Math.random() * NAMES.length)];
  return {
    id: `beer-${nextId++}`,
    from,
    to,
    bar: BARS[Math.floor(Math.random() * BARS.length)],
    amount: [5, 8, 12, 15, 25][Math.floor(Math.random() * 5)],
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    time: 'just now',
    message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] || undefined,
    isNew: true,
  };
}

// Generate initial seed
const SEED: BeerActivity[] = [
  { id: 'seed-1', from: 'Jake M.', to: 'Mike R.', bar: "Murphy's Bleachers", amount: 8, emoji: '', time: '45s ago', message: 'Go Cubs!' },
  { id: 'seed-2', from: 'Sarah K.', to: 'Chris P.', bar: 'Sluggers', amount: 12, emoji: '', time: '2m ago', message: 'Great catch!' },
  { id: 'seed-3', from: 'Alex T.', to: 'Devon L.', bar: 'Cubby Bear', amount: 5, emoji: '', time: '5m ago' },
  { id: 'seed-4', from: 'Mia J.', to: 'Round', bar: 'Old Crow Smokehouse', amount: 25, emoji: '', time: '8m ago', message: "Let's gooo!" },
  { id: 'seed-5', from: 'Tyler B.', to: 'Sam W.', bar: "Casey Moran's", amount: 8, emoji: '', time: '12m ago' },
];

export function useLiveBeerFeed(maxItems = 10) {
  const [activities, setActivities] = useState<BeerActivity[]>(SEED);

  // Simulate new activity arriving every 8-15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = randomActivity();
      setActivities((prev) => {
        // Age existing items
        const aged = prev.map((a) => ({ ...a, isNew: false }));
        return [newActivity, ...aged].slice(0, maxItems);
      });
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [maxItems]);

  // Aggregate stats
  const stats = useMemo(() => {
    const barCounts: Record<string, number> = {};
    let totalAmount = 0;
    activities.forEach((a) => {
      barCounts[a.bar] = (barCounts[a.bar] || 0) + 1;
      totalAmount += a.amount;
    });

    const hottestBar = Object.entries(barCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRoundsToday: 47 + activities.filter((a) => a.id.startsWith('beer-')).length,
      activeBarCount: new Set(activities.map((a) => a.bar)).size,
      hottestBar: hottestBar ? hottestBar[0] : BARS[0],
      hottestBarCount: hottestBar ? hottestBar[1] : 0,
      totalAmountToday: 580 + totalAmount,
      fansActive: 23 + Math.floor(Math.random() * 5),
    };
  }, [activities]);

  return { activities, stats };
}
