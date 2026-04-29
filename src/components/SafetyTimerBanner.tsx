import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveSafetyTimer, useResolveSafetyTimer } from '@/hooks/useSafetyTimer';
import { useToast } from '@/hooks/use-toast';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function SafetyTimerBanner() {
  const { data: timer } = useActiveSafetyTimer();
  const resolveTimer = useResolveSafetyTimer();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!timer) return;

    const tick = () => {
      const diff = new Date(timer.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsUrgent(true);
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
      setIsUrgent(diff < 15 * 60 * 1000); // urgent under 15 min
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSafe = async () => {
    if (!timer) return;
    try {
      await resolveTimer.mutateAsync(timer.id);
      toast({ title: ' Marked Safe!', description: 'Your emergency contact will NOT be notified. Stay safe!' });
    } catch {
      toast({ title: 'Error', description: 'Could not resolve timer.', variant: 'destructive' });
    }
  };

  if (!timer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className={`mx-4 mb-3 rounded-2xl border p-4 shadow-sm ${
          isUrgent
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-primary/5 border-primary/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            isUrgent ? 'bg-destructive/20' : 'bg-primary/10'
          }`}>
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">
                 Safety Timer Active
              </p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isUrgent
                  ? 'bg-destructive/20 text-destructive animate-pulse'
                  : 'bg-primary/10 text-primary'
              }`}>
                {timeLeft}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
               {timer.location_description} · Contact: {timer.emergency_contact_name || 'Emergency'}
            </p>
            <Button
              onClick={handleSafe}
              disabled={resolveTimer.isPending}
              size="sm"
              className={`mt-2 rounded-full gap-1.5 font-semibold ${
                isUrgent
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse'
                  : ''
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {resolveTimer.isPending ? 'Marking…' : "I'm Safe "}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
