import { motion } from 'framer-motion';
import { Navigation, MessageCircle, Zap } from 'lucide-react';
import type { MapCluster } from './ClusterMarker';

interface QuickActionBarProps {
  selectedCluster: MapCluster | null;
  onNavigate: () => void;
  onChat: () => void;
  onJoin: () => void;
}

export function QuickActionBar({ selectedCluster, onNavigate, onChat, onJoin }: QuickActionBarProps) {
  if (!selectedCluster) return null;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      className="absolute bottom-3 left-3 right-3 z-[1000] bg-card/95 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-foreground">
            {selectedCluster.label}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {selectedCluster.count} fan{selectedCluster.count !== 1 ? 's' : ''} · tap to act
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            ~2 min walk
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNavigate}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-muted min-h-[44px] text-xs font-semibold text-foreground"
        >
          <Navigation className="h-4 w-4" />
          Navigate
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onChat}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-muted min-h-[44px] text-xs font-semibold text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onJoin}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl min-h-[44px] text-xs font-bold text-primary-foreground"
          style={{ background: 'hsl(var(--lineup-teal))' }}
        >
          <Zap className="h-3.5 w-3.5" />
          Join
        </motion.button>
      </div>
    </motion.div>
  );
}
