import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, PartyPopper, Beer, ChevronRight, Star, Heart, Trophy, CloudRain, Flame, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface PostGameSuggestion {
  title: string;
  description: string;
  bar: string;
  vibe: 'celebration' | 'consolation' | 'chill' | 'party';
  emoji: string;
  mood_tag: 'lets-go' | 'next-time' | 'good-game' | 'rally';
  group_size: number;
}

interface NearbyGroup {
  id: string;
  location: string;
  description: string | null;
  meeting_time: string;
  members: number;
  max_members: number;
}

interface BarWithFans {
  name: string;
  count: number;
  fans: { user_id: string; display_name: string; profile_photo: string | null }[];
}

interface PostGameData {
  active: boolean;
  outcome: 'win' | 'loss' | 'unknown';
  cubsScore: number | null;
  opponentScore: number | null;
  game?: {
    id: string;
    opponent: string;
    venue: string;
    game_end: string;
  };
  totalFans: number;
  popularBars: BarWithFans[];
  nearbyGroups: NearbyGroup[];
  suggestions: PostGameSuggestion[];
}

const VIBE_CONFIG: Record<string, { color: string; icon: typeof Flame }> = {
  celebration: { color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400', icon: Trophy },
  consolation: { color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400', icon: Heart },
  chill: { color: 'bg-accent/10 border-accent/20 text-accent', icon: Beer },
  party: { color: 'bg-secondary/10 border-secondary/20 text-secondary', icon: Flame },
};

const MOOD_LABELS: Record<string, string> = {
  'lets-go': "LET'S GO!",
  'next-time': 'Next time',
  'good-game': 'Good game',
  'rally': 'Rally time',
};

export function PostGameExperience() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState<'win' | 'loss' | null>(null);
  const [scoreInput, setScoreInput] = useState({ cubs: '', opponent: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['post-game', outcomeInput],
    queryFn: async (): Promise<PostGameData> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const payload: Record<string, unknown> = {};
      if (outcomeInput) payload.outcome = outcomeInput;
      if (scoreInput.cubs) payload.cubs_score = parseInt(scoreInput.cubs);
      if (scoreInput.opponent) payload.opponent_score = parseInt(scoreInput.opponent);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
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

      // Create a lineup meetup directly
      const meetingTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { data: meetup, error } = await supabase.from('lineup_meetups').insert({
        creator_id: user.id,
        location_name: suggestion.bar,
        description: `${suggestion.emoji} ${suggestion.title} — ${suggestion.description}`,
        meeting_time: meetingTime,
        max_members: suggestion.group_size || 6,
      }).select('id').single();

      if (error) throw error;

      // Auto-join creator
      await supabase.from('lineup_members').insert({
        meetup_id: meetup.id,
        user_id: user.id,
      });

      // Send icebreaker message
      await supabase.from('lineup_messages').insert({
        meetup_id: meetup.id,
        sender_id: user.id,
        body: data?.outcome === 'win'
          ? ` CUBS WIN! Let's celebrate at ${suggestion.bar}! Who's in?`
          : data?.outcome === 'loss'
          ? ` Tough game, but we stick together. ${suggestion.bar} for recovery drinks?`
          : ` Great game! Heading to ${suggestion.bar} — come hang!`,
      });

      return meetup.id;
    },
    onSuccess: () => {
      toast.success('Meetup created! Others can join now ');
      queryClient.invalidateQueries({ queryKey: ['lineup'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create meetup');
    },
  });

  const joinGroup = useMutation({
    mutationFn: async (meetupId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('lineup_members').insert({
        meetup_id: meetupId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're in! Check the group chat ");
      queryClient.invalidateQueries({ queryKey: ['post-game'] });
    },
  });

  if (!user || dismissed || isLoading) return null;
  if (!data?.active) return null;

  const { game, outcome, cubsScore, opponentScore, totalFans, popularBars, nearbyGroups, suggestions } = data;
  const minutesSinceEnd = game ? Math.floor((Date.now() - new Date(game.game_end).getTime()) / 60000) : 0;

  const isWin = outcome === 'win';
  const isLoss = outcome === 'loss';
  const themeGradient = isWin
    ? 'from-yellow-500/8 via-card to-primary/5 border-yellow-500/25'
    : isLoss
    ? 'from-blue-500/8 via-card to-muted/30 border-blue-500/25'
    : 'from-secondary/5 via-card to-primary/5 border-secondary/30';

  const headerEmoji = isWin ? '' : isLoss ? '' : '';
  const headerTitle = isWin
    ? 'CUBS WIN! Where to celebrate?'
    : isLoss
    ? "Tough one. Let's regroup."
    : "Game Over — What's Next?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 bg-gradient-to-br overflow-hidden shadow-lg ${themeGradient}`}
    >
      {/* Header */}
      <div className="relative px-4 py-4 border-b border-border overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0 opacity-[0.04]">
          {Array.from({ length: isWin ? 16 : 8 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${isWin ? 'bg-yellow-500' : isLoss ? 'bg-blue-400' : 'bg-secondary'}`}
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
              <span className="text-xl">{headerEmoji}</span>
              <h3 className="text-base font-bold text-foreground">
                {headerTitle}
              </h3>
            </div>
            {game && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Cubs vs {game.opponent} · {minutesSinceEnd < 60 ? `${minutesSinceEnd}m ago` : `${Math.floor(minutesSinceEnd / 60)}h ago`}
                </p>
                {cubsScore !== null && opponentScore !== null && (
                  <Badge variant="outline" className={`text-[10px] h-5 ${isWin ? 'border-yellow-500/30 text-yellow-600' : isLoss ? 'border-blue-500/30 text-blue-500' : 'border-border'}`}>
                    {cubsScore} – {opponentScore}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            
          </button>
        </div>

        {/* Outcome picker if unknown */}
        {outcome === 'unknown' && !outcomeInput && (
          <div className="relative mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">How'd it end?</span>
            <button
              onClick={() => { setOutcomeInput('win'); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors"
            >
              <Trophy className="h-3 w-3" /> Cubs Win!
            </button>
            <button
              onClick={() => { setOutcomeInput('loss'); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500 hover:bg-blue-500/20 transition-colors"
            >
              <CloudRain className="h-3 w-3" /> They lost
            </button>
          </div>
        )}

        {/* Fan count + bar ticker */}
        <div className="relative flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            {totalFans} fans out
          </span>
          {popularBars.slice(0, 3).map((bar) => (
            <span
              key={bar.name}
              className="flex items-center gap-1 shrink-0 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1.5 text-xs font-medium text-foreground"
            >
               {bar.name}
              <span className="text-[10px] font-bold text-accent">{bar.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nearby Active Groups */}
      {nearbyGroups.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="h-3 w-3" /> Groups you can join now
          </p>
          <div className="space-y-1.5">
            {nearbyGroups.slice(0, 3).map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {group.description || group.location}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {group.location} · {format(new Date(group.meeting_time), 'h:mm a')} · {group.members}/{group.max_members}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[10px] font-bold gap-1 border-primary/20 text-primary hover:bg-primary/10"
                  disabled={joinGroup.isPending}
                  onClick={() => joinGroup.mutate(group.id)}
                >
                  <UserPlus className="h-3 w-3" /> Join
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Venue crowd levels */}
      {popularBars.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Where everyone's heading
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
                    className={`absolute inset-y-0 left-0 ${isWin ? 'bg-yellow-500/10' : isLoss ? 'bg-blue-500/10' : 'bg-accent/10'}`}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                      <span className="text-sm font-medium text-foreground">{bar.name}</span>
                      {/* Avatars */}
                      {bar.fans.length > 0 && (
                        <div className="flex -space-x-1.5 ml-1">
                          {bar.fans.slice(0, 3).map((f) => (
                            <div key={f.user_id} className="h-5 w-5 rounded-full border border-background bg-muted overflow-hidden">
                              {f.profile_photo ? (
                                <img src={f.profile_photo} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                  {f.display_name?.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-accent">{bar.count}</span>
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
            {isWin ? <Trophy className="h-3 w-3" /> : isLoss ? <Heart className="h-3 w-3" /> : <Beer className="h-3 w-3" />}
            {isWin ? 'Victory meetups' : isLoss ? 'Consolation hangs' : 'Post-game plans'}
          </p>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const isExpanded = expandedIdx === i;
              const vibeConf = VIBE_CONFIG[s.vibe] ?? VIBE_CONFIG.chill;
              const VibeIcon = vibeConf.icon;
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
                        ? `${isWin ? 'border-yellow-500/30 bg-yellow-500/[0.03]' : isLoss ? 'border-blue-500/30 bg-blue-500/[0.03]' : 'border-secondary bg-secondary/[0.03]'} shadow-sm`
                        : 'border-border bg-background hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl mt-0.5 shrink-0">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{s.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {s.bar}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${vibeConf.color}`}>
                            <VibeIcon className="h-2.5 w-2.5" /> {s.vibe}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                             {s.group_size} ideal
                          </span>
                          {s.mood_tag && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-border">
                              {MOOD_LABELS[s.mood_tag] || s.mood_tag}
                            </Badge>
                          )}
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
                            className={`w-full rounded-xl gap-1.5 ${
                              isWin ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950' : ''
                            }`}
                            disabled={createPostGameEvent.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              createPostGameEvent.mutate(s);
                            }}
                          >
                            <PartyPopper className="h-3.5 w-3.5" />
                            {createPostGameEvent.isPending ? 'Creating...' : isWin ? 'Start Victory Meetup!' : isLoss ? 'Rally the Squad' : 'Start Meetup'}
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

      {/* Fallback */}
      {suggestions.length === 0 && popularBars.length > 0 && (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            {isWin ? ' Celebrate at ' : isLoss ? ' Regroup at ' : ' Head to '}
            <span className="font-semibold text-foreground">{popularBars[0].name}</span> — {popularBars[0].count} fans already there!
          </p>
        </div>
      )}
    </motion.div>
  );
}
