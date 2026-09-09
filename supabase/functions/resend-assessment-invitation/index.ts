// Re-sends the invitation email for an existing assessment_invitations
// row (does not create a new invitation or reset the candidate's
// progress). Same auth pattern as create-assessment-invitations.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendAssessmentInvitationEmail } from "../_shared/email.ts";

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
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return Response.json({ error: "Missing Authorization bearer token." }, { status: 401, headers: corsHeaders });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: corsHeaders });
  }

  const invitationId = body?.invitationId;
  if (!invitationId) return Response.json({ error: "invitationId is required." }, { status: 400, headers: corsHeaders });
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." }, { status: 500, headers: corsHeaders });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: invitation } = await adminClient
    .from("assessment_invitations")
    .select("*, companies(name)")
    .eq("id", invitationId)
    .maybeSingle();
  if (!invitation) return Response.json({ error: "Invitation not found." }, { status: 404, headers: corsHeaders });

  const { data: membership } = await adminClient
    .from("employer_memberships")
    .select("role")
    .eq("company_id", invitation.company_id)
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) return Response.json({ error: "You are not an active member of this company." }, { status: 403, headers: corsHeaders });

  const { data: assessments } = await adminClient
    .from("assessments")
    .select("name, estimated_minutes")
    .in("slug", invitation.assessment_ids || [])
    .eq("status", "published");
  const assessmentNames = (assessments || []).map(a => a.name);
  const totalMinutes = (assessments || []).reduce((s, a) => s + (a.estimated_minutes || 0), 0);

  const link = `${SITE_URL || ""}/assessment.html?t=${invitation.invite_token}`;
  const emailResult = await sendAssessmentInvitationEmail({
    to: invitation.candidate_email,
    candidateName: invitation.candidate_name,
    employerName: (invitation as { companies?: { name?: string } }).companies?.name || "Your prospective employer",
    assessmentNames,
    estimatedMinutes: totalMinutes,
    dueDate: invitation.due_date,
    link,
  });

  if (!emailResult.sent) {
    return Response.json({ error: emailResult.error }, { status: 502, headers: corsHeaders });
  }

  if (invitation.status === "expired") {
    await adminClient.from("assessment_invitations").update({ status: "sent" }).eq("id", invitationId);
  }

  return Response.json({ sent: true }, { headers: corsHeaders });
});
