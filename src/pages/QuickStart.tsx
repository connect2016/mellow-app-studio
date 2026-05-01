import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ArrowRight, MapPin, Globe, Map as MapIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import quickstartBg from '@/assets/quickstart-bg.jpg';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

type Intent = 'watch_game' | 'meet_fans' | 'bar_hop' | 'date' | 'all';
type Behavior = 'at_park' | 'at_bar' | 'at_home';
type Zone = 'wrigleyville' | 'lakeview' | 'loop' | 'anywhere' | 'out_of_state' | 'out_of_country';
type GroupSize = 'solo' | 'small' | 'big';

function track(event: string, payload?: Record<string, unknown>) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    (window as any).gtag?.('event', event, payload ?? {});
    (window as any).plausible?.(event, { props: payload });
  } catch { /* no-op */ }
}

const INTENTS: { id: Intent; emoji: string; label: string; sub: string }[] = [
  { id: 'watch_game', emoji: '', label: 'Watch the game', sub: 'Live scores, section chats, predictions' },
  { id: 'meet_fans', emoji: '', label: 'Meet fellow fans', sub: 'Hi-fives, meetups, ballpark buddies' },
  { id: 'bar_hop', emoji: '', label: 'Bar hop the neighborhood', sub: 'Vibe map, specials, pub crawls' },
  { id: 'date', emoji: '', label: 'Find a date who loves the Cubs', sub: 'Matches, conversations, low-key meetups' },
  { id: 'all', emoji: '', label: 'All of the above', sub: "Give me the full Wrigleyville experience" },
];

const BEHAVIORS: { id: Behavior; emoji: string; label: string }[] = [
  { id: 'at_park', emoji: '', label: 'At the park' },
  { id: 'at_bar', emoji: '', label: 'At a bar' },
  { id: 'at_home', emoji: '', label: 'At home' },
];

type ZoneOption = {
  id: Zone;
  label: string;
  Icon: React.ComponentType<any>;
  example?: string;
};

const ZONES: ZoneOption[] = [
  { id: 'wrigleyville', label: 'Wrigleyville', Icon: MapPin },
  { id: 'lakeview', label: 'Lakeview', Icon: MapPin },
  { id: 'loop', label: 'The Loop', Icon: MapPin },
  { id: 'anywhere', label: 'Anywhere in Chicago', Icon: MapPin },
  { id: 'out_of_state', label: 'Out of State', Icon: MapIcon, example: 'Visiting fan? See traveling-fan meetups.' },
  { id: 'out_of_country', label: 'Out of Country', Icon: Globe, example: 'Repping the Cubs abroad? Connect globally.' },
];

const GROUPS: { id: GroupSize; emoji: string; label: string }[] = [
  { id: 'solo', emoji: '', label: 'Solo' },
  { id: 'small', emoji: '', label: 'Small (2–4)' },
  { id: 'big', emoji: '', label: 'Big crew (5+)' },
];

export default function QuickStart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [behavior, setBehavior] = useState<Behavior | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [group, setGroup] = useState<GroupSize | null>(null);
  const [saving, setSaving] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [showZoneError, setShowZoneError] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    track('quickstart_shown');
  }, []);

  // Opt-in geolocation prefill for nearest local zone
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoHint('Allow location to get a suggested zone.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Wrigley Field ~41.948,-87.655. Within ~3mi → wrigleyville.
        const dLat = latitude - 41.9484;
        const dLng = longitude - -87.6553;
        const approxMiles = Math.sqrt(dLat * dLat + dLng * dLng) * 69;
        let suggested: Zone | null = null;
        if (approxMiles < 1.5) suggested = 'wrigleyville';
        else if (approxMiles < 4) suggested = 'lakeview';
        else if (approxMiles < 10) suggested = 'loop';
        else if (approxMiles < 200) suggested = 'anywhere';
        if (suggested) {
          setZones((prev) => (prev.length ? prev : [suggested!]));
        }
      },
      () => setGeoHint('Allow location to get a suggested zone.'),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 },
    );
  }, []);

  const totalSteps = 3;
  const canAdvance =
    (step === 0 && !!intent) ||
    (step === 1 && !!behavior) ||
    (step === 2 && zones.length > 0 && !!group);

  const toggleZone = (id: Zone) => {
    setShowZoneError(false);
    setZones((prev) => {
      const next = prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id];
      track('chip_toggled', { chip_id: id, new_state: next.includes(id) ? 'selected' : 'deselected' });
      return next;
    });
  };

  const clearZones = () => {
    setZones([]);
    track('chip_toggled', { chip_id: 'all', new_state: 'cleared' });
  };

  const handleNext = async () => {
    if (step === 2 && zones.length === 0) {
      setShowZoneError(true);
      return;
    }
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        quick_start: {
          primary_intent: intent,
          gameday_behavior: behavior,
          hangout_zones: zones,
          hangout_zone: zones[0] ?? null,
          group_size: group,
          completed_at: new Date().toISOString(),
        },
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save preferences');
      return;
    }
    track('quickstart_continue', { selected_chips: zones, intent, behavior, group });
    toast.success("You're all set — let's go");
    navigate('/discover');
  };

  const handleSkip = () => {
    track('quickstart_skip', { step });
    navigate('/discover');
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${quickstartBg})` }}
    >
      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95 backdrop-blur-[2px]" aria-hidden />
      <div className="relative z-10">
      <main className="mx-auto max-w-md px-4 pt-10 pb-32">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6" aria-label={`Step ${step + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/60' : 'w-2 bg-primary/20',
              )}
            />
          ))}
        </div>

        {/* Eyebrow */}
        <p className="eyebrow text-center mb-2">30-second setup</p>

        {step === 0 && (
          <Section
            title="What brings you to Wrigleyville?"
            sub="Pick the one that fits best — you can change this later."
          >
            {INTENTS.map((opt) => (
              <Choice
                key={opt.id}
                selected={intent === opt.id}
                onClick={() => setIntent(opt.id)}
                emoji={opt.emoji}
                label={opt.label}
                sub={opt.sub}
              />
            ))}
          </Section>
        )}

        {step === 1 && (
          <Section title="Where do you usually catch the game?" sub="We'll surface the right CTAs on game day.">
            <div className="grid grid-cols-3 gap-3">
              {BEHAVIORS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBehavior(opt.id)}
                  className={cn(
                    'rounded-2xl p-4 text-center transition-all surface-card hover:shadow-elevated',
                    behavior === opt.id && 'ring-2 ring-primary bg-primary/5',
                  )}
                >
                  <div className="text-3xl mb-1"><ConceptVisual name={opt.emoji} size="sm" /></div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="A couple last things" sub="Pick where you hang so we can tune your feed.">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="eyebrow">Favorite hangout zones</p>
                <span className="text-[11px] text-muted-foreground">Multi-select</span>
              </div>

              {/* Selection summary bar */}
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 mb-3 text-xs transition-colors',
                  zones.length > 0
                    ? 'border-primary/40 bg-primary/5 text-foreground'
                    : 'border-border/60 bg-muted/40 text-muted-foreground',
                )}
                aria-live="polite"
              >
                <span className="font-semibold shrink-0">Selected:</span>
                <span className="flex-1 truncate">
                  {zones.length === 0
                    ? 'None yet'
                    : `${zones
                        .map((z) => ZONES.find((o) => o.id === z)?.label)
                        .filter(Boolean)
                        .join(', ')} (${zones.length})`}
                </span>
                {zones.length > 0 && (
                  <button
                    type="button"
                    onClick={clearZones}
                    aria-label="Clear all selected zones"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-background/60"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>

              {/* Chip grid — wraps on normal screens, horizontal scroll w/ fade on very small */}
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 xs:hidden"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 xs:hidden"
                  aria-hidden
                />
                <div
                  role="group"
                  aria-label="Hangout zones"
                  className="flex gap-2 overflow-x-auto snap-x scrollbar-hide px-1 -mx-1 xs:flex-wrap xs:overflow-visible xs:snap-none sm:grid sm:grid-cols-2"
                >
                {ZONES.map((opt) => {
                  const selected = zones.includes(opt.id);
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      aria-label={`${opt.label}${selected ? ', selected' : ''}`}
                      onClick={() => toggleZone(opt.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border-2 transition-all',
                        'min-h-[44px] px-3 py-2 text-sm font-semibold text-left',
                        'active:scale-[0.96] duration-[120ms]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-background/70 text-foreground border-primary/50 hover:bg-primary/5',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{opt.label}</span>
                      {selected && <Check className="h-4 w-4 ml-1 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>

              {/* Examples for travel options */}
              <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                Traveling? Choose <span className="font-semibold text-foreground">Out of State</span> or{' '}
                <span className="font-semibold text-foreground">Out of Country</span> to see visiting-fan meetups.
              </p>

              {geoHint && zones.length === 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">{geoHint}</p>
              )}

              {showZoneError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-semibold text-destructive"
                >
                  Pick at least one zone to tune your feed or tap Skip for now.
                </p>
              )}
            </div>

            <div>
              <p className="eyebrow mb-2">Usual group size</p>
              <div className="grid grid-cols-3 gap-2">
                {GROUPS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setGroup(opt.id)}
                    className={cn(
                      'rounded-xl px-2 py-3 text-center transition-all surface-card',
                      group === opt.id && 'ring-2 ring-primary bg-primary/5',
                    )}
                  >
                    <div className="text-2xl mb-0.5"><ConceptVisual name={opt.emoji} size="sm" /></div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Sticky CTA */}
        <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
          <div className="mx-auto max-w-md flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="lg" onClick={() => setStep(step - 1)} disabled={saving}>
                Back
              </Button>
            )}
            <Button
              variant="premium"
              size="lg"
              className="flex-1"
              disabled={!canAdvance || saving}
              onClick={handleNext}
              aria-label={
                step === 2 && zones.length === 0
                  ? 'Select at least one zone'
                  : step === totalSteps - 1
                  ? "Let's go"
                  : 'Continue'
              }
            >
              {step === totalSteps - 1 ? (
                <>
                  {saving
                    ? 'Saving…'
                    : zones.length === 0
                    ? 'Select at least one'
                    : "Let's go"}{' '}
                  <Check className="size-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
          <button
            onClick={handleSkip}
            className="block mx-auto mt-3 text-sm text-destructive-foreground hover:text-foreground underline-offset-4 hover:underline min-h-[44px]"
          >
            Skip for now
          </button>
        </div>
      </main>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="h-display text-foreground" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>
          {title}
        </h1>
        <p className="text-sm text-destructive-foreground mt-2">{sub}</p>
      </div>
      <div className="space-y-3 pt-2">{children}</div>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  emoji,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card
        className={cn(
          'p-4 flex items-center gap-4 transition-all',
          selected && 'ring-2 ring-primary bg-primary/5 shadow-elevated',
        )}
      >
        <div className="text-3xl shrink-0">{emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-foreground">{label}</div>
          <div className="text-sm text-destructive-foreground truncate">{sub}</div>
        </div>
        {selected && (
          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Check className="size-4" />
          </div>
        )}
      </Card>
    </button>
  );
}
