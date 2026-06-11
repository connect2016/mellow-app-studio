import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ArrowRight, MapPin, Globe, Map as MapIcon, X, Loader2, Navigation, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import quickstartBg from '@/assets/quickstart-bg.webp';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationModal } from '@/components/GeolocationModal';
import { AppHeader } from '@/components/AppHeader';


type Intent = 'watch_game' | 'meet_fans' | 'bar_hop' | 'date' | 'all';
type Behavior = 'at_park' | 'at_bar' | 'at_home';
type Zone = 'wrigleyville' | 'lakeview' | 'loop' | 'chicagoland' | 'anywhere' | 'out_of_state' | 'out_of_country';
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
  { id: 'chicagoland', label: 'Chicagoland', Icon: MapPin },
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
  const geo = useGeolocation();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [behavior, setBehavior] = useState<Behavior | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [group, setGroup] = useState<GroupSize | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [showZoneError, setShowZoneError] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    track('quickstart_shown');
  }, []);

  // Opt-in geolocation state
  const [geoConsent, setGeoConsent] = useState<'pending' | 'granted' | 'denied' | 'ignored'>('pending');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [suggestedZone, setSuggestedZone] = useState<Zone | null>(null);
  const [userEditedZones, setUserEditedZones] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const suggestedChipRef = useRef<HTMLButtonElement | null>(null);
  const chipsListRef = useRef<HTMLDivElement | null>(null);
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (step === 2 && !promptShownRef.current) {
      promptShownRef.current = true;
      track('quickstart_location_prompt_shown');
    }
  }, [step]);

  const coordsToZone = (latitude: number, longitude: number): Zone => {
    const dLat = latitude - 41.9484;
    const dLng = longitude - -87.6553;
    const approxMiles = Math.sqrt(dLat * dLat + dLng * dLng) * 69;
    if (approxMiles < 1.5) return 'wrigleyville';
    if (approxMiles < 4) return 'lakeview';
    if (approxMiles < 10) return 'loop';
    if (approxMiles < 60) return 'chicagoland';
    if (approxMiles < 200) return 'anywhere';
    return 'out_of_state';
  };

  const applySuggestion = (zone: Zone) => {
    setSuggestedZone(zone);
    track('quickstart_suggested_zone_shown', { suggested_zone_id: zone });
    if (!userEditedZones) {
      setZones((prev) => (prev.includes(zone) ? prev : [...prev, zone]));
      track('quickstart_suggested_zone_accepted', { suggested_zone_id: zone });
      const label = ZONES.find((z) => z.id === zone)?.label ?? zone;
      toast.success(`Suggested: ${label} — you can change this.`);
      requestAnimationFrame(() => suggestedChipRef.current?.focus());
    }
  };

  const requestGeolocation = async () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoConsent('denied');
      setGeoError('Location not available. Pick a zone below or try again.');
      track('quickstart_location_consent', { value: 'denied', reason: 'unsupported' });
      requestAnimationFrame(() => chipsListRef.current?.focus());
      return;
    }
    setGeoLoading(true);
    try {
      const pos = await geo.requestPosition({ enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 });
      setGeoLoading(false);
      setGeoConsent('granted');
      track('quickstart_location_consent', { value: 'granted' });
      const zone = coordsToZone(pos.lat, pos.lng);
      applySuggestion(zone);
    } catch (err: any) {
      setGeoLoading(false);
      // Modal was opened (permission was null) — do not flip to denied.
      if (err?.message === 'Location permission not yet granted') return;
      setGeoConsent('denied');
      setGeoError('Location not available. Pick a zone below or try again.');
      track('quickstart_location_consent', { value: 'denied' });
      requestAnimationFrame(() => chipsListRef.current?.focus());
    }
  };

  const declineGeolocation = () => {
    setGeoConsent('ignored');
    track('quickstart_location_consent', { value: 'ignored' });
  };

  // Coarse timezone-based fallback — no raw coords
  const coarseFallback = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const isChicago = /Chicago/i.test(tz);
      const isUS = /America\//i.test(tz);
      const zone: Zone = isChicago ? 'anywhere' : isUS ? 'out_of_state' : 'out_of_country';
      applySuggestion(zone);
    } catch {
      setGeoError('Could not suggest a zone. Please pick one below.');
    }
  };

  const totalSteps = 3;
  const canAdvance =
    (step === 0 && !!intent) ||
    (step === 1 && !!behavior) ||
    (step === 2 && zones.length > 0 && !!group);

  const toggleZone = (id: Zone) => {
    setShowZoneError(false);
    setUserEditedZones(true);
    setZones((prev) => {
      const next = prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id];
      track('chip_toggled', { chip_id: id, new_state: next.includes(id) ? 'selected' : 'deselected' });
      if (suggestedZone === id && prev.includes(id)) {
        track('quickstart_suggested_zone_rejected', { suggested_zone_id: id });
      }
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
          location_consent: geoConsent,
          suggested_zone: suggestedZone,
          completed_at: new Date().toISOString(),
        },
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save preferences');
      return;
    }
    track('quickstart_continue', { selected_zones: zones, intent, behavior, group, location_consent: geoConsent });
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
      <AppHeader />
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
        <p className="eyebrow text-center mb-2" style={{ color: 'hsl(var(--foreground))', fontWeight: 700, letterSpacing: '0.1em', opacity: 1 }}>30-SECOND SETUP</p>

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
                <p className="eyebrow" style={{ color: 'hsl(var(--foreground))' }}>Favorite hangout zones</p>
                <span
                  className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{ color: 'hsl(var(--foreground))', background: 'rgba(255,255,255,0.75)' }}
                >
                  Multi-select
                </span>
              </div>

              {/* Opt-in geolocation prompt — appears above the chips */}
              {geoConsent === 'pending' && (
                <div
                  role="region"
                  aria-labelledby="geo-opt-in-title"
                  className="rounded-2xl border border-primary/30 bg-primary/5 p-3 mb-3"
                >
                  <div className="flex items-start gap-2">
                    <Navigation className="h-4 w-4 mt-0.5 text-primary shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p id="geo-opt-in-title" className="text-sm font-semibold text-foreground">
                        Use your location to suggest a zone?
                      </p>
                      <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">
                        We can suggest the nearest neighborhood to tune your feed. Optional and editable anytime.
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="premium"
                          onClick={requestGeolocation}
                          disabled={geoLoading}
                          aria-label="Use my location to suggest a nearby zone"
                        >
                          {geoLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              Finding nearby zones…
                            </>
                          ) : (
                            <>
                              <Navigation className="h-3.5 w-3.5" aria-hidden />
                              Use My Location
                            </>
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={declineGeolocation}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline min-h-[44px]"
                          aria-label="No thanks, do not use my location"
                        >
                          No thanks
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {geoLoading && geoConsent !== 'pending' && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 mb-3 text-xs text-muted-foreground"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Finding nearby zones…
                </div>
              )}

              {geoError && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 mb-3 text-xs text-foreground flex items-center justify-between gap-2"
                >
                  <span>{geoError}</span>
                  <button
                    type="button"
                    onClick={coarseFallback}
                    className="font-semibold underline underline-offset-2"
                    aria-label="Suggest me a zone using coarse location"
                  >
                    Suggest me
                  </button>
                </div>
              )}

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
                  ref={chipsListRef}
                  tabIndex={-1}
                  role="group"
                  aria-label="Hangout zones"
                  className="flex gap-2 overflow-x-auto snap-x scrollbar-hide px-1 -mx-1 xs:flex-wrap xs:overflow-visible xs:snap-none sm:grid sm:grid-cols-2 focus:outline-none"
                >
                {ZONES.map((opt) => {
                  const selected = zones.includes(opt.id);
                  const isSuggested = suggestedZone === opt.id;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.id}
                      ref={isSuggested ? suggestedChipRef : undefined}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      aria-label={`${opt.label}${isSuggested ? ', suggested by location' : ''}${selected ? ', selected' : ''}`}
                      data-suggested={isSuggested || undefined}
                      onClick={() => toggleZone(opt.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border-2 transition-all relative',
                        'min-h-[44px] px-3 py-2 text-sm font-semibold text-left',
                        'snap-start shrink-0 xs:shrink',
                        'active:scale-[0.96] duration-[120ms]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background/70 text-foreground border-primary/50 hover:bg-primary/5',
                        isSuggested && 'ring-2 ring-accent ring-offset-1',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{opt.label}</span>
                      {isSuggested && (
                        <span className="ml-1 rounded-full bg-accent/90 text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                          Suggested
                        </span>
                      )}
                      {selected && <Check className="h-4 w-4 ml-1 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
                </div>
              </div>

              {/* Examples for travel options */}
              <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                Traveling? Choose <span className="font-semibold text-foreground">Out of State</span> or{' '}
                <span className="font-semibold text-foreground">Out of Country</span> to see visiting-fan meetups.
              </p>

              {/* Why we ask for location — opens privacy modal */}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 min-h-[32px]"
                style={{ color: '#1a472a' }}
                aria-haspopup="dialog"
                aria-controls="location-privacy-modal"
              >
                <Info className="h-3 w-3" aria-hidden />
                Why we ask for location
              </button>

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
              <p className="eyebrow mb-2" style={{ color: 'hsl(var(--foreground))' }}>Usual group size</p>
              <div className="grid grid-cols-3 gap-2">
                {GROUPS.map((opt) => {
                  const isSelected = group === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGroup(opt.id)}
                      aria-pressed={isSelected}
                      className="rounded-xl px-2 py-3 text-center transition-all"
                      style={{
                        background: isSelected ? '#1a472a' : 'rgba(255, 255, 255, 0.85)',
                        border: `1.5px solid ${isSelected ? '#1a472a' : 'rgba(255, 255, 255, 0.5)'}`,
                        color: isSelected ? '#ffffff' : 'hsl(var(--foreground))',
                      }}
                    >
                      <div className="text-2xl mb-0.5"><ConceptVisual name={opt.emoji} size="sm" /></div>
                      <div className="text-xs font-semibold inline-flex items-center justify-center gap-1">
                        {opt.label}
                        {isSelected && <Check className="size-3" />}
                      </div>
                    </button>
                  );
                })}
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
            <button
              type="button"
              onClick={handleSkip}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                textDecoration: 'underline',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 8px',
                whiteSpace: 'nowrap',
                opacity: 1,
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </main>

      {/* Privacy modal — explains location use */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent id="location-privacy-modal" aria-labelledby="location-privacy-title" className="max-w-sm">
          <DialogHeader>
            <DialogTitle id="location-privacy-title">Location is optional</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              We use your location only to suggest a nearby zone for a better feed. We don't store
              precise coordinates long-term — we store only the selected zone name. You can change
              or remove this any time in Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPrivacyModal(false);
                navigate('/settings');
              }}
            >
              Manage Settings
            </Button>
            <Button variant="premium" onClick={() => setShowPrivacyModal(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <GeolocationModal open={geo.showModal} onOpenChange={geo.setShowModal} controller={geo} />
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
        <p className="mt-2" style={{ color: 'hsl(var(--foreground))', fontSize: '15px', fontWeight: 500, textShadow: '0 1px 4px rgba(255,255,255,0.6)', opacity: 1 }}>{sub}</p>
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
          <div style={{ color: 'hsl(var(--foreground))', fontSize: '16px', fontWeight: 700, opacity: 1 }}>{label}</div>
          <div style={{ color: 'hsl(var(--foreground))', fontSize: '13px', fontWeight: 400, opacity: 1, lineHeight: 1.5 }}>{sub}</div>
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
