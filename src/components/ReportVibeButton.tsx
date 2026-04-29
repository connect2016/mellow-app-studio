import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarVotes, type WaitTime, type VibeType } from '@/hooks/useBarVotes';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const VIBE_OPTIONS: { key: VibeType; label: string; emoji: string; waitMap: WaitTime }[] = [
  { key: 'chill', label: 'Dead', emoji: '', waitMap: 'no_line' },
  { key: 'chill', label: 'Chilled', emoji: '', waitMap: '15_min' },
  { key: 'packed', label: 'Electric', emoji: '', waitMap: '30_plus' },
];

interface ReportVibeButtonProps {
  barName: string;
}

export function ReportVibeButton({ barName }: ReportVibeButtonProps) {
  const { user } = useAuth();
  const { vote, isVoting, getMyVote } = useBarVotes();
  const [expanded, setExpanded] = useState(false);
  const myVote = getMyVote(barName);

  if (!user) return null;

  const handleVote = (option: typeof VIBE_OPTIONS[number]) => {
    vote(
      { barName, waitTime: option.waitMap, vibe: option.key },
      {
        onSuccess: () => {
          toast.success(`Reported "${option.label}" at ${barName}!`);
          setExpanded(false);
        },
      },
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((v) => !v)}
        disabled={isVoting}
        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors font-scoreboard"
      >
        {myVote ? ' Update Vibe' : ' Report Vibe'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.9 }}
            className="flex items-center gap-2 mt-2"
          >
            {VIBE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleVote(opt)}
                disabled={isVoting}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/40 transition-all active:scale-95"
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[9px] font-bold text-foreground font-scoreboard uppercase tracking-wide">
                  {opt.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
