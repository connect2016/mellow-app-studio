import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { IntentChip } from '@/components/IntentChip';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Verified, MapPin, ArrowLeft, Flag, Ban, EyeOff, MessageCircle, ShieldCheck, Clock, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntentType, GameStatus, PrivacyLevel, GamedayIntentType, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI, FanStyleType, FAN_STYLE_OPTIONS } from '@/types';
import { useUserPennants, BADGE_DEFINITIONS } from '@/hooks/usePennants';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const queryClient = useQueryClient();
  const isOwnProfile = !id || id === user?.id;
  const profileUserId = isOwnProfile ? user?.id : id;
  const { data: earnedPennants = [] } = useUserPennants(profileUserId);

  // Fetch other user's profile from DB
  const { data: otherProfile, isLoading } = useQuery({
    queryKey: ['view-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !isOwnProfile,
  });

  const profile = isOwnProfile ? myProfile : otherProfile;

  // Block user
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
      toast({ title: '🚫 User blocked', description: 'They won\'t appear in your feed anymore.' });
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
      navigate('/discover');
    },
  });

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-4xl mb-4">⚾</p>
          <p className="font-semibold text-foreground">Fan not found</p>
          <p className="text-sm text-muted-foreground mt-1">They may have stepped away from the ballpark.</p>
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
          <p className="text-4xl animate-pulse">⚾</p>
        </div>
      </div>
    );
  }

  const displayUser = {
    display_name: profile.display_name,
    age: profile.age,
    pronouns: profile.pronouns,
    bio: profile.bio,
    profile_photo: profile.profile_photo,
    is_verified: profile.is_verified,
    game_status: profile.game_status as GameStatus,
    wrigley_section: profile.wrigley_section,
    wrigley_row: profile.wrigley_row,
    wrigley_location_privacy: profile.wrigley_location_privacy as PrivacyLevel,
    intent: (profile.intent as IntentType[]) ?? [],
    favorite_player: profile.favorite_player,
    favorite_moment: profile.favorite_moment,
    favorite_moment_is_valid: profile.favorite_moment_is_valid,
    superstition: (profile as any).superstition,
    stretch_song: (profile as any).stretch_song,
    best_bar: (profile as any).best_bar,
    gameday_intents: ((profile as any).gameday_intents as GamedayIntentType[]) ?? [],
  };

  const prompts = [
    displayUser.superstition && { label: 'My Cubs superstition is…', value: displayUser.superstition, emoji: '🧢' },
    displayUser.best_bar && { label: 'My favorite Wrigleyville bar…', value: displayUser.best_bar, emoji: '🍻' },
    displayUser.stretch_song && { label: 'My 7th-inning stretch song…', value: displayUser.stretch_song, emoji: '🎵' },
    displayUser.favorite_player && { label: 'Favorite Cubs player ever…', value: displayUser.favorite_player, emoji: '⚾' },
    displayUser.favorite_moment && displayUser.favorite_moment_is_valid !== false && { label: 'Favorite Cubs moment…', value: displayUser.favorite_moment, emoji: '🎉' },
  ].filter(Boolean) as { label: string; value: string; emoji: string }[];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg">
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-4 pt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* Photo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
          <img
            src={displayUser.profile_photo || '/placeholder.svg'}
            alt={displayUser.display_name}
            className="h-80 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </motion.div>

        <div className="px-4 -mt-16 relative space-y-5">
          {/* Name & badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{displayUser.display_name}{displayUser.age ? `, ${displayUser.age}` : ''}</h1>
              {displayUser.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <ShieldCheck className="h-3 w-3" /> Verified Fan
                </span>
              )}
            </div>
            {displayUser.pronouns && <p className="text-sm text-muted-foreground mt-0.5">{displayUser.pronouns}</p>}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={displayUser.game_status} />
            {displayUser.game_status === 'AtWrigley' && displayUser.wrigley_location_privacy === 'Public' && displayUser.wrigley_section && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Section {displayUser.wrigley_section}{displayUser.wrigley_row ? `, Row ${displayUser.wrigley_row}` : ''}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Active recently
            </span>
          </div>

          {/* Intent */}
          <div className="flex flex-wrap gap-1.5">
            {displayUser.intent.map((i) => <IntentChip key={i} intent={i} />)}
          </div>

          {/* Gameday Intent Badges */}
          {displayUser.gameday_intents.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayUser.gameday_intents.map((gi) => (
                <span
                  key={gi}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-xs font-semibold text-foreground"
                >
                  <span>{GAMEDAY_INTENT_EMOJI[gi]}</span>
                  <span>{GAMEDAY_INTENT_LABELS[gi]}</span>
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {displayUser.bio && (
            <p className="text-sm leading-relaxed text-foreground">{displayUser.bio}</p>
          )}

          {/* Prompts */}
          {prompts.length > 0 && (
            <div className="space-y-2.5">
              {prompts.map((p) => (
                <motion.div
                  key={p.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{p.emoji} {p.label}</p>
                  <p className="text-sm font-medium text-foreground">{p.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Earned Pennants */}
          {earnedPennants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> Pennants
                </h3>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/loyalty')}
                    className="text-xs text-accent font-medium hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {earnedPennants.map(p => {
                  const def = BADGE_DEFINITIONS.find(b => b.key === p.badge_key);
                  if (!def) return null;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5"
                    >
                      <span className="text-sm">{def.emoji}</span>
                      <span className="text-xs font-semibold text-foreground">{def.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isOwnProfile ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => toast({ title: '🖐️ Hi-Five sent!' })}
                  variant="outline"
                  className="rounded-xl h-12 font-semibold"
                >
                  🖐️ Hi-Five
                </Button>
                <Button
                  onClick={() => navigate('/messages')}
                  variant="outline"
                  className="rounded-xl h-12 font-semibold"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Chat
                </Button>
                <Button
                  onClick={() => navigate(`/beer-money?to=${id}`)}
                  variant="outline"
                  className="rounded-xl h-12 font-semibold"
                >
                  🍺 Beer
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
                    toast({ title: 'Profile hidden', description: 'You won\'t see this fan again.' });
                    navigate('/discover');
                  }}
                >
                  <EyeOff className="h-3 w-3" /> Hide
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => navigate('/settings')}>
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
