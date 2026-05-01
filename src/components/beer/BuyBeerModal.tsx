import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Beer, ShieldCheck, Apple, CreditCard, Plus, Sparkles, Check, Mail, Eye, EyeOff, Undo2, AlertTriangle, ShieldAlert, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGiftEligibility } from '@/hooks/useGiftEligibility';
import {
  checkSenderCaps,
  detectFraudPattern,
  recordTransaction,
  GIFT_LIMITS,
} from '@/lib/gift-trust-safety';
import { Link } from 'react-router-dom';

export type BeerModalContext =
  | { kind: 'fan'; userId: string; firstName?: string; avatarUrl?: string }
  | { kind: 'meetup'; meetupId: string; locationName?: string; participantCount?: number }
  | { kind: 'bar'; barName: string; patronCount?: number }
  | { kind: 'general' };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: BeerModalContext;
}

type AmountChoice = 'single' | 'round' | 'custom';
type PaymentMethod = 'saved' | 'apple' | 'google' | 'new';

const PLATFORM_FEE_RATE = 0.05; // 5%
const PLATFORM_FEE_MIN = 0.5;
const SINGLE_BEER = 7;

function recipientCount(ctx: BeerModalContext): number {
  switch (ctx.kind) {
    case 'fan': return 1;
    case 'meetup': return Math.max(1, ctx.participantCount ?? 4);
    case 'bar': return Math.max(1, ctx.patronCount ?? 6);
    case 'general': return 1;
  }
}

function recipientLabel(ctx: BeerModalContext): string {
  switch (ctx.kind) {
    case 'fan': return ctx.firstName ?? 'this fan';
    case 'meetup': return ctx.locationName ?? 'the meetup';
    case 'bar': return ctx.barName;
    case 'general': return 'a fan';
  }
}

export function BuyBeerModal({ open, onOpenChange, context }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const defaultRecipients = recipientCount(context);
  const isMulti = context.kind === 'meetup' || context.kind === 'bar';

  const [amountChoice, setAmountChoice] = useState<AmountChoice>(isMulti ? 'round' : 'single');
  const [customAmount, setCustomAmount] = useState<string>('15');
  const [splitEvenly, setSplitEvenly] = useState<boolean>(isMulti);
  const [tipPct, setTipPct] = useState<number>(0);
  const [payment, setPayment] = useState<PaymentMethod>('saved');
  const [savePayment, setSavePayment] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [emailReceipt, setEmailReceipt] = useState<boolean>(false);
  const [step, setStep] = useState<'compose' | 'success'>('compose');
  const [undoSeconds, setUndoSeconds] = useState<number>(10);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setAmountChoice(isMulti ? 'round' : 'single');
      setCustomAmount('15');
      setSplitEvenly(isMulti);
      setTipPct(0);
      setPayment('saved');
      setIsPublic(true);
      setEmailReceipt(false);
      setStep('compose');
      setUndoSeconds(10);
    }
  }, [open, isMulti]);

  // Undo countdown
  useEffect(() => {
    if (step !== 'success') return;
    if (undoSeconds <= 0) return;
    const t = setTimeout(() => setUndoSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, undoSeconds]);

  const subtotal = useMemo(() => {
    if (amountChoice === 'single') return SINGLE_BEER;
    if (amountChoice === 'round') return SINGLE_BEER * defaultRecipients;
    const n = parseFloat(customAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amountChoice, customAmount, defaultRecipients]);

  const tipAmount = useMemo(() => +(subtotal * (tipPct / 100)).toFixed(2), [subtotal, tipPct]);
  const platformFee = useMemo(
    () => +(Math.max(PLATFORM_FEE_MIN, subtotal * PLATFORM_FEE_RATE)).toFixed(2),
    [subtotal],
  );
  const total = useMemo(() => +(subtotal + tipAmount + platformFee).toFixed(2), [subtotal, tipAmount, platformFee]);

  const perRecipient = useMemo(() => {
    if (!splitEvenly || defaultRecipients <= 1) return subtotal;
    return +(subtotal / defaultRecipients).toFixed(2);
  }, [splitEvenly, subtotal, defaultRecipients]);

  const recipientNotice = useMemo(() => {
    const who = recipientLabel(context);
    const amt = `$${perRecipient.toFixed(2)}`;
    if (isPublic) {
      return context.kind === 'fan'
        ? `${who} gets a ${amt} beer voucher — your name will be shown.`
        : `Everyone at ${who} gets ${amt} — posted to the Live Vibe Feed.`;
    }
    return context.kind === 'fan'
      ? `${who} gets a ${amt} beer voucher from "Anonymous Fan".`
      : `Patrons at ${who} get ${amt} each — sent anonymously.`;
  }, [context, perRecipient, isPublic]);

  /* ── Trust & safety ── */
  const recipientUserId = context.kind === 'fan' ? context.userId : undefined;
  const eligibility = useGiftEligibility(recipientUserId);
  const eligibilityBlocked =
    !!recipientUserId && eligibility.data && !eligibility.data.eligible;

  const caps = useMemo(
    () => checkSenderCaps(total, { accountCreatedAt: user?.created_at }),
    [total, user?.created_at],
  );
  const capsBlocked = !caps.allowed;

  const valid = subtotal > 0 && total > 0;
  const canQuickPay = payment !== 'new'; // saved/apple/google = 1-tap
  const canSubmit = valid && !eligibilityBlocked && !capsBlocked && !!user;

  const handleConfirm = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    haptic('selection');
    // Simulated processing — payment integration not yet wired
    await new Promise((r) => setTimeout(r, 600));

    const fraud = detectFraudPattern(recipientUserId);
    recordTransaction({
      amount: total,
      recipientLabel: recipientLabel(context),
      recipientUserId,
      context: context.kind,
      isPublic,
      status: fraud.flagged ? 'flagged_hold' : 'completed',
      flagReason: fraud.reason,
    });

    setSubmitting(false);
    if (fraud.flagged) {
      toast({
        title: 'Hold for review',
        description: `${fraud.reason} You'll get an update within 24h. No funds released yet.`,
      });
      onOpenChange(false);
      return;
    }
    setStep('success');
    haptic('heavy');
  };

  const handleUndo = () => {
    haptic('medium');
    toast({
      title: 'Purchase cancelled',
      description: 'No charge was made. Your card was not billed.',
    });
    onOpenChange(false);
  };

  const handleClose = () => onOpenChange(false);

  const recipientAvatarSrc = context.kind === 'fan' ? context.avatarUrl : undefined;
  const recipientFallback = recipientLabel(context).slice(0, 1).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto p-0 rounded-t-3xl border-t-2"
      >
        {step === 'compose' ? (
          <div className="px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5">
            <SheetHeader className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    {recipientAvatarSrc && <AvatarImage src={recipientAvatarSrc} alt="" />}
                    <AvatarFallback className="bg-primary/10 font-bold">
                      {recipientFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md">
                    <Beer className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-xl leading-tight">
                    {context.kind === 'fan' && `Buy ${context.firstName ?? 'a fan'} a beer`}
                    {context.kind === 'meetup' && `Buy a round`}
                    {context.kind === 'bar' && `Round at ${context.barName}`}
                    {context.kind === 'general' && `Send a beer`}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {context.kind === 'fan' && 'Voucher redeemable at participating bars'}
                    {context.kind === 'meetup' && `${defaultRecipients} fans · ${context.locationName ?? 'meetup'}`}
                    {context.kind === 'bar' && `${defaultRecipients} fans checked in`}
                    {context.kind === 'general' && 'Pick a fan, meetup, or bar after'}
                  </p>
                </div>
              </div>
            </SheetHeader>

            {/* Amount */}
            <section aria-labelledby="amt-label" className="space-y-2.5">
              <h3 id="amt-label" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Amount
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <AmountTile
                  selected={amountChoice === 'single'}
                  onClick={() => { haptic('selection'); setAmountChoice('single'); }}
                  title="Single beer"
                  price={`$${SINGLE_BEER}`}
                />
                <AmountTile
                  selected={amountChoice === 'round'}
                  onClick={() => { haptic('selection'); setAmountChoice('round'); }}
                  title={`Round of ${defaultRecipients}`}
                  price={`$${SINGLE_BEER * defaultRecipients}`}
                  disabled={defaultRecipients < 2}
                />
                <AmountTile
                  selected={amountChoice === 'custom'}
                  onClick={() => { haptic('selection'); setAmountChoice('custom'); }}
                  title="Custom"
                  price="$"
                />
              </div>
              {amountChoice === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-2xl font-bold text-muted-foreground">$</span>
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={1}
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    aria-label="Custom amount in dollars"
                    className="text-lg font-semibold"
                  />
                </div>
              )}
            </section>

            {/* Split + Tip */}
            {(isMulti || tipPct > 0 || amountChoice === 'round') && (
              <section className="space-y-3 rounded-2xl border bg-muted/30 p-3.5">
                {isMulti && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Label htmlFor="split-toggle" className="text-sm">Split evenly</Label>
                      <p className="text-[11px] text-muted-foreground">
                        ${perRecipient.toFixed(2)} per fan × {defaultRecipients}
                      </p>
                    </div>
                    <Switch id="split-toggle" checked={splitEvenly} onCheckedChange={setSplitEvenly} />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm">Tip the bartender</Label>
                    <span className="text-sm font-semibold tabular-nums">
                      {tipPct}% · ${tipAmount.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[tipPct]}
                    onValueChange={(v) => setTipPct(v[0])}
                    min={0}
                    max={25}
                    step={5}
                    aria-label="Tip percentage"
                  />
                </div>
              </section>
            )}

            {/* Payment */}
            <section aria-labelledby="pay-label" className="space-y-2.5">
              <h3 id="pay-label" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Payment
              </h3>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)} className="gap-2">
                <PayRow value="saved" label="Visa •••• 4242" icon={<CreditCard className="h-4 w-4" />} badge="Saved" />
                <PayRow value="apple" label="Apple Pay" icon={<Apple className="h-4 w-4" />} />
                <PayRow value="google" label="Google Pay" icon={<Beer className="h-4 w-4" />} />
                <PayRow value="new" label="Add new card" icon={<Plus className="h-4 w-4" />} />
              </RadioGroup>
              {payment === 'new' && (
                <label className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <span className="text-sm">Save this card for next time</span>
                  <Switch checked={savePayment} onCheckedChange={setSavePayment} />
                </label>
              )}
            </section>

            {/* Visibility + receipt */}
            <section className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPublic((p) => !p)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left"
                aria-pressed={isPublic}
              >
                <div className="flex items-center gap-2.5">
                  {isPublic ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <div className="text-sm font-semibold">{isPublic ? 'Public shoutout' : 'Send anonymously'}</div>
                    <p className="text-[11px] text-muted-foreground">
                      {isPublic ? 'Posted to Live Vibe Feed' : 'Hidden from feed and recipient'}
                    </p>
                  </div>
                </div>
                <Badge variant={isPublic ? 'default' : 'secondary'}>{isPublic ? 'Public' : 'Anon'}</Badge>
              </button>

              <label className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                <span className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email me a receipt
                </span>
                <Switch checked={emailReceipt} onCheckedChange={setEmailReceipt} />
              </label>
            </section>

            {/* Trust & Safety banners */}
            {(() => {
              const e = eligibility.data;
              if (!eligibilityBlocked || !e || e.eligible) return null;
              return (
                <div role="alert" className="flex gap-2.5 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-3">
                  <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-destructive">Gifting unavailable</p>
                    <p className="text-xs text-muted-foreground">{e.message}</p>
                  </div>
                </div>
              );
            })()}
            {!eligibilityBlocked && capsBlocked && (
              <div role="alert" className="flex gap-2.5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Limit reached</p>
                  <p className="text-xs text-muted-foreground">{caps.message}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <section
              aria-label="Charge summary"
              className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-3.5 space-y-1.5"
            >
              <SummaryRow label="Beers" value={`$${subtotal.toFixed(2)}`} />
              {tipAmount > 0 && <SummaryRow label="Tip" value={`$${tipAmount.toFixed(2)}`} />}
              <SummaryRow
                label="Platform fee"
                value={`$${platformFee.toFixed(2)}`}
                hint="Covers processing & voucher delivery"
              />
              <Separator className="my-1" />
              <SummaryRow label="Total" value={`$${total.toFixed(2)}`} bold />
              <p className="pt-1.5 text-[11px] leading-snug text-muted-foreground">
                {recipientNotice}
              </p>
              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                <Lock className="h-2.5 w-2.5" />
                Card details handled by our payment processor — never stored on Cubbies Buddies.
              </p>
              {caps.remainingToday < caps.dailyCap && (
                <p className="text-[10px] text-muted-foreground/80">
                  Daily gifting remaining: <span className="tabular-nums font-semibold">${caps.remainingToday.toFixed(2)}</span> of ${caps.dailyCap}
                  {caps.isNewAccount && ' · New-account limits apply'}
                </p>
              )}
            </section>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleConfirm}
                disabled={!canSubmit || submitting}
                className="w-full h-14 text-base"
                size="lg"
              >
                {submitting ? (
                  <>Processing…</>
                ) : eligibilityBlocked ? (
                  <>Gifting unavailable</>
                ) : capsBlocked ? (
                  <>Limit reached</>
                ) : (
                  <>
                    <Beer className="h-5 w-5" />
                    {canQuickPay ? `Pay $${total.toFixed(2)}` : `Confirm $${total.toFixed(2)}`}
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center px-2">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                Secure payment · Refundable within {GIFT_LIMITS.REFUND_WINDOW_HOURS}h ·{' '}
                <Link to="/profile?tab=transactions" className="underline">View transactions</Link>
              </p>
              {!user && (
                <p className="text-center text-[11px] text-destructive">
                  Sign in required to complete purchase.
                </p>
              )}
            </div>
          </div>
        ) : (
          <SuccessView
            context={context}
            total={total}
            isPublic={isPublic}
            undoSeconds={undoSeconds}
            onUndo={handleUndo}
            onClose={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Sub-components ---------- */

function AmountTile({
  selected, onClick, title, price, disabled,
}: { selected: boolean; onClick: () => void; title: string; price: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'min-h-[72px] rounded-2xl border-2 p-2.5 text-center transition-all duration-150',
        'flex flex-col items-center justify-center gap-0.5',
        selected
          ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
          : 'border-border bg-card hover:border-primary/40',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span className="text-base font-bold leading-tight">{price}</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{title}</span>
    </button>
  );
}

function PayRow({
  value, label, icon, badge,
}: { value: string; label: string; icon: React.ReactNode; badge?: string }) {
  return (
    <label
      htmlFor={`pay-${value}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
    >
      <RadioGroupItem id={`pay-${value}`} value={value} />
      <span className="flex items-center gap-2 flex-1 text-sm font-medium">
        {icon}
        {label}
      </span>
      {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
    </label>
  );
}

function SummaryRow({
  label, value, bold, hint,
}: { label: string; value: string; bold?: boolean; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className={cn('text-sm', bold && 'font-bold text-base')}>
        {label}
        {hint && <span className="block text-[10px] font-normal text-muted-foreground">{hint}</span>}
      </div>
      <span className={cn('tabular-nums text-sm', bold && 'font-bold text-base')}>{value}</span>
    </div>
  );
}

function SuccessView({
  context, total, isPublic, undoSeconds, onUndo, onClose,
}: {
  context: BeerModalContext;
  total: number;
  isPublic: boolean;
  undoSeconds: number;
  onUndo: () => void;
  onClose: () => void;
}) {
  const who = recipientLabel(context);
  const txId = useMemo(() => `BB-${Date.now().toString(36).toUpperCase()}`, []);
  return (
    <div className="px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center space-y-5">
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-primary grid place-items-center shadow-lg">
          <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} aria-hidden="true" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-primary animate-pulse" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold">Cheers! 🍻</h2>
        <p className="text-sm text-muted-foreground px-4">
          {context.kind === 'fan'
            ? `${who} just got a beer from you.`
            : `A round was sent to ${who}.`}
          {isPublic && ' Posted to the Live Vibe Feed.'}
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4 text-left space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total charged</span>
          <span className="font-bold tabular-nums">${total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Receipt #</span>
          <span className="font-mono">{txId}</span>
        </div>
        <Separator />
        <p className="text-[11px] text-muted-foreground">
          Need help? You can request a refund within 24 hours from your{' '}
          <span className="underline">Beer Money receipts</span>.
        </p>
      </div>

      {undoSeconds > 0 ? (
        <Button variant="outline" onClick={onUndo} className="w-full">
          <Undo2 className="h-4 w-4" />
          Undo ({undoSeconds}s)
        </Button>
      ) : (
        <p className="text-[11px] text-muted-foreground">Undo window closed.</p>
      )}

      <Button onClick={onClose} className="w-full" size="lg">
        Done
      </Button>
    </div>
  );
}
