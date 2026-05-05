import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Beer, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const qc = useQueryClient();
  const { user } = useAuth();

  // Webhook will credit the balance asynchronously — refetch a few times.
  useEffect(() => {
    if (!user) return;
    const intervals = [500, 1500, 3000, 6000];
    const timers = intervals.map((ms) =>
      setTimeout(() => qc.invalidateQueries({ queryKey: ["beer-money-balance", user.id] }), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [user, qc]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <Beer className="h-7 w-7 text-amber-500 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-1">Beer Money loaded!</h1>
          <p className="text-sm text-muted-foreground">
            Your credits are on the way to your wallet — refresh in a sec if you don't see them yet.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate("/beer-money")} className="rounded-2xl gap-2">
            <Beer className="h-4 w-4" /> Send a Beer
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/profile">Back to my profile</Link>
          </Button>
        </div>
        {sessionId && (
          <p className="text-[10px] text-muted-foreground/60 break-all">Receipt: {sessionId}</p>
        )}
      </div>
    </div>
  );
}
