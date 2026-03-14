import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const WRIGLEYVILLE_BARS = [
  "Murphy's Bleachers",
  "The Cubby Bear",
  "Budweiser Brickhouse Tavern",
  "Sluggers",
  "Bernie's Tap & Grill",
  "GMAN Tavern",
  "Rizzo's Bar & Inn",
  "Happy Camper",
  "Old Crow Smokehouse",
  "Moe's Cantina",
  "HVAC Pub",
  "Big Star",
  "Sheffield's Beer Garden",
  "Tin Roof",
  "Graystone Tavern",
  "The Stretch",
  "Nisei Lounge",
  "Trace",
];

export default function CheckIn() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedBar, setSelectedBar] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    if (!selectedBar) {
      toast({ title: 'Please select a location first', variant: 'destructive' });
      return;
    }
    setCheckedIn(true);
    toast({ title: '✅ You\'re checked in!', description: `Checked in at ${selectedBar}` });
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
            Current Location
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let your buddies know where you are
          </p>
        </div>

        {/* Dropdown */}
        <div className="mb-6">
          <label
            className="mb-2 block text-sm font-semibold"
            style={{ fontFamily: 'Space Grotesk' }}
          >
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
                    {WRIGLEYVILLE_BARS.map((bar) => (
                      <CommandItem
                        key={bar}
                        value={bar}
                        onSelect={() => {
                          setSelectedBar(bar);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedBar === bar ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {bar}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

        {/* Privacy note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your location is only shared with your buddies to help you sync up for the game.
        </p>
      </div>
    </div>
  );
}
