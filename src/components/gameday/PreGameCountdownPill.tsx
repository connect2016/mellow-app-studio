import { useEffect, useState } from 'react';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

const PRE_GAME_WINDOW_MIN = 180;

/**
 * Renders a "First pitch in Xh Ym" pill when a Cubs HOME game starts
 * within 3 hours, or "Live — game in progress" once first pitch happens.
 * Returns null otherwise. Updates every 60 seconds.
 */
export function PreGameCountdownPill() {
  const { data: game } = useMlbCubsGame();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!game || game.homeAway !== 'home') return null;
  if (game.status === 'no-game' || game.status === 'final' || game.status === 'postponed') return null;

  if (game.status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1"
        style={{
          backgroundColor: '#CC3433',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 20,
          padding: '4px 12px',
          letterSpacing: '0.02em',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
          }}
          aria-hidden="true"
        />
        Live — game in progress
      </span>
    );
  }

  if (!game.gameDate) return null;
  const diffMin = Math.round((new Date(game.gameDate).getTime() - Date.now()) / 60000);
  if (diffMin < 0 || diffMin > PRE_GAME_WINDOW_MIN) return null;

  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        backgroundColor: '#CC3433',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 20,
        padding: '4px 12px',
        letterSpacing: '0.02em',
      }}
      aria-label={`First pitch in ${label}`}
    >
      ⏱ {label} to first pitch
    </span>
  );
}
