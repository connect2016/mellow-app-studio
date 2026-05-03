import { SEOMeta } from '@/components/SEOMeta';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { GameTimeMatchBanner } from '@/components/GameTimeMatchBanner';
import { IntentType, GamedayIntentType, FanStyleType } from '@/types';
import { SlidersHorizontal, Users, Zap, Camera } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CrewsContent from '@/components/CrewsContent';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscoverProfiles } from '@/hooks/useProfile';
import { useSendLike, usePass } from '@/hooks/useInteractions';
import { DiscoverFilterDrawer } from '@/components/DiscoverFilterDrawer';
import { HappeningNow } from '@/components/HappeningNow';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { SmartMeetupSuggestions } from '@/components/SmartMeetupSuggestions';
import { SocialProofBanner } from '@/components/SocialProofBanner';
import { PostGameExperience } from '@/components/PostGameExperience';
import { CubsScoreboard } from '@/components/CubsScoreboard';
import { GamedayStateHero } from '@/components/GamedayStateHero';
import { useGamedayMode } from '@/contexts/GamedayModeContext';
import bgWrigleyville from '@/assets/cubs-bar-interior.webp';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveGame, useGeoUpdater, useGameTimeMatchTrigger } from '@/hooks/useGameTimeMatch';
import { useProfile } from '@/hooks/useProfile';
import { useCompatibility } from '@/hooks/useCompatibility';
import { toast } from 'sonner';
import { useMissionTracker } from '@/hooks/useMissionTracker';
import { LineupFeed } from '@/components/lineup/LineupFeed';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';
import { Plus } from 'lucide-react';
import { NearbyFansOnline } from '@/components/NearbyFansOnline';
import { CrewAtBarNotification } from '@/components/CrewAtBarNotification';
import { GameDayCountdown } from '@/components/GameDayCountdown';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { GameDayBanner } from '@/components/home/GameDayBanner';
import { FindFansBanner } from '@/components/home/FindFansBanner';
import { HomeQuickCarousel } from '@/components/home/HomeQuickCarousel';
import { WhosNearbyCarousel } from '@/components/WhosNearbyCarousel';
import { TonightModeView } from '@/components/home/TonightModeView';
import { useTonightMode } from '@/hooks/useTonightMode';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pickCopy, LOADING_FANS, EMPTY_FANS } from '@/lib/fan-copy';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

const STATUS_OPTIONS = [
  { value: 'AtBar', icon: 'beer', label: 'At the Bar' },
  { value: 'AtWrigley', icon: 'baseball', label: 'In my Seat' },
  { value: 'Tailgating', icon: 'fire', label: 'Tailgate' },
  { value: 'BeerSnake', icon: 'trophy', label: 'Beer Snake' },
  { value: 'WatchingRemote', icon: 'home', label: 'Home' },
] as const;

interface FilterState {
  intents: IntentType[];
  gamedayIntents: GamedayIntentType[];
  statuses: string[];
  distance: number;
  ageRange: number[];
  wrigleyOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  intents: [],
  gamedayIntents: [],
  statuses: [],
  distance: 25,
  ageRange: [21, 65],
  wrigleyOnly: false,
};

export default function Discover() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { gamedayMode, toggleGamedayMode } = useGamedayMode();
  const { data: profiles = [], isLoading } = useDiscoverProfiles();
  const { data: myProfile } = useProfile();
  const sendLike = useSendLike();
  const pass = usePass();
  const { data: activeGame } = useActiveGame();
  const gameTimeMatch = useGameTimeMatchTrigger();
  const queryClient = useQueryClient();
  useGeoUpdater();
  const tracker = useMissionTracker();
  const compatMap = useCompatibility(profiles);
  const { data: cubsGame } = useMlbCubsGame();
  const isGameDay = !!cubsGame && cubsGame.status !== 'no-game';
  const tonight = useTonightMode({ isGameDay });

  // Motion: badge flash on activation + brief exit animation when toggling off.
  const [badgeFlash, setBadgeFlash] = useState(false);
  const [exitingTonight, setExitingTonight] = useState(false);
  const prevActive = useRef(tonight.active);
  useEffect(() => {
    if (prevActive.current === tonight.active) return;
    if (tonight.active) {
      setBadgeFlash(true);
      const id = setTimeout(() => setBadgeFlash(false), 1200);
      try { navigator.vibrate?.(10); } catch {}
      prevActive.current = tonight.active;
      return () => clearTimeout(id);
    } else {
      // Schedule exit animation, then mark previous so toggle is honored
      setExitingTonight(true);
      const id = setTimeout(() => setExitingTonight(false), 260);
      prevActive.current = tonight.active;
      return () => clearTimeout(id);
    }
  }, [tonight.active]);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [matchCelebration, setMatchCelebration] = useState<string | null>(null);
  const [settingStatus, setSettingStatus] = useState(false);
  const [showLineupCreate, setShowLineupCreate] = useState(false);
  const [uploadingSnake, setUploadingSnake] = useState(false);

  const currentStatus = (myProfile?.game_status as string) ?? 'NotSet';

  const handleSetStatus = async (status: string) => {
    if (!user) return;
    setSettingStatus(true);
    try {
      const newStatus = currentStatus === status ? 'NotSet' : status;
      await supabase
        .from('profiles')
        .update({
          game_status: newStatus,
          location_last_set_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['live-fan-counts'] });
      if (newStatus !== 'NotSet') {
        const opt = STATUS_OPTIONS.find(s => s.value === newStatus);
        toast(`Status set to "${opt?.label}"`);
        // Track missions
        if (newStatus === 'AtWrigley') { tracker.trackCheckInWrigley(); tracker.trackAttendGame(); }
        if (newStatus === 'AtBar') tracker.trackCheckInBar();
        if (newStatus === 'BeerSnake') tracker.trackBeerSnake();
      } else {
        toast('Status cleared');
      }
    } finally {
      setSettingStatus(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Live fan counters
  const { data: liveCounts } = useQuery({
    queryKey: ['live-fan-counts'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: active } = await supabase
        .from('profiles')
        .select('game_status')
        .eq('is_banned', false)
        .eq('onboarding_completed', true)
        .gte('location_last_set_at', sixHoursAgo);

      const online = active?.length ?? 0;
      const atWrigley = active?.filter(p => p.game_status === 'AtWrigley').length ?? 0;
      return { online, atWrigley };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const SIX_HOURS = 6 * 60 * 60 * 1000;

  const activeFilterCount =
    filters.intents.length +
    filters.gamedayIntents.length +
    filters.statuses.length +
    (filters.distance !== 25 ? 1 : 0) +
    (filters.ageRange[0] !== 21 || filters.ageRange[1] !== 65 ? 1 : 0);

  const filtered = profiles.filter((u) => {
    const userIntents = (u.intent as string[]) ?? [];
    if (filters.intents.length && !filters.intents.some((i) => userIntents.includes(i))) return false;

    // Gameday intent filter
    const userGamedayIntents = ((u as any).gameday_intents as string[]) ?? [];
    if (filters.gamedayIntents.length && !filters.gamedayIntents.some((gi) => userGamedayIntents.includes(gi))) return false;

    const locationSetAt = (u as any).location_last_set_at;
    const isExpired = locationSetAt && (Date.now() - new Date(locationSetAt).getTime() > SIX_HOURS);
    const effectiveStatus = isExpired ? 'NotSet' : (u.game_status ?? 'NotSet');

    if (filters.statuses.length && !filters.statuses.includes(effectiveStatus)) return false;

    if (u.age && (u.age < filters.ageRange[0] || u.age > filters.ageRange[1])) return false;
    return true;
  });

  const toCardUser = (p: typeof profiles[0]) => ({
    id: p.user_id,
    display_name: p.display_name,
    email: '',
    auth_provider: '',
    profile_photo: p.profile_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    age: p.age ?? 0,
    pronouns: p.pronouns ?? undefined,
    bio: p.bio ?? '',
    intent: (p.intent as IntentType[]) ?? [],
    favorite_player: p.favorite_player ?? '',
    favorite_moment: p.favorite_moment ?? '',
    favorite_moment_is_valid: true,
    location_city: '',
    distance_pref_miles: 25,
    age_min: 21,
    age_max: 50,
    game_status: (p.game_status ?? 'NotSet') as any,
    wrigley_section: p.wrigley_section ?? undefined,
    wrigley_row: p.wrigley_row ?? undefined,
    wrigley_seat: p.wrigley_seat ?? undefined,
    wrigley_location_privacy: 'Hidden' as any,
    wrigleyville_bar: p.wrigleyville_bar ?? undefined,
    bar_location_privacy: 'Hidden' as any,
    last_active: p.updated_at,
    is_verified: p.is_verified ?? false,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
    gameday_intents: ((p as any).gameday_intents as GamedayIntentType[]) ?? [],
    fan_style: ((p as any).fan_style as FanStyleType[]) ?? [],
  });

  const handleLike = async (profile: typeof profiles[0]) => {
    const result = await sendLike.mutateAsync({ toUser: profile.user_id, isHiFive: false });
    if (result.isMatch) {
      setMatchCelebration(profile.display_name);
      setTimeout(() => setMatchCelebration(null), 3000);

      // Check for game-time match if there's an active game
      if (activeGame) {
        gameTimeMatch.mutate({ otherUserId: profile.user_id, gameId: activeGame.id });
      }
    }
  };

  const handleHiFive = async (profile: typeof profiles[0], message?: string) => {
    const result = await sendLike.mutateAsync({ toUser: profile.user_id, isHiFive: true, message });
    if (result.isMutualHiFive) {
      setMatchCelebration(profile.display_name);
      setTimeout(() => setMatchCelebration(null), 3000);
    }
  };

  return (
    <div className="min-h-screen pb-52 relative overflow-x-hidden">
      <SEOMeta
        title="Discover Fans — Cubbies Buddies"
        description="Discover Cubs fans near Wrigleyville. Match with buddies, find your section, and plan game-day meetups."
      />
      {/* Dynamic background image — parallax bg layer (40% drag) */}
      <div className="fixed inset-0 z-0 swipe-drag-bg" data-route-parallax="bg">
        <img
          src={bgWrigleyville}
          alt=""
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }} />
        {gamedayMode && <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />}
      </div>

      {/* Foreground — full-speed drag layer */}
      <div className="relative z-10 swipe-drag" data-route-parallax="fg">
      <AppHeader />

      {/* Match celebration overlay */}
      {matchCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-7xl mb-4"
            >
              
            </motion.div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">
              It's a Match!
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              You and {matchCelebration} are connected
            </p>
          </motion.div>
          {/* Confetti particles */}
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 10 + 6,
                height: Math.random() * 10 + 6,
                backgroundColor: i % 3 === 0 ? 'hsl(var(--secondary))' : i % 3 === 1 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--accent))',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, Math.random() * -180 - 40],
              }}
              transition={{
                duration: 1.8,
                delay: Math.random() * 0.6,
                repeat: Infinity,
                repeatDelay: Math.random() * 0.8,
              }}
            />
          ))}
        </motion.div>
      )}

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Gameday Mode Toggle */}
        <div className={`rounded-xl border px-4 py-3 mb-4 transition-all duration-300 ${
          gamedayMode 
            ? 'border-secondary bg-secondary/10 shadow-md shadow-secondary/10' 
            : 'border-border bg-card/80 backdrop-blur-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-base transition-transform duration-300 ${gamedayMode ? 'scale-110' : ''}`}>
                {gamedayMode ? '' : ''}
              </span>
              <span className={`text-sm font-semibold transition-colors duration-300 ${
                gamedayMode ? 'text-secondary' : 'text-foreground'
              }`}>
                {gamedayMode ? 'Game Day is ON' : 'Gameday Mode'}
              </span>
              {gamedayMode && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                </span>
              )}
            </div>
            <Switch checked={gamedayMode} onCheckedChange={toggleGamedayMode} />
          </div>
          <p className="text-xs italic mt-0.5 text-destructive-foreground">
            Game Day Mode updates your meetups, missions, and fan badges live as the game unfolds.
          </p>
        </div>

        {/* Today / Tonight Mode toggle */}
        <div
          className={cn(
            'rounded-xl border px-3 py-2 mb-4 flex items-center justify-between gap-2 bg-card/80 backdrop-blur-sm',
            tonight.active ? 'border-yellow-300/70 tonight-mode-glow' : 'border-border'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              tonight.active ? 'bg-yellow-300 text-brand-blue' : 'bg-muted text-muted-foreground',
              badgeFlash && 'tonight-badge-flash'
            )}>
              {tonight.active ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                {tonight.active ? 'Tonight Mode' : 'Today'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {tonight.active
                  ? (tonight.nearWrigley ? 'Live near Wrigley · fans, meetups, bars only' : 'Game-night focus · fans, meetups, bars only')
                  : 'Full home feed'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
            <button
              type="button"
              onClick={() => tonight.setActive(false)}
              className={cn(
                'px-3 h-8 rounded-full text-[11px] font-bold transition-colors',
                !tonight.active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => tonight.setActive(true)}
              className={cn(
                'px-3 h-8 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1',
                tonight.active ? 'bg-brand-blue text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Moon className="h-3 w-3" /> Tonight
            </button>
          </div>
        </div>

        {tonight.active ? (
          <TonightModeView className="mb-4" />
        ) : exitingTonight ? (
          <div className="tonight-exit mb-4" aria-hidden />
        ) : (
          <>
            {/* Game Day banner — only renders on game days */}
            <GameDayBanner />

            {/* Friend-finding hero banner */}
            <FindFansBanner />

            {/* Personalized carousel: New Fans · Meetups · Bars · Crew Picks */}
            <HomeQuickCarousel />

            {/* Suggested fans strip */}
            <div className="mb-2">
              <div className="px-4 mb-1 flex items-baseline justify-between">
                <h2
                  className="text-[15px] font-extrabold uppercase tracking-wide text-white"
                  style={{ fontFamily: 'Norwester, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  Suggested Fans Nearby
                </h2>
                <Link to="/discover" className="text-[11px] font-bold text-white/90 underline-offset-2 hover:underline">
                  See all
                </Link>
              </div>
              <WhosNearbyCarousel />
            </div>

            {/* Personalized feed: meetups, vibes, map, specials, photos, carb-up */}
            <HomeDashboard />
          </>
        )}

        {/* Game-Time Match Banner */}
        <GameTimeMatchBanner />

        {/* Missions Banner */}
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/missions')}
          className="w-full mb-4 flex items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-3 text-left transition-all hover:bg-secondary/10"
        >
          <span className="text-2xl"></span>
          <div className="flex-1">
            <p className="mt-2 font-semibold text-white">Game Day Missions</p>
            <p className="text-sm text-destructive-foreground">Complete challenges, earn points & badges</p>
          </div>
          <span className="text-xs font-semibold text-yellow-300">View →</span>
        </motion.button>

        {/* Current Status — playful pill selector */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <ConceptIcon name="pin" className="h-4 w-4 text-secondary" />
            <p className="text-sm font-bold uppercase tracking-wide text-white" style={{ fontFamily: 'Norwester, sans-serif' }}>
              Your Status
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x">
            {STATUS_OPTIONS.map((opt) => {
              const active = currentStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={settingStatus}
                  onClick={() => handleSetStatus(opt.value)}
                  className={cn(
                    'snap-start relative flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95',
                    active
                      ? 'border-secondary bg-secondary text-secondary-foreground shadow-[0_0_18px_hsl(var(--secondary)/0.55)] animate-fab-tap'
                      : 'border-white/20 bg-card/80 text-foreground backdrop-blur-sm hover:border-secondary/50'
                  )}
                >
                  <ConceptIcon name={opt.icon} className="h-4 w-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Beer Snake photo upload */}
        {currentStatus === 'BeerSnake' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <label
              className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-500/40 bg-green-500/5 px-4 py-3 text-sm font-semibold cursor-pointer transition-colors hover:bg-green-500/10 ${uploadingSnake ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Camera className="h-5 w-5 text-green-600" />
              <span className="text-amber-300">
                {uploadingSnake ? 'Uploading...' : ' Share your Beer Snake pic!'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploadingSnake}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setUploadingSnake(true);
                  try {
                    const ext = file.name.split('.').pop();
                    const path = `${user.id}/beer-snake-${Date.now()}.${ext}`;
                    const { error: uploadErr } = await supabase.storage
                      .from('vibe-media')
                      .upload(path, file, { upsert: true });
                    if (uploadErr) throw uploadErr;

                    const { data: urlData } = supabase.storage
                      .from('vibe-media')
                      .getPublicUrl(path);

                    await supabase.from('vibe_posts').insert({
                      user_id: user.id,
                      media_url: urlData.publicUrl,
                      media_type: 'image',
                      location_tag: 'Bleachers – Beer Snake ',
                      caption: ' Beer snake sighting in the bleachers!',
                    });

                    toast.success(' Beer snake photo shared to the Vibe Feed!');
                    queryClient.invalidateQueries({ queryKey: ['vibe-posts'] });
                  } catch (err: any) {
                    toast.error(err.message || 'Upload failed');
                  } finally {
                    setUploadingSnake(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </motion.div>
        )}
        {/* Discover header — tagline + sticky Filters */}
        <div className="sticky top-2 z-20 -mx-1 mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-card/80 px-3 py-2 backdrop-blur-md">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-foreground" style={{ fontFamily: 'Norwester, sans-serif' }}>
              Discover Fans
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">Find your crew. Build your night.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative h-10 gap-1.5 rounded-full border-secondary/40"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Tabbed Discover: Buddies vs Crews — large playful cards */}
        <Tabs defaultValue="buddies" className="mb-6">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="buddies"
              className="group relative flex h-24 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-primary/80 to-primary/40 p-3 text-left text-primary-foreground shadow-md transition-all data-[state=active]:scale-[1.02] data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-secondary active:scale-[0.98]"
            >
              <Zap className="absolute right-2 top-2 h-5 w-5 opacity-70" />
              <span className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'Norwester, sans-serif' }}>
                Buddies
              </span>
              <span className="text-[10px] font-medium opacity-90">Find your people tonight</span>
            </TabsTrigger>
            <TabsTrigger
              value="crews"
              className="group relative flex h-24 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-secondary/80 to-secondary/40 p-3 text-left text-secondary-foreground shadow-md transition-all data-[state=active]:scale-[1.02] data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-primary active:scale-[0.98]"
            >
              <Users className="absolute right-2 top-2 h-5 w-5 opacity-70" />
              <span className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'Norwester, sans-serif' }}>
                Crews
              </span>
              <span className="text-[10px] font-medium opacity-90">Roll with a squad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buddies">
            {liveCounts && (liveCounts.online > 0 || liveCounts.atWrigley > 0) && (
              <div className="mb-3 flex items-center gap-3">
                {liveCounts.online > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    {liveCounts.online} fans online
                  </span>
                )}
                {liveCounts.atWrigley > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {liveCounts.atWrigley} at Wrigley
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="py-20 text-center">
                <p className="text-4xl animate-pulse"></p>
                <p className="mt-2 font-semibold text-muted-foreground">{pickCopy(LOADING_FANS)}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl"></p>
                <p className="mt-2 font-semibold text-destructive-foreground">No fans found</p>
                <p className="text-sm text-destructive-foreground">{pickCopy(EMPTY_FANS)}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...filtered]
                  .sort((a, b) => {
                    const scoreA = compatMap.get(a.user_id)?.score ?? 0;
                    const scoreB = compatMap.get(b.user_id)?.score ?? 0;
                    return scoreB - scoreA;
                  })
                  .map((profile) => {
                  const cardUser = toCardUser(profile);
                  const compat = compatMap.get(profile.user_id);
                  return (
                    <ProfileCard
                      key={profile.id}
                      user={cardUser}
                      currentUserFanStyles={(myProfile?.fan_style as FanStyleType[]) ?? []}
                      matchReasons={compat?.topReasons}
                      matchScore={compat?.score}
                      onHiFive={(msg) => handleHiFive(profile, msg)}
                      onSendDog={() => {
                        sendLike.mutate({ toUser: profile.user_id, isHiFive: true, message: ' Sent you a Hot Dog!' });
                      }}
                      onLike={() => handleLike(profile)}
                      onSendBeer={() => navigate(`/beer-money?to=${profile.user_id}`)}
                      onViewProfile={() => navigate(`/profile/${profile.user_id}`)}
                      onPass={() => pass.mutate(profile.user_id)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="crews">
            <CrewsContent />
          </TabsContent>
        </Tabs>
      </div>

      <DiscoverFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />

      <CreateMeetupModal open={showLineupCreate} onClose={() => setShowLineupCreate(false)} />

      {/* Fixed Quick Actions bar — sits just above the bottom nav, scrollable with edge fade */}
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 z-30 border-t border-white/10 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}
      >
        <div className="relative mx-auto max-w-lg">
          <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none snap-x snap-mandatory">
            {[
              { label: "Hot Spots", icon: 'fire', to: '/bar-map' },
              { label: 'Nearby Fans', icon: 'people', to: '/buddy-heatmap' },
              { label: 'Vibes', icon: 'camera', to: '/vibe-feed' },
              { label: 'Missions', icon: 'trophy', to: '/missions' },
              { label: 'Hall of Fame', icon: 'trophy', to: '/league-leaders' },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                aria-label={q.label}
                onClick={() => navigate(q.to)}
                className="snap-start flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-card/80 px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-card active:scale-95"
              >
                <ConceptIcon name={q.icon} className="h-4 w-4 text-secondary" />
                {q.label}
              </button>
            ))}
          </div>
          {/* Right-edge fade hint so users see the bar is scrollable */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background/95 to-transparent" />
        </div>
      </nav>
      </div>
    </div>
  );
}
