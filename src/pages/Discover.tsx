import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { IntentChip } from '@/components/IntentChip';
import { IntentType } from '@/types';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscoverProfiles } from '@/hooks/useProfile';
import { useSendLike, usePass } from '@/hooks/useInteractions';

export default function Discover() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profiles = [], isLoading } = useDiscoverProfiles();
  const sendLike = useSendLike();
  const pass = usePass();

  const [showFilters, setShowFilters] = useState(false);
  const [filterIntents, setFilterIntents] = useState<IntentType[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<number[]>([21, 50]);
  const [distance, setDistance] = useState<number[]>([25]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const toggleFilterIntent = (i: IntentType) => {
    setFilterIntents((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const SIX_HOURS = 6 * 60 * 60 * 1000;

  const filtered = profiles.filter((u) => {
    const userIntents = (u.intent as string[]) ?? [];
    if (filterIntents.length && !filterIntents.some((i) => userIntents.includes(i))) return false;

    // Treat expired game statuses as 'NotSet'
    const locationSetAt = (u as any).location_last_set_at;
    const isExpired = locationSetAt && (Date.now() - new Date(locationSetAt).getTime() > SIX_HOURS);
    const effectiveStatus = isExpired ? 'NotSet' : (u.game_status ?? 'NotSet');
    if (filterStatus !== 'all' && effectiveStatus !== filterStatus) return false;

    if (u.age && (u.age < ageRange[0] || u.age > ageRange[1])) return false;
    return true;
  });

  // Map DB profile to the shape ProfileCard expects
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Discover</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4 overflow-hidden rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Filter by intent</span>
              <button onClick={() => setShowFilters(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(['FriendToWatch', 'ShareABeer', 'PostGameMeetup', 'Dating'] as IntentType[]).map((i) => (
                <IntentChip key={i} intent={i} selected={filterIntents.includes(i)} onClick={() => toggleFilterIntent(i)} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ v: 'all', l: 'All' }, { v: 'AtWrigley', l: '🏟️ At Wrigley' }, { v: 'AtBar', l: '🍻 At a Bar' }, { v: 'WatchingRemote', l: '📺 Remote' }].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setFilterStatus(s.v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterStatus === s.v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  {s.l}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <Label className="text-sm">Age range: {ageRange[0]}–{ageRange[1]}</Label>
              <Slider min={21} max={65} step={1} value={ageRange} onValueChange={setAgeRange} className="py-1" />
            </div>

            <div className="mt-3 space-y-2">
              <Label className="text-sm">Distance: {distance[0]} mi</Label>
              <Slider min={1} max={50} step={1} value={distance} onValueChange={setDistance} className="py-1" />
            </div>
          </motion.div>
        )}

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
                  onHiFive={() => sendLike.mutate({ toUser: profile.user_id, isHiFive: true })}
                  onLike={() => sendLike.mutate({ toUser: profile.user_id, isHiFive: false })}
                  onSendBeer={() => navigate(`/beer-money?to=${profile.user_id}`)}
                  onViewProfile={() => navigate(`/profile/${profile.user_id}`)}
                  onPass={() => pass.mutate(profile.user_id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
