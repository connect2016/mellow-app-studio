import { motion, AnimatePresence } from 'framer-motion';
import { X, Hand, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getRandomMicroIntro } from '@/lib/icebreakers';
import { toast } from 'sonner';
import type { MapFan } from './useMapClusters';

const STATUS_LABELS: Record<string, string> = {
  AtBar: '🍺 Grabbing a Brew',
  AtWrigley: '⚾️ Scorekeeping',
  Tailgating: '🌭 At the Concessions',
  BeerSnake: '👋 Just Saying Hey',
  WatchingRemote: '👋 Just Saying Hey',
};

interface Props {
  fan: MapFan | null;
  onClose: () => void;
  onHiFive: (fan: MapFan) => void;
}

export function MiniProfileSheet({ fan, onClose, onHiFive }: Props) {
  const { user } = useAuth();

  const sendIcebreaker = async (targetFan: MapFan) => {
    if (!user) return;
    const introText = getRandomMicroIntro(fan?.name ?? 'A Buddy');
    try {
      await supabase.from('notifications').insert({
        user_id: targetFan.userId,
        type: 'micro_intro',
        title: '👋 Someone nearby!',
        body: introText,
        emoji: '👋',
        action_url: `/profile/${user.id}`,
        metadata: { from_user: user.id },
      });
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      toast.success('Icebreaker sent! 🧊');
    } catch {
      toast.error('Failed to send icebreaker');
    }
  };
  return (
    <AnimatePresence>
      {fan && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1001] bg-black/20"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[1002] bg-card border-t border-border rounded-t-3xl shadow-2xl"
            style={{ height: '60%' }}
          >
            {/* Handle */}
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-6 pt-1 overflow-y-auto" style={{ height: 'calc(60% - 56px)' }}>
              {/* Profile row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-16 w-16 rounded-full border-2 border-primary/20 overflow-hidden bg-muted shrink-0">
                  {fan.photo ? (
                    <img src={fan.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {fan.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fan.name}</p>
                  <p className="text-xs text-muted-foreground">{fan.locationLabel}</p>
                  <span className="inline-block mt-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {STATUS_LABELS[fan.gameStatus] ?? '👋 Just Saying Hey'}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => onHiFive(fan)}
                  className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold"
                >
                  <Hand className="h-5 w-5" />
                  Send a High-Five 🖐️
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendIcebreaker(fan)}
                  className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold"
                >
                  <MessageCircle className="h-5 w-5" />
                  Send an Icebreaker 🧊
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
