import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { IntentType } from '@/types';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscoverProfiles } from '@/hooks/useProfile';
import { useSendLike, usePass } from '@/hooks/useInteractions';
import { DiscoverFilterDrawer } from '@/components/DiscoverFilterDrawer';

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
  const sendLike = useSendLike();
  const pass = usePass();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            Discover
          </h2>
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

      <DiscoverFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
