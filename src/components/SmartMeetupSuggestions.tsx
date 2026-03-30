import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Clock, MessageCircle, ChevronRight, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MeetupSuggestion {
  headline: string;
  description: string;
  location: string;
  suggested_time: string;
  suggested_message: string;
  emoji: string;
}

export function SmartMeetupSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['meetup-suggestions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meetup-suggestions`,
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
        throw new Error(err.error || 'Failed to get suggestions');
      }

      return resp.json() as Promise<{ suggestions: MeetupSuggestion[]; fanCount: number }>;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  // Create a crew event from a suggestion
  const createFromSuggestion = useMutation({
    mutationFn: async (suggestion: MeetupSuggestion) => {
      if (!user) throw new Error('Not authenticated');

      // Check if user has any crews
      const { data: myCrews } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .limit(1);

      if (myCrews && myCrews.length > 0) {
        // Create a crew event with the suggestion
        const crewId = myCrews[0].crew_id;
        const { error } = await supabase.from('crew_events').insert({
          crew_id: crewId,
          creator_id: user.id,
          title: `${suggestion.emoji} ${suggestion.headline}`,
          description: suggestion.description,
        });
        if (error) throw error;

        // Add as option
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
            label: `${suggestion.location} @ ${suggestion.suggested_time}`,
            location: suggestion.location,
          });
        }

        // Send crew message
        await supabase.from('crew_messages').insert({
          crew_id: crewId,
          sender_id: user.id,
          body: suggestion.suggested_message,
        });

        return { type: 'crew' as const, crewId };
      }

      // No crew — just navigate to create one
      return { type: 'no-crew' as const };
    },
    onSuccess: (result) => {
      if (result.type === 'crew') {
        toast.success('Meetup posted to your crew! 🎉');
        queryClient.invalidateQueries({ queryKey: ['crew-events'] });
        queryClient.invalidateQueries({ queryKey: ['crew-messages'] });
        navigate(`/crews/${result.crewId}`);
      } else {
        toast('Create a crew first to start a meetup!');
        navigate('/crews');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create meetup');
    },
  });

  if (!user) return null;

  const suggestions = data?.suggestions ?? [];
  const fanCount = data?.fanCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Smart Meetups
          </h3>
          {fanCount > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {fanCount} fans nearby
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="py-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <p className="mt-2 text-xs text-muted-foreground">AI is analyzing nearby fans...</p>
          </div>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Couldn't load suggestions</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Try again
            </Button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-2xl">🏟️</p>
            <p className="mt-1 text-sm text-muted-foreground">No active fans nearby right now</p>
            <p className="text-xs text-muted-foreground">Check back during game time!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const isExpanded = expandedIdx === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isExpanded
                        ? 'border-primary bg-primary/[0.03] shadow-sm'
                        : 'border-border bg-background hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl mt-0.5 shrink-0">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{s.headline}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {s.location}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {s.suggested_time}
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

                          {/* Suggested message preview */}
                          <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> Suggested message
                            </p>
                            <p className="text-xs text-foreground italic">"{s.suggested_message}"</p>
                          </div>

                          <Button
                            size="sm"
                            className="w-full rounded-xl gap-1.5"
                            disabled={createFromSuggestion.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              createFromSuggestion.mutate(s);
                            }}
                          >
                            <Zap className="h-3.5 w-3.5" />
                            {createFromSuggestion.isPending ? 'Creating...' : 'Start this Meetup'}
                          </Button>
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
    </motion.div>
  );
}
