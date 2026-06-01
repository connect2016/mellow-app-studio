import { cn } from '@/lib/utils';

interface Props {
  venueName?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function RooftopBadge({ venueName, className, size = 'sm' }: Props) {
  if (!venueName) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-500 text-amber-950 font-bold border border-amber-600 shadow-sm',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      title={`At ${venueName}`}
    >
      🏙️ <span className="truncate max-w-[140px]">{venueName}</span>
    </span>
  );
}
