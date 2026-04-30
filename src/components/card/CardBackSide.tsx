import { VisibleStat } from '@/components/UserBaseballCard';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface CardBackSideProps {
  displayName: string;
  visibleStats: VisibleStat[];
  isOwner: boolean;
  onFlipBack: () => void;
}

export function CardBackSide({ displayName, visibleStats, isOwner, onFlipBack }: CardBackSideProps) {
  return (
    <div
      className="absolute inset-0 w-full"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
      role="img"
      aria-label={`${displayName || 'Fan'}'s stats — back side`}
    >
      <div className="w-full h-full rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-muted/30 shadow-md flex flex-col">
        {/* Header */}
        <div className="text-center pt-6 pb-4 px-5 border-b border-border/30">
          <h3
            className="font-extrabold text-xl tracking-wide text-foreground"
            style={{ fontFamily: "'Graduate', 'Inter', serif" }}
          >
            {displayName || 'Fan'}'s Stats
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Season Performance</p>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 p-6">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/40 border border-border/30 p-4 gap-1.5 shadow-sm"
              >
                <Icon className="h-6 w-6 text-primary/70" aria-hidden="true" />
                <span className="text-3xl font-extrabold text-foreground leading-none" aria-label={`${stat.value} ${stat.label}`}>
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-muted-foreground text-center leading-tight">{stat.label}</span>
                {isOwner && stat.visibility !== 'everyone' && (
                  <span className="text-[10px] text-muted-foreground/60" aria-label={stat.visibility === 'matches_only' ? 'Visible to matches only' : 'Hidden'}>
                    {stat.visibility === 'matches_only' ? '' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
