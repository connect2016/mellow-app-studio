import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';
import { BarChart3, Camera, Loader2 } from 'lucide-react';
import { FanFlairBadge } from '@/components/profile/FanFlairBadge';
import { FanTagPills } from '@/components/FanTagsPicker';
import { FanAvatarFallback } from '@/components/icons/FanAvatarFallback';

const CARD_TEMPLATE_SRC = '/Wrigleyville_Profile_Card_v2.webp';

interface CardFrontSideProps {
  profileImage?: string | null;
  displayName: string;
  statusLabel: string | null;
  intents?: IntentType[];
  gamedayIntents?: GamedayIntentType[];
  activeReactions: ReactionDef[];
  imgLoaded: boolean;
  onImgLoad: () => void;
  onClick?: () => void;
  fanStreak?: number;
  userId?: string;
  fanTags?: string[];
  /** When true, tapping the avatar opens a photo picker. */
  editable?: boolean;
  uploading?: boolean;
  onPickPhoto?: () => void;
}

export function CardFrontSide({
  profileImage,
  displayName,
  statusLabel,
  activeReactions,
  imgLoaded,
  onImgLoad,
  onClick,
  fanStreak,
  userId,
  fanTags,
  editable = false,
  uploading = false,
  onPickPhoto,
}: CardFrontSideProps) {
  const [hasPulsed, setHasPulsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasPulsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const hasPhoto = !!profileImage;

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden"
      onClick={onClick}
      role="img"
      aria-label={`${displayName || 'Fan'}'s profile card — front side`}
    >
      {/* Layer 1 — Card template image (bottom) */}
      <img
        src={CARD_TEMPLATE_SRC}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 1,
          pointerEvents: 'none',
        }} loading="lazy" decoding="async" />

      {/* Status badge — sits above template */}
      {statusLabel && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-foreground/85 backdrop-blur-sm px-3 py-1.5 border border-background/15"
          style={{ zIndex: 4 }}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[11px] font-semibold text-background whitespace-nowrap">
            {statusLabel}
          </span>
        </div>
      )}

      {/* Layer 2 — User profile photo, contained inside the inner ring circle */}
      <div
        style={{
          position: 'absolute',
          top: '42.8%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '43%',
          aspectRatio: '1 / 1',
          height: 'auto',
          borderRadius: '50%',
          overflow: 'hidden',
          clipPath: 'circle(50% at 50% 50%)',
          zIndex: 3,
          pointerEvents: editable ? 'auto' : 'none',
          background: hasPhoto ? 'transparent' : 'hsl(var(--brand-navy))',
          cursor: editable ? 'pointer' : 'default',
        }}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={
          editable
            ? hasPhoto
              ? 'Change your profile photo'
              : 'Add your profile photo'
            : `Profile photo of ${displayName || 'Fan'}`
        }
        onClick={
          editable
            ? (e) => {
                e.stopPropagation();
                if (!uploading) onPickPhoto?.();
              }
            : undefined
        }
        onKeyDown={
          editable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!uploading) onPickPhoto?.();
                }
              }
            : undefined
        }
      >
        {!imgLoaded && hasPhoto && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ background: '#cbd5e1' }}
            aria-hidden="true"
          />
        )}
        {hasPhoto ? (
          <img
            src={profileImage!}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={onImgLoad}
            onError={onImgLoad}
            className={cn(
              'transition-opacity duration-300',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              height: 'auto',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block',
            }}
          />
        ) : (
          <FanAvatarFallback />
        )}

        {/* Uploading overlay */}
        {editable && uploading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-foreground/55 backdrop-blur-[1px]"
            aria-live="polite"
          >
            <Loader2 className="h-7 w-7 animate-spin text-background" aria-label="Uploading" />
          </div>
        )}

        {/* Camera badge — signals editability */}
        {editable && !uploading && (
          <span
            aria-hidden="true"
            className="absolute"
            style={{
              right: '4%',
              bottom: '4%',
              width: '22%',
              height: '22%',
              borderRadius: '50%',
              background: 'hsl(var(--brand-red))',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}
          >
            <Camera className="text-white" style={{ width: '55%', height: '55%' }} />
          </span>
        )}
      </div>

      {/* "Add your photo" hint — only when editable and no photo yet */}
      {editable && !hasPhoto && (
        <p
          style={{
            position: 'absolute',
            top: 'calc(42.8% + 22%)',
            left: '50%',
            transform: 'translate(-50%, 8px)',
            zIndex: 4,
            fontSize: 11,
            fontWeight: 600,
            color: 'hsl(var(--brand-navy))',
            background: 'rgba(255,255,255,0.85)',
            padding: '2px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          Tap to add your photo
        </p>
      )}

      {/* Layer 3 — Profile name in lower-left white area, above the gold stars */}
      <p
        title={displayName}
        style={{
          position: 'absolute',
          bottom: '11%',
          left: '8%',
          right: '40%',
          textAlign: 'left',
          fontSize: '16px',
          fontWeight: 800,
          letterSpacing: '0.01em',
          color: 'hsl(var(--foreground))',
          zIndex: 4,
          textShadow: 'none',
          background: 'transparent',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {displayName || 'Fan'}
      </p>

      {/* Fan tag pills + Fan flair badge — directly beneath the name, left-aligned */}
      {(fanTags?.length || userId) && (
        <div
          style={{
            position: 'absolute',
            bottom: '11%',
            left: '8%',
            right: '40%',
            textAlign: 'left',
            fontSize: '10px',
            fontWeight: 600,
            color: 'hsl(var(--brand-navy))',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {fanTags && fanTags.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <FanTagPills tags={fanTags} />
            </div>
          )}
          {userId && <FanFlairBadge userId={userId} />}
        </div>
      )}

      {/* Streak indicator */}
      {typeof fanStreak === 'number' && fanStreak > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '9%',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(var(--brand-navy))',
            zIndex: 3,
            pointerEvents: 'none',
          }}
          aria-label={`${fanStreak} game streak`}
        >
          🔥 {fanStreak}
        </div>
      )}

      {/* Active reactions */}
      {activeReactions.length > 0 && (
        <div className="absolute bottom-3 right-3 flex gap-1 items-end" style={{ zIndex: 4 }}>
          {activeReactions.map((r) => (
            <div key={r.key} className="animate-scale-in">
              <RealisticEmoji name={r.icon} alt={r.label} size="md" />
            </div>
          ))}
        </div>
      )}

      {/* Flip hint */}
      <div
        className={cn(
          'absolute flex items-center gap-1 pointer-events-none',
          activeReactions.length > 0 ? 'bottom-10 right-3' : 'bottom-3 right-3',
          !hasPulsed && 'pulse-once'
        )}
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.75)',
          zIndex: 4,
        }}
      >
        <BarChart3 className="h-3 w-3" aria-hidden="true" />
        <span>Stats</span>
      </div>
    </div>
  );
}
