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
      className="absolute inset-0 w-full h-full"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
      role="img"
      aria-label={`${displayName || 'Fan'}'s stats — back side`}
    >
      <div className="w-full h-full rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-muted/30 shadow-md flex flex-col overflow-hidden">
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
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              color: 'white',
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
        <div className="absolute top-2.5 right-2.5 z-10">
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
        <div className="text-center pt-4 pb-3 px-5 shrink-0">
          <h3
            className="font-extrabold text-lg tracking-wide text-foreground"
            style={{ fontFamily: "'Graduate', 'Inter', serif" }}
          >
            {displayName || 'Fan'}'s Stats
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Season Performance</p>
        </div>

        {/* Buyer badge — only shown if user has bought at least 1 beer */}
        {userId && (
          <div className="px-3 pb-2 shrink-0">
            <BeerBuyerBadge userId={userId} variant="tile" />
          </div>
        )}

        {/* Stats grid — internal scroll if needed, no dividing border */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {visibleStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
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
                    className="flex flex-col items-center justify-center rounded-xl bg-muted/30 p-2 gap-1 min-h-[88px] min-w-0 overflow-hidden"
                  >
                    <Icon className="h-5 w-5 text-primary/70" aria-hidden="true" />
                    {isText ? (
                      <span
                        className="font-semibold text-foreground leading-tight text-center line-clamp-2"
                        style={{ fontSize: 'clamp(12px, 3vw, 14px)', whiteSpace: 'nowrap' }}
                        aria-label={`${stat.label}: ${stat.value}`}
                      >
                        {stat.value || '—'}
                      </span>
                    ) : (
                      <span
                        className="font-bold text-foreground leading-none"
                        style={{ fontSize: 'clamp(16px, 4vw, 22px)', whiteSpace: 'nowrap' }}
                        aria-label={`${safeValue} ${stat.label}`}
                      >
                        {safeValue}
                      </span>
                    )}
                    <span
                      className="font-normal text-muted-foreground text-center leading-tight w-full"
                      style={{
                        fontSize: 'clamp(9px, 2.5vw, 12px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stat.label}
                    </span>
                    {showZeroHint && (
                      <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', whiteSpace: 'nowrap' }}>
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
