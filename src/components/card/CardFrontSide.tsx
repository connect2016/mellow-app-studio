import { cn } from '@/lib/utils';
import cardTemplate from '@/assets/baseball-card-template.png';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType } from '@/types';
import { ReactionDef } from '@/components/reactions/reactionData';

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
  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onClick={onClick}
      role="img"
      aria-label={`${displayName || 'Fan'}'s profile card — front side`}
    >
      {/* Inner wrapper holds the card artwork at its natural aspect ratio, centered in the unified flip container */}
      <div className="relative w-full" style={{ aspectRatio: '410 / 399' }}>
        {/* Card artwork */}
        <img
          src={cardTemplate}
          alt="Wrigleyville 60613 Baseball Card"
          className="absolute inset-0 w-full h-full block rounded-2xl select-none object-contain"
          draggable={false}
        />

        {/* Profile photo oval — inset so the photo never crosses the decorative red border */}
        <div
          className="absolute overflow-hidden pointer-events-none"
          style={{
            top: '23%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: '38%',
            borderRadius: '50%',
            zIndex: 5,
          }}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={displayName}
              loading="lazy"
              decoding="async"
              onLoad={onImgLoad}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/60">
              <span className="text-muted-foreground/60 text-xs font-medium">No photo</span>
            </div>
          )}
        </div>

        {/* Status badge */}
        {statusLabel && (
          <div
            className="absolute flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/15"
            style={{ top: '4%', left: '50%', transform: 'translateX(-50%)', zIndex: 15 }}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[11px] font-semibold text-white whitespace-nowrap">{statusLabel}</span>
          </div>
        )}

        {/* Active reaction overlays */}
        {activeReactions.length > 0 && (
          <div className="absolute flex gap-1 items-end" style={{ bottom: '10%', right: '6%', zIndex: 20 }}>
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
