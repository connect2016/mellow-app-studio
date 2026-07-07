export type BeerPayApp = 'venmo' | 'cashapp' | 'paypal';

export interface BeerHandles {
  venmo?: string | null;
  cashapp?: string | null;
  paypal?: string | null;
}

export function availableBeerApps(handles: BeerHandles): BeerPayApp[] {
  const apps: BeerPayApp[] = [];
  if (handles.venmo && handles.venmo.trim()) apps.push('venmo');
  if (handles.cashapp && handles.cashapp.trim()) apps.push('cashapp');
  if (handles.paypal && handles.paypal.trim()) apps.push('paypal');
  return apps;
}

export const BEER_APP_LABEL: Record<BeerPayApp, string> = {
  venmo: 'Venmo',
  cashapp: 'Cash App',
  paypal: 'PayPal',
};

function stripLeading(s: string, ch: string): string {
  let out = s;
  while (out.length > 0 && out[0] === ch) out = out.slice(1);
  return out;
}

export function buildBeerLink(app: BeerPayApp, rawHandle: string): string {
  const handle = rawHandle.trim();

  if (app === 'venmo') {
    return 'https://venmo.com/' + stripLeading(handle, '@');
  }

  if (app === 'cashapp') {
    return 'https://cash.app/$' + stripLeading(handle, '$');
  }

  if (handle.indexOf('http') === 0) return handle;
  if (handle.indexOf('@') !== -1) return 'https://www.paypal.com/paypalme/';
  const lower = handle.toLowerCase();
  const clean = lower.indexOf('paypal.me/') === 0 ? handle.slice(10) : handle;
  return 'https://paypal.me/' + clean;
}
