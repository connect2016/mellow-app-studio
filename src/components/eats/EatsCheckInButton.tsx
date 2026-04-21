import { useState } from 'react';
import { MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = [
  { key: 'looking_for_buddy', emoji: '🤝', label: 'Looking for a Buddy' },
  { key: 'splitting_app', emoji: '🥨', label: 'Splitting an App' },
  { key: 'carbing_up', emoji: '🍺', label: 'Carbing Up' },
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
                <button
                  key={opt.key}
                  onClick={() => { setSelectedStatus(opt.key); setStep('message'); }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 p-2.5 text-left transition-all"
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                </button>
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
              {STATUS_OPTIONS.find(o => o.key === selectedStatus)?.emoji} Add a quick status (optional)
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
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
