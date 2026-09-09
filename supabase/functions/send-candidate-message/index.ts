// Sends a direct email message to an applicant on behalf of the employer
// and logs it against the application as a candidate_notes row
// (note_type='message') so the pipeline shows what was sent and when. Auth
// pattern matches create-assessment-invitations.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendCandidateMessageEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

  const applicationId = body?.applicationId;
  const subject = (body?.subject || "").trim();
  const messageBody = (body?.body || "").trim();
  if (!applicationId || !subject || !messageBody) {
    return Response.json({ error: "applicationId, subject, and body are required." }, { status: 400, headers: corsHeaders });
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

  const { data: application } = await adminClient
    .from("job_applications")
    .select("id, candidate_id, jobs(company_id, title)")
    .eq("id", applicationId)
    .single();
  if (!application) return Response.json({ error: "Application not found." }, { status: 404, headers: corsHeaders });

  const companyId = (application.jobs as { company_id?: string })?.company_id;
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

  const [{ data: company }, { data: profile }, { data: senderProfile }] = await Promise.all([
    adminClient.from("companies").select("name").eq("id", companyId).single(),
    adminClient.from("profiles").select("full_name, email").eq("id", application.candidate_id).single(),
    adminClient.from("employer_profiles").select("full_name").eq("id", userData.user.id).maybeSingle(),
  ]);

  if (!profile?.email) {
    return Response.json({ error: "This candidate has no email on file." }, { status: 422, headers: corsHeaders });
  }

  const employerName = company?.name || "Your prospective employer";
  const senderName = senderProfile?.full_name || employerName;

  const emailResult = await sendCandidateMessageEmail({
    to: profile.email,
    candidateName: profile.full_name || "",
    employerName,
    senderName,
    subject,
    body: messageBody,
  });

  await adminClient.from("candidate_notes").insert({
    application_id: applicationId,
    author_id: userData.user.id,
    note_type: "message",
    body: `Subject: ${subject}\n\n${messageBody}${emailResult.sent ? "" : `\n\n[Email delivery failed: ${emailResult.error}]`}`,
  });

  if (!emailResult.sent) {
    return Response.json({ error: emailResult.error || "Failed to send email." }, { status: 502, headers: corsHeaders });
  }
  return Response.json({ sent: true }, { headers: corsHeaders });
});
