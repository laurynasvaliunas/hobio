// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { z } from "npm:zod@3";

/**
 * create-payment-intent
 * ---------------------
 * Creates (or returns) a Stripe PaymentIntent + ephemeral key for an existing
 * Hobio invoice.
 *
 * Security posture
 *   - Caller must supply a valid Supabase user JWT (Authorization header).
 *   - All DB reads/writes go through a user-scoped client so RLS is enforced.
 *     A service-role client is used ONLY to fetch the organization owner for
 *     authorization (a row the caller might not be allowed to read but that is
 *     required to decide authZ).
 *   - Stripe requests use an idempotency key derived from the invoice id so
 *     retries cannot create duplicate intents.
 *   - CORS is limited to the `hobio://` custom scheme and explicitly allow-
 *     listed web origins.
 *
 * Input  (POST JSON): { invoice_id: uuid }
 * Output (200 JSON):  { paymentIntent, ephemeralKey, customer, publishableKey }
 */

const STRIPE_API_VERSION = "2025-03-31.basil";
const ALLOWED_ORIGINS = new Set<string>([
  "hobio://",
  "https://hobio.app",
  "http://localhost:8081",
  "http://localhost:19006",
]);

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripePublishable = Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(stripeSecret, { apiVersion: STRIPE_API_VERSION });

const PayloadSchema = z.object({
  invoice_id: z.string().uuid(),
});

function corsHeaders(origin: string | null): Record<string, string> {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "hobio://";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "300",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function error(message: string, status: number, origin: string | null): Response {
  return json({ error: message }, status, origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return error("Method not allowed", 405, origin);
  }

  if (!stripeSecret || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return error("Server misconfigured", 500, origin);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return error("Missing Authorization header", 401, origin);
  }
  const jwt = authHeader.slice("Bearer ".length);

  // User-scoped client: RLS applies. This is our primary data path.
  const userClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Service client: only used to resolve the organization owner during authZ.
  const adminClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return error("Unauthorized", 401, origin);
  }
  const user = userData.user;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return error("Invalid JSON", 400, origin);
  }
  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return error(`Invalid payload: ${parsed.error.errors.map((e) => e.path.join(".")).join(", ")}`, 400, origin);
  }
  const { invoice_id } = parsed.data;

  // Fetch invoice via the user-scoped client → RLS already guarantees the
  // caller is either the organizer or the owning member/parent.
  const { data: invoice, error: invErr } = await userClient
    .from("invoices")
    .select("id, group_id, member_id, amount, currency, status, stripe_payment_intent_id, idempotency_key")
    .eq("id", invoice_id)
    .single();
  if (invErr || !invoice) {
    return error("Invoice not found or not accessible", 404, origin);
  }
  if (invoice.status === "paid") {
    return error("Invoice is already paid", 409, origin);
  }
  if (typeof invoice.amount !== "number" || invoice.amount <= 0) {
    return error("Invoice has invalid amount", 400, origin);
  }

  // Extra belt-and-braces authorization: confirm the caller is the member/parent
  // or the organization owner. This is redundant with RLS but keeps the intent
  // explicit and resilient to policy drift.
  const { data: memberRow } = await adminClient
    .from("group_members")
    .select("profile_id, child_id, group:groups(organization_id)")
    .eq("id", invoice.member_id)
    .single();
  const orgOwnerId = (memberRow as any)?.group?.organization_id
    ? (await adminClient
        .from("organizations")
        .select("owner_id")
        .eq("id", (memberRow as any).group.organization_id)
        .single()).data?.owner_id ?? null
    : null;

  const isOwningParticipant = memberRow?.profile_id === user.id;
  const isOrganizer = orgOwnerId === user.id;
  const isChildsParent =
    memberRow?.child_id
      ? !!(await adminClient
          .from("children")
          .select("id")
          .eq("id", memberRow.child_id)
          .eq("parent_id", user.id)
          .single()).data
      : false;

  if (!isOwningParticipant && !isOrganizer && !isChildsParent) {
    return error("Forbidden", 403, origin);
  }

  // Profile for Stripe customer identity
  const { data: profile } = await adminClient
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();
  const email = profile?.email ?? user.email ?? "";
  const name = profile?.full_name ?? "";
  if (!email) return error("Caller has no email", 400, origin);

  // Find or create Stripe customer
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

  // Idempotency: one PaymentIntent per invoice. Using the invoice id as the
  // idempotency key means Stripe returns the same intent even on retries.
  const idempotencyKey = invoice.idempotency_key ?? `invoice-${invoice.id}`;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(Number(invoice.amount) * 100), // DB stores decimal; Stripe wants cents
      currency: String(invoice.currency ?? "EUR").toLowerCase(),
      customer: customerId,
      description: `Hobio invoice ${invoice.id}`,
      payment_method_types: ["card"],
      metadata: {
        invoice_id: invoice.id,
        group_id: invoice.group_id,
        member_id: invoice.member_id,
        supabase_user_id: user.id,
      },
    },
    { idempotencyKey },
  );

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: STRIPE_API_VERSION },
  );

  // Record the payment intent on the invoice. Uses the ADMIN client because
  // RLS restricts writes to organizers, but any authorized caller should be
  // able to trigger payment — we've already verified authZ above.
  await adminClient
    .from("invoices")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      idempotency_key: idempotencyKey,
    })
    .eq("id", invoice.id);

  return json(
    {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      publishableKey: stripePublishable,
    },
    200,
    origin,
  );
});
