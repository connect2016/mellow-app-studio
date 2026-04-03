import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRIGGER_PATTERNS: { pattern: RegExp; emoji: string; label: string; type: 'hr' | 'strikeout' | 'flag' }[] = [
  { pattern: /\b(HR|home\s*run|homer|bomb|gone|moonshot)\b/i, emoji: '⚾', label: 'HOME RUN!', type: 'hr' },
  { pattern: /\b(K|strikeout|struck\s*out|punchout)\b/i, emoji: '🔥', label: 'STRIKE THREE!', type: 'strikeout' },
  { pattern: /\b(W|win|cubs\s*win|go\s*cubs|fly\s*the\s*w)\b/i, emoji: '🏳️', label: 'FLY THE W!', type: 'flag' },
];

export function detectGameTrigger(text: string): typeof TRIGGER_PATTERNS[number] | null {
  for (const trigger of TRIGGER_PATTERNS) {
    if (trigger.pattern.test(text)) return trigger;
  }
  return null;
}

interface GameTriggerAnimationProps {
  trigger: { emoji: string; label: string; type: string } | null;
  onComplete: () => void;
}

export function GameTriggerAnimation({ trigger, onComplete }: GameTriggerAnimationProps) {
  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(onComplete, 2800);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          {/* Flying baseballs / emojis */}
          {trigger.type === 'hr' && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-3xl"
                  initial={{
                    x: 0,
                    y: 200,
                    opacity: 0,
                    scale: 0.5,
                    rotate: 0,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: -300 - Math.random() * 200,
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.2, 1, 0.8],
                    rotate: 360 + Math.random() * 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.15,
                    ease: 'easeOut',
                  }}
                >
                  ⚾
                </motion.span>
              ))}
            </>
          )}

          {/* W Flag animation */}
          {trigger.type === 'flag' && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: [0, 1.3, 1], rotate: [-30, 10, 0] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-8xl"
            >
              🏳️
            </motion.div>
          )}

          {/* Center label */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: [0, 1.2, 1], y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute flex flex-col items-center gap-2"
          >
            <span className="text-5xl">{trigger.emoji}</span>
            <span
              className="text-2xl font-bold tracking-wider uppercase px-6 py-2 rounded-xl"
              style={{
                fontFamily: "'Rye', cursive",
                color: 'hsl(var(--day-blue))',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                background: 'hsla(40, 20%, 95%, 0.9)',
              }}
            >
              {trigger.label}
            </span>
          </motion.div>

          {/* Glow burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--day-blue) / 0.4) 0%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useGameTrigger() {
  const [activeTrigger, setActiveTrigger] = useState<{ emoji: string; label: string; type: string } | null>(null);

  const checkAndTrigger = useCallback((text: string) => {
    const trigger = detectGameTrigger(text);
    if (trigger && !activeTrigger) {
      setActiveTrigger(trigger);
    }
  }, [activeTrigger]);

  const clearTrigger = useCallback(() => setActiveTrigger(null), []);

  return { activeTrigger, checkAndTrigger, clearTrigger };
}
