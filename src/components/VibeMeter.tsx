import { motion } from 'framer-motion';

interface VibeMeterProps {
  /** 1–10 scale */
  level: number;
  size?: 'sm' | 'md';
}

const levelLabels: Record<number, string> = {
  1: 'Ghost Town',
  2: 'Ghost Town',
  3: 'Dead',
  4: 'Slow',
  5: 'Chilled',
  6: 'Chilled',
  7: 'Warming Up',
  8: 'Electric',
  9: 'Electric',
  10: 'Off the Charts',
};

export function vibeToLevel(vibe: string | null, totalUsers: number, voteCount: number): number {
  const base = vibe === 'packed' ? 7 : vibe === 'rowdy' ? 5 : vibe === 'chill' ? 3 : 2;
  const userBoost = Math.min(totalUsers * 0.3, 2);
  const voteBoost = Math.min(voteCount * 0.15, 1);
  return Math.max(1, Math.min(10, Math.round(base + userBoost + voteBoost)));
}

export function VibeMeter({ level, size = 'md' }: VibeMeterProps) {
  const clampedLevel = Math.max(1, Math.min(10, level));
  const fillPercent = (clampedLevel / 10) * 100;
  const label = levelLabels[clampedLevel] || 'Unknown';

  // Glow intensity scales with level
  const glowOpacity = 0.3 + (clampedLevel / 10) * 0.7;
  const glowSize = 4 + clampedLevel * 2;

  const wSize = size === 'sm' ? 'h-10 w-8' : 'h-14 w-11';
  const fontSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  const barHeight = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Glowing W */}
      <div className={`relative ${wSize} flex items-center justify-center`}>
        {/* Glow backdrop */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${glowOpacity}) 0%, transparent 70%)`,
            filter: `blur(${glowSize}px)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* The W letter with fill mask */}
        <div className="relative overflow-hidden rounded">
          <span
            className={`${fontSize} font-bold text-muted/30 font-scoreboard select-none block leading-none`}
            style={{ fontFamily: "'Rye', cursive" }}
          >
            W
          </span>
          <motion.div
            className="absolute bottom-0 left-0 right-0 overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span
              className={`${fontSize} font-bold block leading-none`}
              style={{
                fontFamily: "'Rye', cursive",
                color: `hsl(var(--primary))`,
                textShadow: `0 0 ${glowSize}px hsl(var(--primary) / 0.6)`,
                position: 'absolute',
                bottom: 0,
                left: 0,
              }}
            >
              W
            </span>
          </motion.div>
        </div>
      </div>

      {/* Scale bars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className={`${barHeight} w-1.5 rounded-full`}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: i < clampedLevel ? 1 : 0.2,
              backgroundColor: i < clampedLevel
                ? `hsl(var(--primary))`
                : `hsl(var(--muted))`,
            }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={
              i < clampedLevel
                ? { boxShadow: `0 0 ${3 + i}px hsl(var(--primary) / 0.4)` }
                : {}
            }
          />
        ))}
      </div>

      {/* Label */}
      <span className="text-[9px] font-scoreboard font-semibold text-primary tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
}
