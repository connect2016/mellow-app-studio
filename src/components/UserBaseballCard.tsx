import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { RotateCcw, BarChart3, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { GameStatus, IntentType, GamedayIntentType, INTENT_LABELS, INTENT_EMOJI, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI } from '@/types';
import { Button } from '@/components/ui/button';
import { StatPreference } from '@/hooks/useStatPreferences';
import { CardFrontSide } from '@/components/card/CardFrontSide';
import { CardBackSide } from '@/components/card/CardBackSide';
import { BuyBeerButton } from '@/components/beer/BuyBeerButton';
import { sayHiToBuddy } from '@/hooks/useDiscoverFans';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { MakeYourCardDialog } from '@/components/card/MakeYourCardDialog';
import { shareFanCard } from '@/lib/share-fan-card';
import { CardStats, getVisibleStats } from '@/lib/cardStats';

export interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  instagram?: string | null;
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

export function UserBaseballCard({
  profileImage,
  displayName,
  instagram,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sayHiState, setSayHiState] = useState<'idle' | 'pending' | 'sent'>('idle');

  const handleSayHi = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!userId || sayHiState !== 'idle') return;
    setSayHiState('pending');
    try {
      const res = await sayHiToBuddy(userId);
      setSayHiState('sent');
      toast.success(res.result === 'accepted' ? "You're now teammates! 🎉" : 'Buddy request sent 👋');
    } catch (e: any) {
      setSayHiState('idle');
      toast.error(e?.message ?? 'Could not send request');
    }
  };
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading } = usePhotoUpload();
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handlePickPhoto = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    // Open the "Make your card" dialog — upload happens after crop confirm
    setPendingFile(file);
  };

  async function shareCard() {
    if (!profileImage || isSharing) return;
    setIsSharing(true);
    try {
      await shareFanCard({
        profileImage,
        displayName,
        surface: 'profile',
      });
    } catch (err) {
      console.error('Share card failed', err);
      toast.error('Could not build your card', {
        id: 'share-card-error',
        action: { label: 'Retry', onClick: () => void shareCard() },
      });
    } finally {
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

  const visibleStats = getVisibleStats({ stats, statPreferences, isOwner, isMatch });

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
            instagram={instagram}
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
            editable={isOwner}
            uploading={uploading}
            onPickPhoto={handlePickPhoto}
          />

          {isOwner && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileSelected}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}

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
          context={{ kind: 'fan', userId, firstName: displayName?.split(' ')[0], avatarUrl: profileImage ?? undefined }}
          surface="profile_card"
          variant="default"
          className="w-full rounded-2xl min-h-[48px] shadow-sm"
        />
        </div>
      )}


      {!isOwner && userId && !isFlipped && (
        <div className="mt-2 px-1">
          <Button
            onClick={handleSayHi}
            disabled={sayHiState !== 'idle'}
            className="w-full rounded-2xl min-h-[48px] font-semibold shadow-sm"
            style={{ background: 'hsl(var(--brand-navy))', color: '#FFFFFF' }}
          >
            {sayHiState === 'sent' ? 'Request Sent ✓' : sayHiState === 'pending' ? 'Sending…' : 'Say Hi 👋'}
          </Button>
        </div>
      )}
      {/* Flip toggle — the ONLY trigger for the 3D flip animation */}
      {user && visibleStats.length > 0 && (
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

      {/* Share my card — only when a real photo is set (never for silhouette fallback) */}
      {isOwner && !isFlipped && !!profileImage && (
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
            {isSharing ? 'Building your card…' : 'Share my card'}
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

      {/* Make your card — crop dialog */}
      {isOwner && (
        <MakeYourCardDialog
          open={!!pendingFile}
          file={pendingFile}
          displayName={displayName}
          onClose={() => setPendingFile(null)}
          onUploaded={() => {
            setPendingFile(null);
            setImgLoaded(false);
          }}
        />
      )}
    </div>
  );
}
