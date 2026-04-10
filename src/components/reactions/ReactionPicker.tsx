import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTIONS } from './reactionData';
import { RealisticEmoji } from './RealisticEmoji';

interface ReactionPickerProps {
  onReact: (reaction: { type: string; body: string; key: string }) => void;
  children: React.ReactNode;
}

export function ReactionPicker({ onReact, children }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(true), 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {children}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-card border border-border rounded-2xl shadow-lg p-2 flex gap-1"
          >
            {REACTIONS.map((r, i) => (
              <motion.button
                key={r.key}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 20 }}
                whileHover={{ scale: 1.3, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onReact({ type: 'reaction', body: r.shortText, key: r.key });
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-0.5 p-1 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <RealisticEmoji src={r.image} alt={r.label} size="md" />
                <span className="text-[8px] font-medium text-muted-foreground">{r.shortText}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
