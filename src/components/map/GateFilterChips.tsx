import { GATE_OPTIONS, type GateFilter } from '@/hooks/useFanMapPins';

interface Props {
  selected: GateFilter | null;
  onSelect: (gate: GateFilter | null) => void;
  counts?: Partial<Record<GateFilter, number>>;
}

export function GateFilterChips({ selected, onSelect, counts }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
      {GATE_OPTIONS.map((gate) => {
        const isActive = selected === gate;
        const c = counts?.[gate];
        return (
          <button
            key={gate}
            onClick={() => onSelect(isActive ? null : gate)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 min-h-[36px] text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-[#0E3386] text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {gate}
            {c != null && c > 0 && (
              <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                {c}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
