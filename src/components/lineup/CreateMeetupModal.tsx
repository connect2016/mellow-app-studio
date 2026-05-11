import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, Sparkles, Flame, UserPlus, Zap, Share2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMeetup } from '@/hooks/useLineup';
import { WRIGLEYVILLE_BARS } from '@/types';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface CreateMeetupModalProps {
  open: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

const TIME_OPTIONS = (() => {
  const opts: string[] = [];
  const now = new Date();
  // Next 8 hours in 30-min increments
  for (let i = 0; i < 16; i++) {
    const d = new Date(now.getTime() + i * 30 * 60 * 1000);
    d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
    opts.push(d.toISOString());
  }
  return [...new Set(opts)];
})();

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function CreateMeetupModal({ open, onClose, defaultLocation }: CreateMeetupModalProps) {
  const isPresetBar = !!defaultLocation && WRIGLEYVILLE_BARS.some((b) => b.name === defaultLocation);
  const [location, setLocation] = useState(isPresetBar ? defaultLocation! : (defaultLocation ? '__custom__' : ''));
  const [customLocation, setCustomLocation] = useState(isPresetBar ? '' : (defaultLocation ?? ''));
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [success, setSuccess] = useState<null | { location: string; time: string; max: number }>(null);
  const createMeetup = useCreateMeetup();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(null);
      setLocation('');
      setCustomLocation('');
      setTime('');
      setDescription('');
      setMaxMembers('10');
    }, 250);
  };

  const handleShare = async () => {
    if (!success) return;
    const text = `Join me at ${success.location} at ${formatTime(success.time)} — posted on Cubbies Buddies!`;
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: 'Meetup at Wrigleyville', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied — paste it anywhere!');
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleSubmit = async () => {
    const loc = location === '__custom__' ? customLocation : location;
    if (!loc || !time) {
      toast.error('Pick a spot and a time!');
      return;
    }
    try {
      await createMeetup.mutateAsync({
        location_name: loc,
        meeting_time: time,
        description,
        max_members: parseInt(maxMembers) || 10,
      });
      toast.success(' Your meetup is in The Lineup!');
      setSuccess({ location: loc, time, max: parseInt(maxMembers) || 10 });
    } catch {
      toast.error('Failed to create meetup');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border-t bg-card shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {success ? (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-lg font-bold text-destructive-foreground" style={{ fontFamily: 'Rye, serif' }}>
                    You're on the board!
                  </h3>
                  <button onClick={handleClose} className="rounded-full p-1.5 transition-colors hover:bg-muted">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-primary to-[hsl(222,82%,22%)] p-5 text-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <p className="text-sm font-bold uppercase tracking-wide text-white/90" style={{ fontFamily: 'Norwester, sans-serif' }}>
                      Meetup posted
                    </p>
                  </div>
                  <p className="mt-3 text-xl font-extrabold leading-tight" style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}>
                    {success.location}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/90">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-secondary" /> {formatTime(success.time)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-secondary" /> Up to {success.max} fans
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90"
                  style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
                >
                  <Share2 className="h-5 w-5" /> Share this meetup
                </button>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/40"
                >
                  Done
                </button>
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between px-6 pb-3">
              <h3 className="text-lg font-bold text-destructive-foreground" style={{ fontFamily: 'Rye, serif' }}>
                 Post to The Lineup
              </h3>
              <button onClick={handleClose} className="rounded-full p-1.5 transition-colors hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 pb-6 space-y-5">
              {/* Location */}
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-lineup" /> Where are you heading?
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pick a spot..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {WRIGLEYVILLE_BARS.map((bar) => (
                      <SelectItem key={bar.id} value={bar.name}>
                         {bar.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Wrigley Field - Bleachers"> Bleachers</SelectItem>
                    <SelectItem value="Wrigley Field - Upper Deck"> Upper Deck</SelectItem>
                    <SelectItem value="Wrigley Field - Rooftop"> Rooftop</SelectItem>
                    <SelectItem value="__custom__"> Custom location...</SelectItem>
                  </SelectContent>
                </Select>
                {location === '__custom__' && (
                  <Input
                    placeholder="Type your spot (e.g. Section 202, Gallagher Way)"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="rounded-xl"
                  />
                )}
                {location && location !== '__custom__' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold">
                      <Sparkles className="h-3 w-3" /> Perfect spot for a pregame crew
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-600 px-2.5 py-1 text-[11px] font-semibold">
                      <Flame className="h-3 w-3" /> This bar is heating up — great place to host
                    </span>
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-lineup" /> What time?
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pick a time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatTime(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="font-semibold">Add a note (optional)</Label>
                <Textarea
                  placeholder="e.g. First round's on me! Look for the guy in the Kerry Wood jersey."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>

              {/* Max members */}
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-lineup" /> Max group size
                </Label>
                <Select value={maxMembers} onValueChange={setMaxMembers}>
                  <SelectTrigger className="rounded-xl w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 6, 8, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} fans</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Boost suggestions */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Boost your meetup
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Meetups are the fastest way to find your Wrigleyville crew.
                </p>
                <div className="-mx-6 px-6 overflow-x-auto">
                  <div className="flex gap-3 pb-1 snap-x snap-mandatory">
                    {[
                      { icon: UserPlus, text: 'Fans nearby who might want to join', from: 'from-blue-500/15', to: 'to-blue-500/5', accent: 'text-blue-600' },
                      { icon: Users, text: 'Invite your section', from: 'from-emerald-500/15', to: 'to-emerald-500/5', accent: 'text-emerald-600' },
                      { icon: Zap, text: 'Start a flash meetup at a nearby bar', from: 'from-orange-500/15', to: 'to-orange-500/5', accent: 'text-orange-600' },
                    ].map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toast.info('Coming up next pitch ')}
                        className={`snap-start shrink-0 w-[220px] min-h-[96px] rounded-2xl border border-border bg-gradient-to-br ${s.from} ${s.to} p-3 text-left hover:border-primary/40 transition-colors`}
                      >
                        <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full bg-card ${s.accent} mb-2`}>
                          <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{s.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <Button
                onClick={handleSubmit}
                disabled={createMeetup.isPending}
                className="w-full rounded-full font-semibold bg-lineup text-lineup-foreground hover:bg-lineup/90 h-12 text-base"
              >
                {createMeetup.isPending ? 'Posting...' : ' Post to The Lineup'}
              </Button>
            </div>
            </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
