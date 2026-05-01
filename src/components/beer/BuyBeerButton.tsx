import { useState } from 'react';
import { Beer } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { BuyBeerModal, type BeerModalContext } from './BuyBeerModal';

// Re-export for back-compat with existing imports
export type BeerContext = BeerModalContext;

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {
  context: BeerModalContext;
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
  ...rest
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (loggedInOnly && !user) return null;

  const text = label ?? defaultLabel(context);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    haptic('selection');
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
