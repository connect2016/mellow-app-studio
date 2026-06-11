/**
 * One-time onboarding tooltip for the Buy a Beer feature.
 * Pure CSS animation, dismiss + CTA both fire analytics.
 */
import { useEffect, useState } from 'react';
import { Beer, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasSeenBeerTooltip, markBeerTooltipSeen, trackBeerEvent } from '@/lib/gift-social';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  /** Optional CTA — defaults to dismiss only. */
  onCtaClick?: () => void;
  /** Delay before showing (ms). Default 1200. */
  delayMs?: number;
}

export function BuyBeerOnboardingTooltip({ onCtaClick, delayMs = 1200 }: Props) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (hasSeenBeerTooltip()) return;
    const t = setTimeout(() => {
      setVisible(true);
      trackBeerEvent('beer_tooltip_shown', {});
    }, delayMs);
    return () => clearTimeout(t);
  }, [user, delayMs]);

  if (!visible) return null;

  const dismiss = () => {
    markBeerTooltipSeen();
    setVisible(false);
    trackBeerEvent('beer_tooltip_dismissed', {});
  };

  const handleCta = () => {
    markBeerTooltipSeen();
    setVisible(false);
    trackBeerEvent('beer_tooltip_cta_clicked', {});
    onCtaClick?.();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="beer-tooltip-title"
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border-2 border-amber-500/40 bg-card shadow-lg p-4"
      style={{ animation: 'beer-tooltip-pop 0.35s cubic-bezier(.2,.9,.3,1.4) forwards' }}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted min-h-[32px] min-w-[32px] grid place-items-center"
        aria-label="Dismiss tooltip"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="h-11 w-11 rounded-full bg-amber-500/15 grid place-items-center">
            <Beer className="h-6 w-6 text-amber-600" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="beer-tooltip-title" className="font-bold text-sm leading-tight">
            New: Buy a Beer 🍻
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Send a fan, your crew, or a whole bar a round. Earn{' '}
            <span className="font-semibold text-foreground">Round Giver</span> badges as you go.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-3">
        <Button variant="ghost" size="sm" onClick={dismiss} className="flex-1">
          Got it
        </Button>
        <Button size="sm" onClick={handleCta} className="flex-1 gap-1.5">
          <Beer className="h-3.5 w-3.5" />
          Try it
        </Button>
      </div>

      <style>{`
        @keyframes beer-tooltip-pop {
          0%   { opacity: 0; transform: translateY(20px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
