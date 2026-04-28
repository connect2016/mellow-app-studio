// Friendly Wrigley Guide microcopy — humorous, food/crew-themed.
// Use with `pickCopy(EMPTY_FANS)` to rotate per render.

export const EMPTY_FANS = [
  'Your crew is out there — probably eating nachos.',
  'No fans nearby… yet. Grab a slice and check back.',
];

export const EMPTY_MEETUPS = [
  'No meetups on deck — be the first to call a slice run.',
  'Your crew is out there — probably eating nachos.',
];

export const LOADING_FANS = [
  'Finding fans… and maybe fries.',
  'Loading your Wrigleyville crew.',
];

export const TOAST_NEW_BUDDY = 'Nice! You just made a new Buddy.';
export const TOAST_HI_FIVE = 'Hi-Five sent — vibes delivered.';

export function pickCopy(pool: string[], seed?: string): string {
  if (pool.length === 0) return '';
  if (!seed) return pool[Math.floor(Math.random() * pool.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}
