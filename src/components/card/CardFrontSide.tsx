import { cn } from '@/lib/utils';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';
import cardFrontArt from '@/assets/baseball-card-front.png';

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
}

export function CardFrontSide({
  profileImage,
  displayName,
  statusLabel,
  activeReactions,
  imgLoaded,
  onImgLoad,
  onClick,
}: CardFrontSideProps) {
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
        style={{ top: '22%', width: '48%', aspectRatio: '1 / 1' }}
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

      {/* Username — lower-right pennant area */}
      <div
        className="absolute"
        style={{ left: '14%', right: '8%', bottom: '11%', paddingLeft: 12, paddingRight: 12 }}
      >
        <p
          className="font-semibold text-[16px] leading-tight truncate text-right"
          style={{
            color: '#0A2A66',
            fontFamily: "'Graduate', 'Norwester', serif",
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
          title={displayName}
        >
          {displayName || 'Fan'}
        </p>
      </div>

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
    </div>
  );
}
