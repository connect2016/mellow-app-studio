import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicBackground } from '@/components/DynamicBackground';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign,
  Beer,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  Users,
  Lock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AMOUNTS = [3, 5, 10, 15, 25];

// Format "active X min/hr ago"
function formatActive(iso?: string | null) {
  if (!iso) return null;
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 2) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const hr = Math.floor(diffMin / 60);
  if (hr < 24) return `Active ${hr}h ago`;
  return null;
}

export default function BeerMoney() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toUserId = params.get('to');
  const meetupId = params.get('meetup');
  const barName = params.get('bar');
  const recipientType: 'fan' | 'meetup' | 'bar' | null = toUserId
    ? 'fan'
    : meetupId
    ? 'meetup'
    : barName
    ? 'bar'
    : null;

  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Recipient: Fan
  const { data: toUser, isLoading: loadingFan } = useQuery({
    queryKey: ['beer-recipient-fan', toUserId],
    queryFn: async () => {
      if (!toUserId) return null;
      const { data } = await supabase.rpc('get_public_profiles', {
        p_user_ids: [toUserId],
        p_limit: 1,
      });
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!toUserId,
  });

  // Recipient: Meetup
  const { data: toMeetup, isLoading: loadingMeetup } = useQuery({
    queryKey: ['beer-recipient-meetup', meetupId],
    queryFn: async () => {
      if (!meetupId) return null;
      const { data } = await supabase
        .from('lineup_meetups')
        .select('id, location_name, meeting_time, max_members, creator_id, status')
        .eq('id', meetupId)
        .maybeSingle();
      if (!data) return null;
      const { count } = await supabase
        .from('lineup_members')
        .select('id', { count: 'exact', head: true })
        .eq('meetup_id', meetupId);
      return { ...data, member_count: count ?? 0 };
    },
    enabled: !!meetupId,
  });

  const isAdult = (toUser?.age ?? 21) >= 21;
  const isFanRecipientInvalid = recipientType === 'fan' && toUser && !isAdult;

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const isAmountValid = finalAmount >= 3 && finalAmount <= 25;
  const hasRecipient = !!recipientType && (toUser || toMeetup || barName);
  const canSend = isAmountValid && hasRecipient && !isFanRecipientInvalid;

  const recipientLabel = toUser?.display_name || toMeetup?.location_name || barName || '';

  const handleSend = () => {
    setShowConfirm(false);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      toast({
        title: '🍺 Beer Money Sent!',
        description: `$${finalAmount} sent${recipientLabel ? ` to ${recipientLabel}` : ''}${
          note ? ` — "${note}"` : ''
        }`,
      });
    }, 2500);
  };

  const isLoadingRecipient =
    (recipientType === 'fan' && loadingFan) || (recipientType === 'meetup' && loadingMeetup);

  return (
    <DynamicBackground>
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
              >
                Cheers! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-primary-foreground/80"
              >
                ${finalAmount} sent{recipientLabel ? ` to ${recipientLabel}` : ''}
              </motion.p>
            </motion.div>

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
                animate={{ opacity: [0, 0.6, 0], y: [0, -(Math.random() * 300 + 100)] }}
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

      <div className="mx-auto max-w-lg px-4 pt-4 pb-12">
        <div className="flex items-center gap-2 mb-1">
          <Beer className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Send Beer Money</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Buy a fellow fan a round 🍺 — 21+ only
        </p>

        {/* ============ SEND TO (Recipient context) ============ */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Send to
            </p>
            {hasRecipient && (
              <button
                onClick={() => navigate('/bar-map')}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Change
              </button>
            )}
          </div>

          {/* No recipient → block sending */}
          {!recipientType && (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 text-center">
              <Lock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Pick someone first</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Beer Money needs a clear recipient — a fan, meetup, or bar.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-xl text-xs">
                  <Link to="/bar-map">🗺️ Beer Map</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl text-xs">
                  <Link to="/meetups">🍻 Live Meetups</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Loading recipient */}
          {recipientType && isLoadingRecipient && (
            <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            </div>
          )}

          {/* FAN recipient */}
          {recipientType === 'fan' && toUser && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Link
                  to={`/profile/${toUser.user_id}`}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20"
                >
                  {toUser.profile_photo ? (
                    <img
                      src={toUser.profile_photo}
                      alt={toUser.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                      {toUser.display_name?.charAt(0)}
                    </div>
                  )}
                  {toUser.location_last_set_at &&
                    Date.now() - new Date(toUser.location_last_set_at).getTime() < 10 * 60_000 && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-semibold text-foreground">{toUser.display_name}</p>
                    {toUser.fan_tier_emoji && (
                      <span className="text-sm" title={toUser.fan_title ?? toUser.fan_tier ?? ''}>
                        {toUser.fan_tier_emoji}
                      </span>
                    )}
                  </div>

                  {/* Trust badges */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {toUser.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Unverified
                      </span>
                    )}
                    {isAdult ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        21+
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Under 21
                      </span>
                    )}
                  </div>

                  {/* Location row */}
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {toUser.wrigleyville_bar && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="truncate">At {toUser.wrigleyville_bar}</span>
                      </div>
                    )}
                    {formatActive(toUser.location_last_set_at) && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatActive(toUser.location_last_set_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Under 21 block */}
              {!isAdult && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5">
                  <p className="text-[11px] font-semibold text-destructive">
                    🚫 You can't send Beer Money to fans under 21.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MEETUP recipient */}
          {recipientType === 'meetup' && toMeetup && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
                  🍻
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{toMeetup.location_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Live Meetup
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      21+ venue
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {toMeetup.member_count} / {toMeetup.max_members} fans joined
                      </span>
                    </div>
                    {toMeetup.meeting_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(toMeetup.meeting_time).toLocaleString([], {
                            weekday: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Beer Money to a meetup is split across attendees who've checked in at the bar.
              </p>
            </div>
          )}

          {/* BAR recipient */}
          {recipientType === 'bar' && barName && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-2xl">
                  🍺
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{barName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      Wrigleyville Bar
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> 21+ venue
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>Tip the next round at this bar</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============ AMOUNT + MESSAGE ============ */}
        <fieldset
          disabled={!hasRecipient || isFanRecipientInvalid}
          className="space-y-4 disabled:opacity-50"
        >
          <div>
            <Label className="font-semibold">Pick an amount</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {AMOUNTS.map((a) => (
                <motion.button
                  key={a}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAmount(a);
                    setCustomAmount('');
                  }}
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
            <Label className="font-semibold">
              Add a message{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              placeholder="First round's on me! 🍻"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl min-h-[80px]"
              maxLength={120}
            />
            <p className="text-[11px] text-muted-foreground text-right">{note.length}/120</p>
          </div>
        </fieldset>

        {/* 21+ disclaimer */}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            By sending Beer Money, you confirm you're <strong>21 or older</strong>. Funds are only
            redeemable at verified Wrigleyville venues. No alcohol is delivered through the app.
          </p>
        </div>

        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!canSend}
          className="mt-4 w-full rounded-2xl py-6 text-base font-semibold gap-2"
        >
          <Beer className="h-5 w-5" />
          {!hasRecipient
            ? 'Pick a recipient to continue'
            : isFanRecipientInvalid
            ? 'Recipient not eligible'
            : `Send $${finalAmount || '—'}`}
        </Button>

        {/* Credits / Subscription */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm">🎟️ Beer Money Credits</h3>
          <p className="text-xs text-muted-foreground">
            Pre-load credits to send beers faster — no checkout each time.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { credits: 25, price: 25 },
              { credits: 55, price: 50 },
              { credits: 120, price: 100 },
            ].map((pkg) => (
              <button
                key={pkg.price}
                onClick={() =>
                  toast({
                    title: 'Coming soon!',
                    description: 'Credit packs require Stripe integration',
                  })
                }
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
                <p className="text-xs text-muted-foreground">
                  Unlimited beers, priority matching, badge
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">$9.99</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full rounded-xl"
              onClick={() =>
                toast({
                  title: 'Coming soon!',
                  description: 'Subscriptions require Stripe integration',
                })
              }
            >
              Subscribe
            </Button>
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
                  <h3 className="text-lg font-bold">Confirm</h3>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="text-center py-4">
                  <p className="text-4xl mb-3">🍺</p>
                  <p className="text-base text-foreground">
                    You're sending <span className="font-bold text-primary">${finalAmount}</span>{' '}
                    for a beer
                    {recipientLabel ? (
                      <>
                        {' '}
                        to <span className="font-bold">{recipientLabel}</span>
                      </>
                    ) : null}
                  </p>
                  {note && (
                    <p className="mt-2 text-sm text-muted-foreground italic">"{note}"</p>
                  )}
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    You confirm you're 21+ and the recipient is a verified adult fan.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowConfirm(false)}
                  >
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
    </DynamicBackground>
  );
}
