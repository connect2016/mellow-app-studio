// Curated Wrigleyville food & drink directory.
// Editorially maintained — community suggestions welcome.

export type FoodCategory = 'sports-bar' | 'quick-bites' | 'sit-down' | 'hidden-gem';
export type FoodTag = 'bbq' | 'pizza' | 'tacos' | 'burgers' | 'wings' | 'brunch' | 'coffee' | 'late-night' | 'dog-friendly' | 'outdoor' | 'family' | 'craft-beer' | 'cocktails' | 'noodles' | 'donuts' | 'seafood';
export type GameDayPhase = 'before' | 'during' | 'after';
export type VibeLabel = 'Rowdy' | 'Chill' | 'Upscale' | 'Casual' | 'Dive' | 'Trendy' | 'Family' | 'Cozy';

export interface FoodSpot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: FoodCategory;
  tags: FoodTag[];
  vibe: VibeLabel;
  walkMinutes: number; // minutes walk from Wrigley marquee
  fanTip: string;
  gameDayHighlight: Record<GameDayPhase, string>;
  tvCount?: number; // for bars
  emoji: string;
}

export const CATEGORY_META: Record<FoodCategory, { label: string; emoji: string }> = {
  'sports-bar': { label: 'Classic Sports Bars', emoji: '🏟️' },
  'quick-bites': { label: 'Quick Bites', emoji: '🌭' },
  'sit-down': { label: 'Sit-Down Dining', emoji: '🍽️' },
  'hidden-gem': { label: 'Hidden Gems', emoji: '💎' },
};

export const TAG_META: Record<FoodTag, { label: string; emoji: string }> = {
  bbq: { label: 'BBQ', emoji: '🔥' },
  pizza: { label: 'Pizza', emoji: '🍕' },
  tacos: { label: 'Tacos', emoji: '🌮' },
  burgers: { label: 'Burgers', emoji: '🍔' },
  wings: { label: 'Wings', emoji: '🍗' },
  brunch: { label: 'Brunch', emoji: '🥞' },
  coffee: { label: 'Coffee', emoji: '☕' },
  'late-night': { label: 'Late Night', emoji: '🌙' },
  'dog-friendly': { label: 'Dog Friendly', emoji: '🐕' },
  outdoor: { label: 'Outdoor', emoji: '☀️' },
  family: { label: 'Family', emoji: '👨‍👩‍👧' },
  'craft-beer': { label: 'Craft Beer', emoji: '🍺' },
  cocktails: { label: 'Cocktails', emoji: '🍸' },
  noodles: { label: 'Noodles', emoji: '🍜' },
  donuts: { label: 'Donuts', emoji: '🍩' },
  seafood: { label: 'Seafood', emoji: '🦞' },
};

export const PHASE_META: Record<GameDayPhase, { label: string; emoji: string; color: string }> = {
  before: { label: 'Pre-Game', emoji: '☀️', color: 'text-amber-600 dark:text-amber-400' },
  during: { label: 'Mid-Game', emoji: '⚾', color: 'text-primary' },
  after: { label: 'Post-Game', emoji: '🎉', color: 'text-emerald-600 dark:text-emerald-400' },
};

export const FOOD_SPOTS: FoodSpot[] = [
  // ─── Classic Sports Bars ───
  {
    id: 'murphys-bleachers',
    name: "Murphy's Bleachers",
    address: '3655 N Sheffield Ave',
    lat: 41.9498, lng: -87.6556,
    category: 'sports-bar',
    tags: ['wings', 'craft-beer', 'outdoor', 'late-night'],
    vibe: 'Rowdy',
    walkMinutes: 1,
    fanTip: 'Best for post-game wings and pitchers on the patio',
    gameDayHighlight: {
      before: 'Opens early with $5 Old Style pints',
      during: 'Patio goes absolutely wild on big plays',
      after: 'Win-day shot specials — the place to be',
    },
    tvCount: 12,
    emoji: '🍻',
  },
  {
    id: 'budweiser-brickhouse',
    name: 'Budweiser Brickhouse Tavern',
    address: '3647 N Clark St',
    lat: 41.9495, lng: -87.6559,
    category: 'sports-bar',
    tags: ['burgers', 'craft-beer', 'outdoor', 'family'],
    vibe: 'Casual',
    walkMinutes: 1,
    fanTip: 'Massive rooftop with Wrigley views — arrive early',
    gameDayHighlight: {
      before: 'Brunch menu and bloody mary bar',
      during: '40+ TVs, the best spot if you don\'t have a ticket',
      after: 'Live music and late-night apps',
    },
    tvCount: 42,
    emoji: '📺',
  },
  {
    id: 'sluggers',
    name: 'Sluggers',
    address: '3540 N Clark St',
    lat: 41.9478, lng: -87.6559,
    category: 'sports-bar',
    tags: ['burgers', 'late-night', 'craft-beer'],
    vibe: 'Rowdy',
    walkMinutes: 2,
    fanTip: 'Batting cages upstairs — a must-do before your first game',
    gameDayHighlight: {
      before: 'Hit the cages while you wait',
      during: 'Two floors of screens and energy',
      after: 'Dueling pianos kick off at 9pm',
    },
    tvCount: 25,
    emoji: '⚾',
  },
  {
    id: 'cubby-bear',
    name: 'Cubby Bear',
    address: '1059 W Addison St',
    lat: 41.9474, lng: -87.6565,
    category: 'sports-bar',
    tags: ['pizza', 'late-night', 'craft-beer'],
    vibe: 'Rowdy',
    walkMinutes: 1,
    fanTip: 'Iconic live music venue — check the schedule for postgame shows',
    gameDayHighlight: {
      before: 'Pizza slices and cheap drafts',
      during: 'Standing room only on game days',
      after: 'Live bands or DJs most nights',
    },
    tvCount: 18,
    emoji: '🐻',
  },

  // ─── Quick Bites ───
  {
    id: 'small-cheval',
    name: 'Small Cheval',
    address: '1732 N Milwaukee Ave (Wrigleyville pop-up)',
    lat: 41.9470, lng: -87.6562,
    category: 'quick-bites',
    tags: ['burgers'],
    vibe: 'Trendy',
    walkMinutes: 3,
    fanTip: 'Best burger within walking distance — simple menu, perfect execution',
    gameDayHighlight: {
      before: 'Quick lunch before first pitch',
      during: 'Grab a burger between innings',
      after: 'Usually closes by 10pm — hit it early',
    },
    emoji: '🍔',
  },
  {
    id: 'wrigleyville-dogs',
    name: 'Wrigleyville Dogs',
    address: '3737 N Clark St',
    lat: 41.9510, lng: -87.6559,
    category: 'quick-bites',
    tags: ['late-night', 'family'],
    vibe: 'Casual',
    walkMinutes: 2,
    fanTip: 'Chicago-style dogs at 2am — the real MVP',
    gameDayHighlight: {
      before: 'Quick dog before you head in',
      during: 'Cheap and fast — perfect 7th inning snack run',
      after: 'Late-night spot for post-celebration fuel',
    },
    emoji: '🌭',
  },
  {
    id: 'do-rite-donuts',
    name: 'Do-Rite Donuts',
    address: '1027 W Addison St',
    lat: 41.9473, lng: -87.6570,
    category: 'quick-bites',
    tags: ['donuts', 'coffee', 'brunch'],
    vibe: 'Trendy',
    walkMinutes: 2,
    fanTip: 'The old fashioned donut is life-changing — grab coffee too',
    gameDayHighlight: {
      before: 'Best pre-game breakfast spot. Coffee + donut = ready.',
      during: 'Closes mid-afternoon on weekdays',
      after: 'Usually closed — hit it before the game',
    },
    emoji: '🍩',
  },
  {
    id: 'crisp-wrigleyville',
    name: 'Crisp',
    address: '2940 N Broadway',
    lat: 41.9350, lng: -87.6440,
    category: 'quick-bites',
    tags: ['wings'],
    vibe: 'Casual',
    walkMinutes: 10,
    fanTip: 'Korean fried chicken — worth the walk. Seoul Sassy wings are legendary.',
    gameDayHighlight: {
      before: 'Order ahead, grab and go',
      during: 'Perfect delivery order for a watch party',
      after: 'Closes at 9pm — plan accordingly',
    },
    emoji: '🍗',
  },

  // ─── Sit-Down Dining ───
  {
    id: 'smoke-daddy',
    name: 'Smoke Daddy BBQ',
    address: '3636 N Clark St',
    lat: 41.9490, lng: -87.6559,
    category: 'sit-down',
    tags: ['bbq', 'cocktails', 'outdoor', 'late-night'],
    vibe: 'Casual',
    walkMinutes: 2,
    fanTip: 'Brisket + live blues = perfect postgame vibe',
    gameDayHighlight: {
      before: 'Smoked wings appetizer with a cold one',
      during: 'Order delivery to your couch',
      after: 'Live blues, cold whiskey, slow-smoked brisket',
    },
    emoji: '🔥',
  },
  {
    id: 'big-star',
    name: 'Big Star',
    address: '3640 N Clark St',
    lat: 41.9492, lng: -87.6559,
    category: 'sit-down',
    tags: ['tacos', 'cocktails', 'outdoor', 'dog-friendly'],
    vibe: 'Trendy',
    walkMinutes: 2,
    fanTip: 'Whiskey + tacos on the patio — doesn\'t get better',
    gameDayHighlight: {
      before: 'Breakfast tacos and mezcal',
      during: 'Patio crowd watches on phones together',
      after: 'Late-night tacos and margaritas',
    },
    emoji: '🌮',
  },
  {
    id: 'coda-di-volpe',
    name: 'Coda di Volpe',
    address: '3441 N Southport Ave',
    lat: 41.9445, lng: -87.6634,
    category: 'sit-down',
    tags: ['pizza', 'cocktails', 'outdoor'],
    vibe: 'Upscale',
    walkMinutes: 8,
    fanTip: 'Neapolitan pizza that\'ll make you forget the score',
    gameDayHighlight: {
      before: 'Perfect pre-game date spot',
      during: 'Quiet escape from the Clark St madness',
      after: 'Wood-fired pizza and a glass of wine',
    },
    emoji: '🍕',
  },
  {
    id: 'ella-elli',
    name: 'Ella Elli',
    address: '1349 W Cornelia Ave',
    lat: 41.9450, lng: -87.6630,
    category: 'sit-down',
    tags: ['brunch', 'cocktails', 'outdoor'],
    vibe: 'Upscale',
    walkMinutes: 7,
    fanTip: 'Gorgeous patio brunch — book ahead on weekends',
    gameDayHighlight: {
      before: 'Boozy brunch before a day game',
      during: 'Quiet, sit-down dining away from the crowds',
      after: 'Craft cocktails and shared plates',
    },
    emoji: '🥂',
  },

  // ─── Hidden Gems ───
  {
    id: 'cozys-noodles',
    name: "Cozy's Noodles and Rice",
    address: '3456 N Sheffield Ave',
    lat: 41.9455, lng: -87.6556,
    category: 'hidden-gem',
    tags: ['noodles', 'family'],
    vibe: 'Cozy',
    walkMinutes: 4,
    fanTip: 'Thai food that locals swear by — pad thai is the move',
    gameDayHighlight: {
      before: 'Quick, affordable lunch',
      during: 'Delivery to nearby bars',
      after: 'Cozy sit-down when you need a break from bars',
    },
    emoji: '🍜',
  },
  {
    id: 'nisei-lounge',
    name: 'Nisei Lounge',
    address: '3439 N Sheffield Ave',
    lat: 41.9450, lng: -87.6556,
    category: 'hidden-gem',
    tags: ['craft-beer', 'late-night', 'dog-friendly'],
    vibe: 'Dive',
    walkMinutes: 5,
    fanTip: 'Best dive bar in the neighborhood — cash only, no pretense',
    gameDayHighlight: {
      before: 'Cheap pre-game drinks for purists',
      during: 'Locals-only vibe, no tourists',
      after: 'Late-night spot when Clark St is too much',
    },
    emoji: '🥃',
  },
  {
    id: 'dimo-pizza',
    name: "Dimo's Pizza",
    address: '3463 N Clark St',
    lat: 41.9460, lng: -87.6558,
    category: 'hidden-gem',
    tags: ['pizza', 'late-night', 'family'],
    vibe: 'Casual',
    walkMinutes: 3,
    fanTip: 'Mac & cheese pizza at 2am is a rite of passage',
    gameDayHighlight: {
      before: 'Slices by the window',
      during: 'Quick pizza break',
      after: 'The official late-night fuel of Wrigleyville',
    },
    emoji: '🍕',
  },
  {
    id: 'tango-sur',
    name: 'Tango Sur',
    address: '3763 N Southport Ave',
    lat: 41.9510, lng: -87.6634,
    category: 'hidden-gem',
    tags: ['outdoor'],
    vibe: 'Cozy',
    walkMinutes: 9,
    fanTip: 'BYOB Argentinean steakhouse — bring a bottle of Malbec',
    gameDayHighlight: {
      before: 'Not a game-day spot — save for off days',
      during: 'BYOB dinner while the game\'s on your phone',
      after: 'Celebratory steak dinner after a big win',
    },
    emoji: '🥩',
  },
];
