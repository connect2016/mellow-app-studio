import { Link } from 'react-router-dom';
import { Clock, Users, ChevronRight, Plus, Calendar } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { useLineupMeetups } from '@/hooks/useLineup';
import { SectionHeader } from '@/components/SectionHeader';

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
      <SectionHeader
        id="live-meetups-heading"
        icon={<Calendar className="h-4 w-4" strokeWidth={2.4} />}
        title="Meetups Happening Soon"
        onImage
        trailing={
          <button
            onClick={onCreate}
            className="text-xs font-semibold text-white/90 hover:text-white flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Post one
          </button>
        }
      />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 text-center text-sm text-destructive-foreground">
          Loading meetups…
        </div>
      ) : top.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-primary via-primary to-[hsl(222,82%,22%)] p-5 shadow-lg">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-secondary/15 blur-2xl" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/40">
              <ConceptIcon name="beer" className="h-6 w-6 text-secondary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold leading-tight text-white" style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}>
                Be the first to rally the crew!
              </p>
              <p className="mt-1 text-sm font-medium text-white/85">
                Start a meetup and fans nearby will see it instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onCreate}
            className="relative mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90"
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            Post a Meetup
          </button>
        </div>
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
                  <span className="flex items-center gap-1 font-bold text-destructive-foreground">
                    <Clock className="h-3 w-3" /> {formatTime(m.meeting_time)}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-destructive-foreground">
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
