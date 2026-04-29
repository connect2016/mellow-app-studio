import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Beer, Building2, CheckCircle2, Users, RotateCcw, BarChart3 } from 'lucide-react';
import cardTemplate from '@/assets/baseball-card-template.png';
import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { GameStatus, IntentType, GamedayIntentType, INTENT_LABELS, INTENT_EMOJI, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI } from '@/types';
import { Button } from '@/components/ui/button';
import { StatPreference, StatKey, DEFAULT_STAT_PREFS, StatVisibility } from '@/hooks/useStatPreferences';
import { CardFrontSide } from '@/components/card/CardFrontSide';
import { CardBackSide } from '@/components/card/CardBackSide';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface CardStats {
  beersToday?: number;
  beersThisWeek?: number;
  barsVisitedToday?: number;
  barsVisitedThisWeek?: number;
  meetupsFinished?: number;
  fansConnected?: number;
}

export interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  className?: string;
  onClick?: () => void;
  badges?: string[];
  stats?: CardStats;
  showReactions?: boolean;
  gameStatus?: GameStatus | string | null;
  wrigleySection?: string | null;
  wrigleyvilleBar?: string | null;
  intents?: IntentType[];
  gamedayIntents?: GamedayIntentType[];
  statPreferences?: StatPreference[];
  isMatch?: boolean;
  isOwner?: boolean;
}

export const STAT_ICONS: Record<StatKey, React.ElementType> = {
  beersToday: Beer,
  beersThisWeek: Beer,
  barsVisitedToday: Building2,
  barsVisitedThisWeek: Building2,
  meetupsFinished: CheckCircle2,
  fansConnected: Users,
};

export const CARD_STAT_LABELS: Record<StatKey, string> = {
  beersToday: 'Beers Today',
  beersThisWeek: 'Beers This Week',
  barsVisitedToday: 'Bars Today',
  barsVisitedThisWeek: 'Bars This Week',
  meetupsFinished: 'Meetups Done',
  fansConnected: 'Fans Connected',
};

function canViewStat(visibility: StatVisibility, isOwner: boolean, isMatch: boolean): boolean {
  if (isOwner) return true;
  if (visibility === 'everyone') return true;
  if (visibility === 'matches_only' && isMatch) return true;
  return false;
}

export interface VisibleStat {
  key: StatKey;
  icon: React.ElementType;
  value: number;
  label: string;
  timeRange: string;
  visibility: StatVisibility;
}

export function UserBaseballCard({
  profileImage,
  displayName,
  className,
  onClick,
  showReactions = true,
  gameStatus,
  wrigleySection,
  wrigleyvilleBar,
  intents,
  gamedayIntents,
  stats,
  statPreferences,
  isMatch = false,
  isOwner = false,
}: UserBaseballCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ReactionDef[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReact = (reaction: ReactionDef) => {
    if (activeReactions.find(r => r.key === reaction.key)) {
      setActiveReactions(prev => prev.filter(r => r.key !== reaction.key));
    } else {
      setActiveReactions(prev => [...prev.slice(-2), reaction]);
    }
  };

  const statusLabel = gameStatus === 'AtWrigley' ? `<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> At Wrigley${wrigleySection ? ` · Sec ${wrigleySection}` : ''}`
    : gameStatus === 'AtBar' ? `<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> ${wrigleyvilleBar || 'At the bar'}`
    : gameStatus === 'Tailgating' ? '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Tailgating'
    : gameStatus === 'WatchingRemote' ? '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Watching from home'
    : null;

  const cardStats: CardStats = stats || {
    beersToday: 0,
    beersThisWeek: 0,
    barsVisitedToday: 0,
    barsVisitedThisWeek: 0,
    meetupsFinished: 0,
    fansConnected: 0,
  };

  const prefs = statPreferences ?? DEFAULT_STAT_PREFS;

  const visibleStats: VisibleStat[] = prefs
    .filter(p => p.enabled && canViewStat(p.visibility, isOwner, isMatch))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      key: p.stat_key,
      icon: STAT_ICONS[p.stat_key],
      value: cardStats[p.stat_key] ?? 0,
      label: CARD_STAT_LABELS[p.stat_key],
      timeRange: p.time_range,
      visibility: p.visibility,
    }));

  return (
    <div
      className={cn('relative w-full mx-auto group select-none', className)}
      style={{ perspective: '1200px' }}
      role="region"
      aria-label={`${displayName || 'Fan'}'s baseball card`}
    >
      {/* Flip container */}
      <div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ===== FRONT SIDE ===== */}
        <CardFrontSide
          profileImage={profileImage}
          displayName={displayName}
          statusLabel={statusLabel}
          intents={intents}
          gamedayIntents={gamedayIntents}
          activeReactions={activeReactions}
          imgLoaded={imgLoaded}
          onImgLoad={() => setImgLoaded(true)}
          onClick={onClick}
          hasStats={visibleStats.length > 0}
          onFlipToStats={() => setIsFlipped(true)}
        />

        {/* ===== BACK SIDE (Stats) ===== */}
        <CardBackSide
          displayName={displayName}
          visibleStats={visibleStats}
          isOwner={isOwner}
          onFlipBack={() => setIsFlipped(false)}
        />
      </div>

      {/* Quick-react strip below card */}
      {showReactions && !isFlipped && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide" role="toolbar" aria-label="Reactions">
          {REACTIONS.slice(0, 8).map((r) => (
            <button
              key={r.key}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(r);
              }}
              aria-label={`React with ${r.label}`}
              aria-pressed={!!activeReactions.find(a => a.key === r.key)}
              className={cn(
                'flex-shrink-0 p-2.5 rounded-2xl border min-h-[48px] min-w-[48px] flex items-center justify-center',
                'active:scale-[0.97] transition-all duration-150',
                activeReactions.find(a => a.key === r.key)
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/50 bg-muted/40 hover:bg-primary/5'
              )}
            >
              <RealisticEmoji name={r.icon} alt={r.label} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
