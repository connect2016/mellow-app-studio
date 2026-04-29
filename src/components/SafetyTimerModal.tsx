import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, User, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSafetyTimer } from '@/hooks/useSafetyTimer';
import { useToast } from '@/hooks/use-toast';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface SafetyTimerModalProps {
  open: boolean;
  onClose: () => void;
  meetupId?: string;
  locationName: string;
}

export function SafetyTimerModal({ open, onClose, meetupId, locationName }: SafetyTimerModalProps) {
  const [step, setStep] = useState<'ask' | 'form'>('ask');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [duration, setDuration] = useState(120);
  const createTimer = useCreateSafetyTimer();
  const { toast } = useToast();

  const handleSkip = () => {
    setStep('ask');
    onClose();
  };

  const handleSubmit = async () => {
    if (!contactPhone.trim()) {
      toast({ title: 'Phone number required', variant: 'destructive' });
      return;
    }
    try {
      await createTimer.mutateAsync({
        meetupId,
        emergencyPhone: contactPhone.trim(),
        emergencyName: contactName.trim() || 'Emergency Contact',
        locationDescription: locationName,
        durationMinutes: duration,
      });
      toast({
        title: ' Safety Timer Active',
        description: `We'll check in with you in ${duration / 60} hours. Tap "I'm Safe" when you're good!`,
      });
      setStep('ask');
      setContactName('');
      setContactPhone('');
      onClose();
    } catch {
      toast({ title: 'Could not start timer', variant: 'destructive' });
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {step === 'ask' ? (
              <motion.div
                key="ask"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-5"
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Set a Safety Timer?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                    Meeting someone new at <span className="font-semibold text-foreground">{locationName}</span>?
                    We can notify your emergency contact if you don't check in.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => setStep('form')}
                    className="w-full rounded-xl py-5 font-semibold gap-2"
                  >
                    <Shield className="h-4 w-4" /> Yes, Set a Timer
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full rounded-xl text-muted-foreground"
                  >
                    No thanks, I'm good
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                     Safety Timer
                  </h3>
                  <button onClick={handleSkip} className="p-1.5 rounded-full hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p>If you don't tap <span className="font-bold text-foreground">"I'm Safe"</span> before the timer runs out, we'll alert your emergency contact with your meetup location.</p>
                </div>

                {/* Contact name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Contact Name
                  </label>
                  <Input
                    placeholder="e.g. Mom, Alex"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    maxLength={50}
                    className="rounded-xl"
                  />
                </div>

                {/* Contact phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Contact Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    maxLength={20}
                    className="rounded-xl"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Timer Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '1 hour', value: 60 },
                      { label: '2 hours', value: 120 },
                      { label: '3 hours', value: 180 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDuration(opt.value)}
                        className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                          duration === opt.value
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createTimer.isPending || !contactPhone.trim()}
                  className="w-full rounded-xl py-5 font-semibold gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {createTimer.isPending ? 'Starting…' : 'Start Safety Timer'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
