import { useState } from 'react';
import { MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { motion, AnimatePresence } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const STATUS_OPTIONS = [
  { key: 'looking_for_buddy', emoji: '', label: 'Looking for a Buddy', quickMsg: 'Looking for someone to hang with!' },
  { key: 'splitting_app', emoji: '', label: 'Appetizer Wingman', quickMsg: 'Looking for someone to split an appetizer!' },
  { key: 'carbing_up', emoji: '', label: 'Carb Load', quickMsg: 'Time to carb up before the first pitch!' },
  { key: 'victory_round', emoji: '', label: 'Victory Round', quickMsg: 'Cubs Win! Who is grabbing a round nearby?' },
] as const;

interface Props {
  spotName: string;
}

export function EatsCheckInButton({ spotName }: Props) {
  const { myCheckin, checkIn, checkOut } = useBarCheckins(spotName);
  const [step, setStep] = useState<'idle' | 'status' | 'message'>('idle');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const isCheckedInHere = myCheckin?.bar_name === spotName;

  if (isCheckedInHere) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-xl h-9 text-xs font-bold border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => checkOut.mutate()}
        disabled={checkOut.isPending}
      >
        <LogOut className="h-3.5 w-3.5" />
        Check Out
      </Button>
    );
  }

  if (step === 'idle') {
    return (
      <Button
        size="sm"
        className="gap-1.5 rounded-xl h-9 text-xs font-bold"
        onClick={() => setStep('status')}
      >
        <MapPin className="h-3.5 w-3.5" />
        Check In
      </Button>
    );
  }

  const handleQuickPost = (opt: typeof STATUS_OPTIONS[number]) => {
    checkIn.mutate(
      {
        barName: spotName,
        visibility: 'visible',
        status: opt.key,
        customMessage: opt.quickMsg,
      },
      { onSuccess: () => { setStep('idle'); setSelectedStatus(''); setCustomMessage(''); } },
    );
  };

  const handleCheckin = () => {
    checkIn.mutate(
      {
        barName: spotName,
        visibility: 'visible',
        status: selectedStatus,
        customMessage: customMessage.trim().slice(0, 100) || undefined,
      },
      { onSuccess: () => { setStep('idle'); setSelectedStatus(''); setCustomMessage(''); } },
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="space-y-2 w-full"
      >
        {step === 'status' && (
          <>
            <p className="text-xs font-semibold text-foreground text-center">What's the move?</p>
            <div className="flex flex-col gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <div key={opt.key} className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setSelectedStatus(opt.key); setCustomMessage(''); setStep('message'); }}
                    className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 p-2.5 text-left transition-all"
                  >
                    <span className="text-lg"><ConceptIcon name={opt.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                    <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2 text-[10px] font-bold text-primary shrink-0"
                    onClick={() => handleQuickPost(opt)}
                    disabled={checkIn.isPending}
                  >
                     Post
                  </Button>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('idle')} className="text-[11px] text-muted-foreground hover:text-foreground w-full text-center">
              Cancel
            </button>
          </>
        )}

        {step === 'message' && (
          <>
            <p className="text-xs font-semibold text-foreground text-center">
              <ConceptIcon name={STATUS_OPTIONS.find(o => o.key === selectedStatus)?.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Add a quick status (optional)
            </p>
            <Input
              placeholder="e.g. Who wants to split nachos?"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value.slice(0, 100))}
              maxLength={100}
              className="rounded-xl text-xs h-9"
            />
            <p className="text-[10px] text-muted-foreground text-right">{customMessage.length}/100</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs"
                onClick={() => setStep('status')}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-bold"
                onClick={handleCheckin}
                disabled={checkIn.isPending}
              >
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[hsl(var(--primary))]" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--primary))]" />
                </span>
                Go Live
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
