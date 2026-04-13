import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-03-31.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    // ── Authenticate the caller via Supabase JWT ──────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing Authorization header", 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // ── Parse request body ────────────────────────────────────────────────
    const { group_id, member_id, amount, currency, description } = await req.json();

    if (!amount || amount <= 0) {
      return errorResponse("Invalid amount", 400);
    }
    if (!currency) {
      return errorResponse("Currency is required", 400);
    }

    // ── Get user profile for customer creation ────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";
    const name = profile?.full_name ?? "";

    // ── Find or create Stripe customer ────────────────────────────────────
    let customerId: string;
    const existing = await stripe.customers.list({ email, limit: 1 });

    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // ── Create ephemeral key (for Payment Sheet) ──────────────────────────
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2025-03-31.basil" },
    );

    // ── Create Payment Intent ─────────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount,                      // already in cents from the mobile app
      currency: currency.toLowerCase(),
      customer: customerId,
      description: description ?? "Hobio Group Subscription",
      automatic_payment_methods: { enabled: true },
      metadata: {
        group_id: group_id ?? "",
        member_id: member_id ?? "",
        supabase_user_id: user.id,
      },
    });

    // ── Update invoice with stripe_payment_intent_id if invoice_id provided ─
    // (The mobile hook records the invoice separately; this is a convenience update)
    if (group_id && member_id) {
      await supabase
        .from("invoices")
        .update({ stripe_invoice_id: paymentIntent.id })
        .eq("group_id", group_id)
        .eq("member_id", member_id)
        .eq("status", "unpaid")
        .order("created_at", { ascending: false })
        .limit(1);
    }

    // ── Return response to mobile app ─────────────────────────────────────
    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
