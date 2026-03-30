import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Check, ChevronsUpDown, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBarVotes } from '@/hooks/useBarVotes';
import { BarVibeBadge } from '@/components/BarVibeBadge';
import { BarVotePanel } from '@/components/BarVotePanel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { WRIGLEYVILLE_BARS } from '@/types';

const WRIGLEYVILLE_LOCATIONS = [
  "🏟️ Inside The Ballpark",
  "🪑 Bleachers",
  ...WRIGLEYVILLE_BARS.map(b => b.name),
];

const BAR_LOCATIONS = WRIGLEYVILLE_BARS.map(b => b.name);

export default function CheckIn() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedBar, setSelectedBar] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [openToBuddies, setOpenToBuddies] = useState(false);
  const [votingBar, setVotingBar] = useState<string | null>(null);
  const { getSummary } = useBarVotes();

  const handleCheckIn = async () => {
    if (!selectedBar) {
      toast({ title: 'Please select a location first', variant: 'destructive' });
      return;
    }

    // Update profile with current bar and game status
    if (user) {
      await supabase.from('profiles').update({
        wrigleyville_bar: selectedBar,
        game_status: 'AtBar',
        bar_location_privacy: openToBuddies ? 'Everyone' : 'MatchesOnly',
      }).eq('user_id', user.id);
    }

    setCheckedIn(true);
    toast({ title: '✅ You\'re checked in!', description: `Checked in at ${selectedBar}${openToBuddies ? ' • Open to new Buddies!' : ''}` });
    setTimeout(() => setCheckedIn(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <MapPin className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Solo Check-In
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No crew needed — let Buddies know where you are
          </p>
        </div>

        {/* Dropdown */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
            Where are you currently at?
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between rounded-xl py-6 text-base"
              >
                {selectedBar || 'Select a bar...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search bars..." />
                <CommandList>
                  <CommandEmpty>No bar found.</CommandEmpty>
                  <CommandGroup>
                    {WRIGLEYVILLE_LOCATIONS.map((bar) => (
                      <CommandItem
                        key={bar}
                        value={bar}
                        onSelect={() => {
                          setSelectedBar(bar);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', selectedBar === bar ? 'opacity-100' : 'opacity-0')} />
                        {bar}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Open to Meeting New Buddies toggle */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Open to Meeting New Buddies</p>
              <p className="text-xs text-muted-foreground">
                {openToBuddies ? 'Your avatar shows an "Available" badge' : 'Toggle on to let solo fans find you'}
              </p>
            </div>
          </div>
          <Switch checked={openToBuddies} onCheckedChange={setOpenToBuddies} />
        </div>

        {/* Check In button */}
        <AnimatePresence mode="wait">
          {checkedIn ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent py-6 text-base font-bold text-accent-foreground"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <Check className="h-5 w-5" />
              Checked In!
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                onClick={handleCheckIn}
                className="w-full rounded-xl py-6 text-base font-bold"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Check In Here
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your status updates to "At the Bar" and contributes to Live Vibe instantly.
        </p>

        {/* Live Vibe Section */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              Live Vibe
            </h2>
            <span className="text-xs text-muted-foreground ml-auto">Tap to vote</span>
          </div>

          <div className="space-y-2">
            {BAR_LOCATIONS.map((bar) => {
              const summary = getSummary(bar);
              const isVoting = votingBar === bar;

              return (
                <div key={bar}>
                  <button
                    onClick={() => setVotingBar(isVoting ? null : bar)}
                    className={cn(
                      'w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                      isVoting
                        ? 'border-primary/40 bg-primary/[0.03]'
                        : 'border-border bg-card hover:border-primary/20'
                    )}
                  >
                    <Zap className="h-4 w-4 mt-0.5 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{bar}</p>
                      <BarVibeBadge summary={summary} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isVoting && (
                      <BarVotePanel barName={bar} onClose={() => setVotingBar(null)} />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
