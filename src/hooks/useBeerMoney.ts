import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useBeerMoneyBalance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["beer-money-balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("beer_money_balances")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("balance fetch failed", error);
        return 0;
      }
      return data?.credits ?? 0;
    },
    enabled: !!user,
    staleTime: 10_000,
  });
}

interface SendTipArgs {
  recipientId: string;
  credits: number;
  message?: string;
}

export function useSendBeerTip() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ recipientId, credits, message }: SendTipArgs) => {
      const { data, error } = await supabase.rpc("send_beer_tip", {
        p_recipient_id: recipientId,
        p_credits: credits,
        p_message: message ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beer-money-balance", user?.id] });
      qc.invalidateQueries({ queryKey: ["beer-tips-sent"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Could not send Beer Money";
      const friendly =
        msg.includes("Insufficient")
          ? "Not enough Beer Money — top up to keep the rounds coming."
          : msg.includes("Daily tip limit")
            ? "You've hit today's tip limit (5,000 credits per 24h)."
            : msg.includes("Cannot tip yourself")
              ? "You can't buy yourself a beer 🍻"
              : msg;
      toast.error(friendly, { id: "beer-tip-error" });
    },
  });
}
