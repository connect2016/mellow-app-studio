import { Award } from 'lucide-react';
import { BADGE_DEFINITIONS, useUserPennants } from '@/hooks/usePennants';

interface Props {
  userId: string | undefined;
  isOwner: boolean;
}

export function BadgesSection({ userId, isOwner }: Props) {
  const { data: pennants = [], isLoading } = useUserPennants(userId);

  const unlockedKeys = new Set(pennants.map((p: any) => p.badge_key));
  const unlockedBadges = BADGE_DEFINITIONS.filter((b) => unlockedKeys.has(b.key));
  const lockedBadges = isOwner
    ? BADGE_DEFINITIONS.filter((b) => !unlockedKeys.has(b.key)).slice(0, 4)
    : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive-foreground">
          <Award className="h-4 w-4 text-primary" /> Pennants Earned
        </div>
        <span className="text-xs text-muted-foreground">
          {unlockedBadges.length}/{BADGE_DEFINITIONS.length}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : unlockedBadges.length === 0 && !isOwner ? (
        <div className="rounded-xl border bg-card/60 p-4 text-center text-sm text-muted-foreground">
          No pennants earned yet
        </div>
      ) : (
        <>
          {unlockedBadges.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.key}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-2 text-center transition hover:scale-105"
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {lockedBadges.length > 0 && (
            <>
              <div className="pt-2 text-xs font-semibold text-muted-foreground">
                Up next
              </div>
              <div className="grid grid-cols-4 gap-2">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.key}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/30 p-2 text-center opacity-60"
                    title={badge.description}
                  >
                    <span className="text-2xl grayscale">{badge.emoji}</span>
                    <span className="line-clamp-2 text-[10px] font-medium leading-tight text-muted-foreground">
                      {badge.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
