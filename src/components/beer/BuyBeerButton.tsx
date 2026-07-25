import { useEffect, useRef, useState } from 'react';
import { Beer } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { trackBeerEvent } from '@/lib/gift-social';
import { beerExperiments, trackBuyBeer } from '@/lib/beer-experiments';
import { BuyBeerModal, type BeerModalContext } from './BuyBeerModal';
import { BuyABeer } from './BuyABeer';
import { usePaymentHandles } from '@/hooks/usePaymentHandles';
import { availableBeerApps } from '@/lib/beer-links';
import { P2P_HANDLES_ENABLED } from '@/lib/feature-flags';

// Re-export for back-compat with existing imports
export type BeerContext = BeerModalContext;

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {
  context: BeerModalContext;
  /** Where this CTA renders, drives A/B placement test + analytics slicing. */
  surface?: 'profile_card' | 'fab' | 'vibe_post' | 'bar_pin' | 'meetup_detail' | 'other';
  /** Override the auto-generated label (e.g. "Buy Jake a Beer") */
  label?: string;
  /** Show a one-line microcopy below the button explaining who gets it */
  showMicrocopy?: boolean;
  /** Hide button entirely if user is logged out (default: true) */
  loggedInOnly?: boolean;
  iconOnly?: boolean;
}

function defaultLabel(ctx: BeerModalContext): string {
  switch (ctx.kind) {
    case 'fan': return ctx.firstName ? `Buy ${ctx.firstName} a Beer` : 'Buy a Beer';
    case 'meetup': return 'Buy a Round';
    case 'bar': return 'Buy a Round for Patrons';
    case 'general': return 'Buy a Beer';
  }
}

function microcopy(ctx: BeerModalContext): string {
  switch (ctx.kind) {
    case 'fan': return `${ctx.firstName ?? 'They'}’ll get a beer voucher to redeem at a participating bar.`;
    case 'meetup': return `Everyone going to ${ctx.locationName ?? 'this meetup'} gets a voucher.`;
    case 'bar': return `Sent to fans currently checked in at ${ctx.barName}.`;
    case 'general': return 'Pick a fan, meetup, or bar — vouchers are redeemed at participating bars.';
  }
}

export function BuyBeerButton({
  context,
  label,
  showMicrocopy = false,
  loggedInOnly = true,
  className,
  variant = 'outline',
  size,
  iconOnly = false,
  surface = 'other',
  ...rest
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const viewedRef = useRef(false);

  // Prefer P2P (Venmo/Cash App/PayPal) when the fan has a handle on file —
  // it works today, independent of the Stripe checkout flag below.
  const isFan = context.kind === 'fan';
  const { data: handles } = usePaymentHandles(isFan ? context.userId : undefined);
  const p2pHandles = {
    venmo: handles?.venmo_handle,
    cashapp: handles?.cashapp_cashtag,
    paypal: handles?.paypal_handle,
  };
  const hasP2P = P2P_HANDLES_ENABLED && isFan && availableBeerApps(p2pHandles).length > 0;

  // A/B test: hide CTA on surfaces excluded by the placement experiment.
  const placementAllows =
    surface === 'profile_card' || surface === 'fab'
      ? beerExperiments.shouldShowAt(surface)
      : true;

  useEffect(() => {
    if (!viewedRef.current && user && placementAllows) {
      viewedRef.current = true;
      trackBeerEvent('beer_button_viewed', { context: context.kind, surface });
      trackBuyBeer('buy_beer_cta_viewed', { context: context.kind, surface });
    }
  }, [user, context.kind, surface, placementAllows]);

  if (loggedInOnly && !user) return null;
  if (!placementAllows) return null;

  if (hasP2P) {
    return (
      <div
        className={cn(showMicrocopy && 'space-y-1.5')}
        onClickCapture={() => {
          haptic('selection');
          trackBuyBeer('buy_beer_cta_clicked', { context: context.kind, surface, method: 'p2p' });
        }}
      >
        <BuyABeer
          handles={p2pHandles}
          recipientName={context.kind === 'fan' ? context.firstName : undefined}
          iconOnly={iconOnly}
          variant={variant}
          size={size}
          className={cn('gap-2 font-semibold', className)}
          {...rest}
        />
        {showMicrocopy && (
          <p className="text-[11px] leading-snug text-muted-foreground px-0.5">
            {microcopy(context)}
          </p>
        )}
      </div>
    );
  }

  const text = label ?? defaultLabel(context);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    haptic('selection');
    trackBuyBeer('buy_beer_cta_clicked', { context: context.kind, surface });
    setOpen(true);
  };

  return (
    <>
      <div className={cn(showMicrocopy && 'space-y-1.5')}>
        <Button
          type="button"
          onClick={handleClick}
          variant={variant}
          size={size}
          aria-label={text}
          aria-haspopup="dialog"
          className={cn('gap-2 font-semibold', className)}
          {...rest}
        >
          <Beer className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!iconOnly && <span className="truncate">{text}</span>}
        </Button>
        {showMicrocopy && (
          <p className="text-[11px] leading-snug text-muted-foreground px-0.5">
            {microcopy(context)}
          </p>
        )}
      </div>
      <BuyBeerModal open={open} onOpenChange={setOpen} context={context} />
    </>
  );
}
