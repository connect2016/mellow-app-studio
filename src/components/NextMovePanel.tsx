import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, RefreshCw, MapPin, Users, ArrowRight, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Recommendation {
  rank: number;
  type: 'go_to_venue' | 'join_meetup' | 'stay_put' | 'explore_section' | 'start_meetup';
  title: string;
  location: string;
  reason: string;
  crowd_level: 'empty' | 'chill' | 'buzzing' | 'packed';
  vibe_match: number;
  emoji: string;
  meetup_id?: string;
  urgency: 'now' | 'soon' | 'whenever';
}

interface NextMoveResult {
  recommendations: Recommendation[];
  headline: string;
}

const CROWD_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  empty: { label: 'Empty', color: 'text-muted-foreground', bg: 'bg-muted/50' },
  chill: { label: 'Chill', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  buzzing: { label: 'Buzzing', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  packed: { label: 'Packed', color: 'text-red-500', bg: 'bg-red-500/10' },
};

const URGENCY_STYLE: Record<string, { label: string; color: string }> = {
  now: { label: 'Go now', color: 'text-red-500' },
  soon: { label: 'Soon', color: 'text-amber-500' },
  whenever: { label: 'Anytime', color: 'text-muted-foreground' },
};

const TYPE_ICON: Record<string, typeof MapPin> = {
  go_to_venue: MapPin,
  join_meetup: Users,
  stay_put: Sparkles,
  explore_section: Compass,
  start_meetup: TrendingUp,
};

export function NextMovePanel() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['next-move'],
    queryFn: async (): Promise<NextMoveResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/next-move`,
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
        throw new Error(err.error || 'Failed to get recommendations');
      }

      return resp.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const recs = data?.recommendations ?? [];

  const handleAction = async (rec: Recommendation) => {
    if (rec.type === 'join_meetup' && rec.meetup_id) {
      try {
        const { error } = await supabase.from('lineup_members').insert({
          meetup_id: rec.meetup_id,
          user_id: user!.id,
        });
        if (error) throw error;
        toast.success(`Joined meetup at ${rec.location}! 🎉`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to join');
      }
    } else if (rec.type === 'go_to_venue' || rec.type === 'explore_section') {
      toast.success(`${rec.emoji} Heading to ${rec.location}!`);
    } else if (rec.type === 'start_meetup') {
      toast.info(`Create a meetup at ${rec.location} from the Lineup tab!`);
    } else {
      toast.success(`${rec.emoji} ${rec.title}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            Next Move
          </h3>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary">
            AI Engine
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
          <div className="space-y-3 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-28 bg-muted rounded animate-pulse mb-1.5" />
                  <div className="h-2.5 w-40 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl">🧭</span>
            <p className="text-sm text-muted-foreground mt-2">No recommendations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check in first to get personalized suggestions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Headline */}
            {data?.headline && (
              <p className="text-xs text-muted-foreground italic mb-2">"{data.headline}"</p>
            )}

            {recs.sort((a, b) => a.rank - b.rank).map((rec, idx) => {
              const crowd = CROWD_STYLE[rec.crowd_level] || CROWD_STYLE.chill;
              const urgency = URGENCY_STYLE[rec.urgency] || URGENCY_STYLE.whenever;
              const TypeIcon = TYPE_ICON[rec.type] || Compass;
              const isExpanded = expanded === idx;
              const isTop = idx === 0;

              return (
                <motion.div
                  key={idx}
                  layout
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                    isTop
                      ? 'border-primary/30 bg-primary/5 shadow-sm'
                      : 'border-border bg-background hover:border-primary/20'
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : idx)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isTop ? 'bg-primary/10' : 'bg-muted/50'
                    }`}>
                      <span className="text-lg">{rec.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isTop && (
                          <Badge className="text-[8px] h-3.5 px-1 bg-primary text-primary-foreground border-0">
                            #1
                          </Badge>
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{rec.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <TypeIcon className="h-2.5 w-2.5" /> {rec.location}
                        </span>
                        <span className={`text-[10px] font-medium ${crowd.color}`}>
                          {crowd.label}
                        </span>
                        <span className={`text-[10px] font-medium ${urgency.color}`}>
                          • {urgency.label}
                        </span>
                      </div>
                    </div>
                    {/* Vibe match bar */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <div className="flex gap-px">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-0.5 rounded-full ${
                              i < rec.vibe_match ? 'bg-primary' : 'bg-muted'
                            }`}
                            style={{ height: `${6 + i * 0.8}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[8px] text-muted-foreground">{rec.vibe_match}/10</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[11px] text-muted-foreground mt-2 mb-2.5">{rec.reason}</p>
                        <Button
                          size="sm"
                          className="w-full rounded-lg gap-1.5 h-8 text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(rec);
                          }}
                        >
                          {rec.type === 'join_meetup' ? 'Join Group' :
                           rec.type === 'start_meetup' ? 'Create Meetup' :
                           rec.type === 'stay_put' ? 'Stay Here' : 'Let\'s Go'}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            <p className="text-center text-[10px] text-muted-foreground mt-1">
              Updated based on live crowd data 🧭
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
