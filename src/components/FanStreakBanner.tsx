import { useProfile } from '@/hooks/useProfile';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

/**
 * Shown on Discover when the user has a fan streak of 3 or more AND today
 * is a Cubs home game day they haven't yet "kept" alive.
 */
export function FanStreakBanner() {
  const { data: profile } = useProfile();
  const { data: cubsGame } = useMlbCubsGame();

  const streak = profile?.fan_streak ?? 0;
  if (streak < 3) return null;
  if (!cubsGame || cubsGame.homeAway !== 'home' || cubsGame.status === 'no-game') return null;

  return (
    <div
      className="mb-3 flex items-center gap-2"
      style={{
        backgroundColor: '#0E3386',
        color: '#ffffff',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.3,
      }}
      role="status"
    >
      <span style={{ fontSize: 16 }} aria-hidden="true">🔥</span>
      <span>{streak}-game streak — don't break it tonight!</span>
    </div>
  );
}
