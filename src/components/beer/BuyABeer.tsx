import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  availableBeerApps,
  buildBeerLink,
  BEER_APP_LABEL,
  type BeerHandles,
  type BeerPayApp,
} from '@/lib/beer-links';
import { BUY_A_BEER_ENABLED } from '@/lib/feature-flags';

interface BuyABeerProps {
  handles: BeerHandles;
  recipientName?: string;
  className?: string;
}

export function BuyABeer({ handles, recipientName, className }: BuyABeerProps) {
  const [open, setOpen] = useState(false);
  const apps = availableBeerApps(handles);

  if (!BUY_A_BEER_ENABLED) return null;
  if (apps.length === 0) return null;

  const label = recipientName ? 'Buy ' + recipientName + ' a Beer' : 'Buy a Beer';

  function openApp(app: BeerPayApp) {
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
        onClick={() => openApp(apps[0])}
        className={className}
      >
        🍺 {label}
      </Button>
    );
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={className}
      >
        🍺 {label}
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-40 rounded-xl border bg-white shadow-lg">
          {apps.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => openApp(app)}
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
