// Candidate-facing: loads (and lazily creates) an assessment attempt from a
// secure invite token. No candidate login required. Uses the service-role
// key server-side to bypass RLS — RLS locks question content down to
// admins, so this function is the only path that can read it, and it
// strips answer keys before returning anything to the browser.
//
// Called with no `certify` to render the landing/overview screen, then
// again with `certify: true` once the candidate checks the certification
// box (idempotent — only stamps the timestamp once).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400, headers: corsHeaders });
  }

  const token = body?.token;
  if (!token) return Response.json({ error: "Missing token." }, { status: 400, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invitation } = await supabase
    .from("assessment_invitations")
    .select("id, company_id, candidate_name, assessment_ids, due_date, status, companies(name)")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invitation) {
    return Response.json({ error: "This assessment link is invalid or has expired." }, { status: 404, headers: corsHeaders });
  }

  if (invitation.due_date && new Date(invitation.due_date) < new Date() && invitation.status !== "completed") {
    await supabase.from("assessment_invitations").update({ status: "expired" }).eq("id", invitation.id);
    return Response.json({ error: "This assessment invitation has expired. Please contact the employer for a new link." }, { status: 410, headers: corsHeaders });
  }

  // Get or create the attempt.
  let { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("invitation_id", invitation.id)
    .maybeSingle();

  if (!attempt) {
    const { data: created, error: createError } = await supabase
      .from("assessment_attempts")
      .insert({
        invitation_id: invitation.id,
        user_agent: request.headers.get("user-agent") || null,
        certification_ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
      .select()
      .single();
    if (createError) {
      console.error("[get-assessment-attempt] failed to create attempt:", createError.message);
      return Response.json({ error: "Could not start this assessment. Please try again." }, { status: 500, headers: corsHeaders });
    }
    attempt = created;
    if (invitation.status === "sent") {
      await supabase.from("assessment_invitations").update({ status: "in_progress" }).eq("id", invitation.id);
    }
  }

  if (body?.certify && !attempt.certification_accepted_at) {
    const { data: updated } = await supabase
      .from("assessment_attempts")
      .update({ certification_accepted_at: new Date().toISOString() })
      .eq("id", attempt.id)
      .select()
      .single();
    if (updated) attempt = updated;
  }

  const employerName = (invitation as { companies?: { name?: string } }).companies?.name || "Your prospective employer";

  if (attempt.status === "submitted" || attempt.status === "scored" || invitation.status === "completed") {
    return Response.json({
      completed: true,
      employer_name: employerName,
      candidate_name: invitation.candidate_name,
    }, { headers: corsHeaders });
  }

  // Load published assessments for this invitation, with their sections
  // and questions — but never the answer keys.
  const slugs: string[] = invitation.assessment_ids || [];
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, slug, name, instructions, estimated_minutes, randomize_questions, randomize_options, assessment_sections(id, name, display_order, questions_to_draw, weight)")
    .in("slug", slugs)
    .eq("status", "published");

  const questionSelection = { ...(attempt.question_selection || {}) } as Record<string, string[]>;
  let selectionChanged = false;

  const assessmentPayloads = [];
  for (const assessment of assessments || []) {
    const sections = (assessment.assessment_sections || []).sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
    const sectionPayloads = [];

    for (const section of sections) {
      let orderedQuestionIds = questionSelection[section.id];

      if (!orderedQuestionIds) {
        const { data: pool } = await supabase
          .from("assessment_questions")
          .select("question_id, display_order")
          .eq("section_id", section.id)
          .order("display_order");
        let ids = (pool || []).map(p => p.question_id);
        if (section.questions_to_draw && section.questions_to_draw < ids.length) {
          ids = shuffle(ids).slice(0, section.questions_to_draw);
        } else if (assessment.randomize_questions) {
          ids = shuffle(ids);
        }
        orderedQuestionIds = ids;
        questionSelection[section.id] = ids;
        selectionChanged = true;
      }

      if (orderedQuestionIds.length === 0) continue;

      const { data: questions } = await supabase
        .from("questions")
        .select("id, type, prompt, media_url, points, correct_answer, question_options(id, label, display_order)")
        .in("id", orderedQuestionIds);

      const byId = new Map((questions || []).map(q => [q.id, q]));
      const orderedQuestions = orderedQuestionIds.map(id => byId.get(id)).filter(Boolean);

      sectionPayloads.push({
        id: section.id,
        name: section.name,
        weight: section.weight,
        questions: orderedQuestions.map((q: {
          id: string; type: string; prompt: string; media_url: string | null; points: number;
          correct_answer: unknown; question_options: { id: string; label: string; display_order: number }[];
        }) => {
          const base = { id: q.id, type: q.type, prompt: q.prompt, media_url: q.media_url, points: q.points };
          if (q.type === "data_entry_exercise") {
            // The source record IS the task the candidate copies from —
            // not a secret to strip.
            return { ...base, fields: (q.correct_answer as { fields?: unknown })?.fields ?? [], records: (q.correct_answer as { records?: unknown })?.records ?? [] };
          }
          if (["multiple_choice_single", "multiple_choice_multiple", "true_false", "scenario_judgment", "table_interpretation"].includes(q.type)) {
            let options = (q.question_options || []).sort((a, b) => a.display_order - b.display_order).map(o => ({ id: o.id, label: o.label }));
            if (assessment.randomize_options) options = shuffle(options);
            return { ...base, options };
          }
          return base; // typing_exercise, long_form_written, short_answer, numeric — nothing more to strip/add
        }),
      });
    }

    if (sectionPayloads.length > 0) {
      assessmentPayloads.push({
        slug: assessment.slug,
        name: assessment.name,
        instructions: assessment.instructions,
        estimated_minutes: assessment.estimated_minutes,
        sections: sectionPayloads,
      });
    }
  }

  if (selectionChanged) {
    await supabase.from("assessment_attempts").update({ question_selection: questionSelection }).eq("id", attempt.id);
  }

  return Response.json({
    completed: false,
    attempt_id: attempt.id,
    certified: Boolean(attempt.certification_accepted_at),
    employer_name: employerName,
    candidate_name: invitation.candidate_name,
    due_date: invitation.due_date,
    assessments: assessmentPayloads,
  }, { headers: corsHeaders });
});
