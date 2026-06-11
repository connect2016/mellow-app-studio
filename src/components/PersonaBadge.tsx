import { motion } from 'framer-motion';
import { PersonaIcon, PERSONA_LABELS, type PersonaKey } from '@/components/icons/PersonaIcons';
import { cn } from '@/lib/utils';

export type GamedayPersona = PersonaKey;

interface PersonaStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
}

export const PERSONA_CONFIG: Record<PersonaKey, PersonaStyle> = {
  die_hard: {
    label: PERSONA_LABELS.die_hard,
    color: 'text-red-100',
    bg: 'bg-gradient-to-r from-red-600 to-red-800',
    border: 'border-red-500/50',
    iconColor: 'text-white',
  },
  social_butterfly: {
    label: PERSONA_LABELS.social_butterfly,
    color: 'text-amber-100',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
    border: 'border-amber-400/50',
    iconColor: 'text-white',
  },
  bleacher_creature: {
    label: PERSONA_LABELS.bleacher_creature,
    color: 'text-emerald-50',
    bg: 'bg-gradient-to-r from-emerald-600 to-green-700',
    border: 'border-emerald-400/50',
    iconColor: 'text-white',
  },
  stats_nerd: {
    label: PERSONA_LABELS.stats_nerd,
    color: 'text-indigo-50',
    bg: 'bg-gradient-to-r from-indigo-600 to-blue-700',
    border: 'border-indigo-400/50',
    iconColor: 'text-white',
  },
  first_timer: {
    label: PERSONA_LABELS.first_timer,
    color: 'text-teal-50',
    bg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
    border: 'border-teal-400/50',
    iconColor: 'text-white',
  },
  foodie_fan: {
    label: PERSONA_LABELS.foodie_fan,
    color: 'text-rose-50',
    bg: 'bg-gradient-to-r from-rose-500 to-pink-600',
    border: 'border-rose-400/50',
    iconColor: 'text-white',
  },
  tourist: {
    label: PERSONA_LABELS.tourist,
    color: 'text-sky-100',
    bg: 'bg-gradient-to-r from-sky-500 to-blue-600',
    border: 'border-sky-400/50',
    iconColor: 'text-white',
  },
};

interface PersonaBadgeProps {
  persona: string | null | undefined;
  size?: 'sm' | 'md';
}

export function PersonaBadge({ persona, size = 'sm' }: PersonaBadgeProps) {
  if (!persona) return null;
  const key = (persona in PERSONA_CONFIG ? persona : null) as PersonaKey | null;
  if (!key) return null;
  const config = PERSONA_CONFIG[key];

  if (size === 'sm') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-sm',
          config.border,
          config.bg,
          config.color
        )}
      >
        <PersonaIcon name={key} size={12} className={config.iconColor} strokeWidth={2} />
        {config.label}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm',
        config.border,
        config.bg,
        config.color
      )}
    >
      <PersonaIcon name={key} size={14} className={config.iconColor} strokeWidth={2} />
      {config.label}
    </motion.span>
  );
}
