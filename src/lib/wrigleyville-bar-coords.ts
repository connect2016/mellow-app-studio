// Verified participating venues for Beer Money redemption.
// Coordinates kept here so the Beer Map and Beer Money flow share one source of truth.

export interface ParticipatingBar {
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
}

export const PARTICIPATING_BARS: ParticipatingBar[] = [
  { name: "Murphy's Bleachers", slug: 'murphys-bleachers', address: '3655 N Sheffield Ave', lat: 41.9498, lng: -87.6556 },
  { name: 'Sluggers',           slug: 'sluggers',          address: '3540 N Clark St',     lat: 41.9478, lng: -87.6559 },
  { name: "Casey Moran's",      slug: 'casey-morans',      address: '3660 N Clark St',     lat: 41.9501, lng: -87.6559 },
  { name: 'Cubby Bear',         slug: 'cubby-bear',        address: '1059 W Addison St',   lat: 41.9474, lng: -87.6565 },
  { name: "Bernie's Tap & Grill", slug: 'bernies',         address: '3664 N Clark St',     lat: 41.9503, lng: -87.6559 },
  { name: 'Sports Corner',      slug: 'sports-corner',     address: '956 W Addison St',    lat: 41.9473, lng: -87.6578 },
  { name: 'Old Crow Smokehouse', slug: 'old-crow',         address: '3506 N Clark St',     lat: 41.9465, lng: -87.6558 },
  { name: 'Nisei Lounge',       slug: 'nisei-lounge',      address: '3439 N Sheffield Ave', lat: 41.9450, lng: -87.6556 },
  { name: 'The Dark Horse',     slug: 'dark-horse',        address: '3443 N Sheffield Ave', lat: 41.9451, lng: -87.6540 },
  { name: "Merkle's Bar & Grill", slug: 'merkles',         address: '3516 N Clark St',      lat: 41.9467, lng: -87.6558 },
  { name: "Guthrie's Tavern",   slug: 'guthries',          address: '1300 W Addison St',    lat: 41.9474, lng: -87.6607 },
  { name: 'Rockwood Place',     slug: 'rockwood',          address: '3466 N Clark St',      lat: 41.9458, lng: -87.6557 },
];

export function findParticipatingBar(name?: string | null): ParticipatingBar | null {
  if (!name) return null;
  const target = name.trim().toLowerCase();
  return PARTICIPATING_BARS.find(b => b.name.toLowerCase() === target) ?? null;
}

export const isParticipatingBar = (name?: string | null) => !!findParticipatingBar(name);
