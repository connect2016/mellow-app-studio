import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';
import { BarChart3 } from 'lucide-react';
import { FanFlairBadge } from '@/components/profile/FanFlairBadge';
import { FanTagPills } from '@/components/FanTagsPicker';

const CARD_TEMPLATE_SRC = '/Revised_Wrigleyville_Profile_Card.png';

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
}: CardFrontSideProps) {
  const [hasPulsed, setHasPulsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasPulsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const initials = (displayName || 'Fan')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
        }}
      />

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
          top: '27%',
          left: '49%',
          transform: 'translateX(-50%)',
          width: '42%',
          height: '30%',
          borderRadius: '50%',
          overflow: 'hidden',
          clipPath: 'circle(50% at 50% 50%)',
          zIndex: 3,
          pointerEvents: 'none',
          background: '#0A2A66',
        }}
        aria-label={`Profile photo of ${displayName || 'Fan'}`}
      >
        {!imgLoaded && profileImage && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ background: '#cbd5e1' }}
            aria-hidden="true"
          />
        )}
        {profileImage ? (
          <img
            src={profileImage}
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
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
            style={{ fontFamily: "'Graduate', serif" }}
          >
            {initials || 'CB'}
          </div>
        )}
      </div>

      {/* Layer 3 — Profile name in lower-left white area, above the gold stars */}
      <p
        title={displayName}
        style={{
          position: 'absolute',
          bottom: '16%',
          left: '8%',
          right: '40%',
          textAlign: 'left',
          fontSize: '16px',
          fontWeight: 800,
          letterSpacing: '0.01em',
          color: '#1a1f2e',
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
            color: '#0E3386',
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
            color: '#0E3386',
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
