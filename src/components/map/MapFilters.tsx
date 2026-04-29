import { motion } from 'framer-motion';
import { Flame, Coffee, Trophy, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export type VibeFilter = 'party' | 'chill' | 'hardcore';
export type SizeFilter = 'solo' | 'small' | 'large';
export type MovementFilter = 'arriving' | 'settled' | 'leaving';

interface MapFiltersProps {
  vibes: VibeFilter[];
  sizes: SizeFilter[];
  movements: MovementFilter[];
  onToggleVibe: (v: VibeFilter) => void;
  onToggleSize: (s: SizeFilter) => void;
  onToggleMovement: (m: MovementFilter) => void;
}

const VIBE_OPTIONS: { key: VibeFilter; label: string; emoji: string; icon: typeof Flame; color: string }[] = [
  { key: 'party', label: 'Party', emoji: '', icon: Flame, color: 'hsl(var(--secondary))' },
  { key: 'chill', label: 'Chill', emoji: '', icon: Coffee, color: 'hsl(var(--lineup-teal))' },
  { key: 'hardcore', label: 'Hardcore', emoji: '', icon: Trophy, color: 'hsl(var(--accent))' },
];

const SIZE_OPTIONS: { key: SizeFilter; label: string; range: string }[] = [
  { key: 'solo', label: '1-2', range: 'Solo/Duo' },
  { key: 'small', label: '3-5', range: 'Small group' },
  { key: 'large', label: '6+', range: 'Crew' },
];

const MOVEMENT_OPTIONS: { key: MovementFilter; label: string; icon: typeof ArrowUpRight }[] = [
  { key: 'arriving', label: 'Arriving', icon: ArrowUpRight },
  { key: 'settled', label: 'Settled', icon: Minus },
  { key: 'leaving', label: 'Leaving', icon: ArrowDownRight },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </motion.button>
  );
}

export function MapFilters({
  vibes,
  sizes,
  movements,
  onToggleVibe,
  onToggleSize,
  onToggleMovement,
}: MapFiltersProps) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-muted/30 border-b border-border">
      {/* Vibe row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-10 shrink-0">Vibe</span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {VIBE_OPTIONS.map((v) => (
            <Chip key={v.key} active={vibes.includes(v.key)} onClick={() => onToggleVibe(v.key)}>
              <span><ConceptIcon name={v.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
              {v.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Size row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-10 shrink-0">Size</span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SIZE_OPTIONS.map((s) => (
            <Chip key={s.key} active={sizes.includes(s.key)} onClick={() => onToggleSize(s.key)}>
              <Users className="h-2.5 w-2.5" />
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Movement row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-10 shrink-0">Flow</span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {MOVEMENT_OPTIONS.map((m) => {
            const Icon = m.icon;
            return (
              <Chip key={m.key} active={movements.includes(m.key)} onClick={() => onToggleMovement(m.key)}>
                <Icon className="h-2.5 w-2.5" />
                {m.label}
              </Chip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
