import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLineupMeetups, useJoinMeetup } from '@/hooks/useLineup';
import { format, differenceInMinutes } from 'date-fns';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function HotMeetupsLive() {
  const { data: meetups, isLoading } = useLineupMeetups();
  const join = useJoinMeetup();
  const { toast } = useToast();
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    if (!meetups) return [];
    const now = Date.now();
    return [...meetups]
      .filter((m) => new Date(m.meeting_time).getTime() > now - 30 * 60 * 1000)
      .sort((a, b) => new Date(a.meeting_time).getTime() - new Date(b.meeting_time).getTime())
      .slice(0, 4);
  }, [meetups]);

  const handleJoin = (id: string, name: string) => {
    join.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Joined!', description: `You're in on ${name}` });
        navigate(`/meetups/${id}`);
      },
      onError: (err: any) => {
        toast({ title: 'Could not join', description: err?.message || 'Try again', variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Going down right now</h3>
        </div>
        <Link to="/meetups" className="text-[11px] font-semibold text-primary hover:underline">
          See all →
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <div className="text-2xl mb-1"></div>
          <p className="text-[12px] text-muted-foreground">
            No active meetups. Start one and pull a crew together.
          </p>
          <Button asChild size="sm" className="mt-3 h-8 text-xs">
            <Link to="/meetups">Create a meetup</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((m, idx) => {
            const minsAway = differenceInMinutes(new Date(m.meeting_time), new Date());
            const isStartingSoon = minsAway >= 0 && minsAway <= 30;
            const happeningNow = minsAway < 0 && minsAway > -120;
            const fillPct = Math.min(100, ((m.member_count ?? 1) / m.max_members) * 100);
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {happeningNow && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Happening
                        </span>
                      )}
                      {isStartingSoon && !happeningNow && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          ⏱ Starts in {minsAway}m
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {format(new Date(m.meeting_time), 'h:mm a')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground line-clamp-1">
                      {m.description || `Meetup with ${m.creator_name}`}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{m.location_name}</span>
                    </div>
                    {/* Capacity bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        <Users className="inline h-2.5 w-2.5 mr-0.5" />
                        {m.member_count ?? 1}/{m.max_members}
                      </span>
                    </div>
                  </div>

                  {m.is_member ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs shrink-0"
                      onClick={() => navigate(`/meetups/${m.id}`)}
                    >
                      Open <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      disabled={join.isPending || (m.member_count ?? 1) >= m.max_members}
                      onClick={() => handleJoin(m.id, m.location_name)}
                    >
                      {(m.member_count ?? 1) >= m.max_members ? 'Full' : 'Join'}
                    </Button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
