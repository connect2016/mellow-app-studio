import { useParams, useNavigate } from 'react-router-dom';
import { DynamicBackground } from '@/components/DynamicBackground';
import { AppHeader } from '@/components/AppHeader';

import { UserBaseballCard } from '@/components/UserBaseballCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flag, Ban, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntentType, GameStatus } from '@/types';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const queryClient = useQueryClient();
  const isOwnProfile = !id || id === user?.id;

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

  const profile = isOwnProfile ? myProfile : otherProfile as any;

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
      toast({ title: '🚫 User blocked', description: "They won't appear in your feed anymore." });
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

  return (
    <DynamicBackground className="pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <UserBaseballCard
          profileImage={profile.profile_photo}
          displayName={profile.display_name}
          gameStatus={profile.game_status as GameStatus}
          wrigleySection={profile.wrigley_section}
          wrigleyvilleBar={(profile as any).wrigleyville_bar}
          className="max-w-full"
        />

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {!isOwnProfile ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => toast({ title: '🖐️ Hi-Five sent!' })}
                  variant="outline"
                  className="rounded-xl h-12 font-semibold text-sm"
                >
                  🖐️ Hi-Five
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
      </div>
    </DynamicBackground>
  );
}
