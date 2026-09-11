import { supabase } from "../../supabaseClient";
import { edgeFetch } from "../../lib/edgeFetch.js";
import { computeEffectiveFeatures } from "../featureFlags.js";

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

// Invites someone by email — sends a real invite email for a brand-new
// account, or attaches an existing Jobvair account directly. Requires the
// invite-employer-member Edge Function (needs SUPABASE_SERVICE_ROLE_KEY).
export async function inviteEmployerMemberByEmail(companyId, email, role) {
  return edgeFetch("invite-employer-member", { companyId, email, role });
}

export async function updateMembership(membershipId, patch) {
  const { error } = await supabase.from("employer_memberships").update(patch).eq("id", membershipId);
  if (error) throw error;
}

export async function listPendingInvitations(companyId) {
  const { data, error } = await supabase
    .from("employer_invitations")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function revokeInvitation(invitationId) {
  const { error } = await supabase.from("employer_invitations").update({ status: "revoked" }).eq("id", invitationId);
  if (error) throw error;
}

// Called once per session after sign-in — turns a pending invitation
// matching the signed-in user's verified email into a real membership.
// Returns the company id if one was accepted, otherwise null.
export async function acceptPendingInvitation() {
  const { data, error } = await supabase.rpc("accept_pending_invitation");
  if (error) throw error;
  return data;
}

// ── Company logo ────────────────────────────────────────────────────────
export async function uploadCompanyLogo(companyId, file) {
  const ext = file.name.split(".").pop() || "png";
  const path = `${companyId}/logo_${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
  const publicUrl = data.publicUrl;
  await updateCompany(companyId, { logo_url: publicUrl });
  return publicUrl;
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

// ── Job-attached custom questions ──────────────────────────────────────
// A job's custom questions live in an ordinary company-owned assessment
// (same tables the Assessment Builder writes to) — this just get-or-creates
// that assessment/section the first time a manager adds a question to a
// job, and remembers it via jobs.linked_assessment_id. Reuses the full
// existing scoring/candidate-delivery pipeline instead of a parallel one.
async function getOrCreateCompanyQuestionBank(companyId) {
  const { data: existing } = await supabase.from("question_banks").select("id").eq("company_id", companyId).limit(1).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("question_banks").insert({ company_id: companyId, name: "Custom Questions" }).select().single();
  if (error) throw error;
  return created.id;
}

export async function getOrCreateJobAssessment(job, companyId, userId) {
  if (job.linked_assessment_id) {
    const { data: section } = await supabase.from("assessment_sections").select("id").eq("assessment_id", job.linked_assessment_id).limit(1).maybeSingle();
    if (section) return { assessmentId: job.linked_assessment_id, sectionId: section.id };
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      company_id: companyId,
      created_by: userId,
      name: `${job.title} — Job Questions`,
      category: "Job-Specific",
      slug: `custom-${companyId.slice(0, 8)}-job-${job.id.slice(0, 8)}`,
    })
    .select()
    .single();
  if (assessmentError) throw assessmentError;

  const { data: section, error: sectionError } = await supabase
    .from("assessment_sections")
    .insert({ assessment_id: assessment.id, name: "Job-Specific Questions", display_order: 0, weight: 1 })
    .select()
    .single();
  if (sectionError) throw sectionError;

  await supabase.from("jobs").update({ linked_assessment_id: assessment.id }).eq("id", job.id);

  return { assessmentId: assessment.id, sectionId: section.id };
}

export async function listSectionQuestions(sectionId) {
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("display_order, questions(id, type, prompt, points, correct_answer, rubric, question_options(id, label, is_correct, display_order))")
    .eq("section_id", sectionId)
    .order("display_order");
  if (error) throw error;
  return (data || []).map(row => ({ ...row.questions, question_options: (row.questions.question_options || []).sort((a, b) => a.display_order - b.display_order) }));
}

export async function addSectionQuestion(sectionId, companyId, payload, existingCount) {
  const questionBankId = await getOrCreateCompanyQuestionBank(companyId);
  const { data: q, error } = await supabase
    .from("questions")
    .insert({ question_bank_id: questionBankId, type: payload.type, prompt: payload.prompt, points: payload.points, correct_answer: payload.correct_answer, rubric: payload.rubric })
    .select()
    .single();
  if (error) throw error;
  if (payload.options?.length) {
    await supabase.from("question_options").insert(payload.options.map((o, i) => ({ question_id: q.id, label: o.label, value: o.label, is_correct: o.is_correct, display_order: i })));
  }
  await supabase.from("assessment_questions").insert({ section_id: sectionId, question_id: q.id, display_order: existingCount });
  return q;
}

export async function deleteSectionQuestion(questionId) {
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  if (error) throw error;
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

// Flattened applicant list for pickers (e.g. "send assessment to an
// applicant") — job_applications has no direct FK to profiles (both
// reference auth.users independently), so this joins them in JS.
export async function listApplicantsForCompany(companyId) {
  const applications = await listApplicationsForCompany(companyId);
  const candidateIds = [...new Set(applications.map(a => a.candidate_id))];
  if (candidateIds.length === 0) return [];
  const { data: profiles, error } = await supabase.from("profiles").select("id, full_name, email").in("id", candidateIds);
  if (error) throw error;
  const byId = new Map((profiles || []).map(p => [p.id, p]));
  return applications
    .map(a => {
      const p = byId.get(a.candidate_id);
      const [first, ...rest] = (p?.full_name || "").trim().split(/\s+/);
      return {
        applicationId: a.id,
        jobId: a.job_id,
        jobTitle: a.jobs?.title || "General",
        candidateId: a.candidate_id,
        first: first || "",
        last: rest.join(" "),
        email: p?.email || "",
        stage: a.current_stage,
        appliedAt: a.applied_at,
      };
    })
    .filter(a => a.email);
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

export async function sendCandidateMessage(applicationId, subject, body) {
  return edgeFetch("send-candidate-message", { applicationId, subject, body });
}

export async function inviteToInterview(applicationId, { scheduledAt, durationMinutes, location, meetingLink }) {
  return edgeFetch("invite-to-interview", { applicationId, scheduledAt, durationMinutes, location, meetingLink });
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

// Combines the company's plan features with its per-company overrides into
// one effective feature map — see src/employer/featureFlags.js.
export async function getEffectiveFeatures(companyId) {
  const [subscription, entitlements] = await Promise.all([
    getCompanySubscription(companyId),
    getFeatureEntitlements(companyId),
  ]);
  return computeEffectiveFeatures(subscription?.subscription_plans?.features, entitlements);
}

// ── Super-admin: per-company feature overrides & plan assignment ──────────
export async function listCompaniesForAdmin() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, logo_url, industry, created_at, company_subscriptions(status, plan_id, subscription_plans(id, code, name))")
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function upsertFeatureEntitlement(companyId, featureKey, enabled) {
  const { data, error } = await supabase
    .from("feature_entitlements")
    .upsert({ company_id: companyId, feature_key: featureKey, enabled }, { onConflict: "company_id,feature_key" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearFeatureEntitlement(companyId, featureKey) {
  const { error } = await supabase.from("feature_entitlements").delete().eq("company_id", companyId).eq("feature_key", featureKey);
  if (error) throw error;
}

export async function setCompanySubscriptionPlan(companyId, planId) {
  const { data, error } = await supabase
    .from("company_subscriptions")
    .upsert({ company_id: companyId, plan_id: planId, status: "active" }, { onConflict: "company_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Dashboard metrics ───────────────────────────────────────────────────
export async function getDashboardMetrics(companyId) {
  const { data, error } = await supabase.rpc("get_employer_dashboard_metrics", { target_company_id: companyId }).single();
  if (error) throw error;
  return data;
}

// ── Assessments ─────────────────────────────────────────────────────────
export async function listAssessmentInvitations(companyId) {
  const { data, error } = await supabase
    .from("assessment_invitations")
    .select("*, jobs(title)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// candidates: [{ first, last, email, jobId }]. Creates the invitations and
// emails each candidate a branded, secure link via the create-assessment-
// invitations Edge Function (Resend). Throws with a clear message if the
// company has hit its annual assessment allowance.
export async function createAssessmentInvitations(companyId, userId, { assessmentIds, dueDate, candidates }) {
  const result = await edgeFetch("create-assessment-invitations", { companyId, assessmentIds, dueDate, candidates });
  return { invitations: result.invitations || [], emailResults: result.email_results || [] };
}

// Re-sends the invitation email (does not reset candidate progress).
export async function resendAssessmentInvitation(invitationId) {
  await edgeFetch("resend-assessment-invitation", { invitationId });
}

export async function deleteAssessmentInvitation(invitationId) {
  const { error } = await supabase.from("assessment_invitations").delete().eq("id", invitationId);
  if (error) throw error;
}

// Candidate-facing assessment link — useful as a fallback if the emailed
// link needs to be shared manually (e.g. it landed in spam).
export function getAssessmentLink(invitation) {
  return `${window.location.origin}/assessment.html?t=${invitation.invite_token}`;
}

// Admin-managed bundles (assessment_bundles/assessment_bundle_items),
// resolved to the assessment slugs the employer send-flow already speaks.
export async function listPublishedBundles() {
  const { data, error } = await supabase
    .from("assessment_bundles")
    .select("id, name, description, assessment_bundle_items(display_order, assessments(slug))")
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data || []).map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    assessments: (b.assessment_bundle_items || [])
      .sort((a, c) => a.display_order - c.display_order)
      .map(i => i.assessments?.slug)
      .filter(Boolean),
  }));
}

// This company's own custom assessments (built via the Assessment
// Builder), shaped to match the static ASSESSMENT_LIBRARY cards so the
// Library tab can render both side by side.
export async function listCompanyCustomAssessments(companyId) {
  const { data, error } = await supabase
    .from("assessments")
    .select("slug, name, category, description, icon, estimated_minutes")
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data || []).map(a => ({
    id: a.slug,
    name: a.name,
    icon: a.icon || "🧩",
    category: a.category,
    minutes: a.estimated_minutes || 0,
    questions: null,
    description: a.description || "",
    custom: true,
  }));
}

export async function getAssessmentLicense(companyId) {
  const { data, error } = await supabase.from("assessment_licenses").select("*").eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  return data; // null if the company has never sent an assessment yet (no license row auto-provisioned until then)
}

// All completed scores for a company, for the candidate comparison view.
export async function listCompanyAssessmentScores(companyId) {
  const { data, error } = await supabase
    .from("assessment_scores")
    .select("*, assessment_attempts!inner(invitation_id, assessment_invitations!inner(candidate_name, candidate_email, company_id))")
    .eq("assessment_attempts.assessment_invitations.company_id", companyId);
  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    candidate_name: row.assessment_attempts.assessment_invitations.candidate_name,
    candidate_email: row.assessment_attempts.assessment_invitations.candidate_email,
  }));
}

export async function getAssessmentResult(invitationId) {
  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("invitation_id", invitationId)
    .maybeSingle();
  if (attemptError) throw attemptError;
  if (!attempt) return null;

  const [{ data: scores, error: scoresError }, { data: responses, error: responsesError }] = await Promise.all([
    supabase.from("assessment_scores").select("*, assessment_section_scores(*)").eq("attempt_id", attempt.id),
    supabase.from("assessment_responses").select("*").eq("attempt_id", attempt.id),
  ]);
  if (scoresError) throw scoresError;
  if (responsesError) throw responsesError;

  return { attempt, scores: scores || [], responses: responses || [] };
}
