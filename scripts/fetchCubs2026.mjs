#!/usr/bin/env node
// Fetches the Cubs 2026 regular-season schedule from the MLB Stats API
// and writes src/data/cubsSchedule2026.ts matching the CubsGame interface.

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/cubsSchedule2026.ts');

const URL =
  'https://statsapi.mlb.com/api/v1/schedule' +
  '?sportId=1&season=2026&teamId=112&gameType=R&hydrate=team,venue';

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Special-case multi-word nicknames before falling back to last word.
const NICKNAME_OVERRIDES = {
  'Diamondbacks': 'D-backs',
  'Red Sox':      'Red Sox',
  'White Sox':    'White Sox',
  'Blue Jays':    'Blue Jays',
};

function opponentNickname(teamName) {
  for (const [key, val] of Object.entries(NICKNAME_OVERRIDES)) {
    if (teamName.endsWith(key) || teamName === key) return val;
  }
  const parts = teamName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function toSlug(nickname) {
  return nickname.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
}

function formatCentralTime(utcDateStr) {
  // utcDateStr is like "2026-03-26T18:10:00Z"
  const d = new Date(utcDateStr);
  return d.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

async function main() {
  console.log('Fetching:', URL);
  let json;
  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    json = await res.json();
  } catch (err) {
    console.error('FETCH FAILED:', err.message);
    process.exit(1);
  }

  const dates = json.dates ?? [];
  const games = [];

  for (const dateEntry of dates) {
    for (const g of dateEntry.games ?? []) {
      const homeTeam = g.teams?.home?.team;
      const awayTeam = g.teams?.away?.team;
      if (!homeTeam || !awayTeam) continue;

      const isHome = homeTeam.id === 112;
      const opponentTeam = isHome ? awayTeam : homeTeam;
      const opponentName = opponentTeam.name ?? '';
      const opponent = opponentNickname(opponentName);

      const officialDate = dateEntry.date; // "2026-03-26"
      const [year, month, day] = officialDate.split('-').map(Number);
      const dateObj = new Date(officialDate + 'T12:00:00'); // local noon for weekday
      const weekday = WEEKDAYS[dateObj.getUTCDay()];

      const gameDate = g.gameDate; // UTC ISO string
      const time = gameDate ? formatCentralTime(gameDate) : 'TBD';

      const location = isHome
        ? (g.venue?.name ?? 'Wrigley Field')
        : `at ${opponent}`;

      const id = `${officialDate.replace(/-/g, '')}-${toSlug(opponent)}`;

      games.push({ id, date: officialDate, month, day, weekday, opponent, isHome, time, location });
    }
  }

  // Sort by date then time
  games.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const ts = `export interface CubsGame {
  id: string;
  date: string;
  month: number;
  day: number;
  weekday: string;
  opponent: string;
  isHome: boolean;
  time: string;
  location: string;
}

export const CUBS_SCHEDULE_2026: CubsGame[] = ${JSON.stringify(games, null, 2)};
`;

  writeFileSync(OUT, ts, 'utf8');
  console.log(`\nWrote ${games.length} games to ${OUT}`);
  console.log('\n--- First 5 ---');
  games.slice(0, 5).forEach(g => console.log(JSON.stringify(g)));
  console.log('\n--- Last 5 ---');
  games.slice(-5).forEach(g => console.log(JSON.stringify(g)));
}

main();
