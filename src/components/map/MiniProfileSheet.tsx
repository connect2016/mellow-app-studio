import { motion, AnimatePresence } from 'framer-motion';
import { X, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-4 pb-5 pt-1">
              {/* Profile row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-14 w-14 rounded-full border-2 border-primary/20 overflow-hidden bg-muted shrink-0">
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
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Action */}
              <Button
                onClick={() => onHiFive(fan)}
                className="w-full gap-2 rounded-xl py-5 text-sm font-bold"
              >
                <Hand className="h-5 w-5" />
                Send a High-Five 🖐️
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
