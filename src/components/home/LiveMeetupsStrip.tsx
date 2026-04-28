import { Link } from 'react-router-dom';
import { Clock, Users, ChevronRight, Plus } from 'lucide-react';
import { useLineupMeetups } from '@/hooks/useLineup';

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
  if (diffMin < 0) return 'Now';
  if (diffMin < 60) return `in ${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `in ${h}h${m ? ` ${m}m` : ''}`;
}

export function LiveMeetupsStrip({ onCreate }: { onCreate?: () => void }) {
  const { data: meetups = [], isLoading } = useLineupMeetups();
  const top = meetups.slice(0, 4);

  return (
    <section aria-labelledby="live-meetups-heading" className="mb-5">
      <div className="flex items-baseline justify-between mb-2.5 px-1">
        <h2 id="live-meetups-heading" className="text-base font-extrabold text-on-image">
          📋 Live Meetups
        </h2>
        <button
          onClick={onCreate}
          className="text-xs font-semibold text-on-image hover:underline flex items-center gap-0.5"
        >
          <Plus className="h-3 w-3" /> Post one
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 text-center text-sm text-destructive-foreground">
          Loading meetups…
        </div>
      ) : top.length === 0 ? (
        <button
          onClick={onCreate}
          className="block w-full rounded-2xl border border-dashed border-border bg-card/90 backdrop-blur-sm p-5 text-center transition active:scale-[0.98]"
        >
          <p className="text-2xl mb-1">⚾</p>
          <p className="text-sm font-semibold">No active meetups</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tap to start one</p>
        </button>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none snap-x snap-mandatory">
          {top.map((m) => (
            <Link
              key={m.id}
              to="/discover"
              className="snap-start shrink-0 w-[78%] sm:w-[60%] rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-3.5 shadow-sm transition active:scale-[0.98] hover:shadow-md"
            >
              <div className="flex items-start gap-2.5">
                <img
                  src={m.creator_photo || '/placeholder.svg'}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-tight truncate mt-2 text-destructive-foreground">
                    {m.location_name}
                  </p>
                  <p className="text-xs line-clamp-2 mt-1 text-destructive-foreground">
                    by {m.creator_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60">
                <div className="flex items-center gap-3 text-xs line-clamp-2 mt-1 text-destructive-foreground">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3 w-3" /> {formatTime(m.meeting_time)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="h-3 w-3" /> {m.member_count}/{m.max_members}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
