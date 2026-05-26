import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

export type GameDayIntent = 'wrigley' | 'bar' | 'home';

const PILLS: { value: GameDayIntent; label: string }[] = [
  { value: 'wrigley', label: '⚾ Headed to Wrigley' },
  { value: 'bar', label: '🍺 Watching at a bar' },
  { value: 'home', label: '📺 Watching from home' },
];

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

interface Props {
  onIntentChange?: (intent: GameDayIntent | null) => void;
}

export function GameDayIntentBanner({ onIntentChange }: Props) {
  const { user } = useAuth();
  const { data: cubsGame } = useMlbCubsGame();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState<GameDayIntent | null>(null);

  const isGameDay = !!cubsGame && cubsGame.status !== 'no-game' && cubsGame.status !== 'postponed';
  const savedIntent = (profile as any)?.game_day_intent as GameDayIntent | null | undefined;
  const savedAt = (profile as any)?.intent_set_at as string | null | undefined;
  const savedIsToday = isToday(savedAt);

  useEffect(() => {
    if (savedIsToday && savedIntent) {
      setSelected(savedIntent);
      onIntentChange?.(savedIntent);
    } else {
      setSelected(null);
      onIntentChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIntent, savedIsToday]);

  if (!user || !isGameDay || dismissed) return null;

  const pick = (val: GameDayIntent) => {
    setSelected(val);
    onIntentChange?.(val);
    updateProfile.mutate({
      game_day_intent: val,
      intent_set_at: new Date().toISOString(),
    } as any);
  };

  return (
    <div
      role="region"
      aria-label="Game day intent"
      style={{
        background: '#0E3386',
        borderRadius: 12,
        padding: '12px 14px',
        margin: '0 16px 12px',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 16,
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          minHeight: 44,
          minWidth: 44,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0, paddingRight: 28 }}>
        What's your move today?
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {PILLS.map((p) => {
          const isSel = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => pick(p.value)}
              style={{
                background: isSel ? '#CC3433' : 'rgba(255,255,255,0.15)',
                border: `1px solid ${isSel ? '#CC3433' : 'rgba(255,255,255,0.3)'}`,
                color: 'white',
                fontSize: 12,
                fontWeight: isSel ? 700 : 500,
                borderRadius: 20,
                padding: '6px 12px',
                minHeight: 44,
                cursor: 'pointer',
              }}
              aria-pressed={isSel}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
