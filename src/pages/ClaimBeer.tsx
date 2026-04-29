import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarLocationPreview } from '@/components/BarLocationPreview';
import { findParticipatingBar, PARTICIPATING_BARS } from '@/lib/wrigleyville-bar-coords';
import {
  Beer, MapPin, ShieldCheck, ArrowRight, Sparkles, PartyPopper, CheckCircle2, User, Mail, Lock, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

/* ─── Mock claim data (would come from DB in production) ─── */
function decodeClaim(code: string) {
  // In production this would be a DB lookup; for now decode from the code format
  const parts = atob(code).split('|');
  return {
    senderName: parts[0] || 'A Cubs Fan',
    amount: parseInt(parts[1]) || 12,
    message: parts[2] || '',
    barSlug: parts[3] || '',
    barName: parts[4] || '',
    createdAt: parts[5] || new Date().toISOString(),
  };
}

type Step = 'claim' | 'signup' | 'redeem' | 'done';

export default function ClaimBeer() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<Step>('claim');
  const [claim, setClaim] = useState<ReturnType<typeof decodeClaim> | null>(null);
  const [error, setError] = useState('');

  // Signup form
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  const bar = claim?.barSlug ? findParticipatingBar(claim.barName) || PARTICIPATING_BARS[0] : PARTICIPATING_BARS[0];

  useEffect(() => {
    if (!code) return;
    try {
      const decoded = decodeClaim(code);
      setClaim(decoded);
    } catch {
      setError('This claim link is invalid or expired.');
    }
  }, [code]);

  // If user is already logged in, skip signup
  useEffect(() => {
    if (!loading && user && step === 'signup') {
      setStep('redeem');
    }
    if (!loading && user && step === 'claim') {
      setStep('redeem');
    }
  }, [user, loading, step]);

  const handleSignup = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      toast.error('Fill in all fields (password must be 6+ chars)');
      return;
    }
    setSigningUp(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    setSigningUp(false);
    if (signUpError) {
      toast.error(signUpError.message);
      return;
    }
    toast.success('Account created! Check your email to verify.');
    setStep('redeem');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3"></p>
          <h1 className="text-xl font-bold text-foreground mb-2">Link Expired</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/')} className="rounded-2xl">Go to Cubbies Buddies</Button>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading your beer…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto max-w-md px-4 pt-8 pb-20">

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-xl mb-6"
        >
          {/* Beer animation header */}
          <div className="bg-gradient-to-br from-primary via-primary to-amber-600 p-6 text-center relative overflow-hidden">
            {/* Floating bubbles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: Math.random() * 8 + 4,
                  height: Math.random() * 8 + 4,
                  left: `${10 + Math.random() * 80}%`,
                  bottom: 0,
                }}
                animate={{
                  y: [0, -(Math.random() * 120 + 60)],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              className="text-6xl mb-3"
            >
              
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-primary-foreground mb-1"
            >
              You've got a beer!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-primary-foreground/80 text-sm"
            >
              <span className="font-bold">{claim.senderName}</span> bought you a{' '}
              <span className="font-bold">${claim.amount}</span> drink
            </motion.p>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            {claim.message && (
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-sm text-foreground italic">"{claim.message}"</p>
                <p className="text-[10px] text-muted-foreground mt-1">— {claim.senderName}</p>
              </div>
            )}

            {bar && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 text-black">
                  <MapPin className="h-3 w-3" /> Redeem at
                </p>
                <BarLocationPreview bar={bar} />
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
              <p className="text-[10px] leading-relaxed text-destructive-foreground">
                21+ only. Show this to the bartender at a participating Wrigleyville venue to redeem.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Steps ── */}
        <AnimatePresence mode="wait">
          {/* STEP: CLAIM → START */}
          {step === 'claim' && !user && (
            <motion.div
              key="claim"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold mb-1 text-destructive-foreground">Claim your drink in 30 seconds</h2>
                <p className="text-sm text-muted-foreground">Quick sign-up, then head to the bar </p>
              </div>

              <Button
                onClick={() => setStep('signup')}
                className="w-full rounded-2xl py-6 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
              >
                <Beer className="h-5 w-5" /> Claim My Beer <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                onClick={() => navigate('/auth')}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? <span className="font-semibold text-primary">Sign in</span>
              </button>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <div className="flex -space-x-1.5">
                  {['', '', '', ''].map((e, i) => (
                    <span key={i} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] ring-1 ring-card">{e}</span>
                  ))}
                </div>
                <span>247 beers claimed this week in Wrigleyville</span>
              </div>
            </motion.div>
          )}

          {/* STEP: QUICK SIGNUP */}
          {step === 'signup' && !user && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold mb-1 text-destructive-foreground">Join Cubbies Buddies</h2>
                <p className="text-xs text-muted-foreground">Free account — takes 30 seconds</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Your name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="First name or nickname"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPw ? 'text' : 'password'}
                      placeholder="6+ characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPw ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSignup}
                disabled={signingUp}
                className="w-full rounded-2xl py-5 text-base font-semibold gap-2"
              >
                {signingUp ? 'Creating account…' : 'Create Account & Claim Beer'} 
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                By signing up you confirm you're 21+ and agree to our terms.
              </p>
            </motion.div>
          )}

          {/* STEP: REDEEM */}
          {step === 'redeem' && (
            <motion.div
              key="redeem"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h2 className="text-lg font-bold mb-1 text-destructive-foreground">Ready to redeem!</h2>
                <p className="text-sm text-muted-foreground">Show this screen to the bartender</p>
              </div>

              {/* Redemption ticket */}
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center">
                <p className="text-5xl mb-2"></p>
                <p className="text-2xl font-bold text-primary mb-1">${claim.amount} Beer Voucher</p>
                <p className="text-xs text-muted-foreground mb-2">
                  From <span className="font-semibold">{claim.senderName}</span>
                </p>
                {bar && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" /> {bar.name}
                  </p>
                )}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid now
                </div>
              </div>

              <Button
                onClick={() => setStep('done')}
                className="w-full rounded-2xl py-5 text-base font-semibold gap-2"
              >
                I've Redeemed My Beer 
              </Button>
            </motion.div>
          )}

          {/* STEP: DONE — reciprocity loop */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              {/* Celebration */}
              <div className="text-center relative">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 8 + 4,
                      height: Math.random() * 8 + 4,
                      left: `${10 + Math.random() * 80}%`,
                      top: `${20 + Math.random() * 60}%`,
                      background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i % 6],
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.5, 1, 0],
                      y: [0, -(Math.random() * 80 + 40)],
                    }}
                    transition={{ duration: 2, delay: Math.random() * 0.5, ease: 'easeOut' }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative z-10"
                >
                  <div className="flex items-end justify-center gap-0 mb-2">
                    <motion.span
                      initial={{ x: -30, rotate: -25 }}
                      animate={{ x: 0, rotate: -10 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="text-5xl"
                    ></motion.span>
                    <motion.span
                      initial={{ y: -20, opacity: 0, scale: 0 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="text-3xl -mx-1 mb-3"
                    ></motion.span>
                    <motion.span
                      initial={{ x: 30, rotate: 25 }}
                      animate={{ x: 0, rotate: 10 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="text-5xl"
                    ></motion.span>
                  </div>
                </motion.div>
                <h2 className="text-xl font-bold mb-1 text-destructive-foreground">Cheers! </h2>
                <p className="text-sm text-muted-foreground">
                  {claim.senderName} just made your day — now make someone else's.
                </p>
              </div>

              {/* Primary reciprocity CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-5 text-center"
              >
                <p className="text-lg mb-1"></p>
                <h3 className="text-base font-bold text-foreground mb-1">
                  Return the Favor?
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {claim.senderName} bought you a ${claim.amount} drink. Keep the good vibes rolling — buy them one back or send a round to another fan!
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate('/beer-money')}
                    className="w-full rounded-2xl py-5 text-base font-semibold gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-lg shadow-amber-500/20"
                  >
                    <Beer className="h-5 w-5" /> Buy {claim.senderName.split(' ')[0]} a Beer Back 
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/beer-money')}
                    className="w-full rounded-xl gap-2 text-sm"
                  >
                    <PartyPopper className="h-4 w-4" /> Send to Someone Else
                  </Button>
                </div>
              </motion.div>

              {/* Social proof nudge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground"
              >
                <div className="flex -space-x-1.5">
                  {['', '', '', ''].map((e, i) => (
                    <span key={i} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] ring-1 ring-card">{e}</span>
                  ))}
                </div>
                <span>72% of fans buy a beer back within 10 minutes</span>
              </motion.div>

              {/* Secondary nav */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-2 gap-2"
              >
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5 text-xs"
                  onClick={() => navigate('/bar-map')}
                >
                  <MapPin className="h-3.5 w-3.5" /> Beer Map
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5 text-xs"
                  onClick={() => navigate('/discover')}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Explore App
                </Button>
              </motion.div>

              {/* Profile nudge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
              >
                <p className="text-xs font-bold text-foreground mb-1"> You're a Cubbie Buddy now!</p>
                <p className="text-[11px] text-muted-foreground">
                  Complete your profile to unlock meetups, missions, and earn Ivy Leaves.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
