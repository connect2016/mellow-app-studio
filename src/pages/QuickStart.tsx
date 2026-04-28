import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import quickstartBg from '@/assets/quickstart-bg.jpg';

type Intent = 'watch_game' | 'meet_fans' | 'bar_hop' | 'date' | 'all';
type Behavior = 'at_park' | 'at_bar' | 'at_home';
type Zone = 'wrigleyville' | 'lakeview' | 'loop' | 'anywhere';
type GroupSize = 'solo' | 'small' | 'big';

const INTENTS: { id: Intent; emoji: string; label: string; sub: string }[] = [
  { id: 'watch_game', emoji: '⚾', label: 'Watch the game', sub: 'Live scores, section chats, predictions' },
  { id: 'meet_fans', emoji: '🤝', label: 'Meet fellow fans', sub: 'Hi-fives, meetups, ballpark buddies' },
  { id: 'bar_hop', emoji: '🍻', label: 'Bar hop the neighborhood', sub: 'Vibe map, specials, pub crawls' },
  { id: 'date', emoji: '💘', label: 'Find a date who loves the Cubs', sub: 'Matches, conversations, low-key meetups' },
  { id: 'all', emoji: '🌟', label: 'All of the above', sub: "Give me the full Wrigleyville experience" },
];

const BEHAVIORS: { id: Behavior; emoji: string; label: string }[] = [
  { id: 'at_park', emoji: '🏟️', label: 'At the park' },
  { id: 'at_bar', emoji: '🍺', label: 'At a bar' },
  { id: 'at_home', emoji: '🛋️', label: 'At home' },
];

const ZONES: { id: Zone; label: string }[] = [
  { id: 'wrigleyville', label: 'Wrigleyville' },
  { id: 'lakeview', label: 'Lakeview' },
  { id: 'loop', label: 'The Loop' },
  { id: 'anywhere', label: 'Anywhere in Chicago' },
];

const GROUPS: { id: GroupSize; emoji: string; label: string }[] = [
  { id: 'solo', emoji: '👤', label: 'Solo' },
  { id: 'small', emoji: '👥', label: 'Small (2–4)' },
  { id: 'big', emoji: '🎉', label: 'Big crew (5+)' },
];

export default function QuickStart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [behavior, setBehavior] = useState<Behavior | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [group, setGroup] = useState<GroupSize | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const totalSteps = 3;
  const canAdvance =
    (step === 0 && intent) ||
    (step === 1 && behavior) ||
    (step === 2 && zone && group);

  const handleNext = async () => {
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
          hangout_zone: zone,
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
    toast.success("You're all set — let's go ⚾");
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
                  <div className="text-3xl mb-1">{opt.emoji}</div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="A couple last things" sub="So we can tune your home feed.">
            <div>
              <p className="eyebrow mb-2">Favorite hangout zone</p>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setZone(opt.id)}
                    className={cn(
                      'rounded-xl px-3 py-3 text-sm font-semibold transition-all surface-card text-left',
                      zone === opt.id && 'ring-2 ring-primary bg-primary/5',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
                    <div className="text-2xl mb-0.5">{opt.emoji}</div>
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
            >
              {step === totalSteps - 1 ? (
                <>
                  {saving ? 'Saving…' : "Let's go"} <Check className="size-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="block mx-auto mt-3 text-sm text-destructive-foreground hover:text-foreground underline-offset-4 hover:underline"
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
          <div className="text-sm text-muted-foreground truncate">{sub}</div>
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
