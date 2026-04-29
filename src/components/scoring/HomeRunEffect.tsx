import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  angle: number;
  velocity: number;
}

const HR_EMOJIS = ['', '', '', '', '', '', ''];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    y: 30 + Math.random() * 20,
    emoji: HR_EMOJIS[Math.floor(Math.random() * HR_EMOJIS.length)],
    size: 16 + Math.random() * 24,
    angle: Math.random() * 360,
    velocity: 100 + Math.random() * 200,
  }));
}

interface HomeRunEffectProps {
  trigger: number; // increment to trigger
  playType?: string;
}

export function HomeRunEffect({ trigger, playType }: HomeRunEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const triggerEffect = useCallback(() => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    // Screen flash
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // Particles
    setParticles(createParticles(20));
    setTimeout(() => setParticles([]), 2500);

    // Banner
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 3000);
  }, []);

  useEffect(() => {
    if (trigger > 0) triggerEffect();
  }, [trigger, triggerEffect]);

  const label = playType === 'hr' ? ' HOME RUN!' :
    playType === 'double_play' ? ' DOUBLE PLAY!' :
    playType === 'strikeout' ? ' STRIKEOUT!' :
    playType === 'steal' ? ' STOLEN BASE!' : ' BIG PLAY!';

  return (
    <>
      {/* Screen flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, hsla(var(--primary), 0.4), hsla(var(--secondary), 0.3), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Border glow */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99] pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px 20px hsl(var(--primary) / 0.5), inset 0 0 120px 40px hsl(var(--secondary) / 0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Emoji particles */}
      <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
        <AnimatePresence>
          {particles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * p.velocity;
            const dy = Math.sin(rad) * p.velocity;
            return (
              <motion.div
                key={p.id}
                initial={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  left: `calc(${p.x}% + ${dx}px)`,
                  top: `calc(${p.y}% + ${dy}px)`,
                  scale: [0, 1.5, 1],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{ duration: 1.5 + Math.random() * 0.5, ease: 'easeOut' }}
                className="absolute"
                style={{ fontSize: p.size }}
              >
                <ConceptVisual name={p.emoji} size="sm" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Big play banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[102] pointer-events-none"
          >
            <div className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl shadow-2xl border-2 border-secondary">
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: 3, duration: 0.3 }}
                className="text-2xl font-black tracking-tight text-center whitespace-nowrap"
               
              >
                {label}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
