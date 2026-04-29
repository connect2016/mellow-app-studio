import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, MapPin, Users, MessageCircle, RefreshCw, PartyPopper, Flame, Coffee, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface MatchMember {
  id: string;
  name: string;
  photo: string | null;
  fanStyle: string[];
}

interface InstantMatch {
  group_name: string;
  member_ids: string[];
  members: MatchMember[];
  meeting_spot: string;
  energy: 'celebration' | 'hype' | 'chill';
  reason: string;
  icebreaker: string;
  emoji: string;
}

const ENERGY_STYLE: Record<string, { color: string; icon: typeof Flame; bg: string }> = {
  celebration: { color: 'text-yellow-500', icon: PartyPopper, bg: 'bg-yellow-500/10 border-yellow-500/20' },
  hype: { color: 'text-orange-500', icon: Flame, bg: 'bg-orange-500/10 border-orange-500/20' },
  chill: { color: 'text-sky-500', icon: Coffee, bg: 'bg-sky-500/10 border-sky-500/20' },
};

export function InstantMatchPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activated, setActivated] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['instant-match'],
    queryFn: async (): Promise<{ match: InstantMatch | null; reason?: string }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instant-match`,
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
        if (resp.status === 429) throw new Error('Rate limited — try again in a moment');
        if (resp.status === 402) throw new Error('AI credits exhausted');
        throw new Error(err.error || 'Failed to find match');
      }

      return resp.json();
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const activateMatch = useMutation({
    mutationFn: async (match: InstantMatch) => {
      if (!user) throw new Error('Not authenticated');

      const meetingTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { data: meetup, error } = await supabase.from('lineup_meetups').insert({
        creator_id: user.id,
        location_name: match.meeting_spot,
        description: `${match.emoji} ${match.group_name} — ${match.reason}`,
        meeting_time: meetingTime,
        max_members: match.member_ids.length + 1,
      }).select('id').single();

      if (error) throw error;

      // Add all members
      const memberInserts = match.member_ids.map(uid => ({ meetup_id: meetup.id, user_id: uid }));
      memberInserts.push({ meetup_id: meetup.id, user_id: user.id });
      await supabase.from('lineup_members').insert(memberInserts);

      // Send icebreaker
      await supabase.from('lineup_messages').insert({
        meetup_id: meetup.id,
        sender_id: user.id,
        body: match.icebreaker,
      });

      // Notify members
      const notifications = match.member_ids.map(uid => ({
        user_id: uid,
        type: 'instant_match',
        title: `${match.emoji} Instant Match!`,
        body: `You've been matched into "${match.group_name}" — head to ${match.meeting_spot} now!`,
        emoji: match.emoji,
        action_url: '/game-day',
      }));
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      return meetup.id;
    },
    onSuccess: () => {
      setActivated(true);
      queryClient.invalidateQueries({ queryKey: ['lineup-meetups'] });
      toast.success("You're matched! Group chat is live <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />");
    },
    onError: (err: any) => toast.error(err.message || 'Failed to activate'),
  });

  const match = data?.match;
  const energyConf = match ? ENERGY_STYLE[match.energy] ?? ENERGY_STYLE.chill : ENERGY_STYLE.chill;
  const EnergyIcon = energyConf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Instant Match
          </h3>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary">
            AI-Powered
          </Badge>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-4 py-3">
        {isLoading || isFetching ? (
          <div className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-3 w-32 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-2.5 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : !match ? (
          <div className="text-center py-6">
            <span className="text-3xl"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
            <p className="text-sm text-muted-foreground mt-2">{data?.reason || 'No matches found nearby'}</p>
            <p className="text-xs text-muted-foreground mt-1">Check back closer to game time</p>
          </div>
        ) : activated ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <motion.span
              className="text-4xl block"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {match.emoji}
            </motion.span>
            <p className="text-sm font-bold text-foreground mt-2">You're in! <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></p>
            <p className="text-xs text-muted-foreground mt-1">
              Head to <span className="font-semibold text-foreground">{match.meeting_spot}</span> — group chat is live
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Match card */}
            <div className={`rounded-xl border p-3 ${energyConf.bg}`}>
              <div className="flex items-start gap-2.5">
                <span className="text-2xl">{match.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{match.group_name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {match.meeting_spot}
                    </span>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border-0 ${energyConf.bg}`}>
                      <EnergyIcon className={`h-2.5 w-2.5 mr-0.5 ${energyConf.color}`} />
                      {match.energy}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{match.reason}</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Your group:</span>
              <div className="flex -space-x-2 flex-1">
                {match.members.map(m => (
                  <div
                    key={m.id}
                    className="h-7 w-7 rounded-full border-2 border-card bg-muted overflow-hidden"
                    title={m.name}
                  >
                    {m.photo ? (
                      <img src={m.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {m.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{match.members.length} fans</span>
            </div>

            {/* One-tap activate */}
            <Button
              className="w-full rounded-xl gap-2 h-11 text-sm font-bold"
              disabled={activateMatch.isPending}
              onClick={() => activateMatch.mutate(match)}
            >
              <Zap className="h-4 w-4" />
              {activateMatch.isPending ? 'Matching...' : 'Match & Start Chat'}
              <ChevronRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-[10px] text-muted-foreground">
              One tap — we handle the rest <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
