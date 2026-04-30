import { cn } from '@/lib/utils';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';
import wrigleyBg from '@/assets/wrigley-seats.jpg';

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
      className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md bg-gradient-to-br from-card via-card to-muted/30"
      onClick={onClick}
      role="img"
      aria-label={`${displayName || 'Fan'}'s profile card — front side`}
    >
      {/* Decorative stadium background — non-avatar, low opacity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${wrigleyBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-card/40 to-card/85"
        aria-hidden="true"
      />

      {/* Status badge */}
      {statusLabel && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-foreground/85 backdrop-blur-sm px-3 py-1.5 border border-background/15"
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start h-full pt-12 pb-6 px-5">
        {/* Single avatar */}
        <div
          className="relative rounded-full overflow-hidden ring-4 ring-background shadow-xl"
          style={{ width: 88, height: 88 }}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${displayName || 'Fan'}'s avatar`}
              loading="lazy"
              decoding="async"
              onLoad={onImgLoad}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-2xl">
              {initials || 'CB'}
            </div>
          )}
        </div>

        {/* Name */}
        <h3
          className="mt-4 text-xl font-extrabold tracking-wide text-foreground text-center line-clamp-1"
          style={{ fontFamily: "'Graduate', 'Inter', serif" }}
        >
          {displayName || 'Fan'}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          Bleacher Bum · Wrigleyville
        </p>

        {/* Active reactions */}
        {activeReactions.length > 0 && (
          <div className="absolute bottom-4 right-4 flex gap-1 items-end z-20">
            {activeReactions.map((r) => (
              <div key={r.key} className="animate-scale-in">
                <RealisticEmoji name={r.icon} alt={r.label} size="md" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
