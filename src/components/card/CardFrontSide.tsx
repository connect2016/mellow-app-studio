import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import cardTemplate from '@/assets/baseball-card-template.png';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { IntentType, GamedayIntentType, INTENT_LABELS, INTENT_EMOJI, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI } from '@/types';
import { Button } from '@/components/ui/button';
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
  hasStats: boolean;
  onFlipToStats: () => void;
}

export function CardFrontSide({
  profileImage,
  displayName,
  statusLabel,
  intents,
  gamedayIntents,
  activeReactions,
  imgLoaded,
  onImgLoad,
  onClick,
  hasStats,
  onFlipToStats,
}: CardFrontSideProps) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ backfaceVisibility: 'hidden' }}
      onClick={onClick}
      role="img"
      aria-label={`${displayName || 'Fan'}'s profile card — front side`}
    >
      <div className="relative">
        <img
          src={cardTemplate}
          alt="Wrigleyville 60613 Baseball Card"
          className="w-full h-auto block rounded-2xl"
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
              onLoad={onImgLoad}
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
          style={{ bottom: '7.5%', left: '22%', right: '6%', height: '6%', zIndex: 20 }}
        >
          <span
            className="font-black truncate text-center w-full"
            style={{
              fontSize: 'clamp(20px, 4.6vw, 34px)',
              fontFamily: "'Graduate', 'Inter', serif",
              color: '#002F6C',
              letterSpacing: '1.5px',
              lineHeight: 1,
              textTransform: 'uppercase',
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
            <span className="relative flex h-2 w-2" aria-hidden="true">
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
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: '0 0 20px hsla(var(--primary) / 0.2), 0 0 40px hsla(var(--primary) / 0.1)' }}
        />
      </div>

      {/* Intent badges */}
      {intents && intents.length > 0 && (
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

      {/* Gameday intent badges */}
      {gamedayIntents && gamedayIntents.length > 0 && (
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

      {/* View Stats button */}
      {hasStats && (
        <div className="mt-4 flex justify-center px-1">
          <Button
            variant="outline"
            size="default"
            className="rounded-2xl gap-2 font-semibold text-base min-h-[48px] px-6 shadow-sm active:scale-[0.97] transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onFlipToStats();
            }}
            aria-label="View stats on back of card"
          >
            <BarChart3 className="h-5 w-5" />
            View Stats
          </Button>
        </div>
      )}
    </div>
  );
}
