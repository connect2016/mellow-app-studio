/**
 * 3-step post-onboarding microflow that nudges new fans to take their first
 * action: send a Hi-Five, join a Flash Meetup, or set a Favorite Food Spot.
 *
 * - Shows once per user (tracked via localStorage + profile.onboarding_completed)
 * - Progress microbar + persistent Skip
 * - Emits analytics events: cb:firstaction_view, cb:firstaction_step,
 *   cb:firstaction_choose, cb:firstaction_complete, cb:firstaction_skip
 * - Acceptance metric: first-action rate (track via cb:firstaction_complete)
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HandHeart, Zap, Pizza, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ActionKey = 'hifive' | 'flash' | 'food';

const STORAGE_KEY = 'cb-firstaction-seen-v1';

function track(event: string, payload?: Record<string, unknown>) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    // GA4 + Plausible passthroughs (no-op if not present)
    (window as any).gtag?.('event', event, payload ?? {});
    (window as any).plausible?.(event, { props: payload });
  } catch {
    /* no-op */
  }
}

export function FirstActionMicroflow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chosen, setChosen] = useState<ActionKey | null>(null);
  const [foodSpot, setFoodSpot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Decide whether to show. Only after onboarding is complete and never seen.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) return;
      const seenKey = `${STORAGE_KEY}:${user.id}`;
      if (localStorage.getItem(seenKey)) return;

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed, favorite_food_spot')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!data?.onboarding_completed) return;

      // Only on Discover-like routes; let user breathe on Auth/Onboarding pages
      const path = window.location.pathname;
      if (path === '/onboarding' || path === '/auth' || path === '/') return;

      setOpen(true);
      track('cb:firstaction_view');
    }
    // small delay so it doesn't pop the instant the page mounts
    const t = setTimeout(check, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user]);

  useEffect(() => {
    if (open) track('cb:firstaction_step', { step });
  }, [step, open]);

  function markSeen() {
    if (!user) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}:${user.id}`, String(Date.now()));
    } catch {
      /* no-op */
    }
  }

  function handleSkip() {
    track('cb:firstaction_skip', { step, chosen });
    markSeen();
    setOpen(false);
  }

  function pick(action: ActionKey) {
    setChosen(action);
    track('cb:firstaction_choose', { action });
    setStep(3);
  }

  async function complete() {
    if (!chosen || !user) return;
    setSubmitting(true);
    try {
      if (chosen === 'food') {
        const value = foodSpot.trim();
        if (!value) {
          toast.error('Add a spot to lock it in.');
          setSubmitting(false);
          return;
        }
        const { error } = await supabase
          .from('profiles')
          .update({ favorite_food_spot: value })
          .eq('user_id', user.id);
        if (error) throw error;
        toast.success(`Locked in ${value} as your spot.`);
        track('cb:firstaction_complete', { action: 'food' });
        markSeen();
        setOpen(false);
        return;
      }

      track('cb:firstaction_complete', { action: chosen });
      markSeen();
      setOpen(false);
      if (chosen === 'hifive') {
        navigate('/discover');
      } else if (chosen === 'flash') {
        navigate('/meetups');
      }
    } catch (err) {
      console.error('[FirstActionMicroflow]', err);
      toast.error('Something went sideways. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const progressPct = useMemo(() => (step / 3) * 100, [step]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firstaction-title"
    >
      <div
        className={cn(
          'w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border/60',
          'shadow-lg overflow-hidden',
        )}
      >
        {/* Header with progress + skip */}
        <div className="px-5 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Step {step} of 3
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-2 -mr-2"
              aria-label="Skip onboarding microflow"
            >
              Skip <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="px-5 py-5">
          {step === 1 && (
            <div>
              <h2
                id="firstaction-title"
                className="text-2xl font-extrabold tracking-wide text-foreground"
                style={{ fontFamily: 'Norwester, sans-serif' }}
              >
                Welcome to the bleachers.
              </h2>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                One quick rally before you take your seat — pick a small first
                move and we'll get you connected with the rest of the section.
              </p>
              <Button
                className="mt-5 w-full rounded-xl min-h-[48px] text-base font-bold"
                onClick={() => setStep(2)}
              >
                Let's go <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2
                id="firstaction-title"
                className="text-xl font-extrabold tracking-wide text-foreground"
                style={{ fontFamily: 'Norwester, sans-serif' }}
              >
                Pick your first move
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                You can always do the other two later.
              </p>

              <div className="mt-4 space-y-2.5">
                <ActionCard
                  icon={<HandHeart className="h-5 w-5" />}
                  title="Send a Hi-Five"
                  body="Wave at a fellow fan in your section."
                  accent="from-amber-400/15 to-amber-400/5 border-amber-400/40"
                  onClick={() => pick('hifive')}
                />
                <ActionCard
                  icon={<Zap className="h-5 w-5" />}
                  title="Join a Flash Meetup"
                  body="Drop in on something starting soon."
                  accent="from-primary/15 to-primary/5 border-primary/40"
                  onClick={() => pick('flash')}
                />
                <ActionCard
                  icon={<Pizza className="h-5 w-5" />}
                  title="Set your Favorite Food Spot"
                  body="Show up on the leaderboard with your go-to."
                  accent="from-rose-400/15 to-rose-400/5 border-rose-400/40"
                  onClick={() => pick('food')}
                />
              </div>
            </div>
          )}

          {step === 3 && chosen && (
            <div>
              <h2
                id="firstaction-title"
                className="text-xl font-extrabold tracking-wide text-foreground"
                style={{ fontFamily: 'Norwester, sans-serif' }}
              >
                {chosen === 'hifive' && 'Hi-Five time'}
                {chosen === 'flash' && 'Find a Flash Meetup'}
                {chosen === 'food' && 'Where do you eat in Wrigleyville?'}
              </h2>
              <p className="mt-1 text-sm text-foreground/80">
                {chosen === 'hifive' &&
                  'We\'ll drop you on Discover — tap any fan card to send a Hi-Five.'}
                {chosen === 'flash' &&
                  'Meetups are listed by start time — join one with one tap.'}
                {chosen === 'food' &&
                  'Pick your go-to spot. It shows up on your card and on the leaderboard.'}
              </p>

              {chosen === 'food' && (
                <div className="mt-4">
                  <Input
                    autoFocus
                    value={foodSpot}
                    onChange={(e) => setFoodSpot(e.target.value)}
                    placeholder="e.g. Lou Malnati's, Murphy's, Smoke Daddy"
                    maxLength={60}
                    className="rounded-xl min-h-[48px] text-base"
                    aria-label="Favorite food spot"
                  />
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl min-h-[48px]"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-xl min-h-[48px] text-base font-bold"
                  onClick={complete}
                  disabled={submitting || (chosen === 'food' && !foodSpot.trim())}
                >
                  {submitting ? (
                    'Working…'
                  ) : (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      {chosen === 'hifive' && 'Take me to Discover'}
                      {chosen === 'flash' && 'Take me to Meetups'}
                      {chosen === 'food' && 'Lock it in'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
  onClick: () => void;
}

function ActionCard({ icon, title, body, accent, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left',
        'min-h-[72px] transition-colors hover:bg-muted/40 active:scale-[0.99]',
        accent,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/80 border border-border/60 text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-foreground leading-tight">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {body}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
    </button>
  );
}
