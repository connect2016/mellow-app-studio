import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGamePhase } from '@/hooks/useGamePhase';
import { Clock } from 'lucide-react';

export function WrigleyCountdownClock() {
  const { data: gamePhase } = useGamePhase();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!gamePhase?.game) return;

    const tick = () => {
      const now = Date.now();
      const start = new Date(gamePhase.game!.game_start).getTime();
      const diff = Math.max(0, start - now);

      setTimeLeft({
        hours: Math.floor(diff / 3600000),
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
  const isPreGame = gamePhase.phase === 'pre-game';

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Outfield clock container */}
      <div
        className="relative px-5 py-5"
        style={{
          background: 'linear-gradient(180deg, hsl(160 30% 8%) 0%, hsl(160 40% 5%) 100%)',
          border: '3px solid hsl(40 15% 30%)',
          borderRadius: '16px',
          boxShadow: '0 0 20px hsla(160, 52%, 15%, 0.3), inset 0 1px 0 hsla(40, 20%, 50%, 0.15)',
        }}
      >
        {/* Rivet details */}
        {[
          { top: 8, left: 8 },
          { top: 8, right: 8 },
          { bottom: 8, left: 8 },
          { bottom: 8, right: 8 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              ...pos,
              background: 'radial-gradient(circle at 40% 40%, hsl(40 15% 40%), hsl(40 10% 20%))',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }}
          />
        ))}

        {/* Matchup */}
        <div className="text-center mb-3">
          <p
            className="text-[10px] uppercase tracking-[0.3em] font-scoreboard"
            style={{ color: 'hsl(40 20% 60%)' }}
          >
            {isLive ? 'Live — ' : ''}Cubs vs {gamePhase.game.opponent}
          </p>
        </div>

        {/* Clock display */}
        <div className="flex items-center justify-center gap-2">
          {isPreGame ? (
            <>
              <ClockDigit value={pad(timeLeft.hours)} label="HR" />
              <ClockSeparator />
              <ClockDigit value={pad(timeLeft.minutes)} label="MIN" />
              <ClockSeparator />
              <ClockDigit value={pad(timeLeft.seconds)} label="SEC" />
            </>
          ) : isLive ? (
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span
                  className="text-xl font-bold font-scoreboard uppercase tracking-wider"
                  style={{ color: 'hsl(40 20% 90%)' }}
                >
                  LIVE — Inning {gamePhase.inningEstimate ?? '?'}
                </span>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-bold font-scoreboard"
                style={{ color: 'hsl(40 20% 90%)' }}
              >
                FINAL
              </span>
            </div>
          )}
        </div>

        {/* First pitch label */}
        {isPreGame && (
          <p
            className="text-center text-[9px] font-scoreboard uppercase tracking-[0.2em] mt-3"
            style={{ color: 'hsl(40 15% 45%)' }}
          >
            Until First Pitch
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ClockDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative px-3 py-2 rounded-lg min-w-[52px]"
        style={{
          background: 'hsl(160 25% 4%)',
          border: '1px solid hsl(40 10% 25%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
        }}
      >
        <span
          className="text-3xl font-bold font-scoreboard block text-center leading-none"
          style={{
            color: 'hsl(40 30% 85%)',
            textShadow: '0 0 8px hsl(40 30% 85% / 0.3)',
          }}
        >
          {value}
        </span>
      </div>
      <span
        className="text-[8px] font-scoreboard uppercase tracking-widest mt-1"
        style={{ color: 'hsl(40 15% 40%)' }}
      >
        {label}
      </span>
    </div>
  );
}

function ClockSeparator() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="text-2xl font-bold font-scoreboard pb-4"
      style={{ color: 'hsl(40 20% 60%)' }}
    >
      :
    </motion.span>
  );
}
