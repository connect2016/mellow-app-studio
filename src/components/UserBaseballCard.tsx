import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { Beer, Building2, CheckCircle2, Users, RotateCcw, BarChart3, Wine, UtensilsCrossed, Pizza, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { GameStatus, IntentType, GamedayIntentType, INTENT_LABELS, INTENT_EMOJI, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI } from '@/types';
import { Button } from '@/components/ui/button';
import { StatPreference, StatKey, DEFAULT_STAT_PREFS, StatVisibility } from '@/hooks/useStatPreferences';
import { CardFrontSide } from '@/components/card/CardFrontSide';
import { CardBackSide } from '@/components/card/CardBackSide';
import { BuyBeerButton } from '@/components/beer/BuyBeerButton';


interface CardStats {
  beersToday?: number;
  beersThisWeek?: number;
  barsVisitedToday?: number;
  barsVisitedThisWeek?: number;
  meetupsFinished?: number;
  fansConnected?: number;
  shotsTakenSeason?: number;
  appetizersHadSeason?: number;
  favoriteFoodSpot?: string;
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
  userId?: string;
  fanStreak?: number;
  fanTags?: string[];
}

export const STAT_ICONS: Record<StatKey, React.ElementType> = {
  beersToday: Beer,
  beersThisWeek: Beer,
  barsVisitedToday: Building2,
  barsVisitedThisWeek: Building2,
  meetupsFinished: CheckCircle2,
  fansConnected: Users,
  shotsTakenSeason: Wine,
  appetizersHadSeason: UtensilsCrossed,
  favoriteFoodSpot: Pizza,
};

export const CARD_STAT_LABELS: Record<StatKey, string> = {
  beersToday: 'Beers Today',
  beersThisWeek: 'Beers This Week',
  barsVisitedToday: 'Bars Today',
  barsVisitedThisWeek: 'Bars This Week',
  meetupsFinished: 'Meetups Done',
  fansConnected: 'Fans Connected',
  shotsTakenSeason: 'Shots (Season)',
  appetizersHadSeason: 'Appetizers (Season)',
  favoriteFoodSpot: 'Favorite Food Spot',
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
  value: number | string;
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
  userId,
  fanStreak,
  fanTags,
}: UserBaseballCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ReactionDef[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function shareCard() {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }
        const file = new File([blob], 'my-cubs-card.png', { type: 'image/png' });
        try {
          if (
            typeof navigator !== 'undefined' &&
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            await navigator.share({
              title: 'My Wrigleyville Buddies Fan Card',
              text: 'Find your Cubs crew → wrigleyvillebuddies.com',
              files: [file],
            });
            track('card_shared', { method: 'native' });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-cubs-card.png';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Card downloaded');
            track('card_shared', { method: 'download' });
          }
        } catch {
          // user cancelled share
        } finally {
          setIsSharing(false);
        }
      }, 'image/png');
    } catch {
      toast.error('Could not generate card image');
      setIsSharing(false);
    }
  }

  const handleReact = (reaction: ReactionDef) => {
    if (activeReactions.find(r => r.key === reaction.key)) {
      setActiveReactions(prev => prev.filter(r => r.key !== reaction.key));
    } else {
      setActiveReactions(prev => [...prev.slice(-2), reaction]);
    }
  };

  const statusLabel = gameStatus === 'AtWrigley' ? ` At Wrigley${wrigleySection ? ` · Sec ${wrigleySection}` : ''}`
    : gameStatus === 'AtBar' ? ` ${wrigleyvilleBar || 'At the bar'}`
    : gameStatus === 'Tailgating' ? ' Tailgating'
    : gameStatus === 'WatchingRemote' ? ' Watching from home'
    : null;

  const cardStats: CardStats = stats || {
    beersToday: 0,
    beersThisWeek: 0,
    barsVisitedToday: 0,
    barsVisitedThisWeek: 0,
    meetupsFinished: 0,
    fansConnected: 0,
    shotsTakenSeason: 0,
    appetizersHadSeason: 0,
    favoriteFoodSpot: '',
  };

  function safeNumber(v: unknown): number {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  const prefs = statPreferences ?? DEFAULT_STAT_PREFS;

  const visibleStats: VisibleStat[] = prefs
    .filter(p => p.enabled && canViewStat(p.visibility, isOwner, isMatch))
    .filter(p => {
      // Hide Favorite Food Spot tile if user hasn't set one
      if (p.stat_key === 'favoriteFoodSpot') {
        return !!cardStats.favoriteFoodSpot;
      }
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      key: p.stat_key,
      icon: STAT_ICONS[p.stat_key],
      value: p.stat_key === 'favoriteFoodSpot'
        ? (cardStats.favoriteFoodSpot ?? '')
        : safeNumber(cardStats[p.stat_key]),
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
      {/* Flip container — fixed bounding box (aspect-ratio) drives an identical
          height on both faces. The container itself never transforms; only the
          inner wrapper rotates, so the box this card occupies in the parent
          grid never changes during or after the flip. */}
      <div
        ref={cardRef}
        className="card-container relative w-full mx-auto"
        style={{
          maxWidth: 360,
          aspectRatio: '3 / 4.2',
          perspective: '1200px',
          WebkitPerspective: 1200,
        }}
      >
        <div
          className={cn('card-inner', isFlipped && 'is-flipped')}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
            willChange: 'transform',
          }}
        >
        {/* ===== FRONT SIDE ===== */}
        <div
          className="card-front"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            overflow: 'hidden',
            borderRadius: 12,
          }}
        >
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
            fanStreak={fanStreak}
            userId={userId}
            fanTags={fanTags}
          />

        </div>

        {/* ===== BACK SIDE (Stats) ===== */}
        <CardBackSide
          displayName={displayName}
          visibleStats={visibleStats}
          isOwner={isOwner}
          userId={userId}
          onFlipBack={() => setIsFlipped(false)}
        />
        </div>
      </div>

      {/* Intent badges (front-side metadata) */}
      {intents && intents.length > 0 && !isFlipped && (
        <div className="mt-3 flex flex-wrap gap-2 px-1" role="list" aria-label="Intents">
          {intents.map((intent) => (
            <span
              key={intent}
              role="listitem"
              className="inline-flex items-center gap-1 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              <span aria-hidden="true">{INTENT_EMOJI[intent]}</span>
              <span>{INTENT_LABELS[intent]}</span>
            </span>
          ))}
        </div>
      )}

      {gamedayIntents && gamedayIntents.length > 0 && !isFlipped && (
        <div className="mt-2 flex flex-wrap gap-2 px-1" role="list" aria-label="Gameday intents">
          {gamedayIntents.map((gi) => (
            <span
              key={gi}
              role="listitem"
              className="inline-flex items-center gap-1 rounded-2xl border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary-foreground"
            >
              <span aria-hidden="true">{GAMEDAY_INTENT_EMOJI[gi]}</span>
              <span>{GAMEDAY_INTENT_LABELS[gi]}</span>
            </span>
          ))}
        </div>
      )}

      {/* Buy a Beer — primary social CTA on public profile cards */}
      {!isOwner && userId && !isFlipped && (
        <div className="mt-4 px-1">
          <BuyBeerButton
            context={{ kind: 'fan', userId, firstName: displayName?.split(' ')[0] }}
            surface="profile_card"
            variant="default"
            size="default"
            showMicrocopy
            className="w-full rounded-2xl min-h-[48px] shadow-sm"
          />
        </div>
      )}

      {/* Flip toggle — the ONLY trigger for the 3D flip animation */}
      {visibleStats.length > 0 && (
        <div className="mt-4 flex justify-center px-1">
          <Button
            variant="outline"
            size="default"
            className="w-full rounded-2xl gap-2 font-semibold min-h-[48px] px-6 shadow-sm active:scale-[0.97] transition-all"
            style={{
              background: 'hsl(var(--brand-navy))',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '12px',
              padding: '14px 24px',
              letterSpacing: '0.02em',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped((v) => !v);
            }}
            aria-pressed={isFlipped}
            aria-label={isFlipped ? 'Flip back to profile' : 'View stats on back of card'}
          >
            <BarChart3 className="h-5 w-5" style={{ color: '#FFFFFF' }} />
            {isFlipped ? 'Back to Profile' : 'View Stats'}
          </Button>
        </div>
      )}

      {/* Share my card */}
      {isOwner && !isFlipped && (
        <div className="mt-3 px-1">
          <Button
            variant="outline"
            size="default"
            className="w-full rounded-2xl gap-2 font-semibold min-h-[48px] shadow-sm active:scale-[0.97] transition-all"
            style={{
              background: '#FFFFFF',
              color: 'hsl(var(--brand-navy))',
              border: '2px solid hsl(var(--brand-navy))',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '12px',
              padding: '14px 24px',
              letterSpacing: '0.02em',
            }}
            onClick={(e) => {
              e.stopPropagation();
              shareCard();
            }}
            disabled={isSharing}
            aria-label="Share my fan card"
          >
            {isSharing ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(var(--brand-navy))' }} /> : <Share2 className="h-5 w-5" style={{ color: 'hsl(var(--brand-navy))' }} />}
            {isSharing ? 'Preparing…' : 'Share my card'}
          </Button>
        </div>
      )}

      {/* Quick-react strip below card */}
      {showReactions && !isFlipped && (
        <div className="mt-3 py-2 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide" role="toolbar" aria-label="Reactions">
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
                'flex-shrink-0 px-2 py-1.5 rounded-2xl border min-h-[56px] min-w-[56px] flex flex-col items-center justify-center gap-1',
                'active:scale-[0.97] transition-all duration-150',
                activeReactions.find(a => a.key === r.key)
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/50 bg-muted/40 hover:bg-primary/5'
              )}
            >
              <RealisticEmoji name={r.icon} alt={r.label} size="xs" />
              <span className="text-[10px] font-medium text-muted-foreground leading-none whitespace-nowrap">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
