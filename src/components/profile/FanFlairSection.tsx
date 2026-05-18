import { useFanFlair } from '@/hooks/useFanFlair';
import { Sparkles } from 'lucide-react';

interface Props {
  userId?: string | null;
  /** Show progress hints for locked tiers (own profile only). */
  isOwner?: boolean;
}

export function FanFlairSection({ userId, isOwner }: Props) {
  const { data, isLoading } = useFanFlair(userId);
  if (!userId) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4" style={{ color: '#0E3386' }} />
        <h3 className="text-sm font-bold tracking-tight text-foreground">Your Fan Flair</h3>
      </div>

      {isLoading || !data ? (
        <div className="h-16 animate-pulse rounded-lg bg-muted/60" />
      ) : (
        <ul className="space-y-2">
          {data.all.map((tier) => {
            const unlocked = tier.qualifies(data.context);
            const isCurrent = tier.key === data.current.key;
            const progress = isOwner && !unlocked ? tier.progress(data.context) : null;
            return (
              <li
                key={tier.key}
                className="flex items-start gap-3 rounded-xl border p-2.5"
                style={{
                  borderColor: isCurrent ? 'rgba(14,51,134,0.4)' : 'hsl(var(--border))',
                  background: isCurrent ? 'rgba(14,51,134,0.06)' : 'transparent',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <span
                  style={{
                    background: unlocked ? 'rgba(14, 51, 134, 0.12)' : 'rgba(0,0,0,0.05)',
                    color: unlocked ? '#0E3386' : 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    border: `1px solid ${unlocked ? 'rgba(14,51,134,0.25)' : 'hsl(var(--border))'}`,
                    borderRadius: 20,
                    padding: '2px 8px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {tier.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground/85 leading-snug">{tier.description}</p>
                  {progress && (
                    <p className="text-[11px] mt-1 font-semibold" style={{ color: '#0E3386' }}>
                      {progress}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase" style={{ color: '#0E3386' }}>
                    Active
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
