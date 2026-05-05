import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Beer } from "lucide-react";
import { StripeEmbeddedCheckoutForm } from "./StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PACKS = [
  { priceId: "beer_pack_5", credits: 500, label: "$5", desc: "1 cold one" },
  { priceId: "beer_pack_10", credits: 1000, label: "$10", desc: "Buy 2 rounds" },
  { priceId: "beer_pack_20", credits: 2000, label: "$20", desc: "Top up the night", popular: true },
  { priceId: "beer_pack_50", credits: 5000, label: "$50", desc: "Crew leader" },
];

export function TopUpModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const handleClose = (next: boolean) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <PaymentTestModeBanner />
        <div className="p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beer className="h-5 w-5 text-primary" /> Top up Beer Money
            </DialogTitle>
          </DialogHeader>

          {!selected ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Pre-load credits → tip any fan instantly, no checkout each round.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PACKS.map((p) => (
                  <button
                    key={p.priceId}
                    onClick={() => setSelected(p.priceId)}
                    className={`relative rounded-xl border p-3 text-left transition hover:border-primary/40 ${
                      p.popular ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 left-3 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                        Popular
                      </span>
                    )}
                    <p className="text-lg font-bold text-primary">{p.label}</p>
                    <p className="text-xs font-semibold">{p.credits.toLocaleString()} credits</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                🔒 Secure checkout · 1 credit = 1¢
              </p>
            </div>
          ) : user ? (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 text-xs"
                onClick={() => setSelected(null)}
              >
                ← Pick a different pack
              </Button>
              <StripeEmbeddedCheckoutForm
                priceId={selected}
                userId={user.id}
                customerEmail={user.email ?? undefined}
                returnUrl={returnUrl}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-destructive">You need to be signed in to top up.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
