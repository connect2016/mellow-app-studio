import { cn } from '@/lib/utils';
import { GameStatus, GAME_STATUS_LABELS, GAME_STATUS_EMOJI } from '@/types';

interface StatusBadgeProps {
  status: GameStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'NotSet') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status === 'AtWrigley' && 'bg-accent/15 text-accent',
        status === 'AtBar' && 'bg-secondary/15 text-secondary',
        status === 'Tailgating' && 'bg-secondary/15 text-secondary',
        status === 'BeerSnake' && 'bg-green-500/15 text-green-600',
        status === 'WatchingRemote' && 'bg-primary/15 text-yellow-300',
        className
      )}
    >
      <span>{GAME_STATUS_EMOJI[status]}</span>
      {GAME_STATUS_LABELS[status]}
    </span>
  );
}
