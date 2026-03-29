import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestGateModal } from '@/components/GuestGateModal';
import pennantLogo from '@/assets/logo-transparent.png';

interface TourStep {
  targetSelector: string;
  title: string;
  text: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="vibe-feed"]',
    title: 'The Vibe Feed',
    text: 'See the Wrigleyville atmosphere in real-time. Fans post photos from the bars and bleachers right now.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="check-in"]',
    title: 'Bar Check-In',
    text: "Ready to join the party? Check in at a local bar to let other buddies know you've arrived and unlock the live chat.",
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="buddy-map"]',
    title: 'The Buddy Map',
    text: 'Find your crew safely. See where fan groups are gathering around the stadium without ever sharing your exact coordinates.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="friends-tab"]',
    title: 'Your Inner Circle',
    text: "Your Gameday Inner Circle. View your mutual fan connections, see who is attending today's game, and coordinate meetups.",
    position: 'top',
  },
  {
    targetSelector: '[data-tour="messages"]',
    title: 'Break the Ice',
    text: 'Message fans in your section or at your bar to coordinate the next round.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="beer-money"]',
    title: 'Be a Legend',
    text: 'Send a digital beer voucher to a fellow fan and make a new buddy instantly.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="live-vibe-checkin"]',
    title: 'Live Vibe',
    text: 'Know before you go. See real-time crowd levels and vibes at every Wrigleyville bar, powered by your fellow Buddies.',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'tour_completed';

export function WelcomeTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  const [guestGateAction, setGuestGateAction] = useState('');
  const navigate = useNavigate();
  const { isGuest } = useGuestMode();

  useEffect(() => {
    if (!isGuest) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === 'true') return;
    const timer = setTimeout(() => setActive(true), 800);
    return () => clearTimeout(timer);
  }, [isGuest]);

  const measureTarget = useCallback(() => {
    if (step >= TOUR_STEPS.length) return;
    const el = document.querySelector(TOUR_STEPS[step].targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!active || showFinal) return;
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [active, step, showFinal, measureTarget]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setActive(false);
    setShowFinal(false);
    setStep(0);
  }, []);

  const nextStep = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setActive(false);
      setShowFinal(true);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleInterceptAction = useCallback(
    (action: string) => {
      setGuestGateAction(action);
      setGuestGateOpen(true);
    },
    []
  );

  // Expose interceptor globally for guest tour
  useEffect(() => {
    if (active || showFinal) {
      (window as any).__tourIntercept = handleInterceptAction;
    } else {
      delete (window as any).__tourIntercept;
    }
    return () => {
      delete (window as any).__tourIntercept;
    };
  }, [active, showFinal, handleInterceptAction]);

  if (!isGuest) return null;

  const PAD = 8;

  const currentStep = step < TOUR_STEPS.length ? TOUR_STEPS[step] : null;

  // Compute tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const pos = currentStep?.position || 'bottom';
    const style: React.CSSProperties = { position: 'fixed', zIndex: 70 };
    switch (pos) {
      case 'bottom':
        style.top = targetRect.bottom + PAD + 12;
        style.left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336));
        break;
      case 'top':
        style.bottom = window.innerHeight - targetRect.top + PAD + 12;
        style.left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336));
        break;
      case 'left':
        style.top = targetRect.top + targetRect.height / 2 - 60;
        style.right = window.innerWidth - targetRect.left + PAD + 12;
        break;
      case 'right':
        style.top = targetRect.top + targetRect.height / 2 - 60;
        style.left = targetRect.right + PAD + 12;
        break;
    }
    return style;
  };

  return (
    <>
      <GuestGateModal
        open={guestGateOpen}
        onClose={() => setGuestGateOpen(false)}
        action={guestGateAction}
      />

      {/* Coach Mark Overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65]"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* SVG cutout overlay */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              <defs>
                <mask id="tour-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - PAD}
                      y={targetRect.top - PAD}
                      width={targetRect.width + PAD * 2}
                      height={targetRect.height + PAD * 2}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.75)"
                mask="url(#tour-mask)"
                style={{ pointerEvents: 'auto' }}
              />
            </svg>

            {/* Highlight ring */}
            {targetRect && (
              <div
                className="absolute rounded-xl border-2 border-secondary shadow-[0_0_0_4px_hsl(var(--secondary)/0.3)] pointer-events-none"
                style={{
                  left: targetRect.left - PAD,
                  top: targetRect.top - PAD,
                  width: targetRect.width + PAD * 2,
                  height: targetRect.height + PAD * 2,
                  zIndex: 66,
                }}
              />
            )}

            {/* Tooltip card */}
            {currentStep && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                style={{ ...getTooltipStyle(), maxWidth: 320 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-xl"
              >
                {/* Close button */}
                <button
                  onClick={finish}
                  className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <p
                  className="text-xs font-bold uppercase tracking-wider text-secondary mb-1"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Step {step + 1} of {TOUR_STEPS.length + 1}
                </p>
                <h3
                  className="text-lg font-bold text-foreground mb-2"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {currentStep.text}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {Array.from({ length: TOUR_STEPS.length + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === step
                            ? 'w-5 bg-primary'
                            : i < step
                            ? 'w-1.5 bg-primary/50'
                            : 'w-1.5 bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {step > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={prevStep}
                        className="rounded-full text-xs gap-1 text-muted-foreground"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={nextStep}
                      className="rounded-full text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {step < TOUR_STEPS.length - 1 ? 'Next' : 'Finish'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: Final Hook Modal */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            key="tour-final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={finish}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-8 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pennant Logo */}
              <motion.img
                src={pennantLogo}
                alt="Cubbies Buddies"
                className="mx-auto mb-6 h-28 w-auto drop-shadow-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              />

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-5">
                {Array.from({ length: TOUR_STEPS.length + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === TOUR_STEPS.length ? 'w-5 bg-primary' : 'w-1.5 bg-primary/50'
                    }`}
                  />
                ))}
              </div>

              <p
                className="text-xs font-bold uppercase tracking-wider text-secondary mb-2"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Step {TOUR_STEPS.length + 1} of {TOUR_STEPS.length + 1}
              </p>

              <h2
                className="text-2xl font-bold text-foreground mb-2"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Wrigleyville is Better Together
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Sign up now to start connecting, or keep browsing as a guest!
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    finish();
                    navigate('/auth');
                  }}
                  className="w-full rounded-full font-bold text-base bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
                >
                  Join the Club
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={finish}
                  className="w-full rounded-full font-medium text-base text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted"
                >
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
