import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { GameTimeMatchBanner } from '@/components/GameTimeMatchBanner';
import { IntentType } from '@/types';
import { SlidersHorizontal, Users, Zap, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscoverProfiles } from '@/hooks/useProfile';
import { useSendLike, usePass } from '@/hooks/useInteractions';
import { DiscoverFilterDrawer } from '@/components/DiscoverFilterDrawer';
import { HappeningNow } from '@/components/HappeningNow';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { SmartMeetupSuggestions } from '@/components/SmartMeetupSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveGame, useGeoUpdater, useGameTimeMatchTrigger } from '@/hooks/useGameTimeMatch';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'AtBar', emoji: '🍺', label: 'At the Bar' },
  { value: 'AtWrigley', emoji: '⚾️', label: 'In my Seat' },
  { value: 'Tailgating', emoji: '🌭', label: 'Tailgating' },
  { value: 'BeerSnake', emoji: '🐍', label: 'Beer Snake' },
  { value: 'WatchingRemote', emoji: '🏠', label: 'Watching from Home' },
] as const;

interface FilterState {
  intents: IntentType[];
  statuses: string[];
  distance: number;
  ageRange: number[];
  wrigleyOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  intents: [],
  statuses: [],
  distance: 25,
  ageRange: [21, 65],
  wrigleyOnly: false,
};

export default function Discover() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profiles = [], isLoading } = useDiscoverProfiles();
  const { data: myProfile } = useProfile();
  const sendLike = useSendLike();
  const pass = usePass();
  const { data: activeGame } = useActiveGame();
  const gameTimeMatch = useGameTimeMatchTrigger();
  const queryClient = useQueryClient();
  useGeoUpdater();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [matchCelebration, setMatchCelebration] = useState<string | null>(null);
  const [settingStatus, setSettingStatus] = useState(false);
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
        toast(`${opt?.emoji} Status set to "${opt?.label}"`);
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
    filters.statuses.length +
    (filters.distance !== 25 ? 1 : 0) +
    (filters.ageRange[0] !== 21 || filters.ageRange[1] !== 65 ? 1 : 0);

  const filtered = profiles.filter((u) => {
    const userIntents = (u.intent as string[]) ?? [];
    if (filters.intents.length && !filters.intents.some((i) => userIntents.includes(i))) return false;

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
    favorite_moment_is_valid: p.favorite_moment_is_valid ?? true,
    location_city: '',
    distance_pref_miles: p.distance_pref_miles ?? 25,
    age_min: p.age_min ?? 21,
    age_max: p.age_max ?? 50,
    game_status: (p.game_status ?? 'NotSet') as any,
    wrigley_section: p.wrigley_section ?? undefined,
    wrigley_row: p.wrigley_row ?? undefined,
    wrigley_seat: p.wrigley_seat ?? undefined,
    wrigley_location_privacy: (p.wrigley_location_privacy ?? 'Hidden') as any,
    wrigleyville_bar: p.wrigleyville_bar ?? undefined,
    bar_location_privacy: (p.bar_location_privacy ?? 'Hidden') as any,
    last_active: p.updated_at,
    is_verified: p.is_verified ?? false,
    is_banned: false,
    blocked_users: [],
    hidden_from_discover: false,
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

  const handleHiFive = async (profile: typeof profiles[0]) => {
    const result = await sendLike.mutateAsync({ toUser: profile.user_id, isHiFive: true });
    if (result.isMutualHiFive) {
      setMatchCelebration(profile.display_name);
      setTimeout(() => setMatchCelebration(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
              🎉
            </motion.div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
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
        {/* Game-Time Match Banner */}
        <GameTimeMatchBanner />

        {/* Happening Now */}
        <div className="mb-4">
          <HappeningNow />
        </div>

        {/* Live Activity Feed */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-3">
          <LiveActivityFeed maxItems={4} />
        </div>

        {/* AI Meetup Suggestions */}
        <div className="mb-4">
          <SmartMeetupSuggestions />
        </div>

        {/* Current Status Toggle */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Status</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_OPTIONS.map((opt) => {
              const active = currentStatus === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.95 }}
                  disabled={settingStatus}
                  onClick={() => handleSetStatus(opt.value)}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.35)]'
                      : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="status-glow"
                      className="absolute inset-0 rounded-full ring-2 ring-primary/50"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </motion.button>
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
              <span className="text-green-700 dark:text-green-400">
                {uploadingSnake ? 'Uploading...' : '📸 Share your Beer Snake pic!'}
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
                      location_tag: 'Bleachers – Beer Snake 🐍',
                      caption: '🐍 Beer snake sighting in the bleachers!',
                    });

                    toast.success('🐍 Beer snake photo shared to the Vibe Feed!');
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Discover
            </h2>
            {liveCounts && (liveCounts.online > 0 || liveCounts.atWrigley > 0) && (
              <div className="flex items-center gap-3 mt-0.5">
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
                    🏟️ {liveCounts.atWrigley} at Wrigley
                  </span>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative gap-1.5 rounded-full"
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

        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-4xl animate-pulse">⚾</p>
            <p className="mt-2 font-semibold text-muted-foreground">Finding fans...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">⚾</p>
            <p className="mt-2 font-semibold">No fans found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((profile) => {
              const cardUser = toCardUser(profile);
              return (
                <ProfileCard
                  key={profile.id}
                  user={cardUser}
                  onHiFive={() => handleHiFive(profile)}
                  onLike={() => handleLike(profile)}
                  onSendBeer={() => navigate(`/beer-money?to=${profile.user_id}`)}
                  onViewProfile={() => navigate(`/profile/${profile.user_id}`)}
                  onPass={() => pass.mutate(profile.user_id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <DiscoverFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
