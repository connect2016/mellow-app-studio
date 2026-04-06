import { useState, useEffect } from 'react';
import { useGamePhase } from '@/hooks/useGamePhase';
import { Clock, Zap } from 'lucide-react';

export function GameDayCountdown() {
  const { data: gamePhase } = useGamePhase();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!gamePhase?.game) return;

    const tick = () => {
      const now = Date.now();
      const start = new Date(gamePhase.game!.game_start).getTime();
      const diff = Math.max(0, start - now);

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gamePhase?.game]);

  if (!gamePhase?.game) return null;

  const isLive = gamePhase.phase === 'mid-game';
  const isPostGame = gamePhase.phase === 'post-game';
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-4"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isLive ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Live Now</span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Game</span>
          </>
        )}
      </div>

      <p className="text-sm font-semibold text-foreground mb-2">
        Cubs vs {gamePhase.game.opponent}
      </p>

      {isLive ? (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-secondary" />
          <span className="text-sm font-bold text-secondary">
            Game in progress — Inning {gamePhase.inningEstimate ?? '?'}
          </span>
        </div>
      ) : isPostGame ? (
        <p className="text-sm text-muted-foreground font-medium">Final — Check post-game highlights!</p>
      ) : (
        <div className="flex gap-2">
          {timeLeft.days > 0 && (
            <CountdownUnit value={pad(timeLeft.days)} label="DAYS" />
          )}
          <CountdownUnit value={pad(timeLeft.hours)} label="HR" />
          <CountdownUnit value={pad(timeLeft.minutes)} label="MIN" />
          <CountdownUnit value={pad(timeLeft.seconds)} label="SEC" />
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg bg-muted px-2.5 py-1.5 min-w-[42px] text-center">
        <span className="text-lg font-bold font-scoreboard text-foreground leading-none">{value}</span>
      </div>
      <span className="text-[8px] font-scoreboard uppercase tracking-widest mt-1 text-muted-foreground">{label}</span>
    </div>
  );
}
