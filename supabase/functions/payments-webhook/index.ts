import { createStripeClient, getWebhookSecret, type StripeEnv } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

// Map our priceId → number of credits awarded
const PRICE_TO_CREDITS: Record<string, number> = {
  beer_pack_5: 500,
  beer_pack_10: 1000,
  beer_pack_20: 2000,
  beer_pack_50: 5000,
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const envParam = url.searchParams.get("env");
  if (envParam !== "sandbox" && envParam !== "live") {
    return new Response("Invalid env", { status: 400 });
  }
  const env: StripeEnv = envParam;

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();
  const stripe = createStripeClient(env);
  const webhookSecret = getWebhookSecret(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    if (event.type === "checkout.session.completed" || event.type === "transaction.completed") {
      // Stripe gateway forwards both classic Stripe events and gateway-normalized ones.
      // Pull the session shape regardless.
      const session: any = event.data.object;
      const metadata = session.metadata ?? {};
      const userId: string | undefined = metadata.userId;
      const priceId: string | undefined = metadata.priceId;
      const kind: string | undefined = metadata.kind;
      const sessionId: string = session.id;
      const amountTotal: number = session.amount_total ?? 0;

      if (kind !== "beer_money_pack") {
        // Not our event — ack and ignore.
        return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (!userId || !priceId) {
        console.error("Missing userId/priceId in session metadata", { sessionId });
        return new Response("Missing metadata", { status: 400 });
      }

      const credits = PRICE_TO_CREDITS[priceId];
      if (!credits) {
        console.error("Unknown priceId", priceId);
        return new Response("Unknown priceId", { status: 400 });
      }

      const { error } = await supabase.rpc("add_beer_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_session_id: sessionId,
        p_price_id: priceId,
        p_amount_cents: amountTotal,
      });
      if (error) {
        console.error("add_beer_credits failed", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }

      console.log(`Credited ${credits} to user ${userId} (session ${sessionId})`);
    }

    if (event.type === "checkout.session.async_payment_failed" || event.type === "transaction.payment_failed") {
      const session: any = event.data.object;
      const sessionId = session.id;
      await supabase
        .from("credit_purchases")
        .update({ status: "failed" })
        .eq("stripe_session_id", sessionId);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Webhook handler error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
