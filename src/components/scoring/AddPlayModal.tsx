import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PLAY_TYPES = [
  { value: 'hr', label: 'Home Run', emoji: '💣' },
  { value: 'strikeout', label: 'Strikeout', emoji: '🔥' },
  { value: 'double_play', label: 'Double Play', emoji: '👏' },
  { value: 'hit', label: 'Hit', emoji: '💥' },
  { value: 'error', label: 'Error', emoji: '😬' },
  { value: 'steal', label: 'Stolen Base', emoji: '⚡' },
  { value: 'catch', label: 'Great Catch', emoji: '🧤' },
  { value: 'other', label: 'Other', emoji: '⚾' },
];

interface AddPlayModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: { inning: number; half: string; play_type: string; description: string }) => void;
  currentInning: number;
}

export function AddPlayModal({ open, onClose, onAdd, currentInning }: AddPlayModalProps) {
  const [playType, setPlayType] = useState('');
  const [description, setDescription] = useState('');
  const [inning, setInning] = useState(currentInning);
  const [half, setHalf] = useState<'top' | 'bottom'>('top');

  const handleSubmit = () => {
    if (!playType || !description.trim()) return;
    onAdd({ inning, half, play_type: playType, description: description.trim() });
    setPlayType('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Add Key Play</h3>
              <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            {/* Inning selector */}
            <div className="flex gap-2 items-center">
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button onClick={() => setHalf('top')} className={`px-3 py-1.5 text-xs font-medium ${half === 'top' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>▲ Top</button>
                <button onClick={() => setHalf('bottom')} className={`px-3 py-1.5 text-xs font-medium ${half === 'bottom' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>▼ Bot</button>
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {[1,2,3,4,5,6,7,8,9].map(i => (
                  <button key={i} onClick={() => setInning(i)} className={`h-8 w-8 rounded-lg text-xs font-semibold ${inning === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i}</button>
                ))}
              </div>
            </div>

            {/* Play type */}
            <div className="grid grid-cols-4 gap-2">
              {PLAY_TYPES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlayType(p.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-all ${playType === p.value ? 'border-primary bg-primary/5 font-semibold' : 'border-border hover:border-primary/30'}`}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Description */}
            <Input
              placeholder="What happened? e.g. 'Suzuki 2-run blast to left field'"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-xl"
            />

            <Button onClick={handleSubmit} disabled={!playType || !description.trim()} className="w-full rounded-xl py-5">
              Add to Timeline ⚾
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
