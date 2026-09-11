// invite-employer-member
//
// Invites a person onto an employer's hiring team by email.
//
// - If the email has no Jobvair account yet, sends a real Supabase Auth
//   invite email (via the service-role admin API) and records a pending
//   row in employer_invitations. When they follow the link and finish
//   signup, the employer app calls accept_pending_invitation() to attach
//   them to the company automatically.
// - If the email already has a Jobvair account, they're added to the
//   company directly (via the attach_existing_employer_member RPC) — no
//   new invite email needed, they can just sign in.
//
// Requires SUPABASE_SERVICE_ROLE_KEY — only used inside this server-side
// function, never sent to the client.
//
// Authorization note: the caller's identity is verified once via
// auth.getUser(jwt) (reliable — it validates the JWT directly). Everything
// after that — the company-admin check and attaching an existing user —
// runs through the service-role connection with that verified user id
// passed explicitly, rather than re-deriving identity via auth.uid() on a
// forwarded-JWT RPC call, which does not reliably carry through in this
// runtime.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return Response.json({ error: "Missing Authorization bearer token." }, { status: 401, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: corsHeaders });
  }

  const companyId = body?.companyId;
  const email = (body?.email || "").trim().toLowerCase();
  const role = body?.role || "recruiter";
  if (!companyId || !email) {
    return Response.json({ error: "companyId and email are required." }, { status: 400, headers: corsHeaders });
  }
  if (!["company_admin", "recruiter", "hiring_manager"].includes(role)) {
    return Response.json({ error: "Invalid role." }, { status: 400, headers: corsHeaders });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server is not configured to send invite emails (missing SUPABASE_SERVICE_ROLE_KEY)." }, { status: 500, headers: corsHeaders });
  }

  // Verify the caller directly from their JWT — this does not depend on
  // header forwarding through PostgREST, so it's reliable.
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  // Service-role client — bypasses RLS entirely, so every check below uses
  // the already-verified userData.user.id explicitly instead of relying on
  // auth.uid().
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: membership, error: membershipError } = await adminClient
    .from("employer_memberships")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError) {
    console.error("[invite-employer-member] membership lookup error:", membershipError);
    return Response.json({ error: `Could not verify admin status: ${membershipError.message}` }, { status: 500, headers: corsHeaders });
  }
  if (!membership || membership.role !== "company_admin") {
    console.error("[invite-employer-member] user", userData.user.id, "is not a company_admin of", companyId, "— found:", membership);
    return Response.json({ error: "Only a company admin can invite hiring team members." }, { status: 403, headers: corsHeaders });
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: SITE_URL ? `${SITE_URL}/employer` : undefined,
    data: { invited_role: role, invited_company_id: companyId },
  });

  if (!inviteError) {
    const { error: rowError } = await adminClient.from("employer_invitations").insert({
      company_id: companyId,
      email,
      role,
      invited_by: userData.user.id,
      status: "pending",
    });
    if (rowError) {
      return Response.json({ error: rowError.message }, { status: 500, headers: corsHeaders });
    }
    return Response.json({ status: "invited", email }, { headers: corsHeaders });
  }

  const alreadyRegistered = /already.*registered|already.*exists/i.test(inviteError.message || "");
  if (!alreadyRegistered) {
    return Response.json({ error: inviteError.message }, { status: 500, headers: corsHeaders });
  }

  // Existing Jobvair account — attach them to the company directly instead
  // of sending a signup invite they don't need. Runs via the service-role
  // RPC (restricted to service_role) since we already authorized this
  // request ourselves above.
  const { error: attachError } = await adminClient.rpc("attach_existing_employer_member", {
    target_company_id: companyId,
    member_email: email,
    member_role: role,
    inviter_id: userData.user.id,
  });
  if (attachError) {
    return Response.json({ error: attachError.message }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ status: "added_existing", email }, { headers: corsHeaders });
});
