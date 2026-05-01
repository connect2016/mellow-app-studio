import { useEffect, useState } from 'react';
import { Beer, RefreshCw, Flag, ShieldAlert, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  GIFT_LIMITS,
  getTransactions,
  updateTransactionStatus,
  type LedgerEntry,
} from '@/lib/gift-trust-safety';
import { trackBuyBeer } from '@/lib/beer-experiments';
import { cn } from '@/lib/utils';

const REFUND_WINDOW_MS = GIFT_LIMITS.REFUND_WINDOW_HOURS * 60 * 60 * 1000;

function isWithinRefundWindow(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < REFUND_WINDOW_MS;
}

function statusMeta(status: LedgerEntry['status']) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', tone: 'default' as const, icon: <Check className="h-3 w-3" /> };
    case 'refunded':
      return { label: 'Refunded', tone: 'secondary' as const, icon: <RefreshCw className="h-3 w-3" /> };
    case 'disputed':
      return { label: 'Dispute open', tone: 'destructive' as const, icon: <Flag className="h-3 w-3" /> };
    case 'flagged_hold':
      return { label: 'On hold', tone: 'destructive' as const, icon: <ShieldAlert className="h-3 w-3" /> };
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function TransactionsSection() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LedgerEntry[]>(() => getTransactions());
  const [refundTarget, setRefundTarget] = useState<LedgerEntry | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<LedgerEntry | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('not_received');
  const [disputeNote, setDisputeNote] = useState<string>('');

  useEffect(() => {
    const sync = () => setEntries(getTransactions());
    window.addEventListener('cb:gift-ledger:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cb:gift-ledger:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleRefund = () => {
    if (!refundTarget) return;
    updateTransactionStatus(refundTarget.id, 'refunded');
    setEntries(getTransactions());
    trackBuyBeer('buy_beer_refund_requested', {
      txId: refundTarget.id,
      amount: refundTarget.amount,
      reason: 'user_initiated',
    });
    toast({
      title: 'Refund issued',
      description: `$${refundTarget.amount.toFixed(2)} returned to your original payment method within 3-5 business days.`,
    });
    setRefundTarget(null);
  };

  const handleDispute = () => {
    if (!disputeTarget) return;
    updateTransactionStatus(disputeTarget.id, 'disputed');
    setEntries(getTransactions());
    toast({
      title: 'Dispute filed',
      description: 'Our trust & safety team will review within 24 hours and email you the outcome.',
    });
    setDisputeTarget(null);
    setDisputeReason('not_received');
    setDisputeNote('');
  };

  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Beer className="h-5 w-5 text-primary" />
          Beer Money transactions
        </h2>
        <p className="text-xs text-muted-foreground">
          Refundable within {GIFT_LIMITS.REFUND_WINDOW_HOURS} hours · Disputes reviewed within 24h
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No gifts yet. When you buy a beer for a fan, your receipts will show up here.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const meta = statusMeta(e.status);
            const refundable = e.status === 'completed' && isWithinRefundWindow(e.createdAt);
            const disputable = e.status === 'completed' || e.status === 'flagged_hold';
            return (
              <li
                key={e.id}
                className={cn(
                  'rounded-2xl border bg-card p-3.5 space-y-2.5',
                  e.status === 'flagged_hold' && 'border-destructive/40 bg-destructive/5',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">
                        Beer for {e.recipientLabel}
                      </span>
                      <Badge variant={meta.tone} className="gap-1 text-[10px]">
                        {meta.icon}
                        {meta.label}
                      </Badge>
                      {!e.isPublic && (
                        <Badge variant="secondary" className="text-[10px]">Anonymous</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(e.createdAt)} · #{e.id}
                    </p>
                    {e.flagReason && (
                      <p className="text-[11px] text-destructive mt-1">⚠ {e.flagReason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold tabular-nums">${e.amount.toFixed(2)}</div>
                  </div>
                </div>

                {(refundable || disputable) && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      {refundable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setRefundTarget(e)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Request refund
                        </Button>
                      )}
                      {disputable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => setDisputeTarget(e)}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Dispute
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Refund confirm */}
      <Dialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund this gift?</DialogTitle>
            <DialogDescription>
              ${refundTarget?.amount.toFixed(2)} will be returned to your original payment method
              within 3–5 business days. The recipient's voucher will be voided if unused.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button onClick={handleRefund}>Confirm refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute */}
      <Dialog open={!!disputeTarget} onOpenChange={(o) => !o && setDisputeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File a dispute</DialogTitle>
            <DialogDescription>
              Our trust & safety team reviews disputes within 24 hours. Funds are held until the
              review is complete.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={disputeReason} onValueChange={setDisputeReason} className="gap-2 py-2">
            {[
              { v: 'not_received', l: 'Voucher never delivered' },
              { v: 'unauthorized', l: 'I did not authorize this charge' },
              { v: 'wrong_amount', l: 'Amount or recipient is wrong' },
              { v: 'fraud', l: 'Suspected fraud or scam' },
              { v: 'other', l: 'Something else' },
            ].map((o) => (
              <Label
                key={o.v}
                htmlFor={`r-${o.v}`}
                className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem id={`r-${o.v}`} value={o.v} />
                <span className="text-sm font-medium">{o.l}</span>
              </Label>
            ))}
          </RadioGroup>
          <Textarea
            placeholder="Add details (optional)"
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisputeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDispute}>Submit dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
