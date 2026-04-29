import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DynamicBackground } from '@/components/DynamicBackground';
import { AppHeader } from '@/components/AppHeader';

import { UserBaseballCard } from '@/components/UserBaseballCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Flag, Ban, EyeOff, MessageCircle, IdCard, Sparkles, Settings as SettingsIcon, ShieldCheck, HelpCircle, LifeBuoy, Info, ChevronRight, Target, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntentType, GameStatus, GamedayIntentType } from '@/types';
import { useStatPreferences } from '@/hooks/useStatPreferences';
import { FavoriteBarsSection } from '@/components/profile/FavoriteBarsSection';
import { BadgesSection } from '@/components/profile/BadgesSection';
import { MeetupHistorySection } from '@/components/profile/MeetupHistorySection';
import { SavedPlansSection } from '@/components/profile/SavedPlansSection';
import { PrivateModeBanner } from '@/components/profile/PrivateModeBanner';
import { PrivateModeToggle } from '@/components/profile/PrivateModeToggle';
import { AchievementsHub } from '@/components/achievements/AchievementsHub';
import { FoodPromptsSection, type FoodPromptKey } from '@/components/profile/FoodPromptsSection';
import { RecruitButton } from '@/components/teammates/RecruitButton';
import { useTeammates } from '@/hooks/useTeammates';
import { TeammatesSummary } from '@/components/teammates/TeammatesSummary';
import { Users } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const isOwnProfile = !id || id === user?.id;
  const { preferences: statPreferences } = useStatPreferences();

  const { data: otherProfile, isLoading } = useQuery({
    queryKey: ['view-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_user_ids: [id],
        p_limit: 1,
      });
      if (error) throw error;
      return (data && data.length > 0) ? data[0] : null;
    },
    enabled: !!id && !isOwnProfile,
  });

  // For non-own profiles, fetch private fields (favorite_bars, private_mode) directly.
  // RLS allows only own profile reads, so this returns nothing for others — we treat
  // missing as "no favorites" / "private mode off". Display from public RPC otherwise.
  const { data: extraFields } = useQuery({
    queryKey: ['profile-extras', id ?? user?.id],
    queryFn: async () => {
      const targetId = id ?? user?.id;
      if (!targetId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('favorite_bars, private_mode, pregame_meal, postgame_food, carb_up_strategy, favorite_bar_food, post_win_meal')
        .eq('user_id', targetId)
        .maybeSingle();
      return data;
    },
    enabled: !!(id ?? user?.id),
  });

  // Are the two users matched? (controls private-mode visibility)
  const { data: isMatched } = useQuery({
    queryKey: ['is-matched', user?.id, id],
    queryFn: async () => {
      if (!user || !id || isOwnProfile) return false;
      const [a, b] = [user.id, id].sort();
      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('user_a', a)
        .eq('user_b', b)
        .eq('status', 'matched');
      return (count ?? 0) > 0;
    },
    enabled: !!user && !!id && !isOwnProfile,
  });

  const profile: any = isOwnProfile ? myProfile : otherProfile;
  const targetUserId = isOwnProfile ? user?.id : id;

  const favoriteBars: string[] = (extraFields as any)?.favorite_bars ?? (myProfile as any)?.favorite_bars ?? [];
  const privateModeOn: boolean = (extraFields as any)?.private_mode ?? false;
  const showSocialContent = isOwnProfile || !privateModeOn || isMatched;

  const [localBars, setLocalBars] = useState<string[]>(favoriteBars);
  useEffect(() => { setLocalBars(favoriteBars); }, [favoriteBars.join('|')]); // eslint-disable-line

  const handleBarsChange = (next: string[]) => {
    setLocalBars(next);
    updateProfile.mutate({ favorite_bars: next } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile-extras'] }),
    });
  };

  const foodPromptValues = {
    pregame_meal: (extraFields as any)?.pregame_meal ?? (profile as any)?.pregame_meal ?? '',
    postgame_food: (extraFields as any)?.postgame_food ?? (profile as any)?.postgame_food ?? '',
    carb_up_strategy: (extraFields as any)?.carb_up_strategy ?? (profile as any)?.carb_up_strategy ?? '',
    favorite_bar_food: (extraFields as any)?.favorite_bar_food ?? (profile as any)?.favorite_bar_food ?? '',
    post_win_meal: (extraFields as any)?.post_win_meal ?? (profile as any)?.post_win_meal ?? '',
  };

  const handleFoodPromptSave = (key: FoodPromptKey, value: string) => {
    updateProfile.mutate({ [key]: value || null } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profile-extras'] });
        toast({ title: ' Saved', description: 'Your prompt is live on your profile.' });
      },
    });
  };

  const handlePrivateToggle = (next: boolean) => {
    updateProfile.mutate({ private_mode: next } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profile-extras'] });
        toast({
          title: next ? ' Private Mode on' : ' Private Mode off',
          description: next
            ? 'Bars, badges, and history hidden from non-matches'
            : 'Your social content is visible again',
        });
      },
    });
  };

  const blockUser = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Missing');
      const currentBlocked = (myProfile?.blocked_users as string[]) ?? [];
      await supabase
        .from('profiles')
        .update({ blocked_users: [...currentBlocked, id] })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      toast({ title: ' User blocked', description: "They won't appear in your feed anymore." });
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
      navigate('/discover');
    },
  });

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-4xl mb-4"></p>
          <p className="font-semibold text-destructive-foreground">Fan not found</p>
          <p className="text-sm mt-1 text-destructive-foreground">They may have stepped away from the ballpark.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('/discover')}>Back to Discover</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex items-center justify-center pt-20">
          <p className="text-4xl animate-pulse"></p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-card/80 backdrop-blur">
            <TabsTrigger value="card" className="gap-1.5 rounded-lg">
              <IdCard className="h-4 w-4" /> Card
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 rounded-lg">
              <Sparkles className="h-4 w-4" /> Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-6 pt-4">
            <UserBaseballCard
              profileImage={profile.profile_photo}
              displayName={profile.display_name}
              gameStatus={profile.game_status as GameStatus}
              wrigleySection={profile.wrigley_section}
              wrigleyvilleBar={(profile as any).wrigleyville_bar}
              intents={(profile.intent as IntentType[]) ?? []}
              gamedayIntents={(profile.gameday_intents as GamedayIntentType[]) ?? []}
              statPreferences={statPreferences}
              isOwner={isOwnProfile}
              className="max-w-full"
            />

            {/* Action buttons */}
            <div className="space-y-3">
              {!isOwnProfile ? (
                <>
                  <RecruitButton otherUserId={id!} />
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => toast({ title: ' Hi-Five sent — vibes delivered.' })}
                      variant="outline"
                      className="rounded-xl h-12 font-semibold text-sm"
                    >
                       Hi-Five
                    </Button>
                    <Button
                      onClick={() => navigate('/messages')}
                      variant="outline"
                      className="rounded-xl h-12 font-semibold text-sm"
                    >
                      <MessageCircle className="mr-1 h-4 w-4" /> Chat
                    </Button>
                    <Button
                      onClick={() => navigate(`/beer-money?to=${id}`)}
                      variant="outline"
                      className="rounded-xl h-12 font-semibold text-sm"
                    >
                       Beer
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-1.5 text-xs hover:text-destructive"
                      onClick={() => toast({ title: 'Report submitted', description: 'Our team will review this profile.' })}
                    >
                      <Flag className="h-3 w-3" /> Report
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-1.5 text-xs hover:text-destructive"
                      onClick={() => blockUser.mutate()}
                    >
                      <Ban className="h-3 w-3" /> Block
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-1.5 text-xs hover:text-foreground"
                      onClick={() => {
                        toast({ title: 'Profile hidden', description: "You won't see this fan again." });
                        navigate('/discover');
                      }}
                    >
                      <EyeOff className="h-3 w-3" /> Hide
                    </Button>
                  </div>
                </>
              ) : (
                <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => navigate('/settings')}>
                  Edit Profile
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-5 pt-4">
            {isOwnProfile && (
              <PrivateModeToggle enabled={privateModeOn} onChange={handlePrivateToggle} />
            )}

            {!showSocialContent ? (
              <PrivateModeBanner />
            ) : (
              <>
                {isOwnProfile && <TeammatesSummary />}
                {isOwnProfile && (
                  <AchievementsHub compact onSeeAll={() => navigate('/missions')} />
                )}
                <FavoriteBarsSection
                  bars={localBars}
                  isOwner={isOwnProfile}
                  onChange={isOwnProfile ? handleBarsChange : undefined}
                />
                <FoodPromptsSection
                  values={foodPromptValues}
                  isOwner={isOwnProfile}
                  onChange={isOwnProfile ? handleFoodPromptSave : undefined}
                />
                <BadgesSection userId={targetUserId} isOwner={isOwnProfile} />
                <MeetupHistorySection userId={targetUserId} />
                <SavedPlansSection userId={targetUserId} />

                {isOwnProfile && (
                  <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border">
                      <h3
                        className="text-[13px] font-extrabold uppercase tracking-wide text-foreground"
                        style={{ fontFamily: 'Norwester, sans-serif' }}
                      >
                        Account & Support
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Manage your profile, preferences, and get help.
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {[
                        { icon: UserCog, label: 'Edit Profile', desc: 'Photo, bio, fan stats', to: '/settings#profile' },
                        { icon: Target, label: 'Intent Settings', desc: 'Friend, Beer, Meetup, Dating', to: '/settings#intent' },
                        { icon: ShieldCheck, label: 'Safety Tools', desc: 'Blocking, verification, meetup safety', to: '/settings#safety' },
                        { icon: SettingsIcon, label: 'Settings', desc: 'Notifications, privacy, account', to: '/settings' },
                        { icon: HelpCircle, label: 'FAQ', desc: 'Common questions answered', to: '/settings#faq' },
                        { icon: LifeBuoy, label: 'Support', desc: 'Contact the Cubbies Buddies team', to: '/settings#support' },
                        { icon: Info, label: 'About', desc: 'App version & credits', to: '/settings#about' },
                      ].map(({ icon: Icon, label, desc, to }) => (
                        <li key={label}>
                          <button
                            type="button"
                            onClick={() => navigate(to)}
                            className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left hover:bg-muted/40 active:bg-muted/60 transition-colors"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" strokeWidth={2.25} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-bold text-foreground leading-tight">{label}</span>
                              <span className="block text-[11px] text-muted-foreground truncate">{desc}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
