import { toast } from 'sonner';

export const FAN_TAGS = [
  { key: 'bleacher_creature', emoji: '🏟', label: 'Bleacher Creature' },
  { key: 'stats_nerd', emoji: '📊', label: 'Stats Nerd' },
  { key: 'rooftop_regular', emoji: '🏠', label: 'Rooftop Regular' },
  { key: 'out_of_towner', emoji: '✈️', label: 'Out-of-Towner' },
  { key: 'pregame_royalty', emoji: '🍺', label: 'Pregame King/Queen' },
  { key: 'family_section', emoji: '👨‍👩‍👧', label: 'Family Section' },
  { key: 'old_school', emoji: '📻', label: 'Old School Fan' },
  { key: 'sings_every_song', emoji: '🎶', label: 'Sings Every Song' },
] as const;

export type FanTagKey = typeof FAN_TAGS[number]['key'];

export function getFanTagMeta(key: string) {
  return FAN_TAGS.find((t) => t.key === key);
}

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function FanTagsPicker({ value, onChange }: Props) {
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      if (value.length >= 3) {
        toast('Max 3 fan types — deselect one first');
        return;
      }
      onChange([...value, key]);
    }
  };

  return (
    <div>
      <h3
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'hsl(var(--brand-navy))',
          margin: '0 0 8px',
        }}
      >
        YOUR FAN TYPE
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FAN_TAGS.map((t) => {
          const sel = value.includes(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              aria-pressed={sel}
              style={{
                background: sel ? 'hsl(var(--brand-navy))' : 'rgba(255,255,255,0.9)',
                border: `1.5px solid ${sel ? 'hsl(var(--brand-navy))' : 'hsl(var(--border))'}`,
                color: sel ? 'white' : 'hsl(var(--foreground))',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                minHeight: 44,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span aria-hidden>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PillsProps {
  tags: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function FanTagPills({ tags, className, style }: PillsProps) {
  if (!tags?.length) return null;
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, ...style }}
    >
      {tags.slice(0, 3).map((k) => {
        const meta = getFanTagMeta(k);
        if (!meta) return null;
        return (
          <span
            key={k}
            style={{
              background: 'rgba(14,51,134,0.12)',
              color: 'hsl(var(--brand-navy))',
              border: '1px solid rgba(14,51,134,0.25)',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 10,
              padding: '2px 7px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden>{meta.emoji}</span>
            <span>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
