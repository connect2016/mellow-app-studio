import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BuyBeerButton } from './BuyBeerButton';

const rpcMock = vi.fn();

// BuyBeerModal is mounted (even while closed) alongside the fallback button,
// so its balance/eligibility hooks run supabase.from(...) queries too.
const fromChain = {
  select: () => fromChain,
  eq: () => fromChain,
  maybeSingle: async () => ({ data: null, error: null }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => fromChain,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer-1', created_at: new Date().toISOString() } }),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

beforeEach(() => {
  rpcMock.mockReset();
  openSpy.mockClear();
});

describe('BuyBeerButton — P2P vs Stripe routing', () => {
  it('renders the P2P Buy-a-Beer button (not the Stripe modal trigger) when the fan has a handle on file', async () => {
    rpcMock.mockResolvedValue({
      data: [{ venmo_handle: '@jake-cubs', cashapp_cashtag: null, paypal_handle: null }],
      error: null,
    });

    renderWithClient(
      <BuyBeerButton context={{ kind: 'fan', userId: 'fan-1', firstName: 'Jake' }} />,
    );

    // Both the P2P and Stripe-fallback buttons share the accessible name "Buy
    // Jake a Beer" (via aria-label), so a role query alone can catch the
    // fallback button rendered during the brief pre-query loading state.
    // The emoji-prefixed text content is unique to BuyABeer's P2P button.
    const btn = await screen.findByText('🍺 Buy Jake a Beer');
    expect(rpcMock).toHaveBeenCalledWith('get_payment_handles', { p_user_id: 'fan-1' });

    fireEvent.click(btn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe('https://venmo.com/jake-cubs');

    // The Stripe "Buy a Beer — coming soon" sheet must never open for this click.
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it('falls back to the Stripe modal (which is flag-gated to coming-soon) when the fan has no P2P handle', async () => {
    rpcMock.mockResolvedValue({ data: [{ venmo_handle: null, cashapp_cashtag: null, paypal_handle: null }], error: null });

    renderWithClient(
      <BuyBeerButton context={{ kind: 'fan', userId: 'fan-2', firstName: 'Sam' }} />,
    );

    const btn = await screen.findByRole('button', { name: 'Buy Sam a Beer' });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('never calls get_payment_handles for non-fan contexts (meetup/bar have no P2P equivalent)', async () => {
    renderWithClient(
      <BuyBeerButton context={{ kind: 'meetup', meetupId: 'm-1', locationName: 'Murphy\'s' }} />,
    );

    await screen.findByRole('button', { name: 'Buy a Round' });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
