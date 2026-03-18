import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IntentChip } from '@/components/IntentChip';
import { IntentType } from '@/types';
import { cn } from '@/lib/utils';

interface FilterState {
  intents: IntentType[];
  statuses: string[];
  distance: number;
  ageRange: number[];
  wrigleyOnly: boolean;
}

interface DiscoverFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const INTENTS: IntentType[] = ['FriendToWatch', 'ShareABeer', 'PostGameMeetup', 'Dating'];

const LOCATIONS = [
  { value: 'AtWrigley', label: 'In my Seat', emoji: '⚾️' },
  { value: 'AtBar', label: 'At the Bar', emoji: '🍺' },
  { value: 'Tailgating', label: 'Tailgating', emoji: '🌭' },
  { value: 'WatchingRemote', label: 'Watching from Home', emoji: '🏠' },
];

const DISTANCES = [1, 5, 10, 25];

export function DiscoverFilterDrawer({ open, onClose, filters, onApply }: DiscoverFilterDrawerProps) {
  const [local, setLocal] = useState<FilterState>(filters);

  // Sync when drawer opens
  const handleOpen = () => setLocal(filters);

  const toggleIntent = (i: IntentType) => {
    setLocal((prev) => ({
      ...prev,
      intents: prev.intents.includes(i) ? prev.intents.filter((x) => x !== i) : [...prev.intents, i],
    }));
  };

  const toggleStatus = (s: string) => {
    setLocal((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s) ? prev.statuses.filter((x) => x !== s) : [...prev.statuses, s],
      // If toggling wrigley off when wrigleyOnly is on, turn it off
      wrigleyOnly: s === 'AtWrigley' && prev.wrigleyOnly && prev.statuses.includes(s) ? false : prev.wrigleyOnly,
    }));
  };

  const handleWrigleyToggle = (checked: boolean) => {
    setLocal((prev) => ({
      ...prev,
      wrigleyOnly: checked,
      statuses: checked ? ['AtWrigley'] : [],
    }));
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const reset: FilterState = { intents: [], statuses: [], distance: 25, ageRange: [21, 65], wrigleyOnly: false };
    setLocal(reset);
    onApply(reset);
    onClose();
  };

  const activeCount = local.intents.length + local.statuses.length + (local.distance !== 25 ? 1 : 0) + (local.ageRange[0] !== 21 || local.ageRange[1] !== 65 ? 1 : 0);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onAnimationStart={handleOpen}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border-t bg-card shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-3">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Filters
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 space-y-6">
              {/* Quick toggle */}
              <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Only fans at Wrigley right now
                  </span>
                </div>
                <Switch
                  checked={local.wrigleyOnly}
                  onCheckedChange={handleWrigleyToggle}
                />
              </div>

              {/* Intent */}
              <div>
                <Label className="mb-2.5 block text-sm font-semibold text-foreground">Intent</Label>
                <div className="flex flex-wrap gap-2">
                  {INTENTS.map((i) => (
                    <IntentChip
                      key={i}
                      intent={i}
                      selected={local.intents.includes(i)}
                      onClick={() => toggleIntent(i)}
                      size="md"
                    />
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="mb-2.5 block text-sm font-semibold text-foreground">Location</Label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.value}
                      onClick={() => toggleStatus(loc.value)}
                      disabled={local.wrigleyOnly}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                        local.statuses.includes(loc.value)
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                        local.wrigleyOnly && loc.value !== 'AtWrigley' && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span>{loc.emoji}</span>
                      <span>{loc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <Label className="mb-2.5 block text-sm font-semibold text-foreground">Distance</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DISTANCES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setLocal((prev) => ({ ...prev, distance: d }))}
                      className={cn(
                        'rounded-xl border py-2.5 text-sm font-semibold transition-all',
                        local.distance === d
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      )}
                    >
                      {d} mi
                    </button>
                  ))}
                </div>
              </div>

              {/* Age range */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Age Range</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {local.ageRange[0]} – {local.ageRange[1]}
                  </span>
                </div>
                <Slider
                  min={21}
                  max={65}
                  step={1}
                  value={local.ageRange}
                  onValueChange={(v) => setLocal((prev) => ({ ...prev, ageRange: v }))}
                  className="py-2"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 border-t px-6 py-4">
              <Button variant="outline" className="flex-1 rounded-full" onClick={handleReset}>
                Reset
              </Button>
              <Button className="flex-1 rounded-full font-semibold" onClick={handleApply}>
                Show Results{activeCount > 0 ? ` (${activeCount})` : ''}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
