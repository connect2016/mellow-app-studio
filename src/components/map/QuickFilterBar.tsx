import { motion } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export type QuickMapFilter = 'all' | 'in-stadium' | 'bars' | 'looking-for-buddy';

const FILTERS: { value: QuickMapFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '' },
  { value: 'in-stadium', label: 'In-Stadium', emoji: '' },
  { value: 'bars', label: 'Wrigleyville Bars', emoji: '' },
  { value: 'looking-for-buddy', label: 'Looking for Buddy', emoji: '' },
];

interface Props {
  active: QuickMapFilter;
  onChange: (f: QuickMapFilter) => void;
}

export function QuickFilterBar({ active, onChange }: Props) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-border bg-card/80 backdrop-blur-sm">
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 min-h-[44px] text-xs font-semibold transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span><ConceptIcon name={f.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
            {f.label}
          </motion.button>
        );
      })}
    </div>
  );
}
