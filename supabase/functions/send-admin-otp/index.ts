// Generates and emails a 6-digit one-time code for admin console login,
// replacing TOTP as the second factor. The code itself is generated here
// (not in SQL) because emailing it needs the Resend secret, which only
// Edge Functions have access to. Verification happens separately via the
// verify_admin_email_otp() RPC, which needs no external call.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendAdminOtpEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return Response.json({ error: "Missing Authorization bearer token." }, { status: 401, headers: corsHeaders });

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." }, { status: 500, headers: corsHeaders });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // Only send codes to actual active admins — this endpoint is reachable
  // by anyone who's completed a password sign-in, admin or not.
  const { data: adminRow } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!adminRow) {
    return Response.json({ error: "This account does not have admin privileges." }, { status: 403, headers: corsHeaders });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await sha256Hex(code);

  const { error: storeError } = await adminClient.rpc("store_admin_email_otp", {
    p_user_id: userData.user.id,
    p_code_hash: codeHash,
    p_ttl_minutes: 10,
  });
  if (storeError) {
    console.error("[send-admin-otp] store_admin_email_otp failed:", storeError);
    return Response.json({ error: "Failed to generate code." }, { status: 500, headers: corsHeaders });
  }

  const emailResult = await sendAdminOtpEmail({ to: userData.user.email ?? "", code });
  if (!emailResult.sent) {
    return Response.json({ error: emailResult.error }, { status: 502, headers: corsHeaders });
  }

  return Response.json({ sent: true }, { headers: corsHeaders });
});
