import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlashMeetups, FlashMeetup } from '@/hooks/useFlashMeetups';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Zap, MapPin, Users, Clock, Plus, X, ChevronDown, ChevronUp,
  Flame, Coffee, PartyPopper, Timer,
} from 'lucide-react';
import { toast } from 'sonner';

const VIBE_OPTIONS = [
  { value: 'hype', label: 'Hype', emoji: '⚡', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'chill', label: 'Chill', emoji: '😎', color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' },
  { value: 'party', label: 'Party', emoji: '🎉', color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' },
  { value: 'rally', label: 'Rally', emoji: '🚀', color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
];

const QUICK_SPOTS = [
  "Murphy's Bleachers", "Sluggers", "Cubby Bear", "Casey Moran's",
  "Old Crow Smokehouse", "HVAC Pub", "Gallagher Way", "Bernie's",
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setUrgency('critical');
        return;
      }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      setUrgency(mins < 5 ? 'critical' : mins < 15 ? 'warning' : 'normal');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const colorClass = urgency === 'critical'
    ? 'text-red-500'
    : urgency === 'warning'
      ? 'text-amber-500'
      : 'text-muted-foreground';

  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-mono font-semibold ${colorClass}`}>
      <Timer className="h-3 w-3" />
      {timeLeft}
      {urgency === 'critical' && timeLeft !== 'Expired' && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-0.5 text-[9px]"
        >
          ⏰
        </motion.span>
      )}
    </span>
  );
}

function FlashMeetupCard({ meetup, onJoin, onLeave, isPending }: {
  meetup: FlashMeetup;
  onJoin: () => void;
  onLeave: () => void;
  isPending: boolean;
}) {
  const vibeConf = VIBE_OPTIONS.find(v => v.value === meetup.vibe) ?? VIBE_OPTIONS[0];
  const spotsLeft = meetup.max_members - (meetup.member_count ?? 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${vibeConf.bg}`}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">{meetup.emoji}</span>
          <h4 className="text-base font-bold text-foreground truncate">{meetup.title}</h4>
        </div>
        {meetup.is_system_generated && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary shrink-0">
            AI
          </Badge>
        )}
      </div>

      {/* Pills row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <CountdownTimer expiresAt={meetup.expires_at} />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {meetup.location_name}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {meetup.member_count}/{meetup.max_members}
        </span>
      </div>

      {/* Description */}
      {meetup.description && (
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{meetup.description}</p>
      )}

      {/* Members + Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex -space-x-2">
          {(meetup.members ?? []).slice(0, 5).map(m => (
            <div
              key={m.user_id}
              className="h-7 w-7 rounded-full border-2 border-card bg-muted overflow-hidden"
              title={m.display_name}
            >
              {m.profile_photo ? (
                <img src={m.profile_photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {m.display_name?.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {meetup.is_joined ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full min-h-[44px] px-5 text-sm font-semibold"
            onClick={onLeave}
            disabled={isPending}
          >
            Leave
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full min-h-[44px] px-6 text-sm font-bold gap-1.5"
            disabled={isFull || isPending}
            onClick={onJoin}
          >
            <Zap className="h-4 w-4" />
            {isFull ? 'Full' : isPending ? 'Joining...' : 'Join'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function FlashMeetupsPanel() {
  const { user } = useAuth();
  const { meetups, isLoading, joinMeetup, leaveMeetup, createMeetup } = useFlashMeetups();
  const [showCreate, setShowCreate] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [vibe, setVibe] = useState('hype');
  const [duration, setDuration] = useState(30);
  const [emoji, setEmoji] = useState('⚡');

  const handleCreate = async () => {
    if (!title.trim() || !location.trim()) {
      toast.error('Give your flash meetup a name and spot');
      return;
    }
    try {
      await createMeetup.mutateAsync({
        title: title.trim(),
        location_name: location.trim(),
        emoji,
        vibe,
        duration_minutes: duration,
      });
      toast.success('⚡ Flash meetup is live!');
      setShowCreate(false);
      setTitle('');
      setLocation('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
  };

  const liveMeetups = meetups.filter(m => new Date(m.expires_at).getTime() > Date.now());
  const displayMeetups = showAll ? liveMeetups : liveMeetups.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">
            Flash Meetups
          </h3>
          {liveMeetups.length > 0 && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Badge className="text-[9px] h-4 px-1.5 bg-amber-500 text-white border-0">
                {liveMeetups.length} LIVE
              </Badge>
            </motion.div>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreate ? 'Cancel' : 'Create'}
        </button>
      </div>

      <div className="px-4 py-3">
        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-3 rounded-xl border border-border p-3 bg-background">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">What's happening?</Label>
                  <Input
                    placeholder="e.g. Post-game beers 🍻"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="rounded-lg h-9 text-sm"
                    maxLength={60}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Where?</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUICK_SPOTS.slice(0, 4).map(spot => (
                      <button
                        key={spot}
                        onClick={() => setLocation(spot)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                          location === spot
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {spot}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Or type a spot..."
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="rounded-lg h-9 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Vibe</Label>
                    <div className="flex gap-1">
                      {VIBE_OPTIONS.map(v => (
                        <button
                          key={v.value}
                          onClick={() => { setVibe(v.value); setEmoji(v.emoji); }}
                          className={`flex-1 text-center text-[10px] py-1.5 rounded-lg border transition-all ${
                            vibe === v.value
                              ? `${v.bg} font-medium`
                              : 'border-border text-muted-foreground hover:border-primary/20'
                          }`}
                        >
                          {v.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                    <div className="flex gap-1">
                      {DURATION_OPTIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setDuration(d.value)}
                          className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all ${
                            duration === d.value
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full rounded-lg h-9 text-sm font-semibold gap-1.5"
                  disabled={createMeetup.isPending || !title.trim() || !location.trim()}
                  onClick={handleCreate}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {createMeetup.isPending ? 'Creating...' : `Go Live (${duration} min)`}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meetup list */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
                  <div className="h-7 w-28 rounded-full bg-muted animate-pulse" />
                  <div className="h-7 w-16 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="flex justify-end">
                  <div className="h-11 w-24 rounded-full bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : liveMeetups.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-sm">No meetups yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
              Be the first to start one — rally the fans!
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full min-h-[44px] px-6 font-semibold gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Create Meetup
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayMeetups.map(meetup => (
                <FlashMeetupCard
                  key={meetup.id}
                  meetup={meetup}
                  onJoin={() => {
                    joinMeetup.mutate(meetup.id, {
                      onSuccess: () => toast.success("You're in! We'll notify you when others join. ⚡"),
                      onError: (err: any) => toast.error(err.message || 'Failed to join'),
                    });
                  }}
                  onLeave={() => {
                    leaveMeetup.mutate(meetup.id, {
                      onSuccess: () => toast.info('Left the flash meetup'),
                      onError: (err: any) => toast.error(err.message || 'Failed to leave'),
                    });
                  }}
                  isPending={joinMeetup.isPending || leaveMeetup.isPending}
                />
              ))}
            </AnimatePresence>

            {liveMeetups.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1 text-xs text-primary font-medium py-1.5 hover:text-primary/80 transition-colors"
              >
                {showAll ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Show {liveMeetups.length - 3} more <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}

            <p className="text-center text-[10px] text-muted-foreground">
              Flash meetups auto-expire — jump in before they're gone ⚡
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
