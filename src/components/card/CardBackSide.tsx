import { VisibleStat } from '@/components/UserBaseballCard';
import { BeerBuyerBadge } from '@/components/beer/BeerBuyerBadge';
import { ShareMenu } from '@/components/share/ShareMenu';

interface CardBackSideProps {
  displayName: string;
  visibleStats: VisibleStat[];
  isOwner: boolean;
  userId?: string;
  onFlipBack?: () => void;
}

const ZERO_HINTS: Record<string, string> = {
  beersToday: 'Grab your first beer!',
  beersThisWeek: 'Start the week strong!',
  barsVisitedToday: 'Check in at a bar tonight',
  barsVisitedThisWeek: 'Explore Wrigleyville!',
  meetupsFinished: 'Join your first meetup',
  fansConnected: 'Match with a fan tonight',
  shotsTakenSeason: 'Cheers to the season!',
  appetizersHadSeason: 'Order something tasty',
  favoriteFoodSpot: 'Set your go-to spot',
};

export function CardBackSide({ displayName, visibleStats, isOwner, userId, onFlipBack }: CardBackSideProps) {
  return (
    <div
      className="card-back absolute inset-0 w-full h-full"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        WebkitTransform: 'rotateY(180deg)',
        overflow: 'hidden',
        borderRadius: 12,
      }}
      role="img"
      aria-label={`${displayName || 'Fan'}'s stats — back side`}
    >
      <div
        className="card-back relative w-full h-full rounded-2xl border-2 border-primary/30 shadow-md flex flex-col overflow-hidden"
        style={{
          backgroundImage: "url('/wrigley-crowd.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for readability */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 20, 40, 0.72)',
            zIndex: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />
        {/* Back to Profile button */}
        {onFlipBack && (
          <button
            onClick={onFlipBack}
            aria-label="Back to profile"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              padding: '8px 14px',
              minHeight: '44px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: '20px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            ← Profile
          </button>
        )}

        {/* Share — top-right corner */}
        <div
          className="absolute top-2.5 right-2.5"
          style={{
            zIndex: 10,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '999px',
          }}
        >
          <ShareMenu
            size="sm"
            title={`Share ${displayName || 'this fan'}'s card`}
            shareTitle={`${displayName || 'A Cubs fan'} on Cubbies Buddies`}
            shareUrl={
              typeof window !== 'undefined'
                ? `${window.location.origin}/profile/${userId ?? ''}`
                : 'https://cubbiesbuddies.com'
            }
          />
        </div>


        {/* Header */}
        <div className="text-center pt-4 pb-3 px-5 shrink-0" style={{ position: 'relative', zIndex: 1 }}>
          <h3
            className="text-lg tracking-wide"
            style={{
              fontFamily: "'Graduate', 'Inter', serif",
              color: '#FFFFFF',
              fontWeight: 800,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {displayName || 'Fan'}'s Stats
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.80)' }}>Season Performance</p>
        </div>

        {/* Buyer badge — only shown if user has bought at least 1 beer */}
        {userId && (
          <div className="px-3 pb-2 shrink-0" style={{ position: 'relative', zIndex: 1 }}>
            <BeerBuyerBadge userId={userId} variant="tile" />
          </div>
        )}

        {/* Stats grid — internal scroll if needed, no dividing border */}
        <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ position: 'relative', zIndex: 1 }}>
          {visibleStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
              No stats to show yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 w-full">
              {visibleStats.map((stat) => {
                const Icon = stat.icon;
                const isText = typeof stat.value === 'string';
                const numValue = isText ? NaN : Number(stat.value);
                const safeValue = Number.isNaN(numValue) ? 0 : numValue;
                const showZeroHint = !isText && safeValue === 0;
                return (
                  <div
                    key={stat.key}
                    className="flex flex-col items-center justify-center p-2 gap-1 min-h-[88px] min-w-0 overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.85)' }} aria-hidden="true" />
                    {isText ? (
                      <span
                        className="leading-tight text-center line-clamp-2"
                        style={{ fontSize: 'clamp(12px, 3vw, 14px)', whiteSpace: 'nowrap', color: '#FFFFFF', fontWeight: 600 }}
                        aria-label={`${stat.label}: ${stat.value}`}
                      >
                        {stat.value || '—'}
                      </span>
                    ) : (
                      <span
                        className="leading-none"
                        style={{ fontSize: 'clamp(16px, 4vw, 22px)', whiteSpace: 'nowrap', color: '#FFFFFF', fontWeight: 700 }}
                        aria-label={`${safeValue} ${stat.label}`}
                      >
                        {safeValue}
                      </span>
                    )}
                    <span
                      className="text-center leading-tight w-full"
                      style={{
                        fontSize: 'clamp(9px, 2.5vw, 12px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {stat.label}
                    </span>
                    {showZeroHint && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        {ZERO_HINTS[stat.key] || 'Get started!'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
