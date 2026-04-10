import { REACTIONS } from './reactionData';
import { RealisticEmoji } from './RealisticEmoji';

interface ReactionBarProps {
  onReact: (reaction: { type: string; body: string; key: string }) => void;
}

export function ReactionBar({ onReact }: ReactionBarProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-t border-border/50 bg-background/50 backdrop-blur-sm scrollbar-hide">
      {REACTIONS.map((r) => (
        <button
          key={r.key}
          onClick={() => onReact({ type: 'reaction', body: r.shortText, key: r.key })}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-full bg-muted/70 border border-border/50 hover:bg-primary/10 hover:border-primary/20 active:scale-95 transition-all duration-150"
        >
          <RealisticEmoji src={r.image} alt={r.label} size="xs" />
          <span className="text-[10px] sm:text-xs font-semibold text-foreground whitespace-nowrap">{r.shortText}</span>
        </button>
      ))}
    </div>
  );
}
