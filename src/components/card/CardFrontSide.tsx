import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';
import cardFrontArt from '@/assets/baseball-card-front.png';
import { BarChart3 } from 'lucide-react';
import { FanFlairBadge } from '@/components/profile/FanFlairBadge';


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
      className="relative w-full h-full rounded-xl overflow-hidden shadow-md"
      onClick={onClick}
      role="img"
      aria-label={`${displayName || 'Fan'}'s profile card — front side`}
      style={{
        backgroundImage: `url(${cardFrontArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Subtle gradient for pennant text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 55%, rgba(0,0,0,0.04) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Status badge — top */}
      {statusLabel && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-foreground/85 backdrop-blur-sm px-3 py-1.5 border border-background/15">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[11px] font-semibold text-background whitespace-nowrap">
            {statusLabel}
          </span>
        </div>
      )}

      {/* Centered avatar — fills the artwork's circular frame */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: '20%', width: '54%', aspectRatio: '1 / 1' }}
      >
        <div
          tabIndex={0}
          role="img"
          aria-label={`Profile photo of ${displayName || 'Fan'}`}
          className="relative w-full h-full rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CC3433]"
          style={{
            background: '#0A2A66',
          }}
        >
          {!imgLoaded && profileImage && (
            <div className="absolute inset-0 animate-pulse" style={{ background: '#cbd5e1' }} aria-hidden="true" />
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
                'w-full h-full object-cover transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                display: 'block',
                objectPosition: 'center top',
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
      </div>

      {/* Username — white nameplate strip at bottom of card */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: '14%',
          right: '14%',
          bottom: '5.5%',
          height: '8%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <p
          className="leading-tight"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            paddingLeft: 12,
            paddingRight: 12,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxSizing: 'border-box',
            color: '#0E3386',
            fontFamily: "'Graduate', 'Norwester', serif",
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
          title={displayName}
        >
          {displayName || 'Fan'}
        </p>
      </div>

      {/* Fan streak + flair — subtle line beneath the nameplate */}
      {(typeof fanStreak === 'number' && fanStreak > 0) || userId ? (
        <div
          className="absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-none"
          style={{ bottom: '2%', zIndex: 15 }}
        >
          {typeof fanStreak === 'number' && fanStreak > 0 && (
            <span
              aria-label={`${fanStreak} game streak`}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#FFD700',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                letterSpacing: '0.02em',
              }}
            >
              🔥 {fanStreak}
            </span>
          )}
          {userId && <FanFlairBadge userId={userId} />}
        </div>
      ) : null}


      {/* Active reactions */}
      {activeReactions.length > 0 && (
        <div className="absolute bottom-3 right-3 flex gap-1 items-end z-20">
          {activeReactions.map((r) => (
            <div key={r.key} className="animate-scale-in">
              <RealisticEmoji name={r.icon} alt={r.label} size="md" />
            </div>
          ))}
        </div>
      )}

      {/* Flip hint — bottom-right corner */}
      <div
        className={cn(
          'absolute z-20 flex items-center gap-1 pointer-events-none',
          activeReactions.length > 0 ? 'bottom-10 right-3' : 'bottom-3 right-3',
          !hasPulsed && 'pulse-once'
        )}
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.65)',
        }}
      >
        <BarChart3 className="h-3 w-3" aria-hidden="true" />
        <span>Stats</span>
      </div>
    </div>
  );
}
