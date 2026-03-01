import { cn } from '@/lib/utils';
import { IntentType, INTENT_LABELS, INTENT_EMOJI } from '@/types';

interface IntentChipProps {
  intent: IntentType;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function IntentChip({ intent, selected, onClick, size = 'sm' }: IntentChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1.5 text-sm',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
        !onClick && 'cursor-default'
      )}
    >
      <span>{INTENT_EMOJI[intent]}</span>
      <span>{INTENT_LABELS[intent]}</span>
    </button>
  );
}
