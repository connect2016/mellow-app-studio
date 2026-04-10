import { motion } from 'framer-motion';
import { REACTIONS } from './reactionData';
import { RealisticEmoji } from './RealisticEmoji';

interface ReactionBarProps {
  onReact: (reaction: { type: string; body: string; key: string }) => void;
}

export function ReactionBar({ onReact }: ReactionBarProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-t border-border/50 bg-background/50 backdrop-blur-sm">
      {REACTIONS.map((r, i) => (
        <motion.button
          key={r.key}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.15 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => onReact({ type: 'reaction', body: r.shortText, key: r.key })}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-full bg-muted/70 border border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-colors"
        >
          <RealisticEmoji src={r.image} alt={r.label} size="xs" />
          <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{r.shortText}</span>
        </motion.button>
      ))}
    </div>
  );
}
