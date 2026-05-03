import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useReconnections, ReconnectionSuggestion } from '@/hooks/useReconnections';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, RefreshCw, MessageCircle, Hand, Clock, Sparkles } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

function DaysAgoLabel({ days }: { days: number }) {
  if (days <= 1) return <span className="text-[10px] text-muted-foreground">Yesterday</span>;
  if (days < 7) return <span className="text-[10px] text-muted-foreground">{days}d ago</span>;
  if (days < 30) return <span className="text-[10px] text-muted-foreground">{Math.floor(days / 7)}w ago</span>;
  return <span className="text-[10px] text-muted-foreground">{Math.floor(days / 30)}mo ago</span>;
}

function ReconnectCard({ suggestion, onAction }: {
  suggestion: ReconnectionSuggestion;
  onAction: (action: string, userId: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/20 transition-colors"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
          {suggestion.profile_photo ? (
            <img src={suggestion.profile_photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
              {suggestion.display_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {suggestion.is_active_now && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-green-500">
            <span className="sr-only">Active now</span>
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-foreground truncate">{suggestion.display_name}</span>
          {suggestion.fan_tier_emoji && <span className="text-xs">{suggestion.fan_tier_emoji}</span>}
          {suggestion.vibe_emoji && <span className="text-xs">{suggestion.vibe_emoji}</span>}
        </div>

        {/* Reasons */}
        <div className="flex items-center gap-1 mt-0.5">
          <Sparkles className="h-3 w-3 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate">
            {suggestion.reasons[0]}
            {suggestion.reasons.length > 1 && ` +${suggestion.reasons.length - 1}`}
          </p>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 mt-1">
          <DaysAgoLabel days={suggestion.days_since_interaction} />
          {suggestion.is_active_now && suggestion.wrigleyville_bar && (
            <span className="text-[10px] text-primary font-medium"> {suggestion.wrigleyville_bar}</span>
          )}
          {suggestion.is_active_now && suggestion.game_status === 'AtWrigley' && (
            <span className="text-[10px] text-primary font-medium"> At Wrigley</span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {suggestion.suggested_action === 'say_hi' ? (
          <Button
            size="sm"
            className="rounded-xl text-xs h-8 px-3"
            onClick={() => onAction('message', suggestion.user_id)}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Say Hi
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs h-8 px-3"
            onClick={() => onAction('hifive', suggestion.user_id)}
          >
            <Hand className="h-3.5 w-3.5 mr-1" />
            Hi-Five
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function ReconnectionsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: suggestions = [], isLoading, refetch } = useReconnections();
  const [expanded, setExpanded] = useState(true);

  const handleAction = async (action: string, targetUserId: string) => {
    if (!user) return;

    if (action === 'message') {
      // Find or create conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a.eq.${user.id},participant_b.eq.${targetUserId}),and(participant_a.eq.${targetUserId},participant_b.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        navigate(`/messages?chat=${existing.id}`);
      } else {
        const userA = user.id < targetUserId ? user.id : targetUserId;
        const userB = user.id < targetUserId ? targetUserId : user.id;
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ participant_a: userA, participant_b: userB })
          .select()
          .single();
        if (newConv) navigate(`/messages?chat=${newConv.id}`);
      }
    } else if (action === 'hifive') {
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user: user.id,
          to_user: targetUserId,
          is_hi_five: true,
          message: "Hey! Long time no see",
        });
      if (!error) {
        toast.success("Hi-Five sent — vibes delivered.");
      }
    }
  };

  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50">
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-foreground">Reconnect</h3>
            <p className="text-[11px] text-muted-foreground">
              {suggestions.length > 0
                ? `${suggestions.length} past connection${suggestions.length > 1 ? 's' : ''} to revisit`
                : 'Checking your history…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {suggestions.length}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <BuddyListItemSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {suggestions.map((s, i) => (
                      <ReconnectCard
                        key={s.user_id}
                        suggestion={s}
                        onAction={handleAction}
                      />
                    ))}
                  </AnimatePresence>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Refresh suggestions
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
