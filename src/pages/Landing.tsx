// @ts-ignore
import '@fontsource/norwester';
import { useState, useEffect } from 'react';
import { SEOMeta } from '@/components/SEOMeta';
import { Link, useNavigate } from 'react-router-dom';
import wrigleyvilleAerial from '@/assets/bg-wrigleyville-street.webp';
import { Button } from '@/components/ui/button';
import {
  Zap, Beer, Users, MapPin, Shield, Heart, ChevronRight, Star, Eye,
  Hand, CalendarClock, UserCircle2, Lock, Clock, Flag, Mail,
  Smartphone, Check
} from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { PageTitle } from '@/components/ui/Typography';
import wrigleyHero from '@/assets/cubs-fans-parade.webp';
import onboardingBackground from '@/assets/welcome-bg.webp';
import HeroVideo from '@/components/landing/HeroVideo';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

// Static stats removed — Wrigleyville Buddies is launching for the 2026 season,
// so no fabricated counts go on the landing page.

// ── Hero features ──
const heroFeatures = [
  {
    icon: MapPin,
    title: 'Live Game-Day Map',
    copy: 'See who\'s at Wrigley and which bars are buzzing — right now. Tap a fan to peek their profile and send a Hi-Five.',
    bullets: ['Real-time fan avatars', 'Bar heatmap', 'Tap to connect'],
  },
  {
    icon: CalendarClock,
    title: 'Flash Meetups at Wrigleyville Bars',
    copy: 'Hosted pregames, 7th-inning stretch sing-alongs, post-game hangs. Join in one tap — or spin up your own in 30 seconds.',
    bullets: ['Capacity & spots-left', 'Auto crew chat after', 'Recurring meetups'],
  },
  {
    icon: Hand,
    title: 'Hi-Fives to Break the Ice',
    copy: 'No awkward openers. Send a Hi-Five and we suggest a meetup nearby. Match? Skip straight to "what bar?"',
    bullets: ['One-tap intro', 'Smart meetup suggestions', 'Mutual = chat unlocked'],
  },
];

const secondaryFeatures = [
  { icon: Beer, title: 'Send a Round', copy: 'Buy a buddy a beer with a personal note. Cubbies-style hello.' },
  { icon: Heart, title: 'Set Your Intent', copy: 'Watch the game, grab beers, post-game hangs, or open to dating — your call.' },
  { icon: Shield, title: 'Safety Built In', copy: 'Location privacy, safety timers, easy block/report, optional fan verification.' },
];

// Testimonials removed — the app hasn't launched yet, so attributed quotes
// from "real" fans would be fabricated. We'll add them after the season starts.

// Tint opacity for the "Everything You Need on Game Day" feature grid overlay.
const FEATURE_GRID_TINT_OPACITY = 0.6;

const faqs = [

  {
    q: 'Is this a dating app?',
    a: 'Mostly no. Most fans use Wrigleyville Buddies to find friends and pregame crews. You pick your intent — watch party, beer, post-game hangs, or yes, dating too if that\'s your vibe.',
  },
  {
    q: 'What happens after I create a profile?',
    a: 'You land on the live map. From there you can see fans nearby, send a Hi-Five, browse open meetups at bars, or post your own. Most fans get into a meetup within their first homestand.',
  },
  {
    q: 'Do I need to be at Wrigley to use it?',
    a: 'Nope. The app covers all of Wrigleyville — bars, restaurants, rooftops. You can also plan ahead from home for upcoming home games.',
  },
  {
    q: 'Can I use this with my existing group of friends?',
    a: 'Yes. Create a Crew, name it ("Bleacher Bums 2026"), and use it as your group\'s game-day HQ — chat, plans, polls, and shared bar history.',
  },
  {
    q: 'Is it free?',
    a: 'Completely free. No paywalls, no premium tier locks. We\'re building a community, not a subscription business.',
  },
  {
    q: 'What if someone makes me uncomfortable?',
    a: 'Tap block or report from any profile or chat — it\'s one motion and the other person is never notified. Reports go to a real human on our trust team and are reviewed within 24 hours. Repeat or serious violations result in permanent removal.',
  },
];

// ── Phone mockup wrapper ──
function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[260px] ${className}`}>
      <div className="rounded-[2.2rem] border-[10px] border-foreground/90 bg-background shadow-lg overflow-hidden aspect-[9/19]">
        <div className="h-full w-full overflow-hidden bg-muted/40">{children}</div>
      </div>
    </div>
  );
}

// ── Mock #1: Profile with persona + intent chips ──
function ProfileMock() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-primary/10 to-background p-3">
      <div className="flex items-center gap-2 pb-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">JT</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-destructive-foreground truncate">Jake, 28</p>
          <p className="text-[10px] text-muted-foreground">Sec 204 · 0.2mi away</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Persona</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Bleacher Creature</span>
          <span className="rounded-full bg-secondary/20 border border-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground">Stats Nerd</span>
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground pt-1">Intent</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full bg-card border px-2 py-0.5 text-[10px] text-foreground"> Grab beers</span>
          <span className="rounded-full bg-card border px-2 py-0.5 text-[10px] text-foreground"> Watch game</span>
        </div>
        <div className="rounded-lg bg-card border p-2 mt-2">
          <p className="text-[9px] text-muted-foreground">Go-to bar</p>
          <p className="text-[11px] font-semibold text-destructive-foreground">Murphy's Bleachers</p>
        </div>
      </div>
      <div className="mt-auto flex gap-1.5 pt-3">
        <button className="flex-1 rounded-full bg-primary text-primary-foreground py-1.5 text-[10px] font-bold">Hi-Five</button>
        <button className="flex-1 rounded-full bg-secondary text-secondary-foreground py-1.5 text-[10px] font-bold">Meet Up</button>
      </div>
    </div>
  );
}

// ── Mock #2: Live map ──
function MapMock() {
  return (
    <div className="relative h-full w-full bg-[#dde7d4]">
      {/* fake streets */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 right-0 h-1 bg-white/80" />
        <div className="absolute top-2/3 left-0 right-0 h-1 bg-white/80" />
        <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-white/80" />
        <div className="absolute left-2/3 top-0 bottom-0 w-1 bg-white/80" />
      </div>
      {/* Wrigley field */}
      <div className="absolute top-[28%] left-[28%] h-12 w-12 rounded-lg bg-primary/30 border border-primary flex items-center justify-center">
        <span className="text-[8px] font-bold text-primary">WRIGLEY</span>
      </div>
      {/* avatars */}
      {[
        { t: '20%', l: '20%', c: 'bg-primary', i: 'SM' },
        { t: '45%', l: '55%', c: 'bg-secondary', i: 'JT' },
        { t: '60%', l: '25%', c: 'bg-primary', i: 'MD' },
        { t: '70%', l: '70%', c: 'bg-secondary', i: 'AL' },
        { t: '35%', l: '75%', c: 'bg-primary', i: 'KP' },
      ].map((a, i) => (
        <div key={i} className="absolute" style={{ top: a.t, left: a.l }}>
          <div className={`h-7 w-7 rounded-full ${a.c} border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-white`}>
            {a.i}
          </div>
          <span className="absolute -inset-1 rounded-full border-2 border-primary/50 animate-ping" />
        </div>
      ))}
      <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-background/95 backdrop-blur p-2 shadow-sm">
        <p className="text-[10px] font-bold text-destructive-foreground">Sample map · 12 fans</p>
        <p className="text-[9px] text-muted-foreground">Tap an avatar to say hi</p>
      </div>
    </div>
  );
}

// ── Mock #1b: Baseball field persona picker (spotlight cycles through positions) ──
function FieldMock() {
  const SPOTS = [
    { pos: 'Pitcher',      persona: 'Die-Hard Fan',         x: 50,   y: 53.5 },
    { pos: 'Catcher',      persona: 'Ivy Elder',            x: 50,   y: 64   },
    { pos: 'First Base',   persona: 'Season Ticket Holder', x: 81,   y: 53   },
    { pos: 'Second Base',  persona: 'Pub Crawler',          x: 50,   y: 46   },
    { pos: 'Third Base',   persona: 'Rooftop Regular',      x: 19,   y: 53   },
    { pos: 'Shortstop',    persona: 'Stats Nerd',           x: 34.5, y: 49.5 },
    { pos: 'Left Field',   persona: 'Wrigley Rookie',       x: 22,   y: 15   },
    { pos: 'Center Field', persona: 'Out-of-Towner',        x: 50,   y: 11   },
    { pos: 'Right Field',  persona: 'Bleacher Bum',         x: 78,   y: 15   },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SPOTS.length), 1900);
    return () => clearInterval(id);
  }, []);
  const current = SPOTS[active];
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-primary/10 to-background">
      <p className="pt-3 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Pick your persona</p>
      <div className="relative mx-auto mt-1 w-[95%] flex-1 overflow-hidden rounded-lg">
        <img src="/wrigleyville-field-v4.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {SPOTS.map((s, i) => {
          if (i !== active) return null;
          return (
            <span
              key={s.pos}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary animate-ping"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            />
          );
        })}
      </div>
      <div className="mt-auto px-2 pb-3 text-center">
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{current.pos}</p>
        <p className="text-[12px] font-extrabold leading-tight text-primary">{current.persona}</p>
      </div>
    </div>
  );
}

// ── Mock #3: Meetup card ──
function MeetupMock() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-secondary/10 to-background p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-secondary">Preview · Flash Meetup</p>
      <h4 className="mt-1 text-sm font-extrabold text-destructive-foreground leading-tight">Pregame Pints @ Murphy's</h4>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" /> Murphy's Bleachers · 0.1mi
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" /> Today, 5:30 PM
      </div>
      <div className="mt-3 rounded-lg bg-card border p-2">
        <p className="text-[9px] text-muted-foreground mb-1">Hosted by</p>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">SM</div>
          <p className="text-[10px] font-semibold text-destructive-foreground">Sarah M.</p>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] text-muted-foreground"><Star className="h-2.5 w-2.5 fill-current" /> Verified</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex -space-x-1.5">
          {['JT','MD','AL','KP'].map((i) => (
            <div key={i} className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[9px] font-bold text-secondary-foreground">{i}</div>
          ))}
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold text-foreground">+3</div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground"><span className="font-bold text-foreground">3 spots left</span> of 10</p>
      </div>
      <button className="mt-auto rounded-full bg-secondary text-secondary-foreground py-2 text-[11px] font-bold">Join Meetup</button>
    </div>
  );
}

// ── Tiny inline icon previews for hero feature cards ──
function FeaturePreview({ kind }: { kind: 'map' | 'meetup' | 'hifive' }) {
  if (kind === 'map') {
    return (
      <div className="relative h-24 w-full rounded-xl bg-[#dde7d4] overflow-hidden border">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/80" />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80" />
        {[
          { t: '20%', l: '25%' }, { t: '55%', l: '60%' }, { t: '70%', l: '30%' },
        ].map((a, i) => (
          <div key={i} className="absolute h-5 w-5 rounded-full bg-primary border-2 border-white shadow" style={{ top: a.t, left: a.l }} />
        ))}
      </div>
    );
  }
  if (kind === 'meetup') {
    return (
      <div className="rounded-xl border bg-white/10 p-3 space-y-1.5">
        <p className="text-[10px] font-bold uppercase text-secondary">Flash · 32m</p>
        <p className="text-sm font-bold text-white leading-tight">Pregame @ Murphy's</p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {['JT','MD','AL'].map((i) => (
              <div key={i} className="h-5 w-5 rounded-full bg-secondary border-2 border-[hsl(var(--brand-navy))] flex items-center justify-center text-[8px] font-bold text-secondary-foreground">{i}</div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-white">3 spots left</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-white/10 p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl"></div>
      <div className="flex-1">
        <p className="text-xs font-bold text-white">Example: Jake sends a Hi-Five</p>
        <p className="text-[10px] text-white/70">Suggested: Murphy's, 5:30 PM</p>
      </div>
    </div>
  );
}

function SectionPhotoBackground({ desktopSrc, mobileSrc }: { desktopSrc: string; mobileSrc?: string }) {
  const mobileImage = mobileSrc ?? desktopSrc;
  return (
    <picture className="absolute inset-0 block">
      <source media="(max-width: 767px)" srcSet={mobileImage} />
      <img src={desktopSrc} alt="" className="h-full w-full object-cover object-center" loading="lazy" decoding="async" />
    </picture>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuestMode } = useGuestMode();

  const handleBrowseAsGuest = () => {
    enterGuestMode();
    navigate('/vibe');
  };

  const trackQuickAction = (action: string, to: string) => {
    try {
      // Custom event for any analytics listener (GA, Plausible, internal)
      window.dispatchEvent(new CustomEvent('cb:quick_action', { detail: { action, to } }));
      // GA4 if present
      // @ts-ignore
      if (typeof window.gtag === 'function') window.gtag('event', 'quick_action_click', { action, destination: to });
      // Plausible if present
      // @ts-ignore
      if (typeof window.plausible === 'function') window.plausible('Quick Action', { props: { action, to } });
    } catch {}
  };

  const quickActions = [
    { key: 'live_map', label: 'Live Map', sub: "See who's out", icon: 'map' as const, to: '/bar-map' },
    { key: 'hot_spots', label: "Tonight's Hot Spots", sub: 'Busiest bars now', icon: 'fire' as const, to: '/venues' },
    { key: 'flash_meetup', label: 'Join a Flash Meetup', sub: 'Starts within the hour', icon: 'calendar' as const, to: '/meetups' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="Wrigleyville Buddies — Find Your Crew at Wrigleyville"
        description="Find your Cubs crew at Wrigleyville. Connect with fellow fans, plan game-day meetups, and build your baseball squad."
        url="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      {/* ── Video Hero ── */}
      <HeroVideo />

      {/* ── Quick Discovery Strip (above the fold on mobile) ── */}
      <section aria-label="Quick discovery" className="relative z-10 -mt-3 px-3 sm:px-4">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-border/40 bg-card/95 p-2 shadow-lg backdrop-blur-md sm:gap-3 sm:p-3">
          {quickActions.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => { trackQuickAction(q.key, q.to); navigate(q.to); }}
              data-analytics-id={`quick_action_${q.key}`}
              aria-label={q.label}
              className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-border/40 bg-background px-2 py-2.5 text-center transition-all duration-150 hover:bg-primary/5 hover:border-primary/40 active:scale-95"
            >
              <ConceptIcon name={q.icon} className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-bold leading-tight text-foreground sm:text-xs">{q.label}</span>
              <span className="hidden text-[9px] font-medium text-muted-foreground sm:block">{q.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Static social-proof stats banner removed — no fabricated counts. */}

      {/* ── Three-Step Onboarding ── */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <SectionPhotoBackground desktopSrc="/neon-baseball-bg-v1.png" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'rgba(5, 5, 30, 0.60)', zIndex: 0 }}
        />
        <div className="relative z-[1] mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em' }}>How it works</p>
            <PageTitle as="h2" className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: '#FFFFFF', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
              Three Steps to Your Next{' '}
              <span style={{ color: '#FFFFFF' }}>Wrigleyville Friend</span>
            </PageTitle>
            <p style={{ color: 'rgba(255,255,255,0.80)' }}>Takes under 30 seconds. No awkward DMs — Hi-Fives only.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white shadow" style={{ backgroundColor: 'hsl(var(--secondary))', boxShadow: '0 0 14px 4px hsl(var(--secondary) / 0.55)' }}>1</div>
              <h3 className="mb-1 text-xl" style={{ color: '#FFFFFF', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>Create Your Fan Profile</h3>
              <p className="mb-5 text-sm mt-1 max-w-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Pick your Gameday Persona, set your intent, drop your go-to bar.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white shadow" style={{ backgroundColor: 'hsl(var(--secondary))', boxShadow: '0 0 14px 4px hsl(var(--secondary) / 0.55)' }}>2</div>
              <h3 className="mb-1 text-xl" style={{ color: '#FFFFFF', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>Find Your People</h3>
              <p className="mb-5 text-sm mt-1 max-w-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Open the live map. See fans nearby. Tap to send a Hi-Five.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white shadow" style={{ backgroundColor: 'hsl(var(--secondary))', boxShadow: '0 0 14px 4px hsl(var(--secondary) / 0.55)' }}>3</div>
              <h3 className="mb-1 text-xl" style={{ color: '#FFFFFF', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>Game Day Link-Up</h3>
              <p className="mb-5 text-sm mt-1 max-w-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Join a flash meetup at a bar near Wrigley — or host your own.
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <img src="/wrigleyville-phone-v2.png" alt="Wrigleyville Buddies app" className="w-full max-w-[340px] drop-shadow-2xl" />
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/quick-start">
              <Button size="lg" className="rounded-full bg-secondary px-8 font-bold shadow-lg hover:bg-secondary/90">
                Claim Your Founding Spot
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stories from the Stands ── */}
      {/* "Stories from the stands" testimonials section removed — see comment near
          the deleted `stories` array. We'll re-introduce this section with real
          attributed quotes once the 2026 season is underway. */}

      {/* ── FAQ + Safety ── */}
      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(/Dark_Wrigley_Pic.jpg)` }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'rgba(5, 5, 30, 0.45)' }} />
        <div className="relative mx-auto max-w-3xl px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>FAQ</p>
            <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: '#FFFFFF' }}>
              Questions? We Got You.
            </h2>
          </div>

          <div className="space-y-6 mb-10">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl p-5 w-full sm:w-4/5 ${i % 2 === 0 ? 'sm:mr-auto' : 'sm:ml-auto'}`}
                style={{ background: 'rgba(255, 255, 255, 0.92)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
              >
                <h3 className="text-base font-extrabold mb-2" style={{ color: '#0E3386' }}>{faq.q}</h3>
                <p className="text-sm font-normal" style={{ color: '#1A2C5B', lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>

          {/* Safety reassurance */}
          <div className="rounded-2xl border-2 border-white/30 bg-[hsl(var(--brand-navy))]/90 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">Safety isn't a checkbox.</h3>
            </div>
            <p className="text-sm text-white/85 leading-relaxed mb-4">
              Every meetup is one tap away from a safety timer. Every profile has location privacy controls.
              Block and report are instant and silent — the other person never knows. Reports are reviewed by
              real humans on our trust team within 24 hours, and repeat or serious violations result in
              permanent removal.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Lock, label: 'Location privacy' },
                { icon: Clock, label: 'Safety timer' },
                { icon: Flag, label: 'Block & report' },
                { icon: UserCircle2, label: 'Fan verification' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Icon className="h-4 w-4 text-white flex-shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-20">
        <SectionPhotoBackground desktopSrc={wrigleyHero} />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="relative mx-auto max-w-lg px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            Be a founding fan.
          </h2>
          <p className="mb-8 text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            Wrigleyville Buddies is brand new for the 2026 season. The earliest fans shape the crew — and get founding member status.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link to="/quick-start">
              <Button size="lg" className="rounded-full bg-secondary px-10 font-bold shadow-lg hover:bg-secondary/90">
                Get in the Game
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBrowseAsGuest}
              className="rounded-full px-8 font-medium text-white/90 hover:text-white hover:bg-white/10 gap-2"
            >
              <Eye className="h-4 w-4" />
              Browse Live Map as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8">
            {/* Brand + platform */}
            <div>
              <p className="text-base font-extrabold text-foreground">Wrigleyville Buddies</p>
              <p className="mt-1 text-sm text-muted-foreground">The Wrigleyville social app where fans find friends.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Works in your browser — no download needed</span>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="rounded-lg border bg-card px-3 py-1.5 text-[10px] text-muted-foreground"> App Store · soon</div>
                <div className="rounded-lg border bg-card px-3 py-1.5 text-[10px] text-muted-foreground"> Google Play · soon</div>
              </div>
            </div>

            {/* Email capture */}
            <div>
              <p className="text-sm font-bold text-foreground">Get game-day updates</p>
              <p className="mt-1 text-xs text-muted-foreground">New features, opening day meetups, and the occasional rain-delay survival kit.</p>
              <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@wrigley.fan"
                    className="w-full rounded-full border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" size="sm" className="rounded-full bg-primary font-bold hover:bg-primary/90">
                  Notify me
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <span aria-hidden>·</span>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
            </div>
            <p className="mt-2">© {new Date().getFullYear()} Wrigleyville Buddies · Made with  in Wrigleyville</p>
            <p className="mt-1 text-[11px]">Not affiliated with the Chicago Cubs or Major League Baseball.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
