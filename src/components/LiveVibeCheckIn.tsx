import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarVotePanel } from '@/components/BarVotePanel';
import { useGeofence } from '@/hooks/useGeofence';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { WRIGLEYVILLE_BARS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function LiveVibeCheckIn({ preselectedBar }: { preselectedBar?: string }) {
  const { user } = useAuth();
  const { nearWrigley, checking, recheckLocation } = useGeofence();
  const [open, setOpen] = useState(false);
  const [selectedBar, setSelectedBar] = useState(preselectedBar || '');

  if (!user) return null;

  const handleOpen = () => {
    if (checking) return;
    if (nearWrigley === false) {
      toast.error('You need to be within 0.5 miles of Wrigley Field to vote', {
        action: { label: 'Retry', onClick: recheckLocation },
      });
      return;
    }
    setOpen(true);
  };

  return (
    <div data-tour="live-vibe-checkin">
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        disabled={checking}
        className="rounded-full gap-1.5 text-xs font-semibold border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MapPin className="h-3.5 w-3.5 text-primary" />
        )}
        Check-In Vibe
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <span className="text-3xl"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                <h2 className="text-lg font-bold text-foreground mt-2">
                  Live Vibe Check-In
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Help fellow Buddies know the scene
                </p>
              </div>

              {!preselectedBar && (
                <Select value={selectedBar} onValueChange={setSelectedBar}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <SelectValue placeholder="Which bar are you at?" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {WRIGLEYVILLE_BARS.map((bar) => (
                      <SelectItem key={bar.id} value={bar.name}>
                        {bar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedBar ? (
                <BarVotePanel barName={selectedBar} onClose={() => setOpen(false)} />
              ) : (
                <p className="text-xs text-center text-muted-foreground py-4">
                  Select a bar to vote on wait times &amp; vibes
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
