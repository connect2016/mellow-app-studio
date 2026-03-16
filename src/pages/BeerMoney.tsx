import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Beer, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AMOUNTS = [3, 5, 10, 15, 25];

export default function BeerMoney() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toUserId = params.get('to');

  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Fetch recipient profile from DB
  const { data: toUser } = useQuery({
    queryKey: ['beer-recipient', toUserId],
    queryFn: async () => {
      if (!toUserId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .eq('user_id', toUserId)
        .single();
      return data;
    },
    enabled: !!toUserId,
  });

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const isValid = finalAmount >= 3 && finalAmount <= 25;

  const handleSend = () => {
    setShowConfirm(false);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      toast({
        title: '🍺 Beer Money Sent!',
        description: `$${finalAmount} sent${toUser ? ` to ${toUser.display_name}` : ''}${note ? ` — "${note}"` : ''}`,
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Beer celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="text-center"
            >
              {/* Cheers animation */}
              <div className="relative mb-6 flex items-end justify-center gap-1">
                <motion.span
                  initial={{ x: -40, rotate: -20, opacity: 0 }}
                  animate={{ x: 0, rotate: -8, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="text-6xl"
                >
                  🍺
                </motion.span>
                <motion.span
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="text-3xl mb-3"
                >
                  🤝
                </motion.span>
                <motion.span
                  initial={{ x: 40, rotate: 20, opacity: 0 }}
                  animate={{ x: 0, rotate: 8, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="text-6xl"
                >
                  🍺
                </motion.span>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold text-primary-foreground mb-2"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Cheers! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-primary-foreground/80"
              >
                ${finalAmount} sent{toUser ? ` to ${toUser.display_name}` : ''}
              </motion.p>
            </motion.div>

            {/* Bubble particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary-foreground/20"
                style={{
                  width: Math.random() * 14 + 6,
                  height: Math.random() * 14 + 6,
                  left: `${20 + Math.random() * 60}%`,
                  bottom: '10%',
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: [0, -(Math.random() * 300 + 100)],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.5,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Beer className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Send Beer Money</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">Buy a fellow fan a round 🍺</p>

        {toUser && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {toUser.profile_photo ? (
                <img src={toUser.profile_photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {toUser.display_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{toUser.display_name}</p>
              <p className="text-xs text-muted-foreground">Sending beer money to</p>
            </div>
          </div>
        )}

        {/* Amount picker */}
        <div className="space-y-4">
          <Label className="font-semibold">Pick an amount</Label>
          <div className="grid grid-cols-5 gap-2">
            {AMOUNTS.map((a) => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAmount(a); setCustomAmount(''); }}
                className={`rounded-2xl border py-3.5 text-center font-semibold transition-all ${
                  !customAmount && amount === a
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/40'
                }`}
              >
                ${a}
              </motion.button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Or enter custom ($3–$25)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={3}
                max={25}
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-8 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Add a message <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              placeholder="First round's on me! 🍻"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl min-h-[80px]"
              maxLength={120}
            />
            <p className="text-[11px] text-muted-foreground text-right">{note.length}/120</p>
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!isValid}
            className="w-full rounded-2xl py-6 text-base font-semibold gap-2"
          >
            <Beer className="h-5 w-5" /> Send ${finalAmount || '—'}
          </Button>

          {/* Credits / Subscription */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>🎟️ Beer Money Credits</h3>
            <p className="text-xs text-muted-foreground">Pre-load credits to send beers faster — no checkout each time.</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ credits: 25, price: 25 }, { credits: 55, price: 50 }, { credits: 120, price: 100 }].map((pkg) => (
                <button
                  key={pkg.price}
                  onClick={() => toast({ title: 'Coming soon!', description: 'Credit packs require Stripe integration' })}
                  className="rounded-2xl border border-border bg-card p-3 text-center hover:border-primary/40 transition-colors"
                >
                  <p className="text-lg font-bold text-primary">${pkg.credits}</p>
                  <p className="text-xs text-muted-foreground">for ${pkg.price}</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">⭐ Cubbies+ Subscription</p>
                  <p className="text-xs text-muted-foreground">Unlimited beers, priority matching, badge</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">$9.99</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-3 w-full rounded-xl"
                onClick={() => toast({ title: 'Coming soon!', description: 'Subscriptions require Stripe integration' })}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Confirmation modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Confirm</h3>
                  <button onClick={() => setShowConfirm(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="text-center py-4">
                  <p className="text-4xl mb-3">🍺</p>
                  <p className="text-base text-foreground">
                    You're sending <span className="font-bold text-primary">${finalAmount}</span> for a beer
                    {toUser ? (
                      <> to <span className="font-bold">{toUser.display_name}</span></>
                    ) : null}
                  </p>
                  {note && (
                    <p className="mt-2 text-sm text-muted-foreground italic">"{note}"</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-xl gap-1" onClick={handleSend}>
                    Send 🍺
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
