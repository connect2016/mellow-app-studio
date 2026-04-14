import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Beer, Building2, CheckCircle2, Users, RotateCcw, BarChart3 } from 'lucide-react';
import cardTemplate from '@/assets/baseball-card-template.png';
import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { GameStatus, IntentType, GamedayIntentType, INTENT_LABELS, INTENT_EMOJI, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI } from '@/types';
import { Button } from '@/components/ui/button';
import { StatPreference, StatKey, DEFAULT_STAT_PREFS, StatVisibility } from '@/hooks/useStatPreferences';

interface CardStats {
  beersToday?: number;
  beersThisWeek?: number;
  barsVisitedToday?: number;
  barsVisitedThisWeek?: number;
  meetupsFinished?: number;
  fansConnected?: number;
}

interface UserBaseballCardProps {
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
  /** Whether the viewer is a match of this user */
  isMatch?: boolean;
  /** Whether the viewer is the owner of this card */
  isOwner?: boolean;
}

const STAT_ICONS: Record<StatKey, React.ElementType> = {
  beersToday: Beer,
  beersThisWeek: Beer,
  barsVisitedToday: Building2,
  barsVisitedThisWeek: Building2,
  meetupsFinished: CheckCircle2,
  fansConnected: Users,
};

const STAT_LABELS: Record<StatKey, string> = {
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

  const statusLabel = gameStatus === 'AtWrigley' ? `🏟️ At Wrigley${wrigleySection ? ` · Sec ${wrigleySection}` : ''}`
    : gameStatus === 'AtBar' ? `🍺 ${wrigleyvilleBar || 'At the bar'}`
    : gameStatus === 'Tailgating' ? '🌭 Tailgating'
    : gameStatus === 'WatchingRemote' ? '📺 Watching from home'
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

  // Filter and sort stats based on preferences + visibility
  const visibleStats = prefs
    .filter(p => p.enabled && canViewStat(p.visibility, isOwner, isMatch))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      key: p.stat_key,
      icon: STAT_ICONS[p.stat_key],
      value: cardStats[p.stat_key] ?? 0,
      label: STAT_LABELS[p.stat_key],
      timeRange: p.time_range,
      visibility: p.visibility,
    }));

  return (
    <div
      className={cn(
        'relative w-full mx-auto group select-none',
        className
      )}
      style={{ perspective: '1200px' }}
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
        <div
          className="relative w-full cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={onClick}
        >
          <div className="relative">
            <img
              src={cardTemplate}
              alt="Wrigleyville 60613 Baseball Card"
              className="w-full h-auto block rounded-lg"
              draggable={false}
            />

            {/* Profile photo oval */}
            <div
              className="absolute overflow-hidden"
              style={{
                top: '18%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '56%',
                height: '52%',
                borderRadius: '50%',
              }}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={displayName}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    imgLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/60">
                  <img src={cardTemplate} alt="" className="h-8 w-8 opacity-30 object-contain" draggable={false} />
                </div>
              )}
            </div>

            {/* Display name */}
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{ bottom: '7.5%', left: '30%', right: '8%', height: '5%', zIndex: 20 }}
            >
              <span
                className="font-extrabold truncate text-center w-full"
                style={{
                  fontSize: 'clamp(13px, 3vw, 22px)',
                  fontFamily: "'Graduate', 'Inter', serif",
                  color: '#0a1445',
                  letterSpacing: '1px',
                  lineHeight: 1,
                }}
              >
                {displayName || 'Fan'}
              </span>
            </div>

            {/* Status badge */}
            {statusLabel && (
              <div
                className="absolute flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/15"
                style={{ top: '6%', left: '50%', transform: 'translateX(-50%)', zIndex: 15 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[11px] font-semibold text-white whitespace-nowrap">{statusLabel}</span>
              </div>
            )}

            {/* Active reaction overlays */}
            {activeReactions.length > 0 && (
              <div className="absolute flex gap-1 items-end" style={{ bottom: '12%', right: '6%', zIndex: 20 }}>
                {activeReactions.map((r) => (
                  <div key={r.key} className="animate-scale-in">
                    <RealisticEmoji src={r.image} alt={r.label} size="md" />
                  </div>
                ))}
              </div>
            )}

            {/* Hover glow */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: '0 0 20px hsla(0, 65%, 50%, 0.3), 0 0 40px hsla(215, 52%, 25%, 0.2)' }}
            />
          </div>

          {/* Intent badges */}
          {intents && intents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
              {intents.map((intent) => (
                <span
                  key={intent}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  <span>{INTENT_EMOJI[intent]}</span>
                  <span>{INTENT_LABELS[intent]}</span>
                </span>
              ))}
            </div>
          )}

          {/* Gameday intent badges */}
          {gamedayIntents && gamedayIntents.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
              {gamedayIntents.map((gi) => (
                <span
                  key={gi}
                  className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  <span>{GAMEDAY_INTENT_EMOJI[gi]}</span>
                  <span>{GAMEDAY_INTENT_LABELS[gi]}</span>
                </span>
              ))}
            </div>
          )}

          {/* View Stats button */}
          {visibleStats.length > 0 && (
            <div className="mt-3 flex justify-center px-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
              >
                <BarChart3 className="h-4 w-4" />
                View Stats
              </Button>
            </div>
          )}
        </div>

        {/* ===== BACK SIDE (Stats) ===== */}
        <div
          className="absolute inset-0 w-full"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full h-full rounded-lg border-2 border-primary/40 bg-gradient-to-br from-card via-card to-muted/50 shadow-lg flex flex-col">
            {/* Header */}
            <div className="text-center pt-5 pb-3 px-4 border-b border-border/40">
              <h3
                className="font-extrabold text-lg tracking-wide"
                style={{
                  fontFamily: "'Graduate', 'Inter', serif",
                  color: '#0a1445',
                }}
              >
                {displayName || 'Fan'}'s Stats
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Season Performance</p>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 p-5">
              {visibleStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.key}
                    className="flex flex-col items-center justify-center rounded-xl bg-muted/40 border border-border/30 p-3 gap-1"
                  >
                    <Icon className="h-5 w-5 text-primary/70" />
                    <span className="text-2xl font-extrabold text-foreground leading-none">{stat.value}</span>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{stat.label}</span>
                    {isOwner && stat.visibility !== 'everyone' && (
                      <span className="text-[9px] text-muted-foreground/60">
                        {stat.visibility === 'matches_only' ? '🤝' : '🔒'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back to Profile button */}
            <div className="pb-5 px-5">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl gap-1.5 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Back to Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-react strip below card */}
      {showReactions && !isFlipped && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-hide">
          {REACTIONS.slice(0, 8).map((r) => (
            <button
              key={r.key}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(r);
              }}
              className={cn(
                'flex-shrink-0 p-2 rounded-full border min-h-[44px] min-w-[44px] flex items-center justify-center',
                'active:scale-90 transition-all duration-150',
                activeReactions.find(a => a.key === r.key)
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/50 bg-muted/40 hover:bg-primary/5'
              )}
            >
              <RealisticEmoji src={r.image} alt={r.label} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
