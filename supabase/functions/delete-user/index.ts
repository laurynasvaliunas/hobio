import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * delete-user
 * -----------
 * Permanently deletes the calling user's account in accordance with Apple
 * App Store Review Guideline 5.1.1(v) and GDPR right to erasure.
 *
 * Deletion cascade:
 *   1. Removes all Storage files owned by the user (avatars, documents,
 *      contracts, logos) so no orphaned blobs remain.
 *   2. Deletes the auth.users record via the admin API. Because profiles.id
 *      references auth.users(id) ON DELETE CASCADE, and every other table
 *      references profiles(id) ON DELETE CASCADE, this single delete removes
 *      all user data atomically.
 *
 * Security:
 *   - Caller must supply a valid user JWT. Service-role key is never exposed
 *     to the client.
 *   - The user can only delete their own account (uid from JWT = uid to delete).
 */

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOWED_ORIGINS = new Set<string>([
  "hobio://",
  "https://hobio.app",
  "http://localhost:8081",
  "http://localhost:19006",
]);

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

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return json({ error: "Server misconfigured" }, 500, origin);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization header" }, 401, origin);
  }

  // User-scoped client to verify JWT and get uid.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return json({ error: "Unauthorized" }, 401, origin);
  }

  // Admin client: needed to delete auth.users and read storage.
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // ── Step 1: Delete Storage files ──────────────────────────────────────────
    // Remove avatar files for this user.
    const { data: avatarFiles } = await adminClient.storage
      .from("avatars")
      .list(user.id);
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f) => `${user.id}/${f.name}`);
      await adminClient.storage.from("avatars").remove(paths);
    }

    // Remove document files (stored under profile_id/ prefix).
    for (const bucket of ["documents", "contracts", "logos"]) {
      const { data: files } = await adminClient.storage
        .from(bucket)
        .list(user.id);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await adminClient.storage.from(bucket).remove(paths);
      }
    }

    // ── Step 2: Delete auth.users ─────────────────────────────────────────────
    // This cascades: auth.users → profiles → (all child tables via CASCADE).
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error("deleteUser failed", deleteErr);
      return json({ error: "Failed to delete account" }, 500, origin);
    }

    return json({ success: true }, 200, origin);
  } catch (err) {
    console.error("delete-user unhandled error", err);
    return json({ error: "Internal server error" }, 500, origin);
  }
});
