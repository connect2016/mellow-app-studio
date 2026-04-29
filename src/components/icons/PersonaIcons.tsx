/**
 * Illustrated persona icons for fan personality types.
 * Each icon is a friendly, slightly stylized rounded outline glyph
 * sized to match Lucide (24x24 viewBox, currentColor stroke).
 *
 * Use with <PersonaIcon name="die_hard" />.
 */
import { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export type PersonaKey =
  | 'die_hard'
  | 'social_butterfly'
  | 'bleacher_creature'
  | 'stats_nerd'
  | 'first_timer'
  | 'foodie_fan'
  | 'tourist';

export interface PersonaIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: PersonaKey | string | null | undefined;
  size?: number | string;
  strokeWidth?: number;
}

const base = (size: number | string = 24, strokeWidth = 2, className?: string, rest?: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: cn('shrink-0', className),
  ...rest,
});

/** Die-Hard — fan in a cap with a heart. */
function DieHardGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw, ...rest } = p;
  return (
    <svg {...rest}>
      {/* head */}
      <circle cx="12" cy="11" r="4" />
      {/* cap brim */}
      <path d="M7 9c1.2-2.3 3-3.5 5-3.5S15.8 6.7 17 9" />
      <path d="M16.5 9h2" />
      {/* shoulders */}
      <path d="M5.5 20c.6-2.5 3.2-4 6.5-4s5.9 1.5 6.5 4" />
      {/* heart on chest */}
      <path d="M12 19.2c-.7-.7-1.7-1.2-1.7-2.1 0-.5.4-.9.9-.9.4 0 .7.2.8.5.1-.3.4-.5.8-.5.5 0 .9.4.9.9 0 .9-1 1.4-1.7 2.1Z" strokeWidth={sw * 0.85} />
    </svg>
  );
}

/** Social Butterfly — head with chat bubbles. */
function SocialButterflyGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw: _sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M4 20c.5-2.4 3-4 6-4s5.5 1.6 6 4" />
      <path d="M16 4h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5L17 11V9h-1a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <circle cx="17" cy="6.7" r="0.3" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="6.7" r="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Bleacher Creature — wild-haired fan with arms up. */
function BleacherCreatureGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw: _sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="12" cy="11" r="3.5" />
      {/* spiky hair */}
      <path d="M9 8l-1-2M12 7l-.2-2.2M15 8l1-2M8 9l-2-1M16 9l2-1" />
      {/* arms up */}
      <path d="M9 14l-3 6" />
      <path d="M15 14l3 6" />
      {/* torso */}
      <path d="M12 14v6" />
    </svg>
  );
}

/** Stats Nerd — head with glasses + bar chart. */
function StatsNerdGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="9" cy="9" r="2.5" />
      <circle cx="15" cy="9" r="2.5" />
      <path d="M11.5 9h1" />
      <path d="M5 20c.5-2.2 3-3.5 6-3.5s.7 0 1 .05" strokeWidth={sw} />
      {/* mini bar chart */}
      <path d="M14 20v-3" />
      <path d="M17 20v-5" />
      <path d="M20 20v-7" />
      <path d="M13 20.5h8" />
    </svg>
  );
}

/** First-Timer — head with a sparkle/exclamation. */
function FirstTimerGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw: _sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="10" cy="11" r="3.5" />
      <path d="M4 20c.5-2.4 2.7-4 6-4s5.5 1.6 6 4" />
      {/* sparkle */}
      <path d="M18 4v3" />
      <path d="M16.5 5.5h3" />
      <path d="M19 8.5l1 1" />
      <path d="M21 4l-.7.7" />
    </svg>
  );
}

/** Foodie Fan — head + fork & knife. */
function FoodieFanGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw: _sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="9" cy="10" r="3.2" />
      <path d="M3.5 20c.5-2.4 2.7-4 5.5-4s5 1.6 5.5 4" />
      {/* fork */}
      <path d="M17 4v6" />
      <path d="M17 4v3" />
      <path d="M19 4v3" />
      <path d="M17 10v10" />
      {/* knife */}
      <path d="M21 4c-1 .8-1.5 2.2-1.5 4s.5 3 1.5 3v9" />
    </svg>
  );
}

/** Tourist — head + camera/map pin. */
function TouristGlyph(p: SVGProps<SVGSVGElement> & { sw: number }) {
  const { sw: _sw, ...rest } = p;
  return (
    <svg {...rest}>
      <circle cx="9" cy="10" r="3.2" />
      <path d="M3.5 20c.5-2.4 2.7-4 5.5-4s5 1.6 5.5 4" />
      {/* camera */}
      <rect x="14" y="5" width="7" height="6" rx="1.2" />
      <circle cx="17.5" cy="8" r="1.4" />
    </svg>
  );
}

const GLYPH_MAP: Record<PersonaKey, (p: SVGProps<SVGSVGElement> & { sw: number }) => JSX.Element> = {
  die_hard: DieHardGlyph,
  social_butterfly: SocialButterflyGlyph,
  bleacher_creature: BleacherCreatureGlyph,
  stats_nerd: StatsNerdGlyph,
  first_timer: FirstTimerGlyph,
  foodie_fan: FoodieFanGlyph,
  tourist: TouristGlyph,
};

const ALIASES: Record<string, PersonaKey> = {
  // labels
  'the die-hard': 'die_hard',
  'die-hard': 'die_hard',
  'die hard': 'die_hard',
  'die-hard fan': 'die_hard',
  'the social butterfly': 'social_butterfly',
  'social butterfly': 'social_butterfly',
  'bleacher creature': 'bleacher_creature',
  'stats nerd': 'stats_nerd',
  'the tourist': 'tourist',
  'first-timer': 'first_timer',
  'first timer': 'first_timer',
  'foodie fan': 'foodie_fan',
  foodie: 'foodie_fan',
};

function resolve(name: string | null | undefined): PersonaKey | null {
  if (!name) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  if (trimmed in GLYPH_MAP) return trimmed as PersonaKey;
  const lower = trimmed.toLowerCase();
  if (lower in GLYPH_MAP) return lower as PersonaKey;
  if (ALIASES[lower]) return ALIASES[lower];
  return null;
}

export function PersonaIcon({ name, size = 24, strokeWidth = 1.8, className, ...rest }: PersonaIconProps) {
  const key = resolve(name);
  if (!key) return null;
  const Glyph = GLYPH_MAP[key];
  return <Glyph {...base(size, strokeWidth, className, rest)} sw={strokeWidth} />;
}

export const PERSONA_LABELS: Record<PersonaKey, string> = {
  die_hard: 'The Die-Hard',
  social_butterfly: 'The Social Butterfly',
  bleacher_creature: 'Bleacher Creature',
  stats_nerd: 'Stats Nerd',
  first_timer: 'First-Timer',
  foodie_fan: 'Foodie Fan',
  tourist: 'The Tourist',
};
