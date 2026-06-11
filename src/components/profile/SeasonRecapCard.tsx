import { Trophy, Users, CalendarCheck, Sparkles } from 'lucide-react';
import { ShareMenu } from '@/components/share/ShareMenu';

interface SeasonRecapCardProps {
  displayName?: string | null;
  gamesAttended?: number;
  meetupsJoined?: number;
  buddiesMade?: number;
  isOwner?: boolean;
}

export function SeasonRecapCard({
  displayName,
  gamesAttended,
  meetupsJoined,
  buddiesMade,
  isOwner = false,
}: SeasonRecapCardProps) {
  const name = displayName?.trim() || 'Your';
  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://wrigleyvillebuddies.com';

  // Coerce nullish/NaN stat values at the data layer
  const safeNum = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const games = safeNum(gamesAttended);
  const meetups = safeNum(meetupsJoined);
  const buddies = safeNum(buddiesMade);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-label="Season recap"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="h-5 w-5 text-secondary shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-extrabold uppercase tracking-wide text-foreground truncate">
              {name === 'Your' ? 'Your Season Recap' : `${name}'s Season Recap`}
            </h3>
            <p className="text-xs text-muted-foreground">2026 Cubs season so far</p>
          </div>
        </div>
        <ShareMenu
          size="sm"
          title="Share your season recap"
          shareTitle={`${name === 'Your' ? 'My' : `${name}'s`} Cubs season recap`}
          shareUrl={shareUrl}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <RecapStat icon={CalendarCheck} value={games} label="Games attended" zeroHint="Attend your first game!" />
        <RecapStat icon={Sparkles} value={meetups} label="Meetups joined" zeroHint="Join your first meetup!" />
        <RecapStat icon={Users} value={buddies} label="Buddies made" zeroHint="Make your first buddy!" />
      </div>

      {isOwner && (
        <p className="mt-3 text-[11px] text-muted-foreground italic">
          A fuller animated recap is on the way — stats refresh as you play.
        </p>
      )}
    </section>
  );
}

function RecapStat({
  icon: Icon,
  value,
  label,
  zeroHint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  zeroHint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm p-3 min-h-[88px]">
      <Icon className="h-5 w-5 text-primary/80" aria-hidden="true" />
      <span className="mt-1 text-2xl font-extrabold text-foreground leading-none">{value}</span>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground text-center">
        {label}
      </span>
      {value === 0 && zeroHint && (
        <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }} className="text-center">
          {zeroHint}
        </span>
      )}
    </div>
  );
}
