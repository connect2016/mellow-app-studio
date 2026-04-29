import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBarVotes, type WaitTime, type VibeType, WAIT_LABELS, VIBE_LABELS } from '@/hooks/useBarVotes';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const WAIT_OPTIONS: WaitTime[] = ['no_line', '15_min', '30_plus'];
const VIBE_OPTIONS: VibeType[] = ['chill', 'rowdy', 'packed'];

export function BarVotePanel({ barName, onClose }: { barName: string; onClose: () => void }) {
  const { getMyVote, vote, isVoting } = useBarVotes();
  const existing = getMyVote(barName);

  const [waitTime, setWaitTime] = useState<WaitTime>(
    (existing?.wait_time as WaitTime) || 'no_line'
  );
  const [vibe, setVibe] = useState<VibeType>(
    (existing?.vibe as VibeType) || 'chill'
  );

  const handleSubmit = () => {
    vote({ barName, waitTime, vibe }, { onSuccess: onClose });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-border bg-card p-3 mt-2 space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
            ⏱ Wait Time
          </p>
          <div className="flex gap-1.5">
            {WAIT_OPTIONS.map((w) => (
              <button
                key={w}
                onClick={() => setWaitTime(w)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                  waitTime === w
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                }`}
              >
                {WAIT_LABELS[w]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
             Vibe
          </p>
          <div className="flex gap-1.5">
            {VIBE_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(v)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                  vibe === v
                    ? 'border-accent bg-accent/10 text-accent-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-accent/40'
                }`}
              >
                {VIBE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="flex-1 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isVoting} className="flex-1 text-xs">
            {existing ? 'Update' : 'Submit'} Vote
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
