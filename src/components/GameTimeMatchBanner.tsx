import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMyGameTimeMatches } from '@/hooks/useGameTimeMatch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, MessageCircle, X, Zap } from 'lucide-react';

export function GameTimeMatchBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: matches = [] } = useMyGameTimeMatches();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const active = matches.filter(m => !dismissed.has(m.id));
  const topMatch = active[0];

  const otherUserId = topMatch
    ? topMatch.user_a === user?.id
      ? topMatch.user_b
      : topMatch.user_a
    : null;

  const { data: otherProfile } = useQuery({
    queryKey: ['gtm-profile', otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, profile_photo')
        .eq('user_id', otherUserId)
        .single();
      return data;
    },
    enabled: !!otherUserId,
  });

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!topMatch) return;
    const tick = () => {
      const diff = new Date(topMatch.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [topMatch]);

  if (!topMatch || !otherProfile) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={topMatch.id}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="mx-4 mb-4 rounded-2xl overflow-hidden border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-accent/10 shadow-lg"
      >
        {/* Glowing top accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/20">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-bold text-accent">
                Game-Time Match!
              </span>
            </div>
            <button
              onClick={() => setDismissed(s => new Set(s).add(topMatch.id))}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12 ring-2 ring-accent/40">
              <AvatarImage src={otherProfile.profile_photo || ''} />
              <AvatarFallback className="bg-accent/20 text-accent font-bold">
                {(otherProfile.display_name || '?')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                You & {otherProfile.display_name} are both at the game!
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 text-accent" />
                Meet at the {topMatch.meeting_spot} for a drink?
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (topMatch.conversation_id) {
                  navigate(`/messages?chat=${topMatch.conversation_id}`);
                }
              }}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-semibold gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              Chat Now
            </Button>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-xs font-mono font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {timeLeft}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
