import { VisibleStat } from '@/components/UserBaseballCard';
import { BeerBuyerBadge } from '@/components/beer/BeerBuyerBadge';

interface CardBackSideProps {
  displayName: string;
  visibleStats: VisibleStat[];
  isOwner: boolean;
  userId?: string;
  onFlipBack?: () => void;
}

export function CardBackSide({ displayName, visibleStats, isOwner, userId }: CardBackSideProps) {
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

        {/* Stats grid — internal scroll if needed, no dividing border */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {visibleStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No stats to show yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {visibleStats.map((stat) => {
                const Icon = stat.icon;
                const isText = typeof stat.value === 'string';
                return (
                  <div
                    key={stat.key}
                    className="flex flex-col items-center justify-center rounded-xl bg-muted/30 p-3 gap-1 min-h-[88px]"
                  >
                    <Icon className="h-5 w-5 text-primary/70" aria-hidden="true" />
                    {isText ? (
                      <span
                        className="text-sm font-semibold text-foreground leading-tight text-center line-clamp-2"
                        aria-label={`${stat.label}: ${stat.value}`}
                      >
                        {stat.value || '—'}
                      </span>
                    ) : (
                      <span
                        className="text-[18px] font-semibold text-foreground leading-none"
                        aria-label={`${stat.value} ${stat.label}`}
                      >
                        {stat.value}
                      </span>
                    )}
                    <span className="text-[12px] font-normal text-muted-foreground text-center leading-tight">
                      {stat.label}
                    </span>
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
