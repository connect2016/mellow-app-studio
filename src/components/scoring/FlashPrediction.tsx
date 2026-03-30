import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const QUICK_PREDICTIONS = [
  { value: 'strikeout', emoji: '🔥', label: 'K' },
  { value: 'hit', emoji: '💥', label: 'Hit' },
  { value: 'walk', emoji: '🚶', label: 'Walk' },
  { value: 'hr', emoji: '💣', label: 'HR' },
  { value: 'flyout', emoji: '🪰', label: 'Out' },
  { value: 'double_play', emoji: '👏', label: 'DP' },
];

interface FlashPredictionProps {
  visible: boolean;
  currentInning: number;
  half: 'top' | 'bottom';
  userId?: string;
  hasPending: boolean;
  onPredict: (prediction: { inning: number; half: string; predicted_play: string }) => void;
  onDismiss: () => void;
}

export function FlashPrediction({
  visible, currentInning, half, userId, hasPending, onPredict, onDismiss,
}: FlashPredictionProps) {
  const [countdown, setCountdown] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setCountdown(10);
      setSelected(null);
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, onDismiss]);

  const handleSelect = useCallback((value: string) => {
    if (hasPending || selected) return;
    setSelected(value);
    onPredict({ inning: currentInning, half, predicted_play: value });
    setTimeout(onDismiss, 1500);
  }, [hasPending, selected, currentInning, half, onPredict, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="rounded-2xl border-2 border-secondary/50 bg-card shadow-lg overflow-hidden"
        >
          {/* Header with countdown */}
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/10">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-xs font-bold text-foreground">
                PREDICT NEXT AT-BAT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="h-6 w-6 rounded-full border-2 border-secondary flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className="text-[10px] font-bold text-secondary">{countdown}</span>
              </motion.div>
              {/* Countdown bar */}
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-secondary rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-3 py-3">
            {selected ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-center py-2"
              >
                <p className="text-lg">
                  {QUICK_PREDICTIONS.find(p => p.value === selected)?.emoji}
                </p>
                <p className="text-xs font-bold text-secondary mt-1">Locked in! 🔮</p>
              </motion.div>
            ) : hasPending ? (
              <p className="text-center text-xs text-muted-foreground py-2">
                You already have a prediction pending ⏳
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1.5">
                {QUICK_PREDICTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(opt.value)}
                    className="flex flex-col items-center gap-0.5 rounded-xl border border-border hover:border-secondary/50 bg-background px-1 py-2.5 transition-colors"
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-[10px] font-semibold text-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
