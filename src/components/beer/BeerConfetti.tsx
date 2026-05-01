/**
 * Lightweight, dependency-free confetti + beer-clink success animation.
 * CSS-only emission — no framer-motion, respects high-density perf rules.
 */
import { useMemo } from 'react';
import { Beer } from 'lucide-react';

interface Props { active: boolean; }

export function BeerConfetti({ active }: Props) {
  const pieces = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.6,
      hue: [38, 200, 0, 280, 120][i % 5], // amber/blue/red/purple/green
      size: 6 + Math.random() * 6,
    })),
    [],
  );

  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute -top-2 rounded-sm opacity-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: `hsl(${p.hue} 80% 55%)`,
            animation: `beer-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      {/* Beer clink */}
      <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-1">
        <Beer
          className="h-10 w-10 text-amber-500"
          style={{ animation: 'beer-clink-left 0.7s ease-out forwards' }}
        />
        <Beer
          className="h-10 w-10 text-amber-500 -scale-x-100"
          style={{ animation: 'beer-clink-right 0.7s ease-out forwards' }}
        />
      </div>
      <style>{`
        @keyframes beer-confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(360px) rotate(540deg); opacity: 0; }
        }
        @keyframes beer-clink-left {
          0%   { transform: translateX(40px) rotate(20deg); opacity: 0; }
          50%  { transform: translateX(0) rotate(0deg); opacity: 1; }
          70%  { transform: translateX(-3px) rotate(-4deg); }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
        @keyframes beer-clink-right {
          0%   { transform: translateX(-40px) rotate(-20deg) scaleX(-1); opacity: 0; }
          50%  { transform: translateX(0) rotate(0deg) scaleX(-1); opacity: 1; }
          70%  { transform: translateX(3px) rotate(4deg) scaleX(-1); }
          100% { transform: translateX(0) rotate(0deg) scaleX(-1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
