import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Clock, PartyPopper, Beer, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PostGameSuggestion {
  title: string;
  description: string;
  bar: string;
  vibe: 'chill' | 'party' | 'sports-talk' | 'celebration';
  emoji: string;
}

interface PostGameData {
  active: boolean;
  game?: {
    id: string;
    opponent: string;
    venue: string;
    game_end: string;
  };
  totalFans: number;
  popularBars: { name: string; count: number }[];
  suggestions: PostGameSuggestion[];
}

const VIBE_COLORS: Record<string, string> = {
  chill: 'bg-accent/10 border-accent/20 text-accent',
  party: 'bg-secondary/10 border-secondary/20 text-secondary',
  'sports-talk': 'bg-primary/10 border-primary/20 text-primary',
  celebration: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
};

export function PostGameExperience() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['post-game'],
    queryFn: async (): Promise<PostGameData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load post-game');
      }

      return resp.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const createPostGameEvent = useMutation({
    mutationFn: async (suggestion: PostGameSuggestion) => {
      if (!user) throw new Error('Not authenticated');

      const { data: myCrews } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .limit(1);

      if (myCrews && myCrews.length > 0) {
        const crewId = myCrews[0].crew_id;
        const { error } = await supabase.from('crew_events').insert({
          crew_id: crewId,
          creator_id: user.id,
          title: `${suggestion.emoji} ${suggestion.title}`,
          description: suggestion.description,
        });
        if (error) throw error;

        const { data: event } = await supabase
          .from('crew_events')
          .select('id')
          .eq('crew_id', crewId)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (event) {
          await supabase.from('crew_event_options').insert({
            event_id: event.id,
            label: `${suggestion.bar} — ${suggestion.vibe} vibe`,
            location: suggestion.bar,
          });
        }

        await supabase.from('crew_messages').insert({
          crew_id: crewId,
          sender_id: user.id,
          body: `🎉 Post-game at ${suggestion.bar}! ${suggestion.description}`,
        });

        return { type: 'crew' as const, crewId };
      }

      return { type: 'no-crew' as const };
    },
    onSuccess: (result) => {
      if (result.type === 'crew') {
        toast.success('Post-game event created! 🎉');
        queryClient.invalidateQueries({ queryKey: ['crew-events'] });
        navigate(`/crews/${result.crewId}`);
      } else {
        toast('Create a crew first to start post-game events!');
        navigate('/crews');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create event');
    },
  });

  if (!user || dismissed || isLoading) return null;
  if (!data?.active) return null;

  const { game, totalFans, popularBars, suggestions } = data;
  const minutesSinceEnd = game ? Math.floor((Date.now() - new Date(game.game_end).getTime()) / 60000) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-primary/5 overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="relative px-4 py-4 border-b border-border overflow-hidden">
        {/* Background party dots */}
        <div className="absolute inset-0 opacity-[0.04]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-secondary"
              style={{
                width: Math.random() * 20 + 8,
                height: Math.random() * 20 + 8,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
              transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PartyPopper className="h-5 w-5 text-secondary" />
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                Game Over — What's Next?
              </h3>
            </div>
            {game && (
              <p className="text-xs text-muted-foreground">
                Cubs vs {game.opponent} ended {minutesSinceEnd < 60 ? `${minutesSinceEnd}m ago` : `${Math.floor(minutesSinceEnd / 60)}h ago`}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Fan count + popular bars ticker */}
        <div className="relative flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none pb-0.5">
          <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            {totalFans} fans still out
          </span>
          {popularBars.slice(0, 3).map((bar) => (
            <span
              key={bar.name}
              className="flex items-center gap-1 shrink-0 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1.5 text-xs font-medium text-foreground"
            >
              🍻 {bar.name}
              <span className="text-[10px] font-bold text-accent">{bar.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Where is everyone going? poll */}
      {popularBars.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Where is everyone going?
          </p>
          <div className="space-y-1.5">
            {popularBars.map((bar, i) => {
              const maxCount = popularBars[0]?.count ?? 1;
              const pct = Math.round((bar.count / maxCount) * 100);
              return (
                <motion.div
                  key={bar.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative rounded-xl border border-border bg-background overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                    className="absolute inset-y-0 left-0 bg-accent/10"
                  />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                      <span className="text-sm font-medium text-foreground">{bar.name}</span>
                    </div>
                    <span className="text-xs font-bold text-accent">{bar.count} fans</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Beer className="h-3 w-3" /> Post-game plans
          </p>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const isExpanded = expandedIdx === i;
              const vibeClass = VIBE_COLORS[s.vibe] ?? VIBE_COLORS.chill;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isExpanded
                        ? 'border-secondary bg-secondary/[0.03] shadow-sm'
                        : 'border-border bg-background hover:border-secondary/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl mt-0.5 shrink-0">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{s.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {s.bar}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${vibeClass}`}>
                            {s.vibe}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-2 space-y-3">
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                          <Button
                            size="sm"
                            className="w-full rounded-xl gap-1.5"
                            disabled={createPostGameEvent.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              createPostGameEvent.mutate(s);
                            }}
                          >
                            <PartyPopper className="h-3.5 w-3.5" />
                            {createPostGameEvent.isPending ? 'Creating...' : 'Start this Post-Game Event'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback if no AI suggestions */}
      {suggestions.length === 0 && popularBars.length > 0 && (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            Head to <span className="font-semibold text-foreground">{popularBars[0].name}</span> — {popularBars[0].count} fans are already there! 🍻
          </p>
        </div>
      )}
    </motion.div>
  );
}
