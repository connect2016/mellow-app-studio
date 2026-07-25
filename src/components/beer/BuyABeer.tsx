import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  availableBeerApps,
  buildBeerLink,
  BEER_APP_LABEL,
  type BeerHandles,
  type BeerPayApp,
} from '@/lib/beer-links';
import { P2P_HANDLES_ENABLED } from '@/lib/feature-flags';

interface BuyABeerProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  handles: BeerHandles;
  recipientName?: string;
  iconOnly?: boolean;
}

export function BuyABeer({ handles, recipientName, iconOnly, className, ...rest }: BuyABeerProps) {
  const [open, setOpen] = useState(false);
  const apps = availableBeerApps(handles);

  if (!P2P_HANDLES_ENABLED) return null;
  if (apps.length === 0) return null;

  const label = recipientName ? 'Buy ' + recipientName + ' a Beer' : 'Buy a Beer';
  const displayLabel = iconOnly ? '🍺' : `🍺 ${label}`;

  function openApp(app: BeerPayApp, e?: React.MouseEvent) {
    e?.stopPropagation();
    const handle =
      app === 'venmo' ? handles.venmo : app === 'cashapp' ? handles.cashapp : handles.paypal;
    if (!handle) return;
    const url = buildBeerLink(app, handle);
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  if (apps.length === 1) {
    return (
      <Button
        type="button"
        onClick={(e) => openApp(apps[0], e)}
        className={className}
        aria-label={label}
        {...rest}
      >
        {displayLabel}
      </Button>
    );
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={className}
        aria-label={label}
        {...rest}
      >
        {displayLabel}
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-40 rounded-xl border bg-white shadow-lg">
          {apps.map((app) => (
            <button
              key={app}
              type="button"
              onClick={(e) => openApp(app, e)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              {BEER_APP_LABEL[app]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
