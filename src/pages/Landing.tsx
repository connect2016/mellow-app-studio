// @ts-ignore
import '@fontsource/norwester';
import { Link, useNavigate } from 'react-router-dom';
import wrigleyvilleAerial from '@/assets/wrigleyville-aerial.jpg';
import { Button } from '@/components/ui/button';
import { Zap, Beer, Users, MapPin, Shield, Heart, ChevronRight, Star, Eye } from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import wrigleyHero from '@/assets/wrigley-hero.jpg';
import HeroVideo from '@/components/landing/HeroVideo';
import fansCheering from '@/assets/fans-cheering.jpg';
import beerCheers from '@/assets/beer-cheers.jpg';
import wFlag from '@/assets/w_flag.webp';

const features = [
  { icon: Users, title: 'Find Your Crew', description: 'Match with fans who share your vibe—friends, beer buddies, or something more.' },
  { icon: MapPin, title: 'Live Game-Day Map', description: "See who's at Wrigley or your favorite bar. Connect in real-time, not after the fact." },
  { icon: Zap, title: 'Hi-Fives & Meetups', description: 'Send a Hi-Five to break the ice. Join flash meetups at bars around the ballpark.' },
  { icon: Beer, title: 'Send a Round', description: "Buy someone a beer with a note. It's the Wrigleyville way to say hello." },
  { icon: Heart, title: 'Your Intent, Your Way', description: 'Looking to watch the game? Grab a beer? Post-game hangs? You set the vibe.' },
  { icon: Shield, title: 'Built for Safety', description: 'Location privacy controls, safety timers, verified profiles, and easy blocking.' },
];

const stats = [
  { label: 'Cubs Fans', value: '1,200+' },
  { label: 'Hi-Fives Sent', value: '8,400+' },
  { label: 'Game-Day Meetups', value: '3,100+' },
];

const howItWorks = [
  { step: '1', title: 'Create Your Fan Profile', description: 'Pick your Gameday Persona and set your vibe.' },
  { step: '2', title: 'Find Your People', description: 'Browse the live map, discover fans nearby, send a Hi-Five.' },
  { step: '3', title: 'Meet Up IRL', description: 'Join a flash meetup at a bar, or plan your own pregame.' },
];

const testimonials = [
  { quote: "I moved to Chicago last year and didn't know anyone. Found my whole game-day crew on Cubbies Buddies in one homestand.", name: 'Sarah M.', detail: 'Section 204 regular' },
  { quote: "The flash meetup feature is genius. We met 6 strangers at Murphy's before the NLDS and now we have a group chat that never stops.", name: 'Jake T.', detail: "Die-Hard since '03" },
  { quote: "Finally an app that gets it — I'm not here to swipe, I'm here to find someone who wants to split a pitcher and yell at the ump.", name: 'Marcus D.', detail: 'Bleacher creature' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuestMode } = useGuestMode();

  const handleBrowseAsGuest = () => {
    enterGuestMode();
    navigate('/vibe');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Video Hero ── */}
      <HeroVideo />

      {/* ── Social proof banner ── */}
      <section className="relative -mt-1 overflow-hidden bg-primary py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-extrabold text-primary-foreground">{s.value}</p>
              <p className="text-xs font-medium text-primary-foreground/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fan Culture Photo Strip ── */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              More Than a Game.{' '}
              <span className="text-secondary">It's a Community.</span>
            </h2>
            <p className="max-w-xl mx-auto text-slate-950">
              Pregame beers, seventh-inning sing-alongs, and friendships that last way beyond the final out.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="overflow-hidden rounded-2xl">
              <img src={fansCheering} alt="Cubs fans cheering at a Wrigleyville bar" className="h-64 w-full object-cover sm:h-80" loading="lazy" />
            </div>
            <div className="overflow-hidden rounded-2xl">
              <img src={beerCheers} alt="Friends clinking beers at the ballpark" className="h-64 w-full object-cover sm:h-80" loading="lazy" />
            </div>
            <div className="overflow-hidden rounded-2xl">
              <img src={wFlag} alt="Cubs fans waving W flags after a win at Wrigley Field" className="h-64 w-full object-cover sm:h-80" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three Steps to Your Next{' '}
              <span className="text-primary">Wrigleyville Friend</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-md">
                  {step.step}
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={wrigleyvilleAerial} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything You Need on{' '}
              <span className="text-primary">Game Day</span>
            </h2>
            <p className="text-muted-foreground">
              Six ways Cubbies Buddies makes your Wrigley experience legendary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Real Fans. Real Connections.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-foreground italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions? We Got You.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Is this a dating app?', a: "It can be — but most people use it to find friends and pregame crews. You choose your intent: watch party, grab a beer, post-game hangs, or yeah, dating too." },
              { q: 'Do I need to be at Wrigley Field to use it?', a: "Nope! The app covers all of Wrigleyville — bars, restaurants, rooftops. You can also use it from home to plan meetups for upcoming games." },
              { q: 'Is it free?', a: "Yes, completely free. No paywalls, no premium tiers. We're building a community, not a paywall." },
              { q: 'How do you keep people safe?', a: "Every user has location privacy controls, a built-in safety timer for meetups, easy blocking and reporting, and optional fan verification." },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-card p-5">
                <h3 className="text-sm font-bold text-foreground mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={wrigleyHero} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="relative mx-auto max-w-lg px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            Your crew is already here.
          </h2>
          <p className="mb-8 text-white/80" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            Join 1,200+ fans connecting at Wrigley Field and across Wrigleyville. It takes 30 seconds.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link to="/quick-start">
              <Button
                size="lg"
                className="rounded-full bg-secondary px-10 font-bold shadow-lg hover:bg-secondary/90"
              >
                Get in the Game
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBrowseAsGuest}
              className="rounded-full px-8 font-medium text-white/80 hover:text-white hover:bg-white/10 gap-2"
            >
              <Eye className="h-4 w-4" />
              Browse as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-background py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Cubbies Buddies · Made with ❤️ in Wrigleyville</p>
      </footer>
    </div>
  );
}
