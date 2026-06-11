import { motion } from 'framer-motion';
import { Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VibeMeter, vibeToLevel } from '@/components/VibeMeter';
import { ReportVibeButton } from '@/components/ReportVibeButton';
import type { VenueData } from '@/hooks/useVenueActivity';
import { format } from 'date-fns';

const waitLabels: Record<string, string> = {
  no_line: 'No wait',
  short: '~5 min',
  moderate: '~15 min',
  long: '30+ min',
};

interface LineupVenueCardProps {
  venue: VenueData;
  index: number;
  onJoinMeetup?: (meetupId: string) => void;
}

export function LineupVenueCard({ venue, index, onJoinMeetup }: LineupVenueCardProps) {
  const vibeLevel = vibeToLevel(venue.dominantVibe, venue.totalUsers, venue.voteCount);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
      className="relative"
    >
      {/* Lineup card container */}
      <div className="ticket-stub relative border border-border bg-card/95 rounded-lg overflow-hidden">
        {/* Lineup number + perforation strip */}
        <div className="flex">
          {/* Order number column — like a lineup position */}
          <div className="flex-shrink-0 w-10 bg-primary/10 border-r border-dashed border-primary/25 flex flex-col items-center justify-center py-3">
            <span className="text-lg font-bold text-primary font-scoreboard leading-none">
              {index + 1}
            </span>
            <span className="text-[7px] text-muted-foreground font-scoreboard uppercase mt-0.5">
              pos
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 py-3 px-3">
            {/* Bar name row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-foreground truncate" style={{ fontFamily: "'Rye', cursive" }}>
                  {venue.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-scoreboard">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {venue.totalUsers}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {waitLabels[venue.waitTime] || '—'}
                  </span>
                  {venue.voteCount > 0 && (
                    <span className="text-primary/70">{venue.voteCount} vote{venue.voteCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              {/* Vibe Meter */}
              <VibeMeter level={vibeLevel} size="sm" />
            </div>

            {/* Active users */}
            {venue.activeUsers.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-1.5">
                  {venue.activeUsers.slice(0, 5).map((u) => (
                    <div
                      key={u.user_id}
                      className="h-5 w-5 rounded-full border border-card bg-muted overflow-hidden"
                    >
                      {u.profile_photo ? (
                        <img src={u.profile_photo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {u.display_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {venue.totalUsers > 5 && (
                  <span className="text-[9px] text-muted-foreground">+{venue.totalUsers - 5}</span>
                )}
              </div>
            )}

            {/* Meetups */}
            {venue.meetups.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {venue.meetups.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded bg-primary/[0.04] border border-primary/10 px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-foreground truncate">
                        {m.description || 'Meetup'}
                      </p>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {format(new Date(m.meeting_time), 'h:mm a')} · {m.memberCount}/{m.maxMembers}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 text-[9px] font-bold text-primary"
                      onClick={() => onJoinMeetup?.(m.id)}
                    >
                      Join <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Report Vibe */}
            <div className="mt-2 pt-2 border-t border-dashed border-border/50">
              <ReportVibeButton barName={venue.name} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
