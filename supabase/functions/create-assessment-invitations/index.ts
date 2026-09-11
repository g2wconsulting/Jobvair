// Creates assessment invitations for one or more candidates and emails
// each of them a branded, secure link via Resend. Requires
// SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY — neither ever reaches the
// client. See invite-employer-member for the same auth pattern this
// follows (verify JWT once via auth.getUser, then do every subsequent
// check through the service-role client with that verified user id).

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

  const companyId = body?.companyId;
  const assessmentIds: string[] = body?.assessmentIds || [];
  const dueDate = body?.dueDate || null;
  const candidates: { first: string; last?: string; email: string; jobId?: string }[] = body?.candidates || [];

  if (!companyId || assessmentIds.length === 0 || candidates.length === 0) {
    return Response.json({ error: "companyId, assessmentIds, and at least one candidate are required." }, { status: 400, headers: corsHeaders });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." }, { status: 500, headers: corsHeaders });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: membership } = await adminClient
    .from("employer_memberships")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) {
    return Response.json({ error: "You are not an active member of this company." }, { status: 403, headers: corsHeaders });
  }

  const { data: company } = await adminClient.from("companies").select("name").eq("id", companyId).single();
  const employerName = company?.name || "Your prospective employer";

  const { data: assessments } = await adminClient
    .from("assessments")
    .select("slug, name, estimated_minutes")
    .in("slug", assessmentIds)
    .eq("status", "published");
  const assessmentNames = (assessments || []).map(a => a.name);
  const totalMinutes = (assessments || []).reduce((s, a) => s + (a.estimated_minutes || 0), 0);

  const rows = candidates.map(c => ({
    company_id: companyId,
    job_id: c.jobId || null,
    candidate_name: [c.first, c.last].filter(Boolean).join(" "),
    candidate_email: c.email,
    assessment_ids: assessmentIds,
    due_date: dueDate,
    created_by: userData.user.id,
  }));

  const { data: created, error: insertError } = await adminClient.from("assessment_invitations").insert(rows).select();
  if (insertError) {
    // Most likely cause: the company's annual completed-assessment
    // allowance trigger rejected the insert. Surface it as a clean 402
    // rather than a raw Postgres error.
    const isLimitError = /assessment.*(limit|allowance)/i.test(insertError.message || "");
    return Response.json({ error: insertError.message }, { status: isLimitError ? 402 : 500, headers: corsHeaders });
  }

  const results = [];
  for (const invitation of created || []) {
    const link = `${SITE_URL || ""}/assessment.html?t=${invitation.invite_token}`;
    const emailResult = await sendAssessmentInvitationEmail({
      to: invitation.candidate_email,
      candidateName: invitation.candidate_name,
      employerName,
      assessmentNames,
      estimatedMinutes: totalMinutes,
      dueDate,
      link,
    });
    results.push({ invitation_id: invitation.id, email: invitation.candidate_email, sent: emailResult.sent, error: emailResult.error });
  }

  return Response.json({ invitations: created, email_results: results }, { headers: corsHeaders });
});
