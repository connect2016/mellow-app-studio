import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_USERS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Beer } from 'lucide-react';

const AMOUNTS = [3, 5, 10, 15, 25];

export default function BeerMoney() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const toUserId = params.get('to');
  const toUser = toUserId ? MOCK_USERS.find((u) => u.id === toUserId) : null;

  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const isValid = finalAmount >= 3 && finalAmount <= 25;

  const handleSend = () => {
    toast({ title: '🍺 Beer Money Sent!', description: `$${finalAmount} sent${toUser ? ` to ${toUser.display_name}` : ''}` });
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-1 text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Send Beer Money</h2>
        <p className="mb-6 text-sm text-muted-foreground">Buy a fellow fan a round 🍺</p>

        {toUser && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border bg-card p-4">
            <img src={toUser.profile_photo} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-sm">{toUser.display_name}</p>
              <p className="text-xs text-muted-foreground">Sending beer money to</p>
            </div>
          </div>
        )}

        {/* Amount picker */}
        <div className="space-y-4">
          <Label>Pick an amount</Label>
          <div className="grid grid-cols-5 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => { setAmount(a); setCustomAmount(''); }}
                className={`rounded-xl border py-3 text-center font-semibold transition-all ${
                  !customAmount && amount === a
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                ${a}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Or enter custom ($3–$25)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={3}
                max={25}
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea placeholder="Next round's on me! 🍻" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!isValid}
            className="w-full rounded-xl py-6 text-base font-semibold gap-2"
          >
            <Beer className="h-5 w-5" /> Send ${finalAmount || '—'}
          </Button>

          {/* Credits / Subscription */}
          <div className="mt-8 rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>🎟️ Beer Money Credits</h3>
            <p className="text-xs text-muted-foreground">Pre-load credits to send beers faster — no checkout each time.</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ credits: 25, price: 25 }, { credits: 55, price: 50 }, { credits: 120, price: 100 }].map((pkg) => (
                <button
                  key={pkg.price}
                  onClick={() => toast({ title: 'Coming soon!', description: 'Credit packs require Stripe integration' })}
                  className="rounded-xl border border-border bg-card p-3 text-center hover:border-primary/40 transition-colors"
                >
                  <p className="text-lg font-bold text-primary">${pkg.credits}</p>
                  <p className="text-xs text-muted-foreground">for ${pkg.price}</p>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">⭐ Cubbies+ Subscription</p>
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

        {/* Confirm modal */}
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Confirm Beer Money</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You're sending <span className="font-bold text-foreground">${finalAmount}</span>
                {toUser ? ` to ${toUser.display_name}` : ''} for a beer
                {note ? ` with note: "${note}"` : ''}.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl" onClick={handleSend}>Send 🍺</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
