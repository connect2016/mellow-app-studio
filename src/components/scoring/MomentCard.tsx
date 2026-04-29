import { motion } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

interface MomentCardProps {
  playType: string;
  description: string;
  inning: number;
  half: string;
  calledIt?: string[]; // display names of users who predicted correctly
}

const PLAY_LABELS: Record<string, { emoji: string; label: string }> = {
  hr: { emoji: '', label: 'HOME RUN' },
  strikeout: { emoji: '', label: 'STRIKEOUT' },
  double_play: { emoji: '', label: 'DOUBLE PLAY' },
  hit: { emoji: '', label: 'BASE HIT' },
  walk: { emoji: '', label: 'WALK' },
  steal: { emoji: '', label: 'STOLEN BASE' },
  flyout: { emoji: '', label: 'FLY OUT' },
  groundout: { emoji: '⬇️', label: 'GROUND OUT' },
};

export function MomentCard({ playType, description, inning, half, calledIt }: MomentCardProps) {
  const play = PLAY_LABELS[playType] ?? { emoji: '', label: 'KEY PLAY' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-3 my-1.5 rounded-xl border-2 border-primary/20 bg-primary/5 px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl"><ConceptVisual name={play.emoji} size="sm" /></span>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-black text-primary tracking-wide"
           
          >
            {play.label}
          </p>
          <p className="text-[10px] text-foreground mt-0.5 truncate">{description}</p>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {half === 'top' ? '▲' : '▼'}{inning}
        </span>
      </div>
      {calledIt && calledIt.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[10px] text-secondary font-bold"> Called it:</span>
          <span className="text-[10px] text-muted-foreground">{calledIt.join(', ')}</span>
        </div>
      )}
    </motion.div>
  );
}
