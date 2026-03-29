import { useState } from 'react';
import { ShieldAlert, Flag, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBlockUser, useReportUser } from '@/hooks/useBlockAndReport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const REPORT_REASONS = [
  { value: 'harassment', label: '😤 Harassment', desc: 'Threatening or abusive behavior' },
  { value: 'spam', label: '🚫 Spam', desc: 'Unwanted or repetitive messages' },
  { value: 'fake_profile', label: '🎭 Fake Profile', desc: 'Impersonation or misleading info' },
  { value: 'other', label: '⚠️ Other', desc: 'Something else that feels wrong' },
];

interface QuickBlockButtonProps {
  targetUserId: string;
  targetName?: string;
  onBlocked?: () => void;
  variant?: 'icon' | 'full';
}

export function QuickBlockButton({ targetUserId, targetName, onBlocked, variant = 'icon' }: QuickBlockButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'choose' | 'report'>('choose');
  const [selectedReason, setSelectedReason] = useState('');
  const blockUser = useBlockUser();
  const reportUser = useReportUser();

  const handleBlock = async () => {
    await blockUser.mutateAsync(targetUserId);
    setOpen(false);
    setStep('choose');
    onBlocked?.();
  };

  const handleReport = async () => {
    if (!selectedReason) return;
    await reportUser.mutateAsync({ reportedUserId: targetUserId, reason: selectedReason });
    await blockUser.mutateAsync(targetUserId);
    setOpen(false);
    setStep('choose');
    setSelectedReason('');
    onBlocked?.();
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-1.5 hover:bg-destructive/10 transition-colors"
          title="Block or report"
        >
          <ShieldAlert className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Block
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep('choose'); setSelectedReason(''); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {step === 'choose' ? `Block ${targetName || 'this fan'}?` : 'Report behavior'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {step === 'choose'
                ? 'Blocking permanently hides both profiles from each other.'
                : 'Select a reason — 3 reports triggers automatic review.'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'choose' ? (
              <motion.div
                key="choose"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 pt-2"
              >
                <Button
                  onClick={handleBlock}
                  disabled={blockUser.isPending}
                  className="w-full rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Quick Block
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('report')}
                  className="w-full rounded-xl gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Report & Block
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl text-muted-foreground"
                >
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2 pt-2"
              >
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedReason(r.value)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      selectedReason === r.value
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                  </button>
                ))}
                <Button
                  onClick={handleReport}
                  disabled={!selectedReason || reportUser.isPending || blockUser.isPending}
                  className="w-full rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-2"
                >
                  Submit Report & Block
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
