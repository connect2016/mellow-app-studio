import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function HiFives() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Fetch received hi-fives
  const { data: hiFives = [], isLoading } = useQuery({
    queryKey: ['hi-fives', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('likes')
        .select('id, from_user, created_at, message')
        .eq('to_user', user.id)
        .eq('is_hi_five', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for these users
      const userIds = data.map(d => d.from_user);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', userIds);

      // Check which ones the current user has already hi-fived back
      const { data: sentBack } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', user.id)
        .eq('is_hi_five', true)
        .in('to_user', userIds);

      const sentBackSet = new Set(sentBack?.map(s => s.to_user) ?? []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return data.map(hf => {
        const profile = profileMap.get(hf.from_user);
        const mins = Math.floor((Date.now() - new Date(hf.created_at).getTime()) / 60000);
        let timeLabel = 'just now';
        if (mins >= 1 && mins < 60) timeLabel = `${mins}m ago`;
        else if (mins >= 60 && mins < 1440) timeLabel = `${Math.floor(mins / 60)}h ago`;
        else if (mins >= 1440) timeLabel = `${Math.floor(mins / 1440)}d ago`;

        return {
          id: hf.id,
          fromUser: hf.from_user,
          displayName: profile?.display_name ?? 'Fan',
          photo: profile?.profile_photo ?? '',
          time: timeLabel,
          responded: sentBackSet.has(hf.from_user),
        };
      });
    },
    enabled: !!user,
  });

  // Send hi-five back
  const hiFiveBack = useMutation({
    mutationFn: async (toUser: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('likes')
        .insert({ from_user: user.id, to_user: toUser, is_hi_five: true });
      if (error) throw error;
    },
    onSuccess: (_, toUser) => {
      const fan = hiFives.find(h => h.fromUser === toUser);
      setCelebrateId(toUser);
      setTimeout(() => setCelebrateId(null), 1500);
      toast({
        title: '🙌 Mutual Hi-Five!',
        description: `You and ${fan?.displayName ?? 'a fan'} are vibing!`,
      });
      queryClient.invalidateQueries({ queryKey: ['hi-fives'] });
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate')) {
        toast({ title: 'Already sent!', description: 'You already Hi-Fived them back.' });
      }
    },
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-1 text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Hi-Fives</h2>
        <p className="mb-6 text-sm text-muted-foreground">Fans who sent you a Hi-Five 🖐️</p>

        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-4xl animate-pulse">🖐️</p>
            <p className="mt-2 font-semibold text-muted-foreground">Loading...</p>
          </div>
        ) : hiFives.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">🖐️</p>
            <p className="mt-2 font-semibold text-foreground">No hi-fives yet</p>
            <p className="text-sm text-muted-foreground">Keep browsing—they'll come!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hiFives.map((hf) => (
              <motion.div
                key={hf.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 overflow-hidden"
              >
                {/* Celebrate flash */}
                <AnimatePresence>
                  {celebrateId === hf.fromUser && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-primary z-0"
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {hf.photo ? (
                    <img src={hf.photo} alt={hf.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {hf.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-semibold text-sm text-foreground">{hf.displayName}</p>
                  <p className="text-xs text-muted-foreground">{hf.time}</p>
                </div>
                <div className="relative z-10">
                  {!hf.responded ? (
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={hiFiveBack.isPending}
                        onClick={() => hiFiveBack.mutate(hf.fromUser)}
                      >
                        🖐️ Hi-Five Back
                      </Button>
                    </motion.div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">🙌 Mutual</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
