import { Trophy, Flame, Award } from 'lucide-react';
import { StreaksSection } from './StreaksSection';
import { MilestonesSection } from './MilestonesSection';

interface Props {
  /** Compact summary mode for profile page */
  compact?: boolean;
  onSeeAll?: () => void;
}

export function AchievementsHub({ compact = false, onSeeAll }: Props) {
  if (compact) {
    return (
      <div className="space-y-3">
        <button
          onClick={onSeeAll}
          className="w-full text-left rounded-2xl border border-border bg-card/95 p-4 transition hover:border-primary/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span
                className="text-sm font-bold uppercase tracking-wider text-foreground"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Achievements
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              See all →
            </span>
          </div>
          <div className="space-y-3">
            <StreaksSection compact />
            <MilestonesSection compact />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Streaks card */}
      <section className="rounded-2xl border border-border bg-card/95 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-orange-500" />
          <h2
            className="text-sm font-bold uppercase tracking-wider text-foreground"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Streaks
          </h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Keep your run alive
          </span>
        </div>
        <StreaksSection />
      </section>

      {/* Milestones card */}
      <section className="rounded-2xl border border-border bg-card/95 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-primary" />
          <h2
            className="text-sm font-bold uppercase tracking-wider text-foreground"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Milestones
          </h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Lifetime stats
          </span>
        </div>
        <MilestonesSection />
      </section>
    </div>
  );
}
