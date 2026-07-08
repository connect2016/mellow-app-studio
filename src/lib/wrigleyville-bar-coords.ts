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
  { name: "Wrigley View Rooftop",        slug: "wrigley-view-rooftop",     address: "1050 W Waveland Ave", lat: 41.949161, lng: -87.656402 },
  { name: "Lucky Dorr",                 slug: "lucky-dorr",              address: "1101 W Waveland Ave", lat: 41.948820, lng: -87.656886 },
  { name: "Budweiser Brickhouse Tavern", slug: "brickhouse-tavern",       address: "3647 N Clark St",     lat: 41.948622, lng: -87.657337 },
  { name: "Small Cheval",               slug: "small-cheval",            address: "1119 W Waveland Ave", lat: 41.948929, lng: -87.657710 },
  { name: "The Graystone Tavern",       slug: "graystone-tavern",        address: "3441 N Sheffield Ave", lat: 41.944789, lng: -87.654007 },
  { name: "The Stretch Bar & Grill",    slug: "stretch-bar-grill",       address: "3485 N Clark St",     lat: 41.945781, lng: -87.655089 },
  { name: "Nola Bar & Kitchen",         slug: "nola-bar-kitchen",        address: "3481 N Clark St",     lat: 41.945702, lng: -87.655012 },
  { name: "Rizzo's Bar & Inn",         slug: "rizzos-bar-inn",          address: "3658 N Clark St",     lat: 41.948631, lng: -87.657921 },
  { name: "HVAC Pub",                   slug: "hvac-pub",                address: "3530 N Clark St",     lat: 41.946247, lng: -87.656144 },
  { name: "Roadhouse 66 Gas N' Grill", slug: "roadhouse-66",            address: "3478 N Clark St",     lat: 41.945335, lng: -87.655403 },
  { name: "Vines on Clark",             slug: "vines-on-clark",          address: "3554 N Clark St",     lat: 41.946882, lng: -87.656454 },
  { name: "GMan Tavern",                slug: "gman-tavern",             address: "3740 N Clark St",     lat: 41.950018, lng: -87.658968 },
  { name: "Underground Lounge",         slug: "underground-lounge",      address: "952 W Newport Ave",   lat: 41.944601, lng: -87.653950 },
  { name: "Trader Todd's",            slug: "trader-todds",            address: "3216 N Sheffield Ave", lat: 41.940442, lng: -87.654370 },
  { name: "Sheffield's Wine & Beer Garden", slug: "sheffields",         address: "3258 N Sheffield Ave", lat: 41.941589, lng: -87.654518 },
  { name: "L&L Tavern",                 slug: "ll-tavern",               address: "3207 N Clark St",     lat: 41.940217, lng: -87.650696 },
  { name: "Houndstooth Saloon",         slug: "houndstooth-saloon",      address: "3369 N Clark St",     lat: 41.943387, lng: -87.653233 },
  { name: "Stolen Saddle",              slug: "stolen-saddle",           address: "3505 N Clark St",     lat: 41.945873, lng: -87.655180 },
  { name: "DraftKings at Wrigley Field", slug: "draftkings-wrigley",     address: "1012 W Addison St",   lat: 41.947415, lng: -87.654658 },
];

export function findParticipatingBar(name?: string | null): ParticipatingBar | null {
  if (!name) return null;
  const target = name.trim().toLowerCase();
  return PARTICIPATING_BARS.find(b => b.name.toLowerCase() === target) ?? null;
}

export const isParticipatingBar = (name?: string | null) => !!findParticipatingBar(name);
