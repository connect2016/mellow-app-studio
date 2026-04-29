import { useState, useEffect } from 'react';
import { DynamicBackground } from '@/components/DynamicBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, MessageCircle, ChevronDown } from 'lucide-react';
import { ErrorState } from '@/components/ErrorState';
import bgWrigleyvilleStreet from '@/assets/bg-wrigleyville-street.png';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const QUICK_REPLIES = [
  { emoji: '', text: 'My first game was unforgettable!' },
  { emoji: '', text: 'Let\'s grab a beer before the game!' },
  { emoji: '', text: 'Nothing beats Wrigley on game day!' },
  { emoji: '', text: 'Sluggers or Murphy\'s? 😄' },
  { emoji: '', text: 'Go Cubs Go!' },
  { emoji: '', text: 'Let\'s meet up!' },
];

export default function HiFives() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const { data: hiFives = [], isLoading, isError, refetch } = useQuery({
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

      const userIds = data.map(d => d.from_user);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });

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
          icebreaker: hf.message as string | null,
          favoritePlayer: profile?.favorite_player ?? null,
          gameStatus: profile?.game_status ?? null,
          bar: profile?.wrigleyville_bar ?? null,
        };
      });
    },
    enabled: !!user,
  });

  const hiFiveBack = useMutation({
    mutationFn: async ({ toUser, message }: { toUser: string; message?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('likes')
        .insert({ from_user: user.id, to_user: toUser, is_hi_five: true, message: message || null });
      if (error) throw error;
    },
    onSuccess: (_, { toUser }) => {
      const fan = hiFives.find(h => h.fromUser === toUser);
      setCelebrateId(toUser);
      setReplyingTo(null);
      setTimeout(() => setCelebrateId(null), 1500);
      toast({
        title: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Mutual Hi-Five!',
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
    <DynamicBackground className="pb-24">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgWrigleyvilleStreet})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }} />
      <AppHeader />
      <div className="relative z-10 mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-1 text-3xl font-extrabold" style={{ fontFamily: 'Montserrat, sans-serif', color: 'hsl(222, 82%, 29%)', WebkitTextStroke: '2px white', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))', letterSpacing: '0.03em' }}>Hi-Fives</h2>
        <p className="mb-6 text-base font-semibold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Fans who sent you a Hi-Five <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> — tap to reply!</p>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-9 w-20 rounded-full bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : hiFives.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Zap className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-yellow-300">The bases are empty!</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto">
              Be the first to start a conversation — toss a Hi-Five and see who's ready to play!
            </p>
            <Button variant="outline" className="mt-5 rounded-xl" onClick={() => navigate('/discover')}>
              Discover Fans
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {hiFives.map((hf) => {
              const isReplying = replyingTo === hf.fromUser;
              return (
                <motion.div
                  key={hf.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  <AnimatePresence>
                    {celebrateId === hf.fromUser && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.12 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-primary z-0"
                      />
                    )}
                  </AnimatePresence>

                  {/* Main row */}
                  <div className="relative z-10 flex items-center gap-3 p-4">
                    <button
                      onClick={() => navigate(`/profile/${hf.fromUser}`)}
                      className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border hover:ring-primary/40 transition-all"
                    >
                      {hf.photo ? (
                        <img src={hf.photo} alt={hf.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                          {hf.displayName.charAt(0)}
                        </div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{hf.displayName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{hf.time}</span>
                        {hf.gameStatus && hf.gameStatus !== 'NotSet' && (
                          <span className="flex items-center gap-0.5">
                            {hf.gameStatus === 'AtWrigley' && '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />'}
                            {hf.gameStatus === 'AtBar' && `<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> ${hf.bar ?? ''}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {hf.responded ? (
                        <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Mutual</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isReplying ? 'outline' : 'default'}
                          className="rounded-full font-semibold gap-1"
                          onClick={() => setReplyingTo(isReplying ? null : hf.fromUser)}
                        >
                          <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Reply
                          <ChevronDown className={`h-3 w-3 transition-transform ${isReplying ? 'rotate-180' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Icebreaker message they sent */}
                  {hf.icebreaker && (
                    <div className="px-4 pb-2 relative z-10">
                      <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
                        <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> Their icebreaker
                        </p>
                        <p className="text-sm text-foreground font-medium">"{hf.icebreaker}"</p>
                      </div>
                    </div>
                  )}

                  {/* Quick reply options */}
                  <AnimatePresence>
                    {isReplying && !hf.responded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 space-y-1.5 relative z-10">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> One-tap reply
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_REPLIES.map((qr, i) => (
                              <motion.button
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => hiFiveBack.mutate({ toUser: hf.fromUser, message: qr.text })}
                                disabled={hiFiveBack.isPending}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all"
                              >
                                <span>{qr.emoji}</span>
                                <span>{qr.text}</span>
                              </motion.button>
                            ))}
                          </div>
                          <button
                            onClick={() => hiFiveBack.mutate({ toUser: hf.fromUser })}
                            disabled={hiFiveBack.isPending}
                            className="text-xs font-medium text-muted-foreground py-1.5 hover:text-foreground transition-colors"
                          >
                            Just Hi-Five back <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DynamicBackground>
  );
}
