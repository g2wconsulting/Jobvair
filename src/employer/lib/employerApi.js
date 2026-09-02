import { supabase } from "../../supabaseClient";

// ── Companies & memberships ────────────────────────────────────────────────
export async function getMyMemberships() {
  const { data, error } = await supabase
    .from("employer_memberships")
    .select("*, companies(*)")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function createCompanyAndAdmin(payload) {
  const { data, error } = await supabase.rpc("create_company_and_admin", {
    company_name: payload.name,
    website: payload.website || null,
    industry: payload.industry || null,
    company_size: payload.company_size || null,
    employee_count: payload.employee_count ? Number(payload.employee_count) : null,
    headquarters_location: payload.headquarters_location || null,
    hiring_locations: payload.hiring_locations || [],
    annual_hiring_volume: payload.annual_hiring_volume || null,
    contact_full_name: payload.contact_full_name || null,
    contact_phone: payload.contact_phone || null,
  });
  if (error) throw error;
  return data; // new company id
}

export async function updateCompany(companyId, patch) {
  const { data, error } = await supabase.from("companies").update(patch).eq("id", companyId).select().single();
  if (error) throw error;
  return data;
}

export async function listHiringTeam(companyId) {
  const { data, error } = await supabase
    .from("employer_memberships")
    .select("*, employer_profiles(*)")
    .eq("company_id", companyId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function inviteEmployerMember(companyId, email, role) {
  const { data, error } = await supabase.rpc("invite_employer_member", {
    target_company_id: companyId,
    member_email: email,
    member_role: role,
  });
  if (error) throw error;
  return data;
}

export async function updateMembership(membershipId, patch) {
  const { error } = await supabase.from("employer_memberships").update(patch).eq("id", membershipId);
  if (error) throw error;
}

// ── Jobs ────────────────────────────────────────────────────────────────
export async function listJobs(companyId) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getJob(jobId) {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (error) throw error;
  return data;
}

export async function createJob(companyId, userId, payload) {
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...payload, company_id: companyId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJob(jobId, patch) {
  const { data, error } = await supabase.from("jobs").update(patch).eq("id", jobId).select().single();
  if (error) throw error;
  return data;
}

export async function setJobStatus(jobId, status) {
  const patch = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  if (status === "closed") patch.closed_at = new Date().toISOString();
  return updateJob(jobId, patch);
}

export async function duplicateJob(job, userId) {
  // eslint-disable-next-line no-unused-vars
  const { id, created_at, updated_at, published_at, closed_at, ...rest } = job;
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...rest, title: `${job.title} (Copy)`, status: "draft", created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJob(jobId) {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw error;
}

// ── Applications / ATS pipeline ─────────────────────────────────────────
export async function listApplicationsForCompany(companyId) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs!inner(id, title, company_id)")
    .eq("jobs.company_id", companyId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listApplicationsForJob(jobId) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getApplicationDetail(applicationId) {
  const { data: application, error } = await supabase
    .from("job_applications")
    .select("*, jobs(id, title, company_id)")
    .eq("id", applicationId)
    .single();
  if (error) throw error;

  const candidateId = application.candidate_id;
  const [profile, skills, work, education, certifications, verification, notes, events, assignments] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", candidateId).maybeSingle(),
    supabase.from("candidate_skills").select("*").eq("user_id", candidateId),
    supabase.from("candidate_work_experience").select("*").eq("user_id", candidateId),
    supabase.from("candidate_education").select("*").eq("user_id", candidateId),
    supabase.from("candidate_certifications").select("*").eq("user_id", candidateId),
    supabase.from("identity_verifications").select("status").eq("user_id", candidateId).maybeSingle(),
    supabase.from("candidate_notes").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
    supabase.from("candidate_pipeline_events").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
    supabase.from("candidate_assignments").select("*, employer_profiles(*)").eq("application_id", applicationId),
  ]);

  return {
    application,
    profile: profile.data || null,
    skills: skills.data || [],
    work: work.data || [],
    education: education.data || [],
    certifications: certifications.data || [],
    verified: verification.data?.status === "verified",
    notes: notes.data || [],
    events: events.data || [],
    assignments: assignments.data || [],
  };
}

export async function updateApplicationStage(applicationId, toStage, changedBy, note) {
  const { data: current } = await supabase.from("job_applications").select("current_stage").eq("id", applicationId).single();
  const { error } = await supabase.from("job_applications").update({ current_stage: toStage }).eq("id", applicationId);
  if (error) throw error;
  await supabase.from("candidate_pipeline_events").insert({
    application_id: applicationId,
    from_stage: current?.current_stage || null,
    to_stage: toStage,
    changed_by: changedBy,
    note: note || null,
  });
}

export async function addCandidateNote(applicationId, authorId, body, noteType = "internal") {
  const { data, error } = await supabase
    .from("candidate_notes")
    .insert({ application_id: applicationId, author_id: authorId, body, note_type: noteType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignCandidate(applicationId, assignedTo, assignedBy) {
  const { error } = await supabase
    .from("candidate_assignments")
    .upsert({ application_id: applicationId, assigned_to: assignedTo, assigned_by: assignedBy }, { onConflict: "application_id,assigned_to" });
  if (error) throw error;
}

// ── Saved candidates / talent search (framework — search itself is Phase 2) ─
export async function listSavedCandidates(companyId) {
  const { data, error } = await supabase
    .from("saved_candidates")
    .select("*, profiles:candidate_id(*)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveCandidate(companyId, candidateId, savedBy, note) {
  const { error } = await supabase
    .from("saved_candidates")
    .upsert({ company_id: companyId, candidate_id: candidateId, saved_by: savedBy, note }, { onConflict: "company_id,candidate_id" });
  if (error) throw error;
}

export async function unsaveCandidate(id) {
  const { error } = await supabase.from("saved_candidates").delete().eq("id", id);
  if (error) throw error;
}

// ── Interviews ──────────────────────────────────────────────────────────
export async function listInterviewsForCompany(companyId) {
  const { data, error } = await supabase
    .from("interviews")
    .select("*, job_applications!inner(id, job_id, candidate_id, jobs!inner(company_id, title))")
    .eq("job_applications.jobs.company_id", companyId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createInterview(applicationId, createdBy, payload) {
  const { data, error } = await supabase
    .from("interviews")
    .insert({ application_id: applicationId, created_by: createdBy, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInterview(interviewId, patch) {
  const { error } = await supabase.from("interviews").update(patch).eq("id", interviewId);
  if (error) throw error;
}

export async function addInterviewFeedback(interviewId, interviewerId, payload) {
  const { error } = await supabase
    .from("interview_feedback")
    .upsert({ interview_id: interviewId, interviewer_id: interviewerId, ...payload }, { onConflict: "interview_id,interviewer_id" });
  if (error) throw error;
}

// ── Offers ──────────────────────────────────────────────────────────────
export async function listOffersForCompany(companyId) {
  const { data, error } = await supabase
    .from("offers")
    .select("*, job_applications!inner(id, job_id, candidate_id, jobs!inner(company_id, title))")
    .eq("job_applications.jobs.company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createOffer(applicationId, createdBy, payload) {
  const { data, error } = await supabase
    .from("offers")
    .insert({ application_id: applicationId, created_by: createdBy, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOfferStatus(offerId, status) {
  const patch = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "accepted" || status === "declined") patch.responded_at = new Date().toISOString();
  const { error } = await supabase.from("offers").update(patch).eq("id", offerId);
  if (error) throw error;
}

export async function markHiredAndCreateHcmTransfer(application, companyId, offer) {
  await updateApplicationStage(application.id, "hired", application.candidate_id, "Marked as hired");
  const { data, error } = await supabase
    .from("hcm_transfers")
    .insert({
      application_id: application.id,
      company_id: companyId,
      candidate_user_id: application.candidate_id,
      job_title: application.jobs?.title || null,
      salary_rate: offer?.salary_offered || null,
      start_date: offer?.start_date || null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Salary & market intelligence (modular — swap `source` implementation later) ─
export async function getSalaryInsight({ companyId, requestedBy, jobTitle, location, experienceLevel, industry, companySize }) {
  // Placeholder heuristic until a real compensation data provider is wired in.
  // Kept server-persisted so the shape (low/median/high/recommendation) never
  // has to change in the UI when a real provider replaces this estimate.
  const base = 65000 + jobTitle.length * 400;
  const expMultiplier = { entry: 0.85, mid: 1, senior: 1.35, manager: 1.55, director: 1.9 }[experienceLevel] || 1;
  const median = Math.round((base * expMultiplier) / 500) * 500;
  const low = Math.round(median * 0.85 / 500) * 500;
  const high = Math.round(median * 1.2 / 500) * 500;
  const recommendation = `Based on comparable roles${location ? ` in ${location}` : ""}, a salary between $${low.toLocaleString()} and $${high.toLocaleString()} is likely to be competitive for this position.`;

  const row = { company_id: companyId || null, requested_by: requestedBy || null, job_title: jobTitle, location, experience_level: experienceLevel, industry, company_size: companySize, low, median, high, recommendation, source: "placeholder" };
  const { data, error } = await supabase.from("salary_insights").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function getMarketInsight({ companyId, jobId, location, skillProfile }) {
  // Placeholder market model — same shape a real labor-market data provider
  // would return, so the UI never has to change when one is connected.
  const availability = 400 + Math.floor(Math.random() * 2200);
  const hybridPref = 45 + Math.floor(Math.random() * 35);
  const difficulty = availability > 1500 ? "Low" : availability > 600 ? "Moderate" : "High";

  const row = {
    company_id: companyId || null, job_id: jobId || null, location, skill_profile: skillProfile || [],
    talent_availability_estimate: availability, remote_hybrid_preference_pct: hybridPref,
    hiring_difficulty: difficulty, compensation_competitiveness_pct: -8 + Math.floor(Math.random() * 16),
    candidate_supply_radius_miles: 25, candidate_supply_level: availability > 1000 ? "Healthy" : "Limited",
    source: "placeholder",
  };
  const { data, error } = await supabase.from("market_insights").insert(row).select().single();
  if (error) throw error;
  return data;
}

// ── Subscriptions & entitlements ────────────────────────────────────────
export async function listSubscriptionPlans() {
  const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function getCompanySubscription(companyId) {
  const { data, error } = await supabase
    .from("company_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFeatureEntitlements(companyId) {
  const { data, error } = await supabase.from("feature_entitlements").select("*").eq("company_id", companyId);
  if (error) throw error;
  return data || [];
}

// ── Dashboard metrics ───────────────────────────────────────────────────
export async function getDashboardMetrics(companyId) {
  const { data, error } = await supabase.rpc("get_employer_dashboard_metrics", { target_company_id: companyId }).single();
  if (error) throw error;
  return data;
}
