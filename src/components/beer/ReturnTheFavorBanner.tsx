/**
 * Reciprocity nudge: shown to recipients of a recent gift for 48 hours,
 * with a one-tap "Return the Favor" CTA that opens the BuyBeer modal pre-targeted.
 */
import { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BuyBeerButton } from './BuyBeerButton';
import {
  dismissReciprocityNudge,
  getActiveReciprocityNudges,
  markReciprocityActed,
  trackBeerEvent,
  type ReciprocityNudge,
} from '@/lib/gift-social';

function hoursLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.max(0, Math.floor(ms / 3600000));
  return h;
}

export function ReturnTheFavorBanner({ className }: { className?: string }) {
  const [nudges, setNudges] = useState<ReciprocityNudge[]>(() => getActiveReciprocityNudges());

  useEffect(() => {
    const refresh = () => setNudges(getActiveReciprocityNudges());
    window.addEventListener('cb:beer-reciprocity:changed', refresh);
    return () => window.removeEventListener('cb:beer-reciprocity:changed', refresh);
  }, []);

  useEffect(() => {
    if (nudges.length > 0) {
      trackBeerEvent('beer_reciprocity_shown', { count: nudges.length });
    }
  }, [nudges.length]);

  if (nudges.length === 0) return null;
  const top = nudges[0];

  return (
    <section
      role="region"
      aria-label="Return the favor"
      className={`relative rounded-2xl border-2 border-rose-500/30 bg-gradient-to-r from-rose-50/70 to-amber-50/70 dark:from-rose-950/20 dark:to-amber-950/20 p-3.5 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => {
          dismissReciprocityNudge(top.id);
          trackBeerEvent('beer_reciprocity_dismissed', { nudgeId: top.id });
        }}
        className="absolute top-2 right-2 rounded-full p-1.5 text-muted-foreground hover:bg-background/60 min-h-[32px] min-w-[32px] grid place-items-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border-2 border-rose-500/30">
          {top.fromAvatar && <AvatarImage src={top.fromAvatar} alt="" />}
          <AvatarFallback>{top.fromName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
              Return the favor
            </p>
            <span className="text-[10px] text-muted-foreground ml-auto">{hoursLeft(top.expiresAt)}h left</span>
          </div>
          <p className="text-sm leading-snug">
            <span className="font-bold">{top.fromName}</span> bought you a round (${top.amount.toFixed(0)}). Send one back?
          </p>
          <div className="pt-1">
            <BuyBeerButton
              context={{
                kind: 'fan',
                userId: top.fromUserId ?? '',
                firstName: top.fromName,
                avatarUrl: top.fromAvatar,
              }}
              label={`Buy ${top.fromName} a Beer`}
              variant="default"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
              onClickCapture={() => {
                markReciprocityActed(top.id);
                trackBeerEvent('beer_reciprocity_clicked', { nudgeId: top.id });
              }}
            />
          </div>
        </div>
      </div>

      {nudges.length > 1 && (
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          +{nudges.length - 1} more{' '}
          <Button
            variant="link"
            className="h-auto p-0 text-[10px] underline"
            onClick={() => {
              nudges.slice(1).forEach((n) => dismissReciprocityNudge(n.id));
            }}
          >
            clear
          </Button>
        </p>
      )}
    </section>
  );
}
