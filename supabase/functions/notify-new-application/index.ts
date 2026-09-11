// Fired by a Supabase Database Webhook on INSERT into job_applications
// (configured in the dashboard: Database → Webhooks → new webhook → table
// job_applications, event Insert, type "Supabase Edge Functions" → this
// function). That webhook type signs its request with the project's
// service-role key as the bearer token automatically, which doubles as
// this function's auth check — nothing else should be calling this.
//
// Per-job notification preference (jobs.notify_on_application,
// jobs.notification_email) lets an employer turn this off, or redirect it
// away from their own account email, without touching the pipeline itself
// — the application is recorded either way.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendNewApplicantEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  if (!SUPABASE_SERVICE_ROLE_KEY || authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = payload?.record;
  if (payload?.type !== "INSERT" || !record?.job_id || !record?.candidate_id) {
    // Not an application insert — nothing to do, but not an error either.
    return Response.json({ skipped: true }, { status: 200 });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: job } = await adminClient
    .from("jobs")
    .select("id, title, company_id, notify_on_application, notification_email")
    .eq("id", record.job_id)
    .maybeSingle();
  if (!job || !job.notify_on_application) {
    return Response.json({ skipped: true }, { status: 200 });
  }

  let recipientEmail = job.notification_email;
  if (!recipientEmail) {
    const { data: primary } = await adminClient
      .from("employer_memberships")
      .select("employer_profiles(email)")
      .eq("company_id", job.company_id)
      .eq("is_primary_contact", true)
      .eq("is_active", true)
      .maybeSingle();
    recipientEmail = (primary as { employer_profiles?: { email?: string } })?.employer_profiles?.email || null;
  }
  if (!recipientEmail) {
    const { data: anyAdmin } = await adminClient
      .from("employer_memberships")
      .select("employer_profiles(email)")
      .eq("company_id", job.company_id)
      .eq("role", "company_admin")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    recipientEmail = (anyAdmin as { employer_profiles?: { email?: string } })?.employer_profiles?.email || null;
  }
  if (!recipientEmail) {
    return Response.json({ skipped: true, reason: "no notification recipient on file" }, { status: 200 });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name, desired_titles")
    .eq("id", record.candidate_id)
    .maybeSingle();

  const emailResult = await sendNewApplicantEmail({
    to: recipientEmail,
    jobTitle: job.title,
    candidateName: profile?.full_name || "",
    candidateHeadline: (profile?.desired_titles || [])[0] || null,
    applicationUrl: `${SITE_URL}/employer`,
  });

  return Response.json({ sent: emailResult.sent, error: emailResult.error }, { status: 200 });
});
