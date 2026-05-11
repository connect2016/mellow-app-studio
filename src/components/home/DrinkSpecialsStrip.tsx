import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beer, X, CheckCircle2, Mail } from 'lucide-react';
import { z } from 'zod';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const emailSchema = z
  .string()
  .trim()
  .min(3, 'Enter your email')
  .max(255, 'Email too long')
  .email('Enter a valid email');

export function DrinkSpecialsStrip() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setEmail('');
      setDone(false);
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('waitlist').insert({
        email: parsed.data.toLowerCase(),
        source: 'drink-specials',
        user_id: auth?.user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message || 'Could not join the list — try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="drink-specials-heading" className="mb-5">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2
          id="drink-specials-heading"
          className="text-lg font-bold text-destructive-foreground text-on-image flex items-center gap-1.5"
        >
          <Beer className="h-4 w-4 text-amber-400" /> Tonight's Drink Specials
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-primary via-primary to-[hsl(222,82%,22%)] p-5 shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" aria-hidden />
        <div className="relative flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/40">
            <ConceptIcon name="beer" className="h-6 w-6 text-secondary" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-base font-extrabold leading-tight text-white"
              style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
            >
              Bar Deals Coming to Wrigleyville Soon!
            </p>
            <p className="mt-1 text-sm font-medium text-white/85">
              We're partnering with your favorite bars to bring you exclusive game-day specials.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90"
          style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
        >
          <Mail className="h-5 w-5" strokeWidth={2.6} />
          Notify Me When Deals Go Live
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border-t-2 border-secondary/40 bg-card shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-6 pb-2">
                <h3
                  className="text-lg font-extrabold text-foreground"
                  style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
                >
                  {done ? "You're on the list!" : 'Get Early Access'}
                </h3>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  className="rounded-full p-1.5 transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {done ? (
                <div className="px-6 pb-6">
                  <div className="rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-primary to-[hsl(222,82%,22%)] p-5 text-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                      <p
                        className="text-sm font-bold uppercase tracking-wide"
                        style={{ fontFamily: 'Norwester, sans-serif' }}
                      >
                        Confirmed
                      </p>
                    </div>
                    <p className="mt-2 text-base font-semibold leading-snug text-white/95">
                      You're on the list! We'll alert you when the first deals drop.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-4 w-full min-h-[48px] rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90"
                    style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Drop your email and we'll let you know the moment Wrigleyville bar deals go live.
                  </p>
                  <div>
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      maxLength={255}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90 disabled:opacity-60"
                    style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
                  >
                    {submitting ? 'Adding you…' : 'Notify Me'}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
