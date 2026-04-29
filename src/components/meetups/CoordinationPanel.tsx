import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, Hand, Beer, ThumbsUp, Footprints, Loader2, X, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import {
  useMeetupCoordination,
  usePingMeetup,
  ARRIVAL_META,
  ETA_CHIPS,
  type ArrivalStatus,
  type CoordinationRow,
} from '@/hooks/useMeetupCoordination';

interface Attendee {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

interface Props {
  meetupId: string;
  locationName: string;
  attendees: Attendee[];
  isMember: boolean;
}

const STATUS_ORDER: ArrivalStatus[] = ['on_my_way', 'almost_there', 'arrived', 'running_late'];

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function CoordinationPanel({ meetupId, locationName, attendees, isMember }: Props) {
  const { rows, myRow, isLoading, upsert, clear } = useMeetupCoordination(meetupId);
  const ping = usePingMeetup(meetupId);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  const attendeeMap = useMemo(() => {
    const m = new Map<string, Attendee>();
    attendees.forEach(a => m.set(a.user_id, a));
    return m;
  }, [attendees]);

  // Aggregate counts for the summary strip
  const counts = useMemo(() => {
    const c: Record<ArrivalStatus, number> = {
      on_my_way: 0, almost_there: 0, arrived: 0, running_late: 0,
    };
    rows.forEach(r => { c[r.arrival_status] = (c[r.arrival_status] ?? 0) + 1; });
    return c;
  }, [rows]);

  if (!isMember) return null;

  const handleStatus = async (status: ArrivalStatus) => {
    try {
      await upsert.mutateAsync({ arrival_status: status });
      toast.success(`${ARRIVAL_META[status].emoji} ${ARRIVAL_META[status].label}`);
    } catch {
      toast.error("Couldn't update status");
    }
  };

  const handleEta = async (mins: number) => {
    try {
      await upsert.mutateAsync({ eta_minutes: mins, arrival_status: myRow?.arrival_status ?? 'on_my_way' });
      toast.success(`ETA set to ${mins}m`);
    } catch {
      toast.error("Couldn't set ETA");
    }
  };

  const handleClear = async () => {
    try {
      await clear.mutateAsync();
      toast('Cleared your status');
    } catch {
      toast.error("Couldn't clear");
    }
  };

  const handlePing = async () => {
    try {
      await ping.mutateAsync(`<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Where you at? Heading to ${locationName}.`);
      toast.success('Pinged the group');
    } catch {
      toast.error("Couldn't send ping");
    }
  };

  const handleSharePin = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Location not supported');
      return;
    }
    toast('<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Grabbing your spot...');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          await upsert.mutateAsync({
            shared_lat: pos.coords.latitude,
            shared_lng: pos.coords.longitude,
            shared_label: 'My current spot',
          });
          await ping.mutateAsync(
            `<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Shared my spot — https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
          );
          toast.success('Pin shared with the group');
        } catch {
          toast.error("Couldn't share pin");
        }
      },
      () => toast.error('Location permission denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleReact = async (emoji: string, label: string) => {
    setReactingTo(emoji);
    try {
      await ping.mutateAsync(`${emoji} ${label}`);
      toast.success(`${emoji} sent`);
    } catch {
      toast.error("Couldn't send");
    } finally {
      setTimeout(() => setReactingTo(null), 600);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Live coordination
        </p>
        {myRow && (
          <button
            onClick={handleClear}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> Clear my status
          </button>
        )}
      </div>

      {/* Status counts summary */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {STATUS_ORDER.map(s => {
          const meta = ARRIVAL_META[s];
          const n = counts[s];
          return (
            <div
              key={s}
              className="flex flex-col items-center justify-center rounded-xl bg-muted/60 py-2 px-1"
            >
              <span className="text-base leading-none">{meta.emoji}</span>
              <span className="text-[10px] font-bold text-foreground mt-0.5">{n}</span>
              <span className="text-[9px] text-muted-foreground leading-tight text-center">
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* My status picker */}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
        Set your status
      </p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {STATUS_ORDER.map(s => {
          const meta = ARRIVAL_META[s];
          const active = myRow?.arrival_status === s;
          return (
            <motion.button
              key={s}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleStatus(s)}
              disabled={upsert.isPending}
              className={`flex items-center justify-center gap-1.5 rounded-full min-h-[44px] text-xs font-semibold border transition ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ETA chips */}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Share ETA
        {myRow?.eta_minutes != null && (
          <Badge variant="secondary" className="ml-1 text-[9px] py-0 px-1.5 h-4">
            ~{myRow.eta_minutes}m
          </Badge>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ETA_CHIPS.map(min => {
          const active = myRow?.eta_minutes === min;
          return (
            <motion.button
              key={min}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEta(min)}
              disabled={upsert.isPending}
              className={`px-3 min-h-[36px] rounded-full text-xs font-bold border transition ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {min}m
            </motion.button>
          );
        })}
        {myRow?.eta_minutes != null && (
          <button
            onClick={() => upsert.mutate({ eta_minutes: null })}
            className="px-3 min-h-[36px] rounded-full text-[11px] text-muted-foreground hover:text-foreground"
          >
            clear
          </button>
        )}
      </div>

      {/* Quick actions */}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
        Quick actions
      </p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <Button
          onClick={handlePing}
          disabled={ping.isPending}
          variant="outline"
          className="rounded-xl h-11 gap-1.5 text-xs font-semibold"
        >
          {ping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
          Ping everyone
        </Button>
        <Button
          onClick={handleSharePin}
          disabled={upsert.isPending}
          variant="outline"
          className="rounded-xl h-11 gap-1.5 text-xs font-semibold"
        >
          <MapPin className="h-4 w-4" />
          Share my pin
        </Button>
      </div>

      {/* Quick reactions */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          React:
        </span>
        {[
          { e: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', label: 'Cheers', icon: Beer },
          { e: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', label: 'Got it', icon: ThumbsUp },
          { e: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', label: 'Hustling', icon: Footprints },
          { e: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', label: 'Hyped', icon: Sparkles },
        ].map(r => (
          <motion.button
            key={r.e}
            whileTap={{ scale: 0.85 }}
            animate={reactingTo === r.e ? { scale: [1, 1.3, 1] } : {}}
            onClick={() => handleReact(r.e, r.label)}
            disabled={ping.isPending}
            className="flex-1 min-h-[40px] rounded-xl bg-muted hover:bg-muted/70 text-base"
            aria-label={r.label}
          >
            {r.e}
          </motion.button>
        ))}
      </div>

      {/* Live roster of who's set what */}
      {rows.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Who's where
          </p>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {rows.map(r => <RosterRow key={r.id} row={r} attendee={attendeeMap.get(r.user_id)} />)}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {isLoading && rows.length === 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground text-center">Loading coordination...</p>
      )}
    </section>
  );
}

function RosterRow({ row, attendee }: { row: CoordinationRow; attendee?: Attendee }) {
  const meta = ARRIVAL_META[row.arrival_status];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2.5 text-xs"
    >
      <Link to={`/profile/${row.user_id}`} className="shrink-0">
        <img
          src={attendee?.profile_photo || '/placeholder.svg'}
          alt=""
          className="h-7 w-7 rounded-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-foreground truncate">
            {attendee?.display_name ?? 'Fan'}
          </span>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {meta.emoji} {meta.label}
          </span>
          {row.eta_minutes != null && row.arrival_status !== 'arrived' && (
            <span className="text-[10px] text-muted-foreground font-semibold">
              · ~{row.eta_minutes}m
            </span>
          )}
        </div>
        {row.shared_lat != null && row.shared_lng != null && (
          <a
            href={`https://maps.google.com/?q=${row.shared_lat},${row.shared_lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-primary inline-flex items-center gap-0.5 hover:underline"
          >
            <MapPin className="h-2.5 w-2.5" /> {row.shared_label || 'View pin'}
          </a>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground shrink-0">{timeAgo(row.updated_at)}</span>
    </motion.li>
  );
}
