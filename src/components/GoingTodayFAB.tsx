import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMissionTracker } from '@/hooks/useMissionTracker';

const STATUS_OPTIONS = [
  { value: 'AtBar', emoji: '🍺', label: "At Murphy's" },
  { value: 'AtWrigley', emoji: '🏟️', label: 'In Section 402' },
  { value: 'Tailgating', emoji: '🌭', label: 'Tailgating' },
  { value: 'WatchingRemote', emoji: '🏠', label: 'Watching at Home' },
  { value: 'BeerSnake', emoji: '🐍', label: 'Beer Snake Mode' },
] as const;

export function GoingTodayFAB() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const tracker = useMissionTracker();

  const currentStatus = (profile?.game_status as string) ?? 'NotSet';

  const handleSelect = async (value: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const newStatus = currentStatus === value ? 'NotSet' : value;
      await supabase
        .from('profiles')
        .update({ game_status: newStatus, location_last_set_at: new Date().toISOString() })
        .eq('user_id', user.id);

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['live-fan-counts'] });

      if (newStatus !== 'NotSet') {
        const opt = STATUS_OPTIONS.find(s => s.value === newStatus);
        toast(`${opt?.emoji} Status: "${opt?.label}"`);
        if (newStatus === 'AtWrigley') { tracker.trackCheckInWrigley(); tracker.trackAttendGame(); }
        if (newStatus === 'AtBar') tracker.trackCheckInBar();
        if (newStatus === 'BeerSnake') tracker.trackBeerSnake();
      } else {
        toast('Status cleared');
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Status picker */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[65] w-[90%] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Where are you today?</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = currentStatus === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    disabled={saving}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                    {active && <span className="ml-auto text-xs font-bold text-primary">✓ Active</span>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-[55] flex items-center gap-2 rounded-full bg-secondary px-5 py-3.5 text-secondary-foreground shadow-lg shadow-secondary/30 hover:bg-secondary/90 transition-colors"
      >
        <MapPin className="h-5 w-5" />
        <span className="text-sm font-bold">Going Today?</span>
      </motion.button>
    </>
  );
}
