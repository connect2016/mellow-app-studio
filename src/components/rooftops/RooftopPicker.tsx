import { WRIGLEYVILLE_ROOFTOPS } from '@/data/wrigleyvilleRooftops';
import { cn } from '@/lib/utils';

interface Props {
  value?: string | null;
  onChange: (rooftopName: string) => void;
  className?: string;
}

export function RooftopPicker({ value, onChange, className }: Props) {
  return (
    <div className={cn('rounded-xl border-2 border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 p-3', className)}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        🏙️ Pick a Rooftop
      </p>
      <div className="max-h-64 overflow-y-auto grid grid-cols-1 gap-1.5">
        {WRIGLEYVILLE_ROOFTOPS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.name)}
            className={cn(
              'min-h-[44px] w-full text-left rounded-lg px-3 py-2 text-sm font-semibold border-2 transition-colors',
              value === r.name
                ? 'border-amber-500 bg-amber-500 text-amber-950'
                : 'border-amber-200 dark:border-amber-900 bg-white dark:bg-card text-foreground hover:border-amber-400'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">🏙️ {r.name}</span>
              <span className="text-[10px] opacity-70 shrink-0">cap {r.capacity}</span>
            </div>
            <div className="text-[10px] opacity-70 truncate font-normal">{r.views}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
