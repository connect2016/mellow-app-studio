// Cubbies Buddies Data Types

export type IntentType = 'FriendToWatch' | 'ShareABeer' | 'PostGameMeetup' | 'Dating';
export type GameStatus = 'AtWrigley' | 'AtBar' | 'Tailgating' | 'WatchingRemote' | 'BeerSnake' | 'NotSet';
export type PrivacyLevel = 'Public' | 'MatchesOnly' | 'Hidden';
export type ReportReason = 'Harassment' | 'Spam' | 'FakeProfile' | 'InappropriateContent' | 'SafetyConcern' | 'Other';

export const INTENT_LABELS: Record<IntentType, string> = {
  FriendToWatch: 'Friend to Watch',
  ShareABeer: 'Share a Beer',
  PostGameMeetup: 'Post-Game Meetup',
  Dating: 'Dating',
};

export const INTENT_EMOJI: Record<IntentType, string> = {
  FriendToWatch: '⚾',
  ShareABeer: '🍺',
  PostGameMeetup: '🎉',
  Dating: '❤️',
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  AtWrigley: 'In my Seat',
  AtBar: 'At the Bar',
  Tailgating: 'Tailgating',
  BeerSnake: 'Beer Snake',
  WatchingRemote: 'Watching from Home',
  NotSet: 'Not Set',
};

export const GAME_STATUS_EMOJI: Record<GameStatus, string> = {
  AtWrigley: '⚾️',
  AtBar: '🍺',
  Tailgating: '🌭',
  WatchingRemote: '🏠',
  NotSet: '',
};

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  auth_provider: string;
  profile_photo: string;
  age: number;
  birthdate?: string;
  pronouns?: string;
  bio: string;
  intent: IntentType[];
  favorite_player: string;
  favorite_moment: string;
  favorite_moment_is_valid: boolean;
  location_city: string;
  distance_pref_miles: number;
  age_min: number;
  age_max: number;
  game_status: GameStatus;
  wrigley_section?: string;
  wrigley_row?: string;
  wrigley_seat?: string;
  wrigley_location_privacy: PrivacyLevel;
  wrigleyville_bar?: string;
  bar_location_privacy: PrivacyLevel;
  last_active: string;
  is_verified: boolean;
  is_banned: boolean;
  blocked_users: string[];
  hidden_from_discover: boolean;
  is_admin?: boolean;
  superstition?: string;
  stretch_song?: string;
  best_bar?: string;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  created_date: string;
  status: 'pending' | 'matched' | 'blocked';
}

export interface Like {
  id: string;
  from_user: string;
  to_user: string;
  created_date: string;
  is_hi_five: boolean;
  message?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message_at: string;
  last_message_preview: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: string;
  body: string;
  created_date: string;
  is_read: boolean;
}

export interface BeerPayment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  note?: string;
  stripe_payment_intent_id?: string;
  status: 'created' | 'succeeded' | 'failed' | 'refunded';
  created_date: string;
}

export interface Report {
  id: string;
  reporter: string;
  reported_user: string;
  reason: ReportReason;
  details: string;
  created_date: string;
  status: 'open' | 'reviewing' | 'closed';
  admin_notes?: string;
}

export interface Bar {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
}

// Mock data
export const WRIGLEYVILLE_BARS: Bar[] = [
  { id: '1', name: "Murphy's Bleachers", address: '3655 N Sheffield Ave', neighborhood: 'Wrigleyville' },
  { id: '2', name: 'Sluggers', address: '3540 N Clark St', neighborhood: 'Wrigleyville' },
  { id: '3', name: "Casey Moran's", address: '3660 N Clark St', neighborhood: 'Wrigleyville' },
  { id: '4', name: 'Cubby Bear', address: '1059 W Addison St', neighborhood: 'Wrigleyville' },
  { id: '5', name: "Bernie's Tap & Grill", address: '3664 N Clark St', neighborhood: 'Wrigleyville' },
  { id: '6', name: 'Sports Corner', address: '956 W Addison St', neighborhood: 'Wrigleyville' },
  { id: '7', name: 'Old Crow Smokehouse', address: '3506 N Clark St', neighborhood: 'Wrigleyville' },
  { id: '8', name: "Nisei Lounge", address: '3439 N Sheffield Ave', neighborhood: 'Wrigleyville' },
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    display_name: 'Alex M.',
    email: 'alex@example.com',
    auth_provider: 'google',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    age: 28,
    pronouns: 'he/him',
    bio: 'Bleacher creature since 2010. Never miss a home stand.',
    intent: ['FriendToWatch', 'ShareABeer'],
    favorite_player: 'Dansby Swanson',
    favorite_moment: 'Kris Bryant diving catch against the Cardinals',
    favorite_moment_is_valid: true,
    location_city: 'Chicago',
    distance_pref_miles: 10,
    age_min: 21,
    age_max: 40,
    game_status: 'AtWrigley',
    wrigley_section: '202',
    wrigley_row: '8',
    wrigley_seat: '4',
    wrigley_location_privacy: 'Public',
    wrigleyville_bar: "Murphy's Bleachers",
    bar_location_privacy: 'MatchesOnly',
    last_active: new Date().toISOString(),
    is_verified: true,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    superstition: 'Same hat every game day',
    stretch_song: 'Go Cubs Go (duh)',
    best_bar: "Murphy's Bleachers",
  },
  {
    id: '2',
    display_name: 'Jordan T.',
    email: 'jordan@example.com',
    auth_provider: 'facebook',
    profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
    age: 31,
    pronouns: 'she/her',
    bio: "Die-hard fan. Let's grab a beer and talk stats!",
    intent: ['ShareABeer', 'Dating'],
    favorite_player: 'Ian Happ',
    favorite_moment: "Rizzo's walk-off homer in the rain",
    favorite_moment_is_valid: true,
    location_city: 'Chicago',
    distance_pref_miles: 15,
    age_min: 25,
    age_max: 45,
    game_status: 'AtBar',
    wrigley_location_privacy: 'Hidden',
    wrigleyville_bar: 'Cubby Bear',
    bar_location_privacy: 'Public',
    last_active: new Date().toISOString(),
    is_verified: true,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    superstition: 'Rally cap in the 7th',
    stretch_song: 'Take Me Out to the Ball Game',
    best_bar: 'Cubby Bear',
  },
  {
    id: '3',
    display_name: 'Sam R.',
    email: 'sam@example.com',
    auth_provider: 'google',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    age: 25,
    pronouns: 'they/them',
    bio: 'New to Chicago, looking for game-day buddies!',
    intent: ['FriendToWatch', 'PostGameMeetup'],
    favorite_player: 'Seiya Suzuki',
    favorite_moment: "Suzuki's grand slam debut",
    favorite_moment_is_valid: true,
    location_city: 'Chicago',
    distance_pref_miles: 20,
    age_min: 21,
    age_max: 35,
    game_status: 'WatchingRemote',
    wrigley_location_privacy: 'Hidden',
    bar_location_privacy: 'Hidden',
    last_active: new Date().toISOString(),
    is_verified: false,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    stretch_song: 'Sweet Home Chicago',
    best_bar: 'Sluggers',
  },
  {
    id: '4',
    display_name: 'Taylor K.',
    email: 'taylor@example.com',
    auth_provider: 'google',
    profile_photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    age: 29,
    pronouns: 'she/her',
    bio: 'Season ticket holder. Section 228 fam!',
    intent: ['Dating', 'PostGameMeetup'],
    favorite_player: 'Nico Hoerner',
    favorite_moment: 'My first time catching a foul ball',
    favorite_moment_is_valid: true,
    location_city: 'Chicago',
    distance_pref_miles: 10,
    age_min: 25,
    age_max: 38,
    game_status: 'AtWrigley',
    wrigley_section: '228',
    wrigley_row: '3',
    wrigley_location_privacy: 'Public',
    bar_location_privacy: 'MatchesOnly',
    last_active: new Date().toISOString(),
    is_verified: true,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    superstition: 'Never leave early, even when losing by 10',
    best_bar: "Casey Moran's",
  },
  {
    id: '5',
    display_name: 'Chris P.',
    email: 'chris@example.com',
    auth_provider: 'facebook',
    profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    age: 34,
    pronouns: 'he/him',
    bio: 'Stats nerd. Always down for post-game deep dives.',
    intent: ['FriendToWatch', 'ShareABeer', 'PostGameMeetup'],
    favorite_player: 'Cody Bellinger',
    favorite_moment: 'Kerry Wood 20K game',
    favorite_moment_is_valid: true,
    location_city: 'Chicago',
    distance_pref_miles: 25,
    age_min: 21,
    age_max: 50,
    game_status: 'NotSet',
    wrigley_location_privacy: 'Hidden',
    bar_location_privacy: 'Hidden',
    last_active: new Date(Date.now() - 86400000).toISOString(),
    is_verified: false,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    superstition: 'Must eat a Chicago dog in the 3rd inning',
    stretch_song: 'Go Cubs Go',
    best_bar: 'Old Crow Smokehouse',
  },
];
