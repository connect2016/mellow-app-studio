import { motion } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

export type GamedayPersona = 'die_hard' | 'social_butterfly' | 'tourist';

export const PERSONA_CONFIG: Record<GamedayPersona, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  die_hard: {
    label: 'The Die-Hard',
    emoji: '',
    color: 'text-red-100',
    bg: 'bg-gradient-to-r from-red-600 to-red-800',
    border: 'border-red-500/50',
  },
  social_butterfly: {
    label: 'The Social Butterfly',
    emoji: '',
    color: 'text-amber-100',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
    border: 'border-amber-400/50',
  },
  tourist: {
    label: 'The Tourist',
    emoji: '',
    color: 'text-sky-100',
    bg: 'bg-gradient-to-r from-sky-500 to-blue-600',
    border: 'border-sky-400/50',
  },
};

interface PersonaBadgeProps {
  persona: string | null | undefined;
  size?: 'sm' | 'md';
}

export function PersonaBadge({ persona, size = 'sm' }: PersonaBadgeProps) {
  if (!persona || !(persona in PERSONA_CONFIG)) return null;
  const config = PERSONA_CONFIG[persona as GamedayPersona];

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border ${config.border} ${config.bg} ${config.color} px-2 py-0.5 text-[10px] font-bold shadow-sm`}>
        <span><ConceptVisual name={config.emoji} size="sm" /></span>
        {config.label}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.border} ${config.bg} ${config.color} px-3 py-1 text-xs font-bold shadow-md`}
    >
      <span className="text-sm"><ConceptVisual name={config.emoji} size="sm" /></span>
      {config.label}
    </motion.span>
  );
}
