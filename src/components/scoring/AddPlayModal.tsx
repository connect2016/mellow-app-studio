import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PLAY_TYPES = [
  { value: '1b', label: '1B', emoji: '☝️', color: '#4CAF50' },
  { value: '2b', label: '2B', emoji: '✌️', color: '#2196F3' },
  { value: '3b', label: '3B', emoji: '🤟', color: '#9C27B0' },
  { value: 'hr', label: 'HR', emoji: '💣', color: '#F44336' },
  { value: 'k', label: 'K', emoji: '🔥', color: '#FF9800' },
  { value: 'bb', label: 'BB', emoji: '🚶', color: '#607D8B' },
  { value: 'out', label: 'OUT', emoji: '👎', color: '#795548' },
  { value: 'other', label: '...', emoji: '⚾', color: '#9E9E9E' },
];

interface AddPlayModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: { inning: number; half: string; play_type: string; description: string }) => void;
  onQuickOut?: () => void;
  currentInning: number;
}

export function AddPlayModal({ open, onClose, onAdd, onQuickOut, currentInning }: AddPlayModalProps) {
  const [playType, setPlayType] = useState('');
  const [description, setDescription] = useState('');
  const [inning, setInning] = useState(currentInning);
  const [half, setHalf] = useState<'top' | 'bottom'>('top');

  const handleSubmit = () => {
    if (!playType) return;
    const desc = description.trim() || PLAY_TYPES.find(p => p.value === playType)?.label || playType;
    onAdd({ inning, half, play_type: playType, description: desc });
    setPlayType('');
    setDescription('');
    onClose();
  };

  const handleQuickOut = () => {
    onAdd({ inning, half, play_type: 'out', description: 'Out' });
    onQuickOut?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
            style={{ backgroundColor: '#F9F8F4' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-['Graduate'] tracking-wide" style={{ color: 'hsl(var(--ivy-green))' }}>
                ⚾ Quick Score
              </h3>
              <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Inning selector */}
            <div className="flex gap-2 items-center">
              <div className="flex rounded-xl overflow-hidden border-2" style={{ borderColor: 'hsl(var(--ivy-green) / 0.3)' }}>
                <button
                  onClick={() => setHalf('top')}
                  className="px-3 py-1.5 text-xs font-bold font-['Share_Tech_Mono']"
                  style={{
                    backgroundColor: half === 'top' ? 'hsl(var(--ivy-green))' : 'transparent',
                    color: half === 'top' ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  ▲ TOP
                </button>
                <button
                  onClick={() => setHalf('bottom')}
                  className="px-3 py-1.5 text-xs font-bold font-['Share_Tech_Mono']"
                  style={{
                    backgroundColor: half === 'bottom' ? 'hsl(var(--ivy-green))' : 'transparent',
                    color: half === 'bottom' ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  ▼ BOT
                </button>
              </div>
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <button
                    key={i}
                    onClick={() => setInning(i)}
                    className="h-8 w-8 rounded-lg text-xs font-bold font-['Share_Tech_Mono'] flex-shrink-0"
                    style={{
                      backgroundColor: inning === i ? 'hsl(var(--ivy-green))' : 'hsl(var(--ivy-green) / 0.08)',
                      color: inning === i ? 'white' : 'hsl(var(--ivy-green))',
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Play type grid */}
            <div className="grid grid-cols-4 gap-2">
              {PLAY_TYPES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlayType(p.value)}
                  className="flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all"
                  style={{
                    borderColor: playType === p.value ? p.color : 'hsl(var(--ivy-green) / 0.15)',
                    backgroundColor: playType === p.value ? `${p.color}10` : 'transparent',
                  }}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span
                    className="text-xs font-black font-['Share_Tech_Mono']"
                    style={{ color: playType === p.value ? p.color : 'hsl(var(--foreground))' }}
                  >
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* One-Tap Out */}
            <button
              onClick={handleQuickOut}
              className="w-full rounded-xl py-3 text-sm font-bold border-2 transition-all"
              style={{
                borderColor: 'hsl(var(--ivy-green) / 0.3)',
                backgroundColor: 'hsl(var(--ivy-green) / 0.05)',
                color: 'hsl(var(--ivy-green))',
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              👎 One-Tap Out — Next Batter
            </button>

            {/* Description (optional) */}
            <Input
              placeholder="Add a note (optional)… e.g. 'Suzuki 2-run blast'"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-xl border-2"
              style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)', backgroundColor: '#FFFFF0', fontFamily: "'Share Tech Mono', monospace" }}
            />

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!playType}
              className="w-full rounded-xl py-5 text-sm font-bold"
              style={{ backgroundColor: 'hsl(var(--accent))', fontFamily: "'Graduate', serif" }}
            >
              Add to Scorecard ⚾
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
