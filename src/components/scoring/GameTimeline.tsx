import { motion } from 'framer-motion';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface TimelineEvent {
  id: string;
  inning: number;
  half: string;
  play_type: string;
  description: string;
  confirmed_count: number;
  created_at: string;
}

const PLAY_EMOJI: Record<string, string> = {
  hr: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', strikeout: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', double_play: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', error: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  hit: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', walk: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', steal: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', catch: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />', other: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
};

interface GameTimelineProps {
  events: TimelineEvent[];
}

export function GameTimeline({ events }: GameTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">The scorebook's clean — add moments as they happen!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="space-y-0">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 relative"
          >
            {/* Timeline line */}
            {i < events.length - 1 && (
              <div className="absolute left-[14px] top-8 bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0 mt-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                {PLAY_EMOJI[event.play_type] ?? '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />'}
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-primary">
                  {event.half === 'top' ? '▲' : '▼'} {event.inning}{event.inning === 1 ? 'st' : event.inning === 2 ? 'nd' : event.inning === 3 ? 'rd' : 'th'}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">{event.play_type.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-foreground mt-0.5">{event.description}</p>
              {event.confirmed_count > 1 && (
                <span className="text-[10px] text-accent font-medium"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Confirmed by {event.confirmed_count} fans</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
