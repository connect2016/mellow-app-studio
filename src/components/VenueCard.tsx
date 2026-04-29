import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Zap, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VenueData } from '@/hooks/useVenueActivity';
import { useBarVotes } from '@/hooks/useBarVotes';
import { BarVibeBadge } from '@/components/BarVibeBadge';
import { BarVotePanel } from '@/components/BarVotePanel';
import { format } from 'date-fns';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const crowdConfig: Record<VenueData['crowdLevel'], { label: string; color: string; emoji: string; bars: number }> = {
  empty: { label: 'Empty', color: 'bg-muted text-muted-foreground', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', bars: 0 },
  chill: { label: 'Chill', color: 'bg-green-500/15 text-green-700 dark:text-green-400', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', bars: 1 },
  busy: { label: 'Busy', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', bars: 2 },
  packed: { label: 'Packed', color: 'bg-red-500/15 text-red-700 dark:text-red-400', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', bars: 3 },
};

const vibeEmoji: Record<string, string> = {
  chill: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  party: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  hype: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  rowdy: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
};

const waitLabels: Record<string, string> = {
  no_line: 'No wait',
  short: '~5 min',
  moderate: '~15 min',
  long: '30+ min',
};

interface VenueCardProps {
  venue: VenueData;
  index: number;
  onJoinMeetup?: (meetupId: string) => void;
}

export function VenueCard({ venue, index, onJoinMeetup }: VenueCardProps) {
  const crowd = crowdConfig[venue.crowdLevel];
  const { getSummary } = useBarVotes();
  const summary = getSummary(venue.name);
  const [showVote, setShowVote] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl">{crowd.emoji}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              {venue.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${crowd.color}`}>
                {crowd.label}
              </Badge>
              <BarVibeBadge summary={summary} />
            </div>
          </div>
        </div>

        {/* Crowd meter */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-1.5 rounded-full transition-colors ${
                  i <= crowd.bars ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground ml-1">{venue.totalUsers}</span>
          <Users className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>

      {/* Active users row */}
      {venue.activeUsers.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {venue.activeUsers.slice(0, 6).map((u) => (
              <div
                key={u.user_id}
                className="h-6 w-6 rounded-full border-2 border-card bg-muted overflow-hidden"
              >
                {u.profile_photo ? (
                  <img src={u.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    {u.display_name?.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {venue.totalUsers > 6 && (
            <span className="text-[10px] text-muted-foreground">+{venue.totalUsers - 6} more</span>
          )}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {waitLabels[venue.waitTime] || 'Unknown'}
          </div>
        </div>
      )}

      {/* Meetups */}
      {venue.meetups.length > 0 && (
        <div className="border-t border-border px-4 py-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {venue.meetups.length} Active Meetup{venue.meetups.length !== 1 ? 's' : ''}
            </span>
          </div>
          {venue.meetups.slice(0, 2).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl bg-primary/[0.04] border border-primary/10 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {m.description || 'Meetup'}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {format(new Date(m.meeting_time), 'h:mm a')} · {m.memberCount}/{m.maxMembers} joined
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] font-bold text-primary"
                onClick={() => onJoinMeetup?.(m.id)}
              >
                Join <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Vote button + panel */}
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={() => setShowVote((v) => !v)}
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          {showVote ? 'Cancel' : '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Rate Wait & Vibe'}
        </button>
        <AnimatePresence>
          {showVote && <BarVotePanel barName={venue.name} onClose={() => setShowVote(false)} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
