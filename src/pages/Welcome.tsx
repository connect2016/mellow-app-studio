import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Target, MapPin, Beer, Shield, ChevronRight } from 'lucide-react';
import logoTransparent from '@/assets/logo-transparent.png';
import welcomeBg from '@/assets/welcome-bg.png';

const steps = [
  {
    key: 'welcome',
    emoji: '👋',
    title: 'Welcome to Cubbies Buddies',
    subtitle: 'Your Wrigleyville connection hub.',
    body: "The only app built by Cubs fans, for Cubs fans. Whether you're a bleacher regular or visiting for the first time -- this is your crew.",
    items: null,
  },
  {
    key: 'value',
    emoji: '⚾',
    title: "Here's What You'll Get",
    subtitle: null,
    body: null,
    items: [
      { icon: Users, text: 'Meet fans nearby' },
      { icon: Target, text: 'Join game-day missions' },
      { icon: MapPin, text: 'Find bars & seats' },
      { icon: Beer, text: 'Plan post-game meetups' },
    ],
  },
  {
    key: 'safety',
    emoji: '🔒',
    title: 'Your Privacy Comes First',
    subtitle: 'Your info is private. You choose what others can see.',
    body: "Location sharing, profile visibility, and who can message you -- it's all in your control. Always.",
    items: null,
  },
];

export default function Welcome() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const advance = () => {
    if (isLast) {
      navigate('/onboarding');
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between px-6 py-10">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${welcomeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-primary/75" />
      {/* Dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-secondary' : 'w-2 bg-primary-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center text-center max-w-sm">
        <img
          src={logoTransparent}
          alt="Cubbies Buddies"
          className="mb-6 w-32 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        />

        <span className="mb-4 text-5xl">{current.emoji}</span>

        <h1
          className="mb-2 text-2xl font-extrabold text-primary-foreground sm:text-3xl"
          style={{ fontFamily: 'Graduate, serif', lineHeight: 1.25 }}
        >
          {current.title}
        </h1>

        {current.subtitle && (
          <p className="mb-4 text-base font-medium text-primary-foreground/80" style={{ fontFamily: 'Inter, sans-serif' }}>
            {current.subtitle}
          </p>
        )}

        {current.body && (
          <p className="mb-6 text-sm leading-relaxed text-primary-foreground/65" style={{ fontFamily: 'Inter, sans-serif' }}>
            {current.body}
          </p>
        )}

        {current.items && (
          <div className="mb-6 w-full space-y-3">
            {current.items.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-4 rounded-xl bg-primary-foreground/10 px-5 py-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                  <item.icon className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-base font-semibold text-primary-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          size="lg"
          onClick={advance}
          className="w-full min-h-[56px] rounded-full bg-secondary font-bold text-secondary-foreground shadow-lg hover:bg-secondary/90 text-base"
        >
          {isLast ? 'Start Setup' : 'Next'}
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
        {step === 0 && (
          <button
            onClick={() => navigate('/auth')}
            className="block w-full text-center text-sm font-medium text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
